import {TYPES,CHARACTER_FOLDERS,FIXED_SCRIPT_FOLDERS,isFixedSkill} from './core.js';
export const isLockedDefault=doc=>!!doc?.lockedDefault||isFixedSkill(doc);
export function lockProjectDefaults(project){
  if(project.defaultLocksVersion===1)return false;
  for(const d of project.docs){if(isFixedSkill(d))d.lockedDefault=true;}
  for(const type of Object.keys(TYPES)){
    if(type==='script'){for(const folder of FIXED_SCRIPT_FOLDERS){const d=project.docs.find(d=>d.type===type&&d.folder===folder);if(d)d.lockedDefault=true;}}
    else if(type!=='skill'){const d=project.docs.find(d=>d.type===type);if(d)d.lockedDefault=true;}
  }
  project.defaultLocksVersion=1;return true;
}
export function moveFolders(doc,docs){return [...new Set([...(doc.type==='character'?CHARACTER_FOLDERS:doc.type==='script'?FIXED_SCRIPT_FOLDERS:['默认分类']),...docs.filter(d=>d.type===doc.type).map(d=>d.folder||'未分类')])];}
