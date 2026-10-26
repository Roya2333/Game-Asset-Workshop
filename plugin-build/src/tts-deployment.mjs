import {bootstrapRuntime} from './tts-bootstrap.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const exists=file=>fs.access(file).then(()=>true,()=>false);
// Model and dependency files are immutable; hard links reuse disk space on the same volume.
// Configuration and source files are copied so project changes cannot modify the seed.
export async function cloneRuntime(source,target){
 try{if((await fs.lstat(target)).isSymbolicLink())throw Error('部署目标不能是指向外部的链接目录');}catch(err){if(err.code!=='ENOENT')throw err;}
 await fs.mkdir(target,{recursive:true});
 for(const entry of await fs.readdir(source,{withFileTypes:true})){
  if(['.git','__pycache__','.temp','.lock'].includes(entry.name))continue;
  const from=path.join(source,entry.name),to=path.join(target,entry.name);
  if(entry.isDirectory()||entry.isSymbolicLink()&&(await fs.stat(from)).isDirectory())await cloneRuntime(from,to);
  else if(!await exists(to)){
   if(/\.(py|pth|cfg|json|yaml|toml|md|txt)$/i.test(entry.name))await fs.copyFile(from,to);
   else try{await fs.link(from,to);}catch{await fs.copyFile(from,to);}
  }
 }
}
export function createTTSDeployment(root,{fetcher=fetch,launcher=spawn,resolveProject,seedDirectory=path.resolve(root,'..','app','local-tts'),supportDirectory=path.resolve(import.meta.dirname,'../tts')}={}){
 const states=new Map();
 const health=async()=>{try{const r=await fetcher('http://127.0.0.1:9880/health',{signal:AbortSignal.timeout(2000)});const value=r.ok?await r.json():null;return value?.model?.startsWith('IndexTTS')?value:null;}catch{return null;}};
 return async function deploy(action='status',projectId){
  if(!['status','start','install'].includes(action))throw Error('无效部署操作');
  if(!projectId||!resolveProject)throw Error('请先创建并打开项目，再部署本地 TTS');
  const projectDirectory=await resolveProject(projectId),directory=path.join(projectDirectory,'本地TTS');
  if(await exists(directory)){const actual=await fs.realpath(directory),base=await fs.realpath(projectDirectory);if(!actual.toLowerCase().startsWith((base+path.sep).toLowerCase()))throw Error('TTS 部署目录必须位于当前项目内');}
  let state=states.get(projectId);if(!state){state={running:false,error:'',mode:'',progress:''};states.set(projectId,state);}
  const service=await health(),ready=!!service&&service.projectId===projectId&&service.model==='IndexTTS2.5';
  const installed=await exists(path.join(directory,'ready-2.5.txt'));
  const result=()=>({ready,installed,running:state.running,mode:state.mode,error:state.error,directory,progress:state.progress});
  if(ready){state.running=false;state.progress='IndexTTS 2.5 已就绪';}if(action==='status')return {...result(),logPath:state.logPath||''};
  if(ready)return {...result(),message:'当前项目的 IndexTTS 2.5 已就绪'};
  if(service)throw Error('端口 9880 已有其他 TTS 服务，请先停止该服务，再启动当前项目的环境');
  if(state.running)return {...result(),message:state.progress||'当前项目正在部署，请勿重复启动'};
  if([...states.entries()].some(([id,value])=>id!==projectId&&value.running))throw Error('另一个项目正在部署或启动 TTS，请等待完成');
  state.running=true;state.error='';state.mode=action;state.progress='正在准备项目内的运行环境';
  const run=async()=>{let fresh=false;
   if(!installed){
    fresh=!await exists(path.join(seedDirectory,'ready.txt'));
    await fs.mkdir(directory,{recursive:true});
    if(!fresh){state.progress='正在复用已下载的 Python、依赖、模型和缓存';
    for(const name of ['index-tts','cache'])await cloneRuntime(path.join(seedDirectory,name),path.join(directory,name));
    await cloneRuntime(path.join(seedDirectory,'python','cpython-3.11-windows-x86_64-none'),path.join(directory,'python','cpython-3.11-windows-x86_64-none'));}
   }
   // Native text normalization requires an ASCII path on Windows; the actual files remain in the project.
   let runtime=directory;
   if(process.platform==='win32'){
    runtime=path.join(path.parse(directory).root,'NarrativeTTS-'+projectId);
    try{const target=await fs.realpath(runtime);if(target.toLowerCase()!==(await fs.realpath(directory)).toLowerCase())throw Error('TTS 路径别名已被其他目录占用');}
    catch(err){if(err.code==='ENOENT')await fs.symlink(directory,runtime,'junction');else throw err;}
   }
   if(fresh){const logs=path.join(directory,'logs');await fs.mkdir(logs,{recursive:true});const installLog=await fs.open(path.join(logs,'installation.log'),'a');try{await bootstrapRuntime(runtime,{fetcher,launcher,logFd:installLog.fd,onProgress:value=>{state.progress=value;}});}finally{await installLog.close();}}const repo=path.join(runtime,'index-tts'),python=await exists(path.join(runtime,'python','cpython-3.11-windows-x86_64-none','python.exe'))?path.join(runtime,'python','cpython-3.11-windows-x86_64-none','python.exe'):path.join(repo,'.venv','Scripts','python.exe');
   const cfg=path.join(directory,'index-tts','.venv','pyvenv.cfg');
   if(python.includes('cpython-3.11-windows-x86_64-none'))await fs.writeFile(cfg,(await fs.readFile(cfg,'utf8')).replace(/^home\s*=.*$/m,'home = '+path.join(runtime,'python','cpython-3.11-windows-x86_64-none')));
   await fs.writeFile(path.join(directory,'index-tts','.venv','Lib','site-packages','_editable_impl_indextts.pth'),repo+'\n');
   await fs.copyFile(await exists(path.join(supportDirectory,'indextts2_bridge.py'))?path.join(supportDirectory,'indextts2_bridge.py'):path.join(seedDirectory,'..','indextts2_bridge.py'),path.join(directory,'indextts2_bridge.py'));
   await fs.access(python);
   const logs=path.join(directory,'logs');await fs.mkdir(logs,{recursive:true});
   const logPath=path.join(logs,'deployment-'+Date.now()+'.log'),log=await fs.open(logPath,'a');
   state.logPath=logPath;
   const environment={...process.env,PYTHONIOENCODING:'utf-8',PYTHONPATH:path.join(repo,'.venv','Lib','site-packages')+path.delimiter+repo,HF_HOME:path.join(runtime,'cache','huggingface'),MODELSCOPE_CACHE:path.join(runtime,'cache','modelscope'),NLTK_DATA:path.join(runtime,'cache','nltk')};
   if(!installed){
    state.progress='正在下载并校验 IndexTTS 2.5 模型（支持断点续传）';
    await fs.copyFile(await exists(path.join(supportDirectory,'download_models.py'))?path.join(supportDirectory,'download_models.py'):path.join(seedDirectory,'download_models.py'),path.join(directory,'download_models.py'));
    const modelDir=path.join(directory,'checkpoints-2.5');await fs.mkdir(modelDir,{recursive:true});
    const previousModels=path.join(seedDirectory,'checkpoints');if(await exists(previousModels))await cloneRuntime(previousModels,modelDir);
    try{await new Promise((resolve,reject)=>{const download=launcher(python,['-u',path.join(runtime,'download_models.py'),'IndexTeam/IndexTTS-2.5',path.join(runtime,'checkpoints-2.5')],{cwd:repo,windowsHide:true,env:environment,stdio:['ignore',log.fd,log.fd]});download.on('error',reject);download.on('exit',code=>code===0?resolve():reject(Error('IndexTTS 2.5 模型下载失败，可重试续传；日志：'+logPath)));});}catch(err){await log.close();throw err;}
    await fs.writeFile(path.join(directory,'ready-2.5.txt'),new Date().toISOString());
   }
   state.progress='正在加载 IndexTTS 2.5 模型';
   let child;
   try{child=launcher(python,['-u',path.join(runtime,'indextts2_bridge.py'),'--repo',repo,'--model-dir',path.join(runtime,'checkpoints-2.5'),'--fp16','--project-id',projectId],{cwd:repo,windowsHide:true,stdio:['ignore',log.fd,log.fd],env:environment});
   child.on('error',err=>{state.error='TTS 无法启动：'+err.message;state.running=false;});
   child.on('exit',code=>{state.running=false;if(code)state.error='TTS 启动失败（'+code+'），日志：'+logPath;});
   }finally{await log.close();}
  };
  run().catch(err=>{state.running=false;state.error=err.message;});
  return {...result(),message:'正在部署到 '+directory+'，服务就绪后才可生成配音'};
 };
}

// Old cached app views sent only an action. Resolve only an unambiguous live project.
export function deploymentProjectId(projects,requested){
 if(requested)return requested;
 const active=projects.filter(p=>!p.deleted&&!p.archived);
 if(active.length===1)return active[0].id;
 if(!active.length)throw Error('请先创建并打开项目，再部署本地 TTS');
 throw Error('当前页面版本已过期，请重新打开插件页面后部署，以便确认当前项目');
}
