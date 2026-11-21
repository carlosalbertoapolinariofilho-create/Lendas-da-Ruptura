import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { WebSocket } from 'ws';
const timeout=ms=>new Promise(r=>setTimeout(r,ms));
const receive=(ws,type,limit=9000)=>new Promise((res,rej)=>{
  const timer=setTimeout(()=>{ws.off('message',onMsg);rej(new Error(`Timeout: ${type}`));},limit);
  function onMsg(raw){
    let p;try{p=JSON.parse(raw.toString());}catch{return;}
    if(p.type===type){clearTimeout(timer);ws.off('message',onMsg);res(p);}
  }
  ws.on('message',onMsg);
});
const connected=ws=>new Promise((res,rej)=>{ws.once('open',res);ws.once('error',rej);});
const send=(ws,packet)=>ws.send(JSON.stringify(packet));

test('duas conexões reais WebSocket entram em partida e recebem snapshot autoritativo', {timeout:30000}, async()=>{
  const dir=mkdtempSync(join(tmpdir(),'lendas-integration-'));
  const port=randomInt(26000,42000);
  const srv=spawn(process.execPath,['src/server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
  const clients=[];
  try{
    let ready=false;
    for(let i=0;i<60;i++){
      if(srv.exitCode!==null)throw new Error('Servidor encerrou antes de iniciar');
      try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok){ready=true;break;}}catch{}
      await timeout(100);
    }
    assert.equal(ready,true,'HTTP /health não iniciou');
    const a=new WebSocket(`ws://127.0.0.1:${port}/ws`),b=new WebSocket(`ws://127.0.0.1:${port}/ws`);
    clients.push(a,b);
    await Promise.all([connected(a),connected(b)]);
    const aauth=receive(a,'auth');send(a,{type:'register',nickname:'Jogador Alfa'});
    const bAuth=receive(b,'auth');send(b,{type:'register',nickname:'Jogador Beta'});
    const [pa,pb]=await Promise.all([aauth,bAuth]);
    assert.notEqual(pa.profile.id,pb.profile.id);
    const amatch=receive(a,'match_found'),bmatch=receive(b,'match_found');
    send(a,{type:'select_hero',hero:'nyra'});
    send(a,{type:'queue',mode:'casual'});
    send(b,{type:'queue',mode:'casual'});
    const [ma,mb]=await Promise.all([amatch,bmatch]);
    assert.equal(ma.matchId,mb.matchId);
    assert.notEqual(ma.team,mb.team);
    const snapA=receive(a,'snapshot'),snapB=receive(b,'snapshot');
    const [sa,sb]=await Promise.all([snapA,snapB]);
    assert.equal(sa.players.length,2);
    assert.equal(sb.players.length,2);
    assert.ok(sa.structures.length>=8);
    const start=sa.players.find(p=>p.id===pa.profile.id);
    send(a,{type:'input',x:1,z:0});
    await timeout(350);
    const snapNext=await receive(a,'snapshot');
    const moved=snapNext.players.find(p=>p.id===pa.profile.id);
    assert.ok(moved.x>start.x,`Jogador deveria mover no servidor (${start.x}->${moved.x})`);
    const health=await (await fetch(`http://127.0.0.1:${port}/health`)).json();
    assert.equal(health.rooms,1);
  }finally{
    for(const ws of clients)try{ws.close();}catch{}
    srv.kill('SIGTERM');
    await timeout(200);
    rmSync(dir,{force:true,recursive:true});
  }
});
