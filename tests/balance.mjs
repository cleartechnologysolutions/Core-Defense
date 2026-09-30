import assert from 'node:assert/strict';
import {fresh,place,upgrade,startWave,tick,spot,onRoad,pointAt,pathLength,stats,upgradeCost,TYPES,ability,waveInfo} from '../public/engine.js';
function play(map,active){const s=fresh(map),positions=[];
 for(let col=0;col<10;col++)for(let row=0;row<12;row++){const p=spot(col,row);if(!onRoad(map,p.x,p.y))positions.push({col,row,...p})}
 for(let wave=1;wave<=12;wave++){
  if(active||wave===1)for(let round=0;round<15;round++){
   if(s.towers.length>=(map===2?7:5)){const t=s.towers.filter(t=>t.level<3&&upgradeCost(t)<=s.gold).sort((a,b)=>a.level-b.level)[0];if(t){upgrade(s,t.id,t.type==='bolt'?'chain':t.type==='cannon'?(map===2?'siege':'napalm'):'blizzard');continue}}
   const type=['cannon','bolt','bolt','frost'][s.towers.length%4];if(s.gold<TYPES[type].cost)break;const info=waveInfo(wave);
   const ranked=positions.filter(p=>!s.towers.some(t=>t.col===p.col&&t.row===p.row)).map(p=>{let score=0;for(let lane=0;lane<2;lane++)for(let d=0;d<pathLength(map,lane);d+=12){const q=pointAt(map,d,lane);if(Math.hypot(p.x-q.x,p.y-q.y)<TYPES[type].range)score+=(info.mode===2||info.mode===lane?1:.5)/(1+s.towers.filter(t=>Math.hypot(spot(t.col,t.row).x-q.x,spot(t.col,t.row).y-q.y)<stats(t).range).length*.3)}return {...p,score}}).sort((a,b)=>b.score-a.score);if(!ranked[0]||!place(s,type,ranked[0].col,ranked[0].row))break;
  }
  startWave(s);for(let step=0;step<5000&&s.status==='wave';step++){
   if(active&&s.enemies.length){const target=s.enemies.filter(e=>e.hp>0).map(e=>{const p=pointAt(map,e.d,e.lane);return {e,score:s.enemies.reduce((n,v)=>{const q=pointAt(map,v.d,v.lane);return n+(Math.hypot(p.x-q.x,p.y-q.y)<65?Math.min(v.hp,190+s.wave*18):0)},0)}}).sort((a,b)=>b.score-a.score)[0]?.e;if(target){const p=pointAt(map,target.d,target.lane);if(s.enemies.length>=3||target.type==='boss')ability(s,'airstrike',p.x,p.y);if(s.enemies.length>=4)ability(s,'freeze',p.x,p.y)}}tick(s,.05);
  }if(s.status==='lost')break;
 }return s}
for(let map=0;map<3;map++){const passive=play(map,false),active=play(map,true);console.log({map,passive:{wave:passive.wave,health:passive.health},active:{status:active.status,wave:active.wave,health:active.health}});assert.ok(passive.wave<=4,'initial towers alone must fail early');assert.equal(active.status,'won','active strategy must be able to win')}
