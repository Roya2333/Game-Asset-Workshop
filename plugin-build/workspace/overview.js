import {documentResources} from './asset-slots.js';
import {relationsOf} from './relations.js';
import {dialogueMarkdown} from './dialogue.js';
import {detailsMarkdown} from './content-forms.js';
import {TYPES,parseMD,safePath} from './core.js';

export const OVERVIEW_FILE='项目全量资料.md';
const resourcePath=r=>`资源/${r.fileId}-${safePath(r.name||'image.png').replace(/\//g,'_')}`;
const linkText=s=>String(s||'未命名').replace(/[\[\]\r\n]/g,' ');
export function buildProjectOverview(project){
  const docs=project.docs||[],name=project.name||'未命名项目';
  const out=[`# ${name} · 项目全量资料`,`项目 ID：${project.id}\n\n本文件汇总导出时的项目资料，可直接提供给对话 AI 阅读。修改项目后需要重新导出，本文不会自动同步外部文件。`,`## 读取约定\n\n- 所有业务字段均可留空，空白表示未设定，不代表默认值；不要替作者补定规则。\n- 各条目保留稳定 ID，修改时请指出目标 ID 与修改内容。\n- 下列正式资料、历史版本与候选结果分别标明，历史和候选不应覆盖正式设定。\n- 图片、声音等二进制文件另附；仅凭路径不能读取其内容，需要一并提供相应附件。\n- 本文件不包含工具保存的 API 密钥。`,`## 项目说明\n\n${project.description||'（未填写）'}`,`## 内容目录\n\n${Object.entries(TYPES).map(([key,v])=>`- ${v.label}：${docs.filter(d=>d.type===key).length} 条`).join('\n')}`];
  for(const [type,meta] of Object.entries(TYPES)){
    out.push(`## ${meta.label}`);const entries=docs.filter(d=>d.type===type);
    if(!entries.length){out.push('（暂无内容）');continue;}
    for(const d of entries){
      out.push(`### ${d.title||'未命名条目'}\n\nID：${d.id}\n分类：${d.folder||'（未分类）'}\n状态：${d.status||'（未设置）'}`);
      out.push(`#### 正式正文\n\n${parseMD(d.md||'').body.trim()||'（未填写）'}`);
      if(d.dialogue){out.push('#### 剧本原文\n\n'+(d.dialogue.source||'（未填写）'));out.push('#### 对白与配音\n\n'+dialogueMarkdown(d,docs.filter(c=>c.type==='character')));}if(d.details)out.push('#### 表单资料\n\n'+detailsMarkdown(d)+(d.details.notes?'\n\n补充说明：\n'+d.details.notes:''));
      if(d.character){const {files,...fields}=d.character;out.push('#### 人物资料字段\n\n'+Object.entries(fields).map(([k,v])=>`- ${k}：${typeof v==='object'?JSON.stringify(v):String(v??'')||'（未填写）'}`).join('\n'));for(const [slot,r] of Object.entries(files||{}))if(r?.fileId)out.push(`人物附件 ${slot}：[${linkText(r.name)}](${encodeURI(resourcePath(r))})`);}
      for(const [label,ids] of [['参考文档',d.refs],['主要参与人物',d.participants]])if(ids?.length)out.push(`#### ${label}\n\n${ids.map(id=>`- ${docs.find(x=>x.id===id)?.title||'引用目标缺失'}（ID：${id}）`).join('\n')}`);
      if(d.images?.length)out.push('#### 参考图\n\n'+d.images.map(r=>`- [${linkText(r.name)}](${encodeURI(resourcePath(r))})\n  - 参考用途：${r.note||'（未填写）'}\n  - 不参考：${r.avoid||'（未填写）'}\n  - 当前启用：${r.enabled===false?'否':'是'}`).join('\n'));
      if(d.details?.uiEditor)out.push('#### UI 图层与布局\n\n```json\n'+JSON.stringify(d.details.uiEditor,null,2)+'\n```');if(relationsOf(d).length)out.push('#### 对象关联\n\n'+JSON.stringify(relationsOf(d)));for(const {slot,role,resource:r}of documentResources(d))out.push('素材用途 '+slot+' / '+role+'：['+linkText(r.name)+']('+encodeURI(resourcePath(r))+')');if(d.media)out.push(`#### 关联素材\n\n[${linkText(d.media.name)}](${encodeURI(resourcePath(d.media))})`);
      if(d.draft)out.push(`#### 当前提示词草稿（非正式设定）\n\n修改要求：${d.draft.request||'（未填写）'}\n\n保留要求：${d.draft.preserve||'（未填写）'}\n\n${d.draft.prompt||'（尚未整理最终提示词）'}`);
      if(d.versions?.length){out.push('#### 历史版本（仅供追溯）');for(const v of d.versions)out.push(`##### ${v.label||'快照'} · ${v.id}\n\n${parseMD(v.md||'').body||'（空正文）'}`);}
      out.push('---');
    }
  }
  if(project.generationJobs?.length)out.push('## 当前 GPT 任务\n\n```json\n'+JSON.stringify(project.generationJobs,null,2)+'\n```');
  out.push('## AI 生成记录（候选与历史，不作为正式设定）');
  for(const task of project.tasks||[]){out.push(`### ${task.title||'未命名任务'}\n\n任务 ID：${task.id}\n目标 ID：${task.docId}\n状态：${task.status}\n模型：${task.model||'（未填写）'}\n\n#### 输入提示词\n\n${task.prompt||'（空）'}\n\n#### 结果\n\n${task.result||task.error||'（无文本结果）'}`);if(task.fileId)out.push(`[生成附件](${encodeURI(resourcePath({fileId:task.fileId,name:task.imageName||'result.png'}))})`);}
  if(!project.tasks?.length)out.push('（暂无记录）');
  return out.join('\n\n')+'\n';
}
