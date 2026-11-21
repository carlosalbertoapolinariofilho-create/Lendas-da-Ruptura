import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Accounts} from '../src/accounts.js';
import {Match} from '../src/match.js';
import {Engine} from '../src/engine.js';
import {tier} from '../src/heroes.js';
function fixture(){const dir=mkdtempSync(join(tmpdir(),'lendas-'));return {store:new Accounts(dir),cleanup:()=>rmSync(dir,{force:true,recursive:true})};}
test('registro, login token, persistência e ranking',()=>{
 const t=fixture();try{
 const {profile,token}=t.store.create('Heroína 1');
 assert.equal(profile.mmr,1000);
 assert.equal(t.store.login(profile.id,token).nickname,'Heroína 1');
 assert.equal(t.store.login(profile.id,'errado'),null);
 assert.throws(()=>t.store.create('<script>'));
 t.store.result([profile.id],[]);assert.equal(new Accounts(t.store.dir).public(profile.id).mmr,1025);
 assert.equal(tier(1650),'Diamante');
 }finally{t.cleanup();}
});
test('combate, velocidade validada, escolha de herói e vitória',()=>{
 let end=null;
 const p=[{accountId:'p1',nickname:'Alpha',hero:'aster'},{accountId:'p2',nickname:'Beta',hero:'kael'}];
 const match=new Match('test','casual',p,(m,w)=>{end=w;});
 match.controls('p1',1000,1000);
 let a=match.players.get('p1'),x=a.x;
 match.tick(0.1);
 assert.ok(a.x-x<0.5,'não permitir teleporte por input adulterado');
 assert.equal(match.attack('p1',99),false);
 assert.equal(match.attack('p1',0),false,'inimigo fora de alcance');
 const core=match.structures.find(s=>s.kind==='core'&&s.team===1);
 core.hp=1;
 match.damage(a,core,5);
 assert.equal(end,0);assert.equal(match.finished,true);
});
test('fila, pareamento automático e ranqueada experimental',()=>{
 const t=fixture();try{
 const out=new Map(),engine=new Engine(t.store,(s,m)=>{if(!out.has(s))out.set(s,[]);out.get(s).push(m);});
 const a={id:'socket-a'},b={id:'socket-b'};engine.add(a);engine.add(b);
 engine.message(a,{type:'register',nickname:'Aurora'});engine.message(b,{type:'register',nickname:'Boreal'});
 engine.message(a,{type:'select_hero',hero:'nyra'});
 engine.message(a,{type:'queue',mode:'ranked'});assert.equal(engine.matches.size,0);
 engine.message(b,{type:'queue',mode:'ranked'});assert.equal(engine.matches.size,1);
 let room=[...engine.matches.values()][0];assert.equal(room.players.size,2);
 const first=[...room.players.values()][0];room.finish(first.team);
 assert.equal(engine.matches.size,0);assert.equal(t.store.public(first.id).mmr,1025);
 assert.ok(out.get(a).some(m=>m.type==='match_result'));
 }finally{t.cleanup();}
});
