import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const events=[];const param=()=>({value:0,setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&t>=0);events.push(['set',v,t])},exponentialRampToValueAtTime(v,t){assert.ok(Number.isFinite(v)&&v>0&&t>=0)}});
class AudioContext{constructor(){this.currentTime=1;this.sampleRate=44100;this.state='running';this.destination={}}createGain(){return {gain:param(),connect(){}}}createDynamicsCompressor(){return {threshold:param(),ratio:param(),connect(){}}}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)}}createOscillator(){return {frequency:param(),connect(){},start(t){events.push(['osc',t])},stop(){}}}createBufferSource(){return {connect(){},start(){events.push(['noise'])},stop(){}}}createBiquadFilter(){return {frequency:param(),connect(){}}}resume(){this.state='running'}}
const s=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),context=vm.createContext({window:{AudioContext},audio:null,soundOn:true,paused:false,game:{status:'wave'},document:{hidden:false}});
vm.runInContext(s.slice(s.indexOf('let master='),s.indexOf('function effects(')),context);
for(const weapon of ['bolt','cannon','frost'])vm.runInContext(`tone('fire','${weapon}');audio.currentTime+=1`,context);
assert.equal(events.filter(e=>e[0]==='noise').length,1,'mortar has a noise transient');assert.equal(events.filter(e=>e[0]==='osc').length,5,'distinct layered weapon voices');
for(const type of ['hit','kill','wave','won','lost','build'])vm.runInContext(`tone('${type}');audio.currentTime+=1`,context);
vm.runInContext('for(let i=0;i<16;i++){soundtrack(.25);audio.currentTime+=.25}',context);
const count=events.length;vm.runInContext("soundOn=false;tone('fire');soundtrack(.5)",context);assert.equal(events.length,count,'mute prevents new audio');
console.log('PASS: weapon layers, noise bursts, musical scheduling, positive envelopes, soundtrack and mute.');
