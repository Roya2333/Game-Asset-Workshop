import {reviewAsset,slotState} from './asset-slots.js';
import {escapeHTML} from './core.js';
import {confirmImage,candidateKey} from './character-images.js';
import {alphaSummary} from './ui-model.js';
export function imageRecords(project,fileId,scope={}){
 const found=[],seen=new Set();
 function visit(value){if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);if(value.fileId===fileId)found.push(value);for(const [key,child] of Object.entries(value))if(typeof child==='object'&&!['history','versions','originalHistory','audioHistory','trash'].includes(key)&&!key.startsWith('history:'))visit(child);}
 // Recycle bin entries remain unchanged until restored.
 for(const doc of project.docs||[])if(!scope.docId||doc.id===scope.docId){if(scope.slot)visit(slotState(doc,scope.slot));else visit(doc);}
 if(!scope.docId&&!scope.slot)for(const task of project.tasks||[])visit(task);
 return found;
}
export function imageStatus(project,fileId){const records=imageRecords(project,fileId);return records.some(r=>r.imageStatus==='confirmed'||r.status==='confirmed'||r.confirmedAt)?'confirmed':'pending';}
export function setImageStatus(project,fileId,status,scope={}){
 if(!['pending','confirmed'].includes(status))throw Error('无效图片状态');
 const owners=(project.docs||[]).filter(d=>(!scope.docId||d.id===scope.docId)&&imageRecords({docs:[d]},fileId).length);if(owners.length>1&&!scope.docId)throw Error('该文件被多个内容使用，请从所属条目确认');for(const doc of owners){const slots=Object.entries(doc.details?.assets||{}).filter(([slot,s])=>(!scope.slot||scope.slot===slot)&&[s.candidate,s.current].some(r=>r?.fileId===fileId));if(slots.length>1&&!scope.slot)throw Error('该文件用于多个用途，请选择具体用途');for(const [slot]of slots)reviewAsset(doc,slot,status);}const time=Date.now();for(const r of imageRecords(project,fileId,scope)){if(!['running','done','adopted','failed','cancelled'].includes(r.status))r.status=status;r.imageStatus=status;r.reviewStatus=status==='confirmed'?'confirmed':'pending';r.confirmedAt=status==='confirmed'?time:null;}
 if(status==='confirmed')for(const doc of owners){const files=doc.character?.files||{};for(const key of Object.keys(files))if(key.startsWith('candidate:')&&files[key].fileId===fileId)confirmImage(files,key.slice(candidateKey('').length),crypto.randomUUID(),time);}
}
export function installImageStates({getProject,getCurrentDoc=()=>null,urls,save,render,onError=()=>{},root=document.body}){
 const inspected=new WeakMap();
 const inspect=img=>{const src=img.getAttribute('src');if(!src||src.includes('#ns-file=')||inspected.get(img)===src||img.closest('.ui-editor-page'))return;inspected.set(img,src);const run=()=>{try{if(img.naturalWidth*img.naturalHeight>16777216)return;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const cx=c.getContext('2d');cx.drawImage(img,0,0);const alpha=alphaSummary(cx.getImageData(0,0,c.width,c.height).data);const label=alpha.empty?'全透明：没有可见像素':alpha.hasTransparency?'Alpha：含透明像素':'Alpha：全不透明';img.title=label;let badge=(img.closest('button')||img).nextElementSibling;if(!badge?.classList.contains('image-alpha-note')){badge=document.createElement('small');badge.className='image-alpha-note';(img.closest('button')||img).after(badge);}badge.textContent=label;}catch{img.title='无法检测 Alpha，请检查原始图片';}};if(img.complete&&img.naturalWidth)run();else img.addEventListener('load',run,{once:true});};
 let scheduled=false;
 const refresh=()=>{scheduled=false;const project=getProject();if(!project)return;for(const img of root.querySelectorAll('img')){
  inspect(img);if(img.closest('.skill-table,.image-review-page,.ui-editor-page'))continue;
  const fileId=img.dataset.file||[...urls].find(([,url])=>url===img.getAttribute('src'))?.[0];
  if(!fileId||!imageRecords(project,fileId).length)continue;
  const host=img.closest('button')||img;
  let controls=host.nextElementSibling;
  if(!controls?.classList.contains('image-review-controls')){controls=document.createElement('div');controls.className='image-review-controls';host.after(controls);}
  const status=imageStatus(project,fileId);
  const html=`<span class="char-image-status ${status==='confirmed'?'confirmed':'pending'}">${status==='confirmed'?'确认':'待修改'}</span><button type="button" class="btn subtle" data-review-file="${escapeHTML(fileId)}" data-review-status="pending" aria-pressed="${status==='pending'}">待修改</button><button type="button" class="btn subtle" data-review-file="${escapeHTML(fileId)}" data-review-status="confirmed" aria-pressed="${status==='confirmed'}">确认</button>`;
  if(controls.innerHTML!==html)controls.innerHTML=html;
 }};
 new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(refresh);}}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-file']});
 root.addEventListener('click',async ev=>{const button=ev.target.closest('[data-review-file]');if(!button)return;ev.preventDefault();ev.stopPropagation();const project=getProject(),backup=structuredClone(project);try{setImageStatus(project,button.dataset.reviewFile,button.dataset.reviewStatus,{docId:getCurrentDoc()?.id});if(await save()===false)throw Error('图片状态保存失败，请重试');}catch(error){Object.assign(project,backup);onError(error);}render();refresh();});
 refresh();
}
