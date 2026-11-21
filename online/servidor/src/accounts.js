import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { tier } from './heroes.js';
const hash = value=>createHash('sha256').update(value).digest('hex');
export function safeNickname(value){
  if(typeof value !== 'string') return null;
  const name = value.trim();
  return /^[\p{L}\p{N}_ -]{3,20}$/u.test(name) ? name : null;
}
export class Accounts {
  constructor(dataDir){
    this.dir=dataDir;
    fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
    this.file=path.join(dataDir,'accounts.json');
    try{this.records=JSON.parse(fs.readFileSync(this.file,'utf8'));}catch{this.records={};}
  }
  persist(){
    const tmp=this.file+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify(this.records,null,2),{mode:0o600});
    fs.renameSync(tmp,this.file);
  }
  create(nickname){
    const name=safeNickname(nickname);
    if(!name) throw new Error('Apelido: 3–20 letras, números, espaços, _ ou -');
    const id=randomUUID(),token=randomBytes(32).toString('hex');
    this.records[id]={id,nickname:name,tokenHash:hash(token),mmr:1000,wins:0,losses:0,createdAt:Date.now()};
    this.persist();
    return {profile:this.public(id),token};
  }
  login(id,token){
    if(typeof id!=='string'||typeof token!=='string'||token.length!==64) return null;
    const record=this.records[id];
    if(!record||record.tokenHash!==hash(token)) return null;
    return this.public(id);
  }
  public(id){
    const r=this.records[id];
    if(!r) return null;
    return {id:r.id,nickname:r.nickname,mmr:r.mmr,tier:tier(r.mmr),wins:r.wins,losses:r.losses};
  }
  result(winnerIds,loserIds){
    for(const id of winnerIds){let r=this.records[id];if(r){r.wins++;r.mmr=Math.min(4000,r.mmr+25);}}
    for(const id of loserIds){let r=this.records[id];if(r){r.losses++;r.mmr=Math.max(0,r.mmr-25);}}
    this.persist();
  }
}
