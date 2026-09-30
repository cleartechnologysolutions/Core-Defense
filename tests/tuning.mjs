import {fresh,place,upgrade,startWave,tick,spot,onRoad,pointAt,pathLength,upgradeCost} from '../public/engine.js';
for(let map=0;map<3;map++)for(const mix of [['bolt','bolt','cannon','frost'],['cannon','frost','bolt'],['bolt','cannon','cannon','frost']])for(const cap of [5,7,9]){
 const s=fresh(map),positions=[];
 for(let col=0;col<10;col++)for(let row=0;row<12;row++){let p=spot(col,row);if(onRoad(map,p.x,p.y))continue;let coverage=0;for(let d=0;d<pathLength(map);d+=10){let q=pointAt(map,d);if(Math.hypot(p.x-q.x,p.y-q.y)<90)coverage++}positions.push({col,row,coverage})}positions.sort((a,b)=>b.coverage-a.coverage);
 for(let wave=1;wave<=12;wave++){for(let n=0;n<30;n++){if(s.towers.length>=cap){const t=s.towers.find(t=>t.level<3&&t.type!=='frost'&&upgradeCost(t)<=s.gold);if(t){upgrade(s,t.id);continue}}const p=positions.find(p=>!s.towers.some(t=>t.col===p.col&&t.row===p.row));if(!p||!place(s,mix[s.towers.length%mix.length],p.col,p.row))break;}startWave(s);for(let k=0;k<6000&&s.status==='wave';k++)tick(s,.05);if(s.status==='lost')break;}
 console.log(map,mix.join('/'),cap,s.status,s.wave,s.health);
}
