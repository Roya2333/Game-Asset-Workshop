export function createProjectWriter(save){
 let queue=Promise.resolve(),pending=0;
 const write=project=>{pending++;const task=queue.then(()=>save(project));queue=task.catch(()=>{});return task.finally(()=>{pending--;});};
 write.pending=()=>pending>0;return write;
}
export function contentSnapshot(doc){
 const result={md:doc.md,details:structuredClone(doc.details||{})};
 for(const key of ['title','folder','status','character','dialogue','refs','participants','images','media'])if(Object.hasOwn(doc,key))result[key]=structuredClone(doc[key]);
 if(doc.media?.fileId)result.fileId=doc.media.fileId;
 result.fullContent=true;return result;
}
export function restoreSnapshot(doc,version){
 doc.md=version.md;doc.details=structuredClone(version.details||{});
 for(const key of ['media','character','dialogue','refs','participants','images','title','folder','status']){
  if(Object.hasOwn(version,key))doc[key]=structuredClone(version[key]);
  else if(key==='media'||version.fullContent)delete doc[key];
 }
}
