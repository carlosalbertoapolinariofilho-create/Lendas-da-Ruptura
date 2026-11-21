// Teste de ponta a ponta em duas conexões WebSocket reais; cria duas contas temporárias de teste.
// Rodar somente na pré-alfa. Não é um teste com dois aparelhos físicos.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { WebSocket } from 'ws';

const url = process.env.GAME_SERVER_URL || 'wss://lendas-multiplayer-alpha-production.up.railway.app/ws';
if (!url.startsWith('wss://')) throw new Error('Este teste exige WSS em TLS.');
const base = new URL(url);
const healthUrl = new URL('/health', base);
healthUrl.protocol = 'https:';
const healthResponse = await fetch(healthUrl, { signal: AbortSignal.timeout(12000) });
assert.equal(healthResponse.status, 200, 'Servidor /health precisa responder HTTP 200');
const health = await healthResponse.json();
assert.equal(health.service, 'lendas-da-ruptura');
console.log('Health remoto:', JSON.stringify({ version: health.version, rooms: health.rooms }));

function waitFor(socket, type, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off('message', handle); reject(new Error('Timeout ao aguardar '+type)); }, timeout);
    function handle(raw) {
      let message;
      try { message = JSON.parse(raw.toString()); } catch { return; }
      if (message.type === 'error') console.log('Resposta de erro do servidor:', message.message);
      if (message.type === type) { clearTimeout(timer); socket.off('message', handle); resolve(message); }
    }
    socket.on('message', handle);
  });
}
function open(socket) {
  return new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
    setTimeout(() => reject(new Error('Timeout ao abrir WSS')), 12000).unref();
  });
}
const send = (ws, obj) => ws.send(JSON.stringify(obj));
const users = [new WebSocket(url, { handshakeTimeout: 12000 }), new WebSocket(url, { handshakeTimeout: 12000 })];
try {
  await Promise.all(users.map(open));
  console.log('Dois clientes independentes conectados por WSS.');
  const marker = randomBytes(3).toString('hex');
  const authA = waitFor(users[0], 'auth'), authB = waitFor(users[1], 'auth');
  send(users[0], { type: 'register', nickname: 'TesteA'+marker });
  send(users[1], { type: 'register', nickname: 'TesteB'+marker });
  const [playerA, playerB] = await Promise.all([authA, authB]);
  assert.notEqual(playerA.profile.id, playerB.profile.id);
  const matchA = waitFor(users[0], 'match_found'), matchB = waitFor(users[1], 'match_found');
  send(users[0], { type: 'select_hero', hero: 'nyra' });
  send(users[0], { type: 'queue', mode: 'casual' });
  send(users[1], { type: 'select_hero', hero: 'aster' });
  send(users[1], { type: 'queue', mode: 'casual' });
  const [foundA, foundB] = await Promise.all([matchA, matchB]);
  assert.equal(foundA.matchId, foundB.matchId, 'Os jogadores precisam estar na mesma sala');
  assert.notEqual(foundA.team, foundB.team);
  const snapA = waitFor(users[0], 'snapshot'), snapB = waitFor(users[1], 'snapshot');
  const [snapshotA, snapshotB] = await Promise.all([snapA, snapB]);
  assert.equal(snapshotA.players.length, 2);
  assert.equal(snapshotB.players.length, 2);
  send(users[0], { type: 'input', x: 1, z: 0 });
  await new Promise(r => setTimeout(r, 500));
  const next = await waitFor(users[0], 'snapshot');
  const first = snapshotA.players.find(p => p.id === playerA.profile.id);
  const moved = next.players.find(p => p.id === playerA.profile.id);
  assert.ok(moved.x > first.x, 'Movimento deve ser validado e refletido pelo servidor');
  console.log('SUCESSO 1x1 WSS público:', JSON.stringify({matchId: foundA.matchId, heroes: snapshotA.players.map(p=>p.hero), positionBefore: first.x, positionAfter: moved.x}));
} finally {
  for (const socket of users) socket.close();
}
