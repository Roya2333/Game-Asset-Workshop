import {TYPES} from './core.js';
const TABS=['preview','refs','history','list','icons','sounds','story','dialogue','character-properties'];
const PAGES=['settings','tasks','trash','images','audios'];
export function resolveNavigation(project,saved={}){
  const type=TYPES[saved.type]?saved.type:'script';
  const doc=project.docs.find(d=>d.id===saved.selected);
  const selected=doc||project.docs.find(d=>d.type===type);
  return {type:doc?.type||type,selected:selected?.id||null,tab:TABS.includes(saved.tab)?saved.tab:'preview',special:PAGES.includes(saved.special)?saved.special:null,query:typeof saved.query==='string'?saved.query:''};
}
export function readView(storage,key){try{return JSON.parse(storage.getItem(key)||'null');}catch{return null;}}
export function saveView(local,session,state){
  try{const json=JSON.stringify(state);local.setItem('nw-last-view',json);local.setItem('nw-view:'+state.projectId,json);session.setItem('nw-current-view',json);}catch{/* Navigation memory must not block editing when storage is full. */}
}
