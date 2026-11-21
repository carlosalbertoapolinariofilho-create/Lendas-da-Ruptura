import {HEROES} from './heroes.js';
const WORLD_X = 28, WORLD_Z = 17;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const choose=(items,origin,r)=>items.filter(t=>t.hp>0&&distance(t,origin)<=r).sort((a,b)=>distance(a,origin)-distance(b,origin))[0] || null;
let nextEntity=1;
export class Match {
  constructor(id,mode,participants,onEnd){
    this.id=id;this.mode=mode;this.age=0;this.finished=false;this.onEnd=onEnd;
    this.players=new Map();this.minions=[];this.waves=0;
    this.structures=[];
    for(const team of [0,1]){
      for(const z of [-11,0,11])this.structures.push({id:nextEntity++,kind:'tower',team,x:team===0?-17:17,z,hp:320,maxHp:320});
      this.structures.push({id:nextEntity++,kind:'core',team,x:team===0?-25:25,z:0,hp:660,maxHp:660});
    }
    for(const [i,p] of participants.entries()){
      const hero=HEROES[p.hero];
      this.players.set(p.accountId,{id:p.accountId,nickname:p.nickname,hero:p.hero,team:i%2,x:i%2===0?-23:23,z: i%2===0?0:0,hp:hero.health,maxHp:hero.health,kills:0,deaths:0,gold:0,move:{x:0,z:0},attackReady:0,skills:[0,0,0],respawnAt:0});
    }
  }
  controls(id,x,z){
    const p=this.players.get(id);if(!p||p.hp<=0||this.finished) return;
    if(!Number.isFinite(x)||!Number.isFinite(z)) return;
    const len=Math.hypot(x,z)||1;
    p.move={x:clamp(x/Math.max(1,len),-1,1),z:clamp(z/Math.max(1,len),-1,1)};
  }
  attack(id,slot=0){
    const p=this.players.get(id);
    if(!p||p.hp<=0||this.finished||!Number.isInteger(slot)||slot<0||slot>3)return false;
    const hero=HEROES[p.hero];
    if(slot===0&&this.age<p.attackReady) return false;
    if(slot>0&&this.age<p.skills[slot-1]) return false;
    if(slot===2){ // esquiva / avanço curto, resolvido pelo servidor
      const dx=p.move.x|| (p.team===0?1:-1),dz=p.move.z;
      p.x=clamp(p.x+dx*3,-WORLD_X,WORLD_X);p.z=clamp(p.z+dz*3,-WORLD_Z,WORLD_Z);
      p.skills[1]=this.age+9;return true;
    }
    if(slot===3){ // autocura
      p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*0.26));p.skills[2]=this.age+16;return true;
    }
    const range=slot===1?hero.range+3:hero.range;
    const enemies=[...this.players.values(),...this.minions,...this.structures].filter(o=>o.team!==p.team&&o.hp>0&&(!(o.respawnAt)||o.hp>0));
    const target=choose(enemies,p,range);
    if(!target)return false;
    this.damage(p,target,Math.round(hero.attack*(slot===1?1.75:1)));
    if(slot===0)p.attackReady=this.age+0.75;
    else p.skills[0]=this.age+7;
    return true;
  }
  damage(source,target,points){
    if(target.hp<=0)return;
    target.hp=Math.max(0,target.hp-points);
    if(target.hp!==0)return;
    if(target.kind==='core'){this.finish(source.team);return;}
    if(target.kind==='tower')source.gold+=80;
    else if(target.kind==='minion')source.gold+=15;
    else if(target.id){source.kills++;source.gold+=125;target.deaths++;target.respawnAt=this.age+8;target.move={x:0,z:0};}
  }
  spawnWave(){
    for(const lane of [-11,0,11])for(const team of [0,1])for(let i=0;i<2;i++)this.minions.push({id:nextEntity++,kind:'minion',team,lane,x:(team===0?-23:23)+(team===0?-i:i),z:lane+(i===0?-0.7:0.7),hp:80,maxHp:80,speed:2.3,attackReady:0});
  }
  tick(dt){
    if(this.finished)return;
    dt=clamp(dt,0,0.1); this.age+=dt;
    if(Math.floor(this.age/8)>this.waves){this.waves++;this.spawnWave();}
    for(const p of this.players.values()){
      if(p.hp<=0){if(this.age>=p.respawnAt){p.hp=p.maxHp;p.x=p.team===0?-23:23;p.z=0;}continue;}
      const speed=HEROES[p.hero].speed;
      p.x=clamp(p.x+p.move.x*speed*dt,-WORLD_X,WORLD_X);
      p.z=clamp(p.z+p.move.z*speed*dt,-WORLD_Z,WORLD_Z);
    }
    for(const m of this.minions){
      if(m.hp<=0)continue;
      const enemy=choose([...this.players.values(),...this.minions,...this.structures].filter(p=>p.team!==m.team),m,3.8);
      if(enemy){if(this.age>=m.attackReady){this.damage(m,enemy,9);m.attackReady=this.age+1.2;}}
      else m.x=clamp(m.x+(m.team===0?1:-1)*m.speed*dt,-WORLD_X,WORLD_X);
    }
    for(const t of this.structures.filter(t=>t.kind==='tower'&&t.hp>0)){
      const target=choose([...this.players.values(),...this.minions].filter(o=>o.team!==t.team),t,7);
      if(target && (!t.attackReady||this.age>=t.attackReady)){this.damage(t,target,16);t.attackReady=this.age+1.5;}
    }
    this.minions=this.minions.filter(m=>m.hp>0&&Math.abs(m.x)<27);
    if(this.age>900)this.finish(null);
  }
  finish(winnerTeam){
    if(this.finished)return;
    this.finished=true;
    this.winner=winnerTeam;
    this.onEnd?.(this,winnerTeam);
  }
  snapshot(){
    const compact=o=>({id:o.id,team:o.team,x:+o.x.toFixed(2),z:+o.z.toFixed(2),hp:o.hp,maxHp:o.maxHp,kind:o.kind,hero:o.hero,nickname:o.nickname,kills:o.kills,deaths:o.deaths,gold:o.gold});
    return {type:'snapshot',matchId:this.id,mode:this.mode,elapsed:Math.round(this.age),players:[...this.players.values()].map(compact),minions:this.minions.map(compact),structures:this.structures.map(compact)};
  }
}
