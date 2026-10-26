import {watch} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';

const root=import.meta.dirname;
let timer,running=false,pending=false;
async function rebuild(){
 if(running){pending=true;return;}
 running=true;
 const child=spawn(process.execPath,['build.mjs'],{cwd:root,stdio:'inherit',windowsHide:true});
 const code=await new Promise(resolve=>{child.once('error',err=>{console.error(err.message);resolve(1);});child.once('exit',resolve);});
 console.log(code===0?'插件已更新：重新打开工作台查看新界面。工具逻辑变更需重载本地 MCP 连接。':'构建失败，请修复上方错误。');
 running=false;if(pending){pending=false;await rebuild();}
}
for(const directory of ['workspace','src'])watch(path.join(root,directory),{recursive:true},(_,file)=>{
 if(!file||! /\.(js|mjs|css)$/.test(String(file)))return;
 clearTimeout(timer);timer=setTimeout(rebuild,350);
});
console.log('管理工坊插件开发监听已启动，不提供独立网页。');
await rebuild();
