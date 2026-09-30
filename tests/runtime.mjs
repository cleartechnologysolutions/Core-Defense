import assert from 'node:assert/strict';
const {Miniflare}=await import(process.env.MINIFLARE_MODULE||'miniflare');
import {fresh,place,startWave,tick} from '../public/engine.js';
const root=new URL('../',import.meta.url).pathname;
const mf=new Miniflare({modules:true,modulesRoot:root,scriptPath:root+'worker/index.js',modulesRules:[{type:'ESModule',include:['**/*.js']}],compatibilityDate:'2026-05-22',durableObjects:{PLAYERS:{className:'Player',useSQLite:true}},assets:{directory:root+'public',binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true},assetConfig:{html_handling:'none'}}});
try{
 const base='http://localhost';let response=await mf.dispatchFetch(base+'/api/adam');assert.equal(response.status,200);const initial=await response.json();assert.equal(initial.version,0);
 const g=fresh();place(g,'bolt',7,0);startWave(g);for(let i=0;i<300;i++)tick(g,.05);
 response=await mf.dispatchFetch(base+'/api/adam',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({version:0,game:g})});assert.equal(response.status,200);
 const result=await response.json();assert.equal(result.game.wave,1);
 assert.equal((await mf.dispatchFetch(base+'/api/adam',{method:'POST',body:'{}'})).status,403);
 for(const path of ['/', '/adam','/app.js','/engine.js','/style.css']){const r=await mf.dispatchFetch(base+path);assert.equal(r.status,200);assert.equal(r.headers.get('location'),null)}
 console.log('PASS: actual Cloudflare runtime, snapshot persistence, origin checks, asset routes and no redirect loop.');
}finally{await mf.dispose()}
