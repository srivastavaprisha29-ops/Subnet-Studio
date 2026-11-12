export function ipToInt(ip) {
  const p = String(ip).trim().split('.');
  if (p.length !== 4 || p.some(x => !/^\d{1,3}$/.test(x) || Number(x) > 255)) throw new Error('Enter four octets from 0 to 255, for example 192.168.1.10.');
  return p.reduce((n, x) => n * 256 + Number(x), 0);
}
export function intToIp(n) {
  if (!Number.isInteger(n) || n < 0 || n > 4294967295) throw new Error('IPv4 address out of range.');
  return [24,16,8,0].map(b => Math.floor(n / 2 ** b) % 256).join('.');
}
export function subnet(ip, prefix) {
  const n = ipToInt(ip); prefix = Number(prefix);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 30) throw new Error('Use a prefix from /0 to /30. This lab practices conventional subnets with network and broadcast addresses.');
  const total = 2 ** (32-prefix), network = Math.floor(n/total)*total, broadcast = network+total-1;
  return {ip:intToIp(n), n, prefix, hostBits:32-prefix, total, usable:total-2, network:intToIp(network), broadcast:intToIp(broadcast), first:intToIp(network+1), last:intToIp(broadcast-1), mask:intToIp(4294967296-total), networkInt:network, broadcastInt:broadcast};
}
export function maskToPrefix(mask) {
  const n = ipToInt(mask), bits = n.toString(2).padStart(32,'0');
  if (!/^1*0*$/.test(bits)) throw new Error('A subnet mask must have consecutive 1s followed by 0s.');
  return bits.indexOf('0') === -1 ? 32 : bits.indexOf('0');
}
export function rangeInfo(start, end) {
  const a = ipToInt(start), b = ipToInt(end);
  if (b < a) throw new Error('The range end must be at or after its start.');
  let prefix = 32, x=a, y=b;
  while(x !== y) {x=Math.floor(x/2); y=Math.floor(y/2); prefix--;}
  const size=2**(32-prefix), network=Math.floor(a/size)*size;
  const exact = a===network && b===network+size-1;
  const cover=[]; let c=a;
  while(c<=b) {
    let h=0; while(h<32 && c % 2**(h+1)===0 && 2**(h+1)<=b-c+1) h++;
    cover.push(`${intToIp(c)}/${32-h}`); c+=2**h;
  }
  return {count:b-a+1, prefix, covering:`${intToIp(network)}/${prefix}`, exact, cover};
}
export function vlsm(base, parentPrefix, requests) {
  const parent=subnet(base,parentPrefix); let cursor=parent.networkInt;
  return [...requests].sort((a,b)=>b.hosts-a.hosts).map(r=>{
    if (!Number.isInteger(r.hosts)||r.hosts<1) throw new Error('Host requirements must be positive integers.');
    const hostBits=Math.max(2,Math.ceil(Math.log2(r.hosts+2))), size=2**hostBits;
    cursor=Math.ceil(cursor/size)*size;
    if(cursor+size-1>parent.broadcastInt) throw new Error('These requests do not fit in the parent block.');
    const s=subnet(intToIp(cursor),32-hostBits); cursor+=size; return {...r,...s,cidr:`${s.network}/${s.prefix}`};
  });
}
const field=(key,label,type,answer,placeholder='')=>({key,label,type,answer:String(answer),placeholder});
export function addressQuestion(ip='167.199.170.82', prefix=27, title='Find the address block') {
  const s=subnet(ip,prefix), o=Math.floor(prefix/8), rem=prefix%8;
  const jump=rem===0?256:2**(8-rem), idx=rem===0?Math.max(0,o-1):o;
  return {kind:'address',title,tag:'Address calculations',ip:s.ip,prefix,lead:`An interface has the address ${s.ip}/${prefix}. Find its subnet and usable host range.`,fields:[field('mask','Subnet mask','ip',s.mask,'255.255.255.0'),field('network','Network address','ip',s.network,'e.g. 192.168.1.0'),field('broadcast','Broadcast address','ip',s.broadcast),field('first','First usable host','ip',s.first),field('last','Last usable host','ip',s.last),field('total','Total addresses','number',s.total),field('usable','Usable hosts','number',s.usable)],steps:[{title:'Separate the fixed and variable bits',body:`/${prefix} fixes the first ${prefix} bits. The remaining 32 − ${prefix} = ${s.hostBits} host bits can change. There are 2^${s.hostBits} = ${s.total.toLocaleString()} addresses.`},{title:'Build the subnet mask',body:`Write ${prefix} ones followed by ${s.hostBits} zeros, then convert each 8-bit octet to decimal. The mask is ${s.mask}.`},{title:'Find the network boundary',body:`Set every host bit to 0 (equivalently, IP AND mask). This gives ${s.network}. ${rem ? `In octet ${idx+1}, block boundaries jump by ${jump}; take the boundary at or below the address.` : `The prefix ends at an octet boundary; all following host octets become 0.`}`},{title:'Find the broadcast address',body:`Set every host bit to 1. Network + ${s.total} − 1 = ${s.broadcast}. The endpoints both belong to the subnet.`},{title:'Remove the two reserved endpoints',body:`First usable = ${s.first}; last usable = ${s.last}. Total addresses = ${s.total.toLocaleString()}; usable hosts = ${s.total} − 2 = ${s.usable.toLocaleString()}.`} ]};
}
export function maskQuestion(prefix=27, reverse=false) {
  const s=subnet('192.168.10.75',prefix);
  return {kind:'mask',title:reverse?'Read the mask':'Translate the prefix',tag:'CIDR & masks',ip:s.ip,prefix,lead:reverse?`Convert the subnet mask ${s.mask} to CIDR notation, then calculate the host capacity.`:`Convert /${prefix} to a dotted-decimal subnet mask, then calculate the host capacity.`,fields:[reverse?field('prefix','CIDR prefix','prefix',prefix,'e.g. /24'):field('mask','Subnet mask','ip',s.mask,'e.g. 255.255.255.0'),field('hostBits','Number of host bits','number',s.hostBits),field('total','Total addresses','number',s.total),field('usable','Usable hosts','number',s.usable)],steps:[{title:'Count the mask bits',body:`${s.mask} in binary is ${s.mask.split('.').map(x=>Number(x).toString(2).padStart(8,'0')).join(' · ')}. It contains ${prefix} consecutive ones, so the prefix is /${prefix}.`},{title:'Count the host combinations',body:`32 − ${prefix} = ${s.hostBits} host bits. The total block size is 2^${s.hostBits} = ${s.total.toLocaleString()} addresses.`},{title:'Reserve the endpoints',body:`For a conventional subnet, subtract one network and one broadcast address: ${s.total} − 2 = ${s.usable.toLocaleString()} usable hosts.`}]};
}
export function classQuestion(borrowed=2, base='146.102.0.0') {
  const prefix=16+borrowed, count=2**borrowed, s=subnet(base,prefix), jump=2**(8-borrowed);
  return {kind:'class',title:'Split a Class B network',tag:'Class B subnetting',ip:base,prefix,lead:`For this classful exercise, divide ${base}/16 into ${count} equal subnets. Find the new prefix, mask, and capacity of each subnet.`,fields:[field('borrowed','Bits borrowed from the host part','number',borrowed),field('prefix','New CIDR prefix','prefix',prefix,'e.g. /18'),field('mask','New subnet mask','ip',s.mask),field('usable','Usable hosts per subnet','number',s.usable),field('next','Second subnet network address','ip',intToIp(s.networkInt+s.total))],steps:[{title:'Start with the Class B default',body:`In this explicitly classful exercise, the starting mask is /16 (255.255.0.0). Modern routing uses the stated CIDR prefix rather than assuming an address class.`},{title:'Borrow enough bits',body:`2^b = ${count}, so b = ${borrowed}. New prefix = 16 + ${borrowed} = /${prefix}. Those ${borrowed} borrowed bits identify the equal subnets.`},{title:'Convert the partial octet',body:`The third mask octet is ${'1'.repeat(borrowed)+'0'.repeat(8-borrowed)}₂ = ${Number.parseInt('1'.repeat(borrowed)+'0'.repeat(8-borrowed),2)}. The complete mask is ${s.mask}; subnet boundaries jump by ${jump} in octet 3.`},{title:'Count hosts and move one block',body:`Each subnet has ${s.hostBits} host bits: 2^${s.hostBits} = ${s.total.toLocaleString()} addresses and ${s.usable.toLocaleString()} usable hosts. The second network is ${intToIp(s.networkInt+s.total)}/${prefix}. All ${count} subnets are counted; no obsolete “subtract two subnets” rule.`}]};
}
export function rangeQuestion(start='146.102.29.0',end='146.102.32.255') {
  const r=rangeInfo(start,end);
  return {kind:'range',title:'A range across octets',tag:'Variable ranges',start,end,ip:start,prefix:r.prefix,lead:`Consider every IPv4 address from ${start} through ${end}, inclusive. Count the addresses and decide whether this is one exact CIDR block.`,fields:[field('count','Addresses in the inclusive range','number',r.count),field('exact','Is the range one exact CIDR block?','choice',r.exact?'yes':'no'),field('covering','Smallest single CIDR covering the range','cidr',r.covering,'e.g. 146.102.0.0/18')],steps:[{title:'Count across the octet boundary',body:`Treat each IPv4 address as a 32-bit number. End − start + 1 = ${ipToInt(end).toLocaleString()} − ${ipToInt(start).toLocaleString()} + 1 = ${r.count.toLocaleString()} addresses.`},{title:'Check size AND alignment',body:`A single CIDR block needs a power-of-two size and a correctly aligned starting address. ${r.exact?'This range meets both conditions.':'This range is not one CIDR block. A power-of-two count alone does not guarantee alignment.'}`},{title:'Find the common fixed bits',body:`The endpoints share their first ${r.prefix} bits. The smallest single covering block is ${r.covering}${r.exact?'.':'; it also includes addresses outside the requested range.'}`},{title:'Cover the exact range without extras',body:`An exact decomposition is ${r.cover.join(' + ')}. These aligned blocks cover just the requested addresses.`}]};
}
export function vlsmQuestion(base='192.168.10.0', requests=[{name:'A',hosts:60},{name:'B',hosts:28},{name:'C',hosts:12}]) {
  const alloc=vlsm(base,24,requests);
  return {kind:'vlsm',title:'Give each network enough space',tag:'VLSM allocation',ip:base,prefix:24,alloc,lead:`Allocate inside ${base}/24, starting at its lowest address. Serve the largest network first, use the smallest conventional subnet that fits, and place each next subnet at the next valid boundary.`,fields:alloc.map(r=>field(r.name,`Network ${r.name} · ${r.hosts} hosts · network/prefix`,'cidr',r.cidr,'e.g. 192.168.10.0/26')),steps:[{title:'Work from largest to smallest',body:`Order the requests by host count: ${alloc.map(r=>`${r.name} (${r.hosts})`).join(', ')}. Include two reserved addresses in each requirement.`},...alloc.map(r=>({title:`Allocate network ${r.name}`,body:`${r.hosts} hosts need at least ${r.hosts+2} total addresses. The next usable power-of-two block has ${r.total} addresses, so use ${r.cidr}. It provides ${r.usable} usable hosts, from ${r.first} to ${r.last}; broadcast ${r.broadcast}.`}))]};
}
export const examples=[
  {label:'/27 · 167.199.170.82',make:()=>addressQuestion()},
  {label:'/24 · 192.168.1.10',make:()=>addressQuestion('192.168.1.10',24)},
  {label:'Class B · /16 into four',make:()=>classQuestion()},
  {label:'Mask · 255.255.192.0',make:()=>maskQuestion(18,true)},
  {label:'Range · 32 addresses at .96',make:()=>rangeQuestion('14.11.45.96','14.11.45.127')},
  {label:'Range · .29.0 through .32.255',make:()=>rangeQuestion()},
  {label:'VLSM · 60, 28, 12 hosts',make:()=>vlsmQuestion()}
];
export function generateQuestion(topic='mixed',rng=Math.random) {
  const pick=a=>a[Math.floor(rng()*a.length)], num=(a,b)=>a+Math.floor(rng()*(b-a+1));
  const type=topic==='mixed'?pick(['address','mask','class','range','vlsm']):topic;
  const ip=`${pick([10,172,192])}.${num(16,31)}.${num(0,240)}.${num(1,254)}`;
  if(type==='mask') return maskQuestion(pick([16,18,20,23,24,25,26,27,28,29,30]),rng()<.5);
  if(type==='class') return classQuestion(num(1,6),`${num(128,191)}.${num(0,255)}.0.0`);
  if(type==='range') {
    const oct=num(0,245), count=pick([1,2,3,4,5,8]);
    return rangeQuestion(`146.102.${oct}.0`,`146.102.${oct+count-1}.255`);
  }
  if(type==='vlsm') return vlsmQuestion(`192.168.${num(0,254)}.0`,[{name:'A',hosts:pick([45,50,60,90])},{name:'B',hosts:pick([18,25,28])},{name:'C',hosts:pick([6,10,12])}]);
  return addressQuestion(ip,pick([16,18,20,23,24,25,26,27,28,29,30]));
}
export function normalize(value,type) {
  const v=String(value).trim();
  if(type==='ip') return intToIp(ipToInt(v));
  if(type==='prefix') {if(!/^\/?\d{1,2}$/.test(v))throw new Error('Enter a prefix such as /27 or 27.'); const p=Number(v.replace('/','')); if(p>32)throw new Error('A prefix is between 0 and 32.'); return String(p);}
  if(type==='number') {const n=v.replaceAll(',','');if(!/^\d+$/.test(n))throw new Error('Enter a whole number.'); return String(Number(n));}
  if(type==='cidr') {const p=v.split('/');if(p.length!==2||!/^\d{1,2}$/.test(p[1])||Number(p[1])>32)throw new Error('Use network/prefix, for example 192.168.1.0/24.'); return `${intToIp(ipToInt(p[0]))}/${Number(p[1])}`;}
  return v.toLowerCase();
}
export function checkField(field,value) {
  if(!String(value).trim())return {ok:false,empty:true,message:'Add your answer.'};
  try {const ok=normalize(value,field.type)===normalize(field.answer,field.type);return {ok,message:ok?'Correct':'Try again — use a hint or reveal the worked steps.'};}
  catch(e){return {ok:false,message:e.message};}
}
