import {CHARACTER_FIELDS,normalizeCharacterFields} from './character-fields.js';
export function parseProfileCandidate(text){
  const data=JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('AI 未返回人物资料对象');
  const result={};
  for(const [key] of CHARACTER_FIELDS){
    if(data[key]!=null&&typeof data[key]!=='string')throw Error('人物资料字段格式不正确');
    if(data[key]!=null||['name','gender','faction'].includes(key))result[key]=(data[key]||'').trim().slice(0,['name','gender','faction','age','species','identity','occupation'].includes(key)?100:10000);
  }
  if(data.customFields!=null&&!Array.isArray(data.customFields))throw Error('自定义字段格式不正确');
  result.customFields=(data.customFields||[]).slice(0,30).filter(x=>x&&typeof x.name==='string'&&typeof x.value==='string').map(x=>({name:x.name.trim().slice(0,60),value:x.value.trim().slice(0,10000)})).filter(x=>x.name);
  if(!Object.values(result).some(x=>typeof x==='string'?x:x.length))throw Error('AI 未返回可用的人物资料');
  return normalizeCharacterFields(result);
}
export function mergeProfile(character,candidate){
  const next=normalizeCharacterFields(character);candidate=normalizeCharacterFields(candidate);
  for(const [key] of CHARACTER_FIELDS)if(!String(next[key]||'').trim())next[key]=candidate[key]||'';
  next.customFields||=[];
  for(const field of candidate.customFields||[]){
    const existing=next.customFields.find(x=>x.name.trim()===field.name.trim());
    if(existing){if(!String(existing.value||'').trim())existing.value=field.value;}
    else next.customFields.push({...field});
  }
  return next;
}
