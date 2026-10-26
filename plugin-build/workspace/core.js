export const TYPES = {
  script:{label:'策划文档',icon:'book',folder:'剧本',hint:'让每一份创作，都有共同的世界',actions:['完善设定','补充细节','检查一致性','改写风格']},
  character:{label:'人物',icon:'person',folder:'人物',hint:'让角色拥有自己的故事',actions:['完善人设','生成立绘','生成表情','修改形象']},
  item:{label:'道具',icon:'box',folder:'道具',hint:'每件物品，都是世界的一部分',actions:['完善设定','生成图标','生成外观','修改材质']},
  skill:{label:'技能',icon:'spark',folder:'技能',hint:'将力量与规则转化为表现',actions:['完善技能','生成图标','表现概念','修改效果']},
  term:{label:'技能词条',icon:'tag',folder:'词条',hint:'为世界建立一致的语言',actions:['完善定义','补充示例','检查规则','生成图标']},
  music:{label:'音乐',icon:'music',folder:'音乐',hint:'为故事谱写氛围',actions:['完善音乐需求','生成音乐提示词','调整情绪','设计循环段落']},
  sound:{label:'音效',icon:'sound',folder:'音效',hint:'让世界的每个动作都有声音',actions:['完善音效需求','生成音效提示词','调整质感','设计声音层次']},
  narrative:{label:'剧本管理',icon:'file',folder:'章节剧本',hint:'将剧本转换为对白与人物配音',actions:['完善章节','补充场景','调整剧情','检查一致性']},
  ui:{label:'UI 管理',icon:'grid',folder:'UI',hint:'从页面规划到界面素材',actions:['完善页面策划','设计交互流程','生成界面图','修改界面图']},
  asset:{label:'素材库',icon:'image',folder:'素材',hint:'从灵感到可用的游戏素材',actions:['修改图片','生成变体','统一风格','生成素材']}
};
export const SKILL_TEMPLATES=['主动技能','被动技能','buff'];
export function isFixedSkill(doc){return doc?.type==='skill'&&SKILL_TEMPLATES.some((_,i)=>doc.id==='skill-template-'+i);}
export function initializeSkills(project){let changed=false;for(const [i,title] of SKILL_TEMPLATES.entries()){if(!project.docs.some(d=>d.id==='skill-template-'+i&&d.type==='skill')){project.docs.push({id:'skill-template-'+i,type:'skill',title,folder:'',status:'draft',md:template('skill',title),details:{kind:title},refs:[],images:[],versions:[],updated:Date.now()});changed=true;}}return changed;}
export const uid=()=>crypto.randomUUID();
export const CHARACTER_FOLDERS=['主角','配角','怪物','boss','其他'];
export const FIXED_SCRIPT_FOLDERS=['世界观','派系','组织','玩法','道具设定','技能设定'];
export function directoryGroups(type,docs,customFolders=[]){
  return [...new Set([...(type==='script'?FIXED_SCRIPT_FOLDERS:type==='character'?CHARACTER_FOLDERS:['默认分类']),...customFolders,...docs.map(d=>d.folder||'未分类')])];
}
export function isChapter(doc){return doc.type==='narrative'||doc.type==='script'&&(/章节/.test(doc.folder||'')||/^第.+章/.test(doc.title||''));}
export function referenceDocs(doc,docs){const ids=new Set([...(doc.refs||[]),...(doc.participants||[])]);return docs.filter(r=>r.id!==doc.id&&ids.has(r.id));}
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safePath(s){return String(s).replace(/[\\:*?"<>|\x00-\x1f]/g,'_').replace(/(^|\/)\.\.(?=\/|$)/g,'$1_').replace(/^\/+/, '').trim() || '未命名';}
export function parseMD(md){
  const m=md.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/); const meta={};
  if(m)for(const line of m[1].split(/\r?\n/)){const p=line.match(/^([\w-]+):\s*(.*)$/);if(p)meta[p[1]]=p[2];}
  const body=m?md.slice(m[0].length):md;
  return {meta,body,title:body.match(/^#\s+(.+)$/m)?.[1]||'未命名文档'};
}
export function serializeMD(doc){
  const parsed=parseMD(doc.md); const fields={...parsed.meta,id:doc.id,...(doc.contentNumber?{content_number:doc.contentNumber}:{}),type:doc.type,status:doc.status,locked_default:!!doc.lockedDefault,folder:JSON.stringify(doc.folder||''),title:JSON.stringify(doc.title),references:JSON.stringify(doc.refs||[]),participants:JSON.stringify(doc.participants||[]),reference_images:JSON.stringify(doc.images||[]),media:JSON.stringify(doc.media||null),character:JSON.stringify(doc.character||null),dialogue:JSON.stringify(doc.dialogue||null),details:JSON.stringify(doc.details||{})};
  return `---\n${Object.entries(fields).map(([k,v])=>`${k}: ${String(v).replace(/[\r\n]/g,' ')}`).join('\n')}\n---\n\n${parsed.body.replace(/\n<!-- dialogue:start -->[\s\S]*?<!-- dialogue:end -->/g,'').trim()}${doc.dialogue?.lines?.length?'\n\n<!-- dialogue:start -->\n## 游戏对白\n\n'+doc.dialogue.lines.map((l,i)=>'### '+(i+1)+'. '+(l.speaker||'未关联人物')+'（'+(l.emotion||'正常')+'）\n\n'+l.text+(l.audio?.path?'\n\n[配音文件]('+encodeURI('../'+l.audio.path)+')':'')).join('\n\n')+'\n<!-- dialogue:end -->':''}\n`;
}
const safeURL=url=>/^(https?:|mailto:)/i.test(url)?escapeHTML(url):null;
export function markdown(md){
  const body=parseMD(md).body;let inCode=false,inList=false;const result=[];
  const inline=s=>escapeHTML(s).replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<span class="md-attachment">▧ $1</span>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{const safe=safeURL(url.replace(/&amp;/g,'&'));return safe?`<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`:`<span class="md-link">${label}</span>`;}).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  for(const line of body.split(/\r?\n/)){
    if(line.startsWith('```')){if(inList){result.push('</ul>');inList=false;}result.push(inCode?'</code></pre>':'<pre><code>');inCode=!inCode;continue;}
    if(inCode){result.push(escapeHTML(line)+'\n');continue;}
    const list=line.match(/^\s*[-*]\s+(.+)$/);if(list){if(!inList){result.push('<ul>');inList=true;}result.push(`<li>${inline(list[1])}</li>`);continue;}
    if(inList){result.push('</ul>');inList=false;}
    const heading=line.match(/^(#{1,4})\s+(.+)$/);if(heading)result.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
    else if(line.startsWith('> '))result.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    else if(/^---+$/.test(line))result.push('<hr>');else if(line.trim())result.push(`<p>${inline(line)}</p>`);
  }
  if(inList)result.push('</ul>');if(inCode)result.push('</code></pre>');return result.join('\n');
}
export function template(type,title){const sections={ui:['页面用途','布局与组件','交互流程','界面状态','适配与视觉要求'],narrative:['章节目标','场景信息','剧情概要','关键事件','结束与衔接'],script:['核心设定','背景与规则','创作要求'],character:['身份与经历','性格与关系','外貌特征','创作要求'],item:['用途与来历','外观与材质','关联规则','创作要求'],skill:['技能概念','作用与限制','视觉表现','创作要求'],term:['定义','适用规则','使用示例'],music:['使用场景','情绪与氛围','乐器与风格','节奏与时长','循环与过渡要求'],sound:['触发场景','声音描述','材质与空间','时长与变化','制作要求'],asset:['素材用途','表现要求','修改记录']};return `# ${title}\n\n${sections[type].map(s=>`## ${s}\n\n`).join('\n')}`;}
export function buildPrompt({doc,refs=[],images=[],action,request,preserve}){
  return [`# 创作任务\n${action}：${doc.title}`,`## 当前内容\n${doc.character?JSON.stringify({...doc.character,files:undefined},null,2):[parseMD(doc.md).body.trim(),doc.details?JSON.stringify(doc.details,null,2):''].filter(Boolean).join('\n\n')}`,refs.length?`## 参考设定\n${refs.map(r=>`### ${r.title} [${r.id}]\n${r.character?JSON.stringify({...r.character,files:undefined},null,2):[parseMD(r.md).body.trim(),r.details?JSON.stringify(r.details,null,2):''].filter(Boolean).join('\n\n')}`).join('\n\n')}`:'',images.length?`## 参考图用途\n${images.map((r,i)=>`${i+1}. ${r.name}：${r.note||'参考整体视觉方向'}${r.avoid?`；不参考：${r.avoid}`:''}`).join('\n')}`:'',`## 本次要求\n${request||'依据以上设定完成任务，保持项目方向一致。'}`,preserve?`## 必须保留\n${preserve}`:'','## 输出要求\n遵循已提供的设定；如有矛盾或缺失，请明确指出。按策划字段提供结构化候选；不要自行变更关键设定。'].filter(Boolean).join('\n\n');
}
export function defaultDocuments(){const entries=[...FIXED_SCRIPT_FOLDERS.map(folder=>({type:'script',title:folder.endsWith('设定')?folder:folder+'设定',folder})),...Object.entries(TYPES).filter(([type])=>type!=='script'&&type!=='skill').map(([type,v])=>({type,title:type==='asset'?'默认素材':v.label+'设定',folder:type==='character'?'其他':'默认分类'}))];return entries.map(entry=>({...entry,id:uid(),lockedDefault:true,status:'draft',md:template(entry.type,entry.title),refs:[],images:[],versions:[],updated:Date.now()}));}
export function initializeDefaults(project){if(project.contentTemplatesInitialized)return initializeGenerationSettings(project);project.contentTemplatesInitialized=true;const narrativeChanged=initializeNarrative(project);const skillsChanged=initializeSkills(project)||narrativeChanged;if(project.defaultsVersion===1)return skillsChanged;const defaults=defaultDocuments();for(const doc of defaults){const exists=project.docs.some(d=>doc.type==='script'?d.type==='script'&&d.folder===doc.folder:d.type===doc.type);if(!exists)project.docs.push(doc);}project.defaultsVersion=1;project.generationSettingsVersion=1;return true;}
export function initialProject(){const project={id:uid(),name:'未命名项目',description:'',docs:[],tasks:[],created:Date.now()};initializeDefaults(project);return project;}

export function initializeNarrative(project){let changed=false;for(const d of project.docs){if(d.type==='script'&&isChapter(d)){d.type='narrative';changed=true;}}if(!project.docs.some(d=>d.type==='narrative')){project.docs.push({id:uid(),type:'narrative',title:'默认章节',folder:'默认分类',lockedDefault:true,status:'draft',md:template('narrative','默认章节'),details:{},refs:[],participants:[],images:[],versions:[],updated:Date.now()});changed=true;}return changed;}

export function initializeGenerationSettings(project){
 if(project.generationSettingsVersion===1)return false;
 project.generationSettingsVersion=1;
 for(const folder of ['道具设定','技能设定']){
  const exists=(project.docs||[]).some(d=>d.type==='script'&&(d.folder===folder||d.title===folder));
  const trashed=(project.trash||[]).some(entry=>entry.kind==='document'&&entry.data?.type==='script'&&(entry.data.folder===folder||entry.data.title===folder));
  if(!exists&&!trashed)project.docs.push({id:uid(),type:'script',title:folder,folder,status:'draft',md:template('script',folder),details:{},refs:[],images:[],versions:[],updated:Date.now()});
 }
 return true;
}
