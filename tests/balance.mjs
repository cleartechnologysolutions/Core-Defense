import {fresh,place,upgrade,startWave,tick,spot,onRoad,pointAt,pathLength,stats,upgradeCost,TYPES} from '../public/engine.js';
for(let map=0;map<3;map++){
 const s=fresh(map),positions=[];
 for(let col=0;col<10;col++)for(let row=0;row<12;row++){const p=spot(col,row);if(onRoad(map,p.x,p.y))continue;let coverage=0;for(let d=0;d<pathLength(map);d+=10){const q=pointAt(map,d);if(Math.hypot(p.x-q.x,p.y-q.y)<90)coverage++}positions.push({col,row,coverage})}
 positions.sort((a,b)=>b.coverage-a.coverage);
 for(let wave=1;wave<=12;wave++){
  for(let round=0;round<20;round++){
   const type=s.towers.length%4===3?'frost':s.towers.length%3===2?'cannon':'bolt';
   if(s.towers.length>=8){const t=s.towers.filter(t=>t.level<3&&t.type!=='frost'&&upgradeCost(t)<=s.gold).sort((a,b)=>a.level-b.level)[0];if(t){upgrade(s,t.id);continue}}
   if(s.gold<TYPES[type].cost)break;const p=positions.find(p=>!s.towers.some(t=>t.col===p.col&&t.row===p.row));if(!p)break;place(s,type,p.col,p.row);
  }
  startWave(s);for(let step=0;step<6000&&s.status==='wave';step++)tick(s,.05);
  if(s.status==='lost')break;
 }
 console.log({map,status:s.status,wave:s.wave,health:s.health,towers:s.towers.length,gold:s.gold});
 if(s.status!=='won')process.exitCode=1;
}
