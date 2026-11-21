import { randomUUID } from 'node:crypto';
import {HEROES,HERO_IDS} from './heroes.js';
import {Match} from './match.js';
export class Engine {
  constructor(accounts,send){
    this.accounts=accounts;this.send=send;
    this.clients=new Map();this.accountToSocket=new Map();this.queue={casual:[],ranked:[]};this.matches=new Map();this.nextRoom=1;
  }
  add(socket){this.clients.set(socket,{id:null,hero:'aster',room:null});this.send(socket,{type:'welcome',protocol:1,heroes:HEROES,ranked:'prototipo-1v1'});}
  remove(socket){
    const c=this.clients.get(socket);if(!c)return;
    for(const q of Object.values(this.queue)){const i=q.indexOf(socket);if(i>=0)q.splice(i,1);}
    if(c.id)this.accountToSocket.delete(c.id);
    if(c.room){const room=this.matches.get(c.room);if(room&&!room.finished){const p=room.players.get(c.id);if(p){room.finish(1-p.team);}}}
    this.clients.delete(socket);
  }
  message(socket,msg){
    const c=this.clients.get(socket);if(!c||!msg||typeof msg!=='object')return;
    try{
      if(msg.type==='register'){
        if(c.id)throw new Error('Você já está autenticado');
        const {profile,token}=this.accounts.create(msg.nickname);
        this.auth(socket,profile);
        this.send(socket,{type:'auth',profile,token});return;
      }
      if(msg.type==='login'){
        const profile=this.accounts.login(msg.id,msg.token);
        if(!profile)throw new Error('Login inválido');
        this.auth(socket,profile);
        this.send(socket,{type:'auth',profile});return;
      }
      if(!c.id)throw new Error('Entre ou crie um perfil antes de jogar');
      if(msg.type==='select_hero'){
        if(c.room)throw new Error('Não é possível trocar herói durante a partida');
        if(typeof msg.hero!=='string'||!HERO_IDS.includes(msg.hero))throw new Error('Herói inválido');
        c.hero=msg.hero;this.send(socket,{type:'selected',hero:c.hero});return;
      }
      if(msg.type==='queue'){
        if(c.room)throw new Error('Partida em andamento');
        const mode=msg.mode==='ranked'?'ranked':'casual';
        for(const q of Object.values(this.queue)){const i=q.indexOf(socket);if(i>=0)q.splice(i,1);}
        this.queue[mode].push(socket);this.send(socket,{type:'queued',mode,playersAhead:this.queue[mode].length-1});
        this.matchmake(mode);return;
      }
      if(msg.type==='cancel_queue'){
        for(const q of Object.values(this.queue)){const i=q.indexOf(socket);if(i>=0)q.splice(i,1);}
        this.send(socket,{type:'queue_cancelled'});return;
      }
      const room=this.matches.get(c.room);
      if(!room)return;
      if(msg.type==='input')room.controls(c.id,Number(msg.x),Number(msg.z));
      if(msg.type==='attack')room.attack(c.id,Number(msg.slot));
    }catch(error){this.send(socket,{type:'error',message:error.message});}
  }
  auth(socket,profile){
    const existing=this.accountToSocket.get(profile.id);
    if(existing&&existing!==socket)throw new Error('Este perfil já está conectado');
    this.clients.get(socket).id=profile.id;this.accountToSocket.set(profile.id,socket);
  }
  matchmake(mode){
    const q=this.queue[mode];
    while(q.length>=2){
      const sockets=q.splice(0,2);
      const participants=sockets.map(s=>({accountId:this.clients.get(s).id,nickname:this.accounts.public(this.clients.get(s).id).nickname,hero:this.clients.get(s).hero}));
      const id=`room-${this.nextRoom++}`;
      const room=new Match(id,mode,participants,(match,winner)=>this.end(match,winner));
      this.matches.set(id,room);
      sockets.forEach((s,i)=>{this.clients.get(s).room=id;this.send(s,{type:'match_found',matchId:id,team:i,mode,hero:participants[i].hero,notice:mode==='ranked'?'Ranqueada experimental; sem proteção anticheat':'1v1 de teste'});});
    }
  }
  end(room,winnerTeam){
    let winners=[],losers=[];
    if(winnerTeam!==null){
      winners=[...room.players.values()].filter(p=>p.team===winnerTeam).map(p=>p.id);
      losers=[...room.players.values()].filter(p=>p.team!==winnerTeam).map(p=>p.id);
      if(room.mode==='ranked')this.accounts.result(winners,losers);
    }
    for(const p of room.players.values()){
      const socket=this.accountToSocket.get(p.id);
      if(socket){this.send(socket,{type:'match_result',won:winnerTeam===null?null:p.team===winnerTeam,profile:this.accounts.public(p.id)});const c=this.clients.get(socket);if(c)c.room=null;}
    }
    this.matches.delete(room.id);
  }
  tick(dt){
    for(const room of this.matches.values())room.tick(dt);
  }
  broadcast(){
    for(const room of this.matches.values()){
      const snapshot=room.snapshot();
      for(const p of room.players.values()){const socket=this.accountToSocket.get(p.id);if(socket)this.send(socket,snapshot);}
    }
  }
  health(){return {service:'lendas-da-ruptura',version:'0.2.0-alpha',online:this.clients.size,queue:{casual:this.queue.casual.length,ranked:this.queue.ranked.length},rooms:this.matches.size,rankedStatus:'experimental'};}
}
