import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readZIP} from '../workspace/zip.js';
export async function bootstrapRuntime(directory,{fetcher=fetch,launcher,onProgress=()=>{},logFd}={}){
 if(process.platform!=='win32')throw Error('当前一键安装面向 Windows，请使用已配置的本地 TTS 环境');
 const tools=path.join(directory,'tools'),repo=path.join(directory,'index-tts');await fs.mkdir(tools,{recursive:true});
 const get=async url=>{const r=await fetcher(url,{signal:AbortSignal.timeout(600000),headers:{'User-Agent':'Narrative-Studio'}});if(!r.ok)throw Error('下载失败 HTTP '+r.status);return r;};
 const unpack=async(url,target,strip=false)=>{const response=await get(url),blob=await response.blob();if(blob.size>100*1024*1024)throw Error('安装包超过 100 MB');const rows=await readZIP(blob);await fs.mkdir(target,{recursive:true});for(const row of rows){const name=strip?row.name.split('/').slice(1).join('/'):row.name;if(!name)continue;const dest=path.resolve(target,name);if(!dest.startsWith(path.resolve(target)+path.sep))throw Error('安装包包含不安全路径');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,row.data);}return createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex');};
 onProgress('正在下载官方 uv 安装工具');const uvInfo=await (await get('https://api.github.com/repos/astral-sh/uv/releases/latest')).json(),asset=uvInfo.assets.find(a=>a.name==='uv-x86_64-pc-windows-msvc.zip');if(!asset?.browser_download_url?.startsWith('https://github.com/astral-sh/uv/'))throw Error('未找到官方 Windows 安装工具');const uvHash=await unpack(asset.browser_download_url,tools);
 onProgress('正在下载官方 IndexTTS 源码');const commit=await (await get('https://api.github.com/repos/index-tts/index-tts/commits/main')).json();if(!/^[a-f0-9]{40}$/.test(commit.sha))throw Error('官方源码版本无效');const sourceHash=await unpack('https://codeload.github.com/index-tts/index-tts/zip/'+commit.sha,repo,true);
 const env={...process.env,UV_PYTHON_INSTALL_DIR:path.join(directory,'python'),UV_CACHE_DIR:path.join(directory,'cache','uv'),HF_HOME:path.join(directory,'cache','huggingface'),PYTHONIOENCODING:'utf-8'};
 onProgress('正在安装项目内 Python 和依赖，可在部署日志查看进度');await new Promise((resolve,reject)=>{const child=launcher(path.join(tools,'uv.exe'),['sync','--python','3.11'],{cwd:repo,env,windowsHide:true,stdio:['ignore',logFd,logFd]});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('依赖安装失败，请查看部署日志后重试')));});
 await fs.access(path.join(repo,'indextts','infer_v2_5.py'));await fs.writeFile(path.join(directory,'安装来源.md'),'# 项目内 TTS 安装\n\n官方源码：https://github.com/index-tts/index-tts\n\n版本：'+commit.sha+'\n\n源码包 SHA256：'+sourceHash+'\n\nuv '+uvInfo.tag_name+' SHA256：'+uvHash+'\n');return {repo,python:path.join(repo,'.venv','Scripts','python.exe')};
}
