import {stripGPTAPISettings} from '../workspace/gpt-settings.js';
import {App} from '@modelcontextprotocol/ext-apps';
const app=new App({name:'管理工坊',version:'0.5.1'},{});
window.__NARRATIVE_VERSION__='0.5.1';
await app.connect();
try{await app.requestDisplayMode({mode:'inline'});}catch{}
window.__NARRATIVE_RPC__=async(name,args)=>{const routed=['project_backup','generation_job'].includes(name)?{name:'ui_storage',arguments:{operation:'extension_action',project:{method:name,args}}}:name==='restart_local_service'?{name:'ui_storage',arguments:{operation:'restart_service'}}:{name,arguments:args};const result=await app.callServerTool(routed,{timeout:650000});if(result.isError)throw Error(result.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n')||'本地工具失败');return result.structuredContent||JSON.parse(result.content.find(c=>c.type==='text').text);};
window.__NARRATIVE_CHAT__=async({projectId,docId,revision,prompt})=>{const result=await app.sendMessage({role:'user',content:[{type:'text',text:'请使用管理工坊插件处理当前项目。项目 ID：'+projectId+'；内容 ID：'+docId+'；当前版本：'+revision+'。先读取最新内容与关联设定，图片/配音通过插件工具生成并写入本地，文字按填写字段生成候选，确认后保存 details 或人物字段；图片使用宿主原生图片生成，不调用任何文字或图像 API，不把生成描述当成图片。用户的本次要求：\n'+prompt}]});if(result.isError)throw Error('未能将要求发送给 GPT');};
for(const area of [localStorage,sessionStorage]){const cleaned=stripGPTAPISettings({local:Object.fromEntries(Object.keys(area).map(k=>[k,area.getItem(k)]))}).local;for(const k of Object.keys(area))if(/^nw-(api|key|media)/.test(k)&&!(k in cleaned))area.removeItem(k);for(const [k,v] of Object.entries(cleaned))if(/^nw-(api|key|media)/.test(k))area.setItem(k,v);}
try{const preferences=await window.__NARRATIVE_RPC__('ui_storage',{operation:'settings_get'});for(const [k,v] of Object.entries(preferences.local||{}))localStorage.setItem(k,v);for(const [k,v] of Object.entries(preferences.session||{}))sessionStorage.setItem(k,v);}catch{}
window.__NARRATIVE_DOWNLOAD__=async(blob,name)=>{const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));const result=await app.downloadFile({contents:[{type:'resource',resource:{uri:'file:///'+encodeURIComponent(name),mimeType:blob.type||'application/octet-stream',blob:btoa(binary)}}]});if(result.isError)throw Error('文件保存已取消或未获允许');};
await import('../workspace/app.js');
