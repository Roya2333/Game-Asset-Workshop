import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {createZIP} from './workspace/zip.js';
const root=path.resolve(import.meta.dirname,'..'),source=path.join(root,'plugins','narrative-studio');
const manifest=JSON.parse(await fs.readFile(path.join(source,'plugin.json'),'utf8'));
const destination=await fs.mkdtemp(path.join(os.tmpdir(),'management-plugin-package-')),stage=path.join(destination,'narrative-studio');
await fs.mkdir(stage,{recursive:true});
const included=['.codex-plugin','assets','server','skills','tts','ui','plugin.json'];
for(const name of included)await fs.cp(path.join(source,name),path.join(stage,name),{recursive:true});
const mcp={mcpServers:{'narrative-studio':{type:'stdio',command:'node',args:['${PLUGIN_ROOT}/server/index.mjs'],cwd:'${PLUGIN_ROOT}',env:{NARRATIVE_PORT:'4174'}}}};
await fs.writeFile(path.join(stage,'.mcp.json'),JSON.stringify(mcp,null,2)+'\n');
await fs.writeFile(path.join(stage,'mcp.json'),JSON.stringify({$schema:'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',...mcp},null,2)+'\n');
for(const name of ['install.mjs','安装管理工坊.cmd','README.md'])await fs.copyFile(path.join(import.meta.dirname,'packaging',name),path.join(stage,name));
try{await fs.copyFile(path.join(root,'THIRD_PARTY_NOTICES.md'),path.join(stage,'THIRD_PARTY_NOTICES.md'));}catch(error){if(error.code!=='ENOENT')throw error;}
const files=[];
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('插件包不允许包含链接');if(entry.isDirectory())await walk(full);else{const data=await fs.readFile(full),name='narrative-studio/'+path.relative(stage,full).split(path.sep).join('/');if(/项目资料|\.private-settings|\.bridge\.md|checkpoints|node_modules|\.wav$/i.test(name))throw Error('发现不应分发的文件：'+name);if(/\.(mjs|html|md|json|py|cmd)$/i.test(name)&&/[A-Z]:[/\\]Users[/\\]/i.test(data.toString('utf8')))throw Error('发现开发者本机路径：'+name);files.push({name,data:new Blob([data])});}}}
await walk(stage);const zip=Buffer.from(await(await createZIP(files)).arrayBuffer());
const releases=path.join(root,'releases');await fs.mkdir(releases,{recursive:true});const output=path.join(releases,'管理工坊-'+manifest.version+'-通用插件.zip');await fs.writeFile(output,zip);const sha=createHash('sha256').update(zip).digest('hex');await fs.writeFile(output+'.sha256',sha+'  '+path.basename(output)+'\n');
console.log(JSON.stringify({archive:output,version:manifest.version,files:files.length,bytes:zip.length,sha256:sha,stage}));
