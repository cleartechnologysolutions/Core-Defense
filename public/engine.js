export const W=360,H=432,WAVES=12;
export const MAPS=[
 {name:'The Outpost',tag:'01 / Meadow circuit',color:'#a6edbf',path:[[-18,54],[306,54],[306,162],[90,162],[90,306],[270,306],[270,414],[378,414]]},
 {name:'Red Canyon',tag:'02 / Switchback',color:'#ffba87',path:[[54,-18],[54,126],[270,126],[270,234],[126,234],[126,378],[378,378]]},
 {name:'The Foundry',tag:'03 / Last stand',color:'#b6acff',path:[[-18,90],[234,90],[234,198],[54,198],[54,342],[306,342],[306,450]]}
];
export const TYPES={
 bolt:{name:'Pulse',cost:55,color:'#83ecd1',range:91,damage:15,rate:.54,speed:290,tip:'Fast shots. Your reliable all-rounder.'},
 cannon:{name:'Mortar',cost:95,color:'#ffbb78',range:110,damage:34,rate:1.55,speed:195,splash:39,tip:'Explosive shots hit groups. Ignores armor.'},
 frost:{name:'Cryo',cost:80,color:'#9cbcff',range:90,damage:6,rate:.85,speed:240,tip:'Slows enemies by 48%. Pair with damage towers.'}
};
export function pathLength(map){const p=MAPS[map].path;return p.slice(1).reduce((n,b,i)=>n+Math.hypot(b[0]-p[i][0],b[1]-p[i][1]),0)}
export function pointAt(map,d){const p=MAPS[map].path;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],n=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=n)return {x:a[0]+(b[0]-a[0])*d/n,y:a[1]+(b[1]-a[1])*d/n,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};d-=n}return {x:p.at(-1)[0],y:p.at(-1)[1],angle:0}}
function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)}
export function onRoad(map,x,y){const p=MAPS[map].path;return p.slice(1).some((b,i)=>segmentDistance(x,y,p[i],b)<27)}
export function spot(col,row){return{x:col*36+18,y:row*36+18}}
export function stats(t){const b=TYPES[t.type],n=t.level-1;return{...b,damage:Math.round(b.damage*(1+n*.7)),range:b.range+n*10,rate:b.rate/(1+n*.16),splash:b.splash?b.splash+n*5:0}}
export function upgradeCost(t){return Math.round(TYPES[t.type].cost*(.8+.4*t.level))}
export function sellValue(t){return Math.floor(t.spent*.7)}
export function fresh(map=0){return{map,wave:0,status:'build',gold:185,health:20,kills:0,towers:[],enemies:[],shots:[],spawn:[],spawnIn:0,nextId:1,time:0}}
export function place(s,type,col,row){if(!TYPES[type]||!['build','wave'].includes(s.status)||!Number.isInteger(col)||!Number.isInteger(row)||col<0||col>=10||row<0||row>=12)return false;const{x,y}=spot(col,row);if(onRoad(s.map,x,y)||s.towers.some(t=>t.col===col&&t.row===row)||s.gold<TYPES[type].cost)return false;s.gold-=TYPES[type].cost;s.towers.push({id:s.nextId++,type,col,row,level:1,spent:TYPES[type].cost,cooldown:0,angle:0});return true}
export function upgrade(s,id){const t=s.towers.find(t=>t.id===id);if(!t||t.level>=3||!['build','wave'].includes(s.status)||s.gold<upgradeCost(t))return false;const cost=upgradeCost(t);s.gold-=cost;t.spent+=cost;t.level++;return true}
export function sell(s,id){const t=s.towers.find(t=>t.id===id);if(!t||!['build','wave'].includes(s.status))return false;s.gold+=sellValue(t);s.towers=s.towers.filter(t=>t.id!==id);return true}
export function wavePlan(wave,map){const count=8+wave*2,mapBoost=1+map*.15;return Array.from({length:count},(_,i)=>{const boss=wave%4===0&&i===count-1,type=boss?'boss':wave>=3&&i%4===0?'tank':wave>=2&&i%3===0?'runner':'scout';const growth=1+(wave-1)*.38+Math.pow(Math.max(0,wave-4),1.65)*.035;return{type,hp:Math.round(({scout:42,runner:30,tank:125,boss:480}[type])*growth*mapBoost),speed:({scout:47,runner:80,tank:35,boss:30}[type])*(1+(wave-1)*.015),reward:{scout:6,runner:6,tank:12,boss:45}[type],armor:0,leak:boss?5:type==='tank'?2:1}})}
export function startWave(s){if(s.status!=='build'||s.wave>=WAVES)return false;s.wave++;s.spawn=wavePlan(s.wave,s.map);s.spawnIn=.45;s.status='wave';return true}
export function tick(s,dt,emit=()=>{}){
 if(s.status!=='wave')return;dt=Math.min(.05,Math.max(0,dt));s.time+=dt;
 s.spawnIn=Math.max(0,s.spawnIn-dt);if(s.spawn.length&&s.spawnIn<=0){const spec=s.spawn.shift();s.enemies.push({...spec,id:s.nextId++,maxHp:spec.hp,d:0,slow:0,armor:spec.type==='tank'?.45:spec.type==='boss'?.25:0});s.spawnIn=Math.max(.32,.85-s.wave*.035);emit('spawn',s.enemies.at(-1))}
 for(const e of s.enemies){e.slow=Math.max(0,e.slow-dt);e.d+=e.speed*(e.slow>0?.52:1)*dt;if(e.d>=pathLength(s.map)){e.hp=0;e.escaped=true;s.health=Math.max(0,s.health-e.leak);emit('leak',e)}}
 s.enemies=s.enemies.filter(e=>!e.escaped);
 if(s.health<=0){s.status='lost';s.spawn=[];s.shots=[];emit('lost',{});return}
 for(const t of s.towers){t.cooldown=Math.max(0,t.cooldown-dt);const info=stats(t),pos=spot(t.col,t.row);const target=s.enemies.filter(e=>e.hp>0&&Math.hypot(pointAt(s.map,e.d).x-pos.x,pointAt(s.map,e.d).y-pos.y)<=info.range).sort((a,b)=>b.d-a.d)[0];if(!target)continue;const dest=pointAt(s.map,target.d);t.angle=Math.atan2(dest.y-pos.y,dest.x-pos.x);if(t.cooldown<=0){t.cooldown=info.rate;s.shots.push({id:s.nextId++,x:pos.x,y:pos.y,target:target.id,type:t.type,damage:info.damage,speed:info.speed,splash:info.splash});emit('fire',{...pos,type:t.type})}}
 for(const b of s.shots){const e=s.enemies.find(e=>e.id===b.target&&e.hp>0);if(!e){b.dead=true;continue}const p=pointAt(s.map,e.d),distance=Math.hypot(p.x-b.x,p.y-b.y);if(distance<=b.speed*dt+5){b.dead=true;const victims=b.splash?s.enemies.filter(v=>Math.hypot(pointAt(s.map,v.d).x-p.x,pointAt(s.map,v.d).y-p.y)<=b.splash):[e];for(const v of victims){v.hp-=b.damage*(b.type==='cannon'?1:1-v.armor);if(b.type==='frost')v.slow=2.1}emit('hit',{...p,type:b.type,splash:b.splash})}else{b.x+=(p.x-b.x)/distance*b.speed*dt;b.y+=(p.y-b.y)/distance*b.speed*dt}}
 s.shots=s.shots.filter(b=>!b.dead);
 for(const e of s.enemies)if(e.hp<=0){s.gold+=e.reward;s.kills++;emit('kill',{...pointAt(s.map,e.d),type:e.type})}
 s.enemies=s.enemies.filter(e=>e.hp>0);
 if(!s.enemies.length&&!s.spawn.length){s.shots=[];const reward=20+s.wave*2;s.gold+=reward;s.status=s.wave===WAVES?'won':'build';emit(s.status==='won'?'won':'waveEnd',{reward})}
}
