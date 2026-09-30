const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const num=(n,max=1000000)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
export function validGame(g){
 if(!g||![0,1,2].includes(g.map)||!Number.isInteger(g.wave)||!num(g.wave,12)||!['build','wave','won','lost'].includes(g.status)||!num(g.gold)||!num(g.health,20)||!num(g.kills)||!num(g.time)||!Number.isInteger(g.nextId)||!num(g.nextId)||!num(g.spawnIn,10))return false;
 if(g.status==='won'&&(g.wave!==12||g.health<=0))return false;
 if(!Array.isArray(g.towers)||g.towers.length>120||!Array.isArray(g.enemies)||g.enemies.length>100||!Array.isArray(g.shots)||g.shots.length>300||!Array.isArray(g.spawn)||g.spawn.length>50)return false;
 if(g.rules!==2||!g.cooldowns||!num(g.cooldowns.airstrike,24)||!num(g.cooldowns.freeze,18)||!Array.isArray(g.zones)||g.zones.length>40||!g.zones.every(z=>z&&Number.isFinite(z.x)&&z.x>=-30&&z.x<=400&&Number.isFinite(z.y)&&z.y>=-30&&z.y<=460&&num(z.r,100)&&num(z.life,3)&&num(z.damage)))return false;
 const towerTypes=['bolt','cannon','frost'],enemyTypes=['scout','runner','tank','boss','shield','repair'];
 if(!g.towers.every(t=>t&&towerTypes.includes(t.type)&&(!t.branch||({bolt:['rapid','chain'],cannon:['siege','napalm'],frost:['deep','blizzard']}[t.type]).includes(t.branch))&&Number.isInteger(t.col)&&num(t.col,9)&&Number.isInteger(t.row)&&num(t.row,11)&&[1,2,3].includes(t.level)&&num(t.id)&&num(t.spent)&&num(t.cooldown,10)&&typeof t.angle==='number'&&Number.isFinite(t.angle)))return false;
 if(new Set(g.towers.map(t=>t.col+','+t.row)).size!==g.towers.length)return false;
 const spec=e=>e&&enemyTypes.includes(e.type)&&[0,1].includes(e.lane)&&num(e.hp)&&num(e.speed,1000)&&num(e.reward,1000)&&num(e.armor,1)&&num(e.leak,20);
 return g.spawn.every(spec)&&g.enemies.every(e=>spec(e)&&num(e.id)&&num(e.maxHp)&&num(e.d,3000)&&num(e.slow,10)&&(e.slowFactor===undefined||num(e.slowFactor,1)))&&g.shots.every(b=>b&&towerTypes.includes(b.type)&&num(b.id)&&num(b.target)&&typeof b.x==='number'&&Number.isFinite(b.x)&&typeof b.y==='number'&&Number.isFinite(b.y)&&num(b.damage)&&num(b.speed,1000)&&num(b.splash,200)&&num(b.chain,3)&&typeof b.burn==='boolean'&&num(b.slowFactor,1)&&num(b.slowTime,4));
}
export class Player {
 constructor(ctx){this.ctx=ctx;this.queue=Promise.resolve()}
 fetch(req){const job=this.queue.then(()=>this.handle(req));this.queue=job.catch(()=>{});return job}
 async handle(req){let s=await this.ctx.storage.get('state')||{version:0,unlocked:0,best:[0,0,0],game:null};if(req.method==='GET')return json(s);
 let body;try{const text=await req.text();if(text.length>65536)return json({error:'Save is too large.'},413);body=JSON.parse(text)}catch{return json({error:'Invalid save.'},400)}
 if(body.version!==s.version)return json({error:'Your link was updated elsewhere. The latest save was loaded.',state:s},409);
 if(!validGame(body.game))return json({error:'Invalid game data.'},400);
 if(body.game.map>s.unlocked)return json({error:'Complete the previous sector first.'},403);
 s.game=body.game;s.best[s.game.map]=Math.max(s.best[s.game.map],s.game.status==='build'||s.game.status==='won'?s.game.wave:Math.max(0,s.game.wave-1));
 if(s.game.status==='won')s.unlocked=Math.min(2,Math.max(s.unlocked,s.game.map+1));
 s.version++;await this.ctx.storage.put('state',s);return json(s)
 }
}
export default{async fetch(req,env){const url=new URL(req.url);
 if(url.pathname.startsWith('/api/')){const slug=url.pathname.slice(5);if(!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(slug))return json({error:'Invalid player link.'},400);if(!['GET','POST'].includes(req.method))return json({error:'Method not allowed.'},405);if(req.method==='POST'&&req.headers.get('Origin')!==url.origin)return json({error:'Invalid origin.'},403);if(Number(req.headers.get('Content-Length'))>65536)return json({error:'Save is too large.'},413);return env.PLAYERS.get(env.PLAYERS.idFromName(slug)).fetch(req)}
 if(['/app.js','/engine.js','/style.css','/favicon.svg'].includes(url.pathname))return env.ASSETS.fetch(req);
 if(url.pathname==='/'||/^\/[a-z0-9][a-z0-9_-]{0,39}$/.test(url.pathname)){url.pathname='/index.html';const response=await env.ASSETS.fetch(new Request(url,req));const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'");return new Response(response.body,{status:response.status,headers})}return new Response('Not found',{status:404})}};
