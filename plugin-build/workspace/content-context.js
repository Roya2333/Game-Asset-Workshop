import {effectiveSources} from './relations.js';
// Unspecified nested fields, images and audio survive a partial GPT edit.
export function mergeContentPatch(current,patch){
 if(!patch||typeof patch!=='object'||Array.isArray(patch))return structuredClone(patch);
 const result=current&&typeof current==='object'&&!Array.isArray(current)?structuredClone(current):{};
 for(const [key,value] of Object.entries(patch)){if(['__proto__','constructor','prototype'].includes(key))continue;result[key]=value&&typeof value==='object'&&!Array.isArray(value)?mergeContentPatch(result[key],value):structuredClone(value);}
 return result;
}
export const creativeReferences=effectiveSources;
