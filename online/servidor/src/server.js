import http from 'node:http';
import path from 'node:path';
import {WebSocketServer, WebSocket} from 'ws';
import {Accounts} from './accounts.js';
import {Engine} from './engine.js';
const port=Number.parseInt(process.env.PORT||'8080',10);
const bind=process.env.HOST||'0.0.0.0';
const accounts=new Accounts(process.env.DATA_DIR||path.resolve('data'));
const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));};
const engine=new Engine(accounts,send);
const app=http.createServer((req,res)=>{
  if(req.url==='/health'){
    res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    res.end(JSON.stringify(engine.health()));
    return;
  }
  res.writeHead(404,{'content-type':'application/json'});res.end(JSON.stringify({error:'not_found'}));
});
const wss=new WebSocketServer({server:app,path:'/ws',maxPayload:2048,perMessageDeflate:false});
wss.on('connection',ws=>{
  engine.add(ws);
  let received=0;
  let windowStart=Date.now();
  ws.on('message',data=>{
    const now=Date.now();if(now-windowStart>1000){received=0;windowStart=now;}
    if(++received>35){ws.close(1008,'Muitas mensagens');return;}
    try{const msg=JSON.parse(data.toString());engine.message(ws,msg);}catch{send(ws,{type:'error',message:'JSON inválido'});}
  });
  ws.on('close',()=>engine.remove(ws));
  ws.on('error',()=>{});
});
let last=Date.now(),n=0;
const loop=setInterval(()=>{
  const now=Date.now();engine.tick(Math.min(0.1,(now-last)/1000));last=now;
  if((++n)%2===0)engine.broadcast();
},50);
app.listen(port,bind,()=>console.log(`Lendas online: http://${bind}:${port}/health (WS /ws)`));
function shutdown(){clearInterval(loop);for(const ws of wss.clients)ws.close(1001,'Servidor encerrando');app.close(()=>process.exit(0));}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
