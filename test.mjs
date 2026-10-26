import assert from 'node:assert/strict';
import {subnet,ipToInt,intToIp,maskToPrefix,rangeInfo,vlsm,examples,generateQuestion,checkField} from './dist/core.mjs';
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
eq(subnet('167.199.170.82',27),{ip:'167.199.170.82',n:2814880338,prefix:27,hostBits:5,total:32,usable:30,network:'167.199.170.64',broadcast:'167.199.170.95',first:'167.199.170.65',last:'167.199.170.94',mask:'255.255.255.224',networkInt:ipToInt('167.199.170.64'),broadcastInt:ipToInt('167.199.170.95')});
const a=subnet('192.168.1.10',24);eq([a.network,a.broadcast,a.first,a.last,a.total,a.usable],['192.168.1.0','192.168.1.255','192.168.1.1','192.168.1.254',256,254]);
const b=subnet('146.102.129.12',18);eq([b.mask,b.network,b.broadcast,b.usable],['255.255.192.0','146.102.128.0','146.102.191.255',16382]);
eq(rangeInfo('146.102.29.0','146.102.32.255'),{count:1024,prefix:18,covering:'146.102.0.0/18',exact:false,cover:['146.102.29.0/24','146.102.30.0/23','146.102.32.0/24']});
eq(rangeInfo('14.11.45.96','14.11.45.127'),{count:32,prefix:27,covering:'14.11.45.96/27',exact:true,cover:['14.11.45.96/27']});
eq(vlsm('192.168.10.0',24,[{name:'A',hosts:60},{name:'B',hosts:28},{name:'C',hosts:12}]).map(x=>x.cidr),['192.168.10.0/26','192.168.10.64/27','192.168.10.96/28']);
eq([subnet('255.255.255.255',30).network,subnet('0.0.0.0',0).broadcast],['255.255.255.252','255.255.255.255']);
for(const bad of ['300.1.1.1','1.2.3','1.2.3.-1','a.b.c.d','1.2.3.4.5','1.2.3.'])assert.throws(()=>ipToInt(bad));
assert.throws(()=>maskToPrefix('255.255.128.128'));assert.throws(()=>rangeInfo('1.1.1.2','1.1.1.1'));assert.throws(()=>subnet('1.2.3.4',31));
for(let p=0;p<=30;p++){const s=subnet('167.199.170.82',p);eq(maskToPrefix(s.mask),p);eq(s.broadcastInt-s.networkInt+1,2**(32-p));eq(ipToInt(s.first),s.networkInt+1);eq(ipToInt(s.last),s.broadcastInt-1);}
// Independent BigInt bit masks verify random arithmetic across all octets.
let seed=20261027;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<1000;i++){const n=Math.floor(rng()*4294967296),p=Math.floor(rng()*31),s=subnet(intToIp(n),p),mask=(0xffffffffn << BigInt(32-p))&0xffffffffn;eq(BigInt(s.networkInt),BigInt(n)&mask);eq(BigInt(s.broadcastInt),(BigInt(n)&mask)|(~mask&0xffffffffn));eq(intToIp(ipToInt(intToIp(n))),intToIp(n));}
for(const topic of ['mixed','address','mask','class','range','vlsm'])for(let i=0;i<100;i++){const q=generateQuestion(topic,rng);assert.ok(q.steps.length>0);for(const f of q.fields){eq(checkField(f,f.answer).ok,true);eq(checkField(f,'').empty,true);eq(checkField(f,'nonsense').ok,false);}if(q.kind==='vlsm'){let prev=ipToInt(q.ip)-1;for(const r of q.alloc){assert.ok(r.networkInt>prev);assert.ok(r.usable>=r.hosts);prev=r.broadcastInt;assert.ok(prev<=ipToInt(q.ip)+255);}}}
for(const e of examples)for(const f of e.make().fields)eq(checkField(f,f.answer).ok,true);
eq(checkField({type:'prefix',answer:'27'},'/27').ok,true);eq(checkField({type:'number',answer:'16382'},'16,382').ok,true);eq(checkField({type:'ip',answer:'1.2.3.4'},'1.2.3.5').ok,false);
console.log(`Passed ${checks.toLocaleString()} assertions: known examples, all prefixes /0–/30, 1,000 independent bit-mask cases, and 600 generated question sets.`);
