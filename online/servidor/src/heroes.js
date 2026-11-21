export const HEROES = Object.freeze({
  aster: { name:'Aster, Guardião Solar', role:'tanque', health:250, speed:4.6, attack:23, range:3.4, color:'#e4aa49' },
  nyra: { name:'Nyra, Lâmina Lunar', role:'assassina', health:165, speed:6.0, attack:31, range:3.2, color:'#a590ff' },
  kael: { name:'Kael, Arqueiro das Cinzas', role:'atirador', health:155, speed:5.2, attack:25, range:8.0, color:'#e56a5f' },
  lyra: { name:'Lyra, Feiticeira Prismática', role:'maga', health:165, speed:5.1, attack:29, range:7.0, color:'#70c4ef' },
  orion: { name:'Orion, Monge de Aço', role:'lutador', health:215, speed:5.3, attack:27, range:3.4, color:'#7ccc98' },
  selene: { name:'Selene, Voz do Eclipse', role:'suporte', health:180, speed:5.0, attack:19, range:6.5, color:'#f6b1df' },
});
export const HERO_IDS = Object.freeze(Object.keys(HEROES));
export function tier(mmr){return mmr>=1600?'Diamante':mmr>=1350?'Platina':mmr>=1150?'Ouro':mmr>=900?'Prata':'Bronze';}
