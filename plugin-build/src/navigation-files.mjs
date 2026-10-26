import {assetName,documentName,uniqueName} from '../workspace/file-names.js';
import {resourceFilePath,MIME_EXTENSIONS} from './resource-files.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {serializeMD,safePath} from '../workspace/core.js';
import {NAV_FOLDERS,documentFolder,attachmentFolder} from '../workspace/storage-layout.js';
const valid=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
const extensions=MIME_EXTENSIONS;
const mdRecord=(key,value,body)=>'---\nschema_version: 1\npath_base: project-root\n'+key+': '+JSON.stringify(value)+'\n---\n\n'+body+'\n';
export async function writeNavigationFiles(directory,project,resourceRoot){
 for(const folder of NAV_FOLDERS)await fs.mkdir(path.join(directory,folder),{recursive:true});
 const documents=[],texts=[],assets=new Map(),missing=new Set(),names=new Map();
 const used=folder=>{if(!names.has(folder))names.set(folder,new Map());return names.get(folder);};
 async function materialize(value,owner,slot=''){
  if(!value||typeof value!=='object')return value;
  if(Array.isArray(value))return Promise.all(value.map((v,i)=>materialize(v,owner,slot+'.'+i)));
  const copy={};for(const [k,v] of Object.entries(value))copy[k]=k==='md'?v:await materialize(v,owner,slot?slot+'.'+k:k);
  if(!value.fileId)return copy;
  if(!valid(value.fileId)){copy.path=null;copy.missing=true;return copy;}
  let record;try{const meta=await fs.readFile(path.join(resourceRoot,value.fileId,'资源.md'),'utf8');record=JSON.parse(meta.match(/^resource: (.+)$/m)[1]);}catch(err){if(err.code!=='ENOENT')throw err;missing.add(value.fileId);copy.path=null;copy.missing=true;return copy;}
  const folder=owner.archiveFolder||attachmentFolder(owner,record.mime),relative=folder+'/素材/'+owner.id+'/'+uniqueName(assetName(owner,slot,record.name),extensions[record.mime]||'bin',value.fileId,used(folder+'/'+owner.id));
  const source=await resourceFilePath(path.join(resourceRoot,value.fileId),record.mime,record.storedName),target=path.join(directory,...relative.split('/'));await fs.mkdir(path.dirname(target),{recursive:true});
  if(!assets.has(relative)){try{await fs.link(source,target);}catch(err){if(err.code==='ENOENT'){missing.add(value.fileId);copy.path=null;copy.missing=true;return copy;}if(err.code!=='EEXIST')await fs.copyFile(source,target);}assets.set(relative,{fileId:value.fileId,docId:owner.id,name:record.name,mime:record.mime,size:record.size,sha256:record.hash,path:relative});}
  copy.path=relative;copy.mime=record.mime;copy.missing=false;return copy;
 }
 async function writeDoc(folder,doc,sourcePath){const name=uniqueName(documentName(doc),'md',doc.id,used(folder)),relative=folder+'/'+name;let md=serializeMD(doc);md=md.replace(/^---\n/,'---\nschema_version: 1\npath_base: project-root\n'+(sourcePath?'source_path: '+JSON.stringify(sourcePath)+'\n':''));await fs.writeFile(path.join(directory,folder,name),md);if(!sourcePath)texts.push('## '+doc.title+'\n\n'+md);documents.push({id:doc.id,...(doc.contentNumber?{number:doc.contentNumber}:{}),type:doc.type,title:doc.title,path:relative,...(sourcePath?{sourcePath}:{} )});return relative;}
 for(const original of project.docs){const d=await materialize(original,original),folder=documentFolder(d),source=await writeDoc(folder,d);if(d.type==='item'||d.type==='skill'){const prefix=d.type==='item'?'道具':'技能';await writeDoc(prefix+'图标',d,source);await writeDoc(prefix+'音效',d,source);}if(d.type==='narrative')await writeDoc('人物对白',d,source);}
 for(const task of project.tasks||[]){const id=valid(task.id)?task.id:randomUUID(),data=await materialize(task,{id,type:'asset',archiveFolder:'生成记录'});await fs.writeFile(path.join(directory,'生成记录',id+'.md'),mdRecord('task',data,'# 生成记录'));}
 for(const entry of project.trash||[]){const id=valid(entry.id)?entry.id:randomUUID(),data=await materialize(entry,{id,type:'asset',archiveFolder:'垃圾桶'});await fs.writeFile(path.join(directory,'垃圾桶',id+'.md'),mdRecord('trash_entry',data,'# 可恢复条目'));}
 const resources=[...assets.values()];
 for(const [folder,prefix] of [['图片索引','image/'],['音频索引','audio/']])await fs.writeFile(path.join(directory,'素材库',folder+'.md'),mdRecord('resources',resources.filter(r=>r.mime.startsWith(prefix)),'# '+folder+'\n\n文件保存在所属板块，索引不复制业务条目。'));
 await fs.writeFile(path.join(directory,'项目全量资料.md'),'# 项目全量资料\n\n附件 path 以本目录为根目录。\n\n'+texts.join('\n\n---\n\n'));await fs.writeFile(path.join(directory,'项目.md'),mdRecord('project',{id:project.id,name:project.name,description:project.description||'',contentTables:project.contentTables||{},itemSettings:project.itemSettings||{},skillSettings:project.skillSettings||{}},'# 项目资料'));
 const manifest={projectId:project.id,name:project.name,revision:project._archiveRevision||project._revision||null,documents,resources,missingFileIds:[...missing]};
 await fs.writeFile(path.join(directory,'目录.md'),mdRecord('manifest',manifest,'# '+(project.name||'未命名项目')+' · 项目目录\n\n'+NAV_FOLDERS.map(folder=>'## '+folder+'\n\n'+documents.filter(d=>d.path.startsWith(folder+'/')).map(d=>'- ['+String(d.title).replace(/[\[\]\r\n]/g,' ')+']('+encodeURI(d.path)+')').join('\n')).join('\n\n')));
 await fs.writeFile(path.join(directory,'读取说明.md'),'# 程序读取约定\n\n1. 固定入口：项目目录下的 当前内容/目录.md。\n2. 读取 front matter 中 manifest 的单行 JSON，取得 documents 和 resources。\n3. 所有 path 都以 当前内容 为根目录，使用 UTF-8、正斜杠相对路径；文件名按类型、名称和用途保存；重名追加短 ID，内容 ID 保持不变，改名后请重新读取索引。\n4. 策划字段存 details，人物字段存 character；图片与音频引用保留 fileId 并增加 path、mime、missing。\n5. source_path 表示由列表或剧本派生的视图；通过 ID 关联，勿当作第二份业务条目导入。\n6. 历史/候选状态保留；confirmed 为确认，pending 为待修改。空值不等于默认值。\n7. missing 为 true 的附件不存在，不应尝试加载。二进制资源保留真实格式，不转换图片或声音。\n8. 当前内容为自动更新的只读归档入口，请通过插件修改，避免修改硬链接资源。跨多文件读取时可解析 当前版本.md，固定读取同一 versions/<revision>/分类资料 快照。\n');
 return manifest;
}
export async function publishNavigationFiles(base,revision){
 const versions=path.resolve(base,'versions'),target=path.resolve(versions,revision,'分类资料');if(!valid(revision)||!target.startsWith(versions+path.sep))throw Error('无效归档目录');
 const current=path.join(base,'当前内容'),temp=path.join(base,'.当前内容-'+randomUUID()),backup=path.join(base,'.旧内容入口-'+randomUUID());
 await fs.symlink(target,temp,process.platform==='win32'?'junction':'dir');let moved=false;
 try{try{const stat=await fs.lstat(current);if(!stat.isSymbolicLink())throw Error('当前内容已存在真实文件夹，已保留，未覆盖');const old=await fs.realpath(current),realVersions=await fs.realpath(versions);if(!old.startsWith(realVersions+path.sep))throw Error('当前内容指向项目之外，已保留');await fs.rename(current,backup);moved=true;}catch(err){if(err.code!=='ENOENT')throw err;}
 await fs.rename(temp,current);if(moved)await fs.unlink(backup);
 }catch(err){await fs.unlink(temp).catch(()=>{});if(moved)await fs.rename(backup,current).catch(()=>{});throw err;}
}
