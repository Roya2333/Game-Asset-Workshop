import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,spawnSync} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';import {readZIP} from './workspace/zip.js';
const archive=process.argv[2];if(!archive)throw Error('需要插件 ZIP 路径');
const rows=await readZIP(new Blob([await fs.readFile(archive)])),root=await fs.mkdtemp(path.join(os.tmpdir(),'management-package-verify-')),unpacked=path.join(root,'朋友 试用'),plugin=path.join(unpacked,'narrative-studio');let http,transport;
try{
 for(const row of rows){assert.ok(row.name.startsWith('narrative-studio/'));const file=path.resolve(unpacked,row.name);assert.ok(file.startsWith(unpacked+path.sep));await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,row.data);}
 const portable=JSON.parse(await fs.readFile(path.join(plugin,'mcp.json'),'utf8')),legacy=JSON.parse(await fs.readFile(path.join(plugin,'.mcp.json'),'utf8'));assert.equal(portable.$schema,'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json');assert.deepEqual(portable.mcpServers,legacy.mcpServers);
 const config=portable.mcpServers['narrative-studio'];assert.equal(config.command,'node');assert.ok(!config.env.NARRATIVE_DATA_DIR);
 const metadata=JSON.parse(await fs.readFile(path.join(plugin,'plugin.json'),'utf8'));assert.equal(metadata.extensions['com.openai'].interface.displayName,'管理工坊');
 const installer=spawnSync(process.execPath,[path.join(plugin,'install.mjs'),'--check'],{encoding:'utf8',windowsHide:true});assert.equal(installer.status,0,installer.stderr);assert.ok(installer.stdout.includes('未安装或修改配置'));
 const server=config.args[0].replace('${PLUGIN_ROOT}',plugin),data=path.join(root,'isolated-data'),env={...process.env,NARRATIVE_DATA_DIR:data,NARRATIVE_PORT:'4177'};
 http=spawn(config.command,[server,'--http'],{env,windowsHide:true,stdio:'ignore'});
 let ready=false;for(let i=0;i<80;i++){try{await fs.access(path.join(data,'.bridge.md'));ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready,'解压后的服务未启动');
 transport=new StdioClientTransport({command:config.command,args:[server],cwd:plugin,env,stderr:'pipe'});const client=new Client({name:'portable-package-verification',version:'0.5.1'});await client.connect(transport);
 const tools=await client.listTools();assert.equal(tools.tools.length,27);
 const list=await client.callTool({name:'list_projects',arguments:{}});assert.equal(list.structuredContent.projects.length,0);
 const resource=await client.readResource({uri:tools.tools.find(t=>t.name==='open_workspace')._meta.ui.resourceUri});assert.ok(resource.contents[0].text.includes('管理工坊'));assert.ok(resource.contents[0].text.includes('data-item-icon'));
 const created=await client.callTool({name:'create_project',arguments:{name:'独立安装验收',directory:path.join(root,'自己的 项目')}});assert.ok(!created.isError,JSON.stringify(created));const projectId=created.structuredContent.projectId;
 const read=await client.callTool({name:'read_project',arguments:{projectId}});assert.ok(!read.isError);const saved=await client.callTool({name:'save_content',arguments:{projectId,revision:read.structuredContent.revision,type:'item',title:'临时验收',patch:{details:{name:'临时验收'}}}});assert.ok(!saved.isError,JSON.stringify(saved));
 await client.close();console.log(JSON.stringify({version:metadata.version,packageFiles:rows.length,noBundledProjects:true,portablePaths:true,installerCheck:true,tools:tools.tools.length,independentStart:true,readWrite:true,chineseAndSpacePath:true}));
}finally{await transport?.close().catch(()=>{});if(http){const exited=new Promise(resolve=>http.once('exit',resolve));http.kill();await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,500))]);}assert.ok(root.startsWith(path.join(os.tmpdir(),'management-package-verify-')));await fs.rm(root,{recursive:true,force:true});}
