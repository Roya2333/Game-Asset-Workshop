const sequence=(prefix,value)=>{const match=String(value||'').match(new RegExp('^'+prefix+'-(\\d+)$'));const n=match?Number(match[1]):0;return Number.isSafeInteger(n)&&n>0?n:0;};
const safeCounter=value=>Number.isSafeInteger(value)&&value>=0?value:0;
const prefixes={item:'ITEM',skill:'SKILL',term:'TERM',character:'CHAR',ui:'UI',narrative:'STORY',music:'MUSIC',sound:'SOUND',asset:'ASSET'};
const records=p=>[...(p?.docs||[]),...(p?.trash||[]).filter(x=>x.kind==='document').map(x=>x.data)].filter(Boolean);
export function ensureContentNumbers(project,previous){
 let changed=false;const old=new Map(records(previous).map(d=>[d.id,d]));
 const unique=new Map(records(project).map(d=>[d.id,d]));project.contentNumberCounters||={};
 for(const [type,prefix] of Object.entries(prefixes)){
  let counter=Math.max(safeCounter(project.contentNumberCounters[type]),safeCounter(previous?.contentNumberCounters?.[type]));const used=new Set(),reserved=new Map(records(previous).filter(d=>d.type===type&&d.contentNumber).map(d=>[d.contentNumber,d.id]));
  for(const d of unique.values()){if(d.type!==type)continue;const saved=old.get(d.id)?.contentNumber;if(saved&&d.contentNumber!==saved){d.contentNumber=saved;changed=true;}counter=Math.max(counter,sequence(prefix,d.contentNumber));}
  for(const d of unique.values()){if(d.type!==type)continue;if(!sequence(prefix,d.contentNumber)||used.has(d.contentNumber)||(reserved.has(d.contentNumber)&&reserved.get(d.contentNumber)!==d.id)){if(counter>=Number.MAX_SAFE_INTEGER)throw Error('编号超出范围，请检查导入文件');d.contentNumber=prefix+'-'+String(++counter).padStart(4,'0');changed=true;}used.add(d.contentNumber);}
  if(project.contentNumberCounters[type]!==counter){project.contentNumberCounters[type]=counter;changed=true;}
 }
 return changed;
}
export function matchesPlanningSearch(doc,query=''){return [doc.contentNumber,doc.title,JSON.stringify(doc.details||{})].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());}
