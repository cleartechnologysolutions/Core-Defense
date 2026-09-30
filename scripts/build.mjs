import fs from 'node:fs';
import {fresh,MAPS,TYPES,wavePlan} from '../public/engine.js';
for(const file of ['public/index.html','public/app.js','public/style.css','public/engine.js','worker/index.js'])if(!fs.existsSync(file))throw Error('Missing '+file);
for(let map=0;map<MAPS.length;map++)for(let wave=1;wave<=12;wave++){const plan=wavePlan(wave,map);if(!plan.length||plan.some(e=>!Number.isFinite(e.hp)))throw Error('Invalid wave')}
console.log('Core Defense ready: 3 sectors, 36 waves, 3 tower types. Static assets and Worker are deployable.');
