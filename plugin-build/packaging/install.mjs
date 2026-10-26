import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const source=path.dirname(fileURLToPath(import.meta.url));
const exists=async p=>fs.access(p).then(()=>true,()=>false);
async function codexExecutable(){
 const where=spawnSync('where.exe',['codex.exe'],{encoding:'utf8',windowsHide:true});
 for(const p of (where.stdout||'').trim().split(/\r?\n/))if(p&&await exists(p))return p;
 const base=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'OpenAI','Codex','bin');
 const dirs=await fs.readdir(base,{withFileTypes:true}).catch(()=>[]);const candidates=[];
 for(const d of dirs)if(d.isDirectory()){const p=path.join(base,d.name,'codex.exe');if(await exists(p))candidates.push({p,time:(await fs.stat(p)).mtimeMs});}
 return candidates.sort((a,b)=>b.time-a.time)[0]?.p;
}
async function main(){
 if(process.platform!=='win32')throw Error('此安装助手面向 Windows；其他系统请手动配置本地 MCP，TTS 一键部署尚未适配。');
 if(Number(process.versions.node.split('.')[0])<22)throw Error('需要 Node.js 22 或更新版本，请先更新 Node.js。');
 const manifest=JSON.parse(await fs.readFile(path.join(source,'plugin.json'),'utf8'));
 if(manifest.name!=='narrative-studio')throw Error('插件包不完整，请重新解压。');
 const codex=await codexExecutable();if(!codex)throw Error('没有找到支持本地插件的 Codex 桌面运行程序。请先安装并打开桌面应用，再运行本助手。');
 const root=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'ManagementStudio');
 const destination=path.join(root,'plugins','narrative-studio');
 const dataDirectory=path.join(root,'ProjectIndex');
 console.log('管理工坊 '+manifest.version+'\n插件安装位置：'+destination+'\n项目索引位置：'+dataDirectory+'\n游戏项目的保存位置将在首次创建时由你选择。');
 if(process.argv.includes('--check')){console.log('安装检查通过，未安装或修改配置。');return;}
 // Copy only packaged program files; never copy project data, models or credentials.
 const entries=['.codex-plugin','assets','server','skills','tts','ui','.mcp.json','mcp.json','plugin.json','README.md'];
 await fs.mkdir(destination,{recursive:true});
 for(const name of entries)await fs.cp(path.join(source,name),path.join(destination,name),{recursive:true,force:true});
 const config={mcpServers:{'narrative-studio':{type:'stdio',command:process.execPath,args:['${PLUGIN_ROOT}/server/index.mjs'],cwd:'${PLUGIN_ROOT}',env:{NARRATIVE_DATA_DIR:dataDirectory,NARRATIVE_PORT:'4174'}}}};
 await fs.writeFile(path.join(destination,'.mcp.json'),JSON.stringify(config,null,2)+'\n');
 await fs.writeFile(path.join(destination,'mcp.json'),JSON.stringify({$schema:'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',...config},null,2)+'\n');
 const marketplace={name:'management-studio-local',interface:{displayName:'管理工坊 · 本地插件'},plugins:[{name:'narrative-studio',source:{source:'local',path:'./plugins/narrative-studio'},policy:{installation:'AVAILABLE',authentication:'ON_INSTALL'},category:'Productivity'}]};
 await fs.mkdir(path.join(root,'.agents','plugins'),{recursive:true});
 await fs.writeFile(path.join(root,'.agents','plugins','marketplace.json'),JSON.stringify(marketplace,null,2)+'\n');
 for(const args of [['plugin','marketplace','add',root,'--json'],['plugin','add','narrative-studio@management-studio-local','--json']]){
  const r=spawnSync(codex,args,{encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error((r.stderr||r.stdout||'插件安装失败').trim());
 }
 console.log('\n安装完成。请重启桌面应用，在本地聊天中启用「管理工坊」，发送「打开管理工坊」。\n首次打开请创建自己的项目。文字与图片生成取决于宿主可用能力；配音需要另行部署本地 IndexTTS 2.5。');
}
main().catch(error=>{console.error('\n安装未完成：'+error.message);process.exitCode=1;});
