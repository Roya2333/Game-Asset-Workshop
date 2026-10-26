import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONTENT_FIELDS,detailsMarkdown,renderContentForm} from '../../workspace/content-forms.js';
import {serializeMD,parseMD,buildPrompt} from '../../workspace/core.js';
import {buildProjectOverview} from '../../workspace/overview.js';
test('包括总设定的内容板块均使用可空字段表单',()=>{
  assert.deepEqual(Object.keys(CONTENT_FIELDS),['ui','script','narrative','item','skill','term','music','sound','asset']);
  for(const type of Object.keys(CONTENT_FIELDS)){const html=renderContentForm({id:'d',type,title:'条目',md:'',details:{}},{icon:()=>'',urls:new Map(),refs:'',history:'',composer:''});assert.match(html,/data-content-field/);assert.ok(!html.includes('required'));assert.ok(!html.includes('source-editor'));}
});
test('表单字段保存为 MD 元数据并进入 AI 提示词和全量资料',()=>{
  const d={id:'d',type:'item',title:'道具',md:'# 原有资料',details:{purpose:'开门',appearance:'木质',notes:'补充'},images:[]};
  assert.deepEqual(JSON.parse(parseMD(serializeMD(d)).meta.details),d.details);
  assert.match(buildPrompt({doc:d,action:'完善道具'}),/开门/);
  assert.match(buildProjectOverview({id:'p',docs:[d]}),/用途与效果：开门/);
  assert.match(detailsMarkdown(d),/木质/);
});
test('字段与原有文本均被转义，空字段可展示',()=>{
  const html=renderContentForm({id:'d',type:'skill',title:'技能',md:'<script>bad</script>',details:{effect:'<img src=x onerror=bad>'}},{icon:()=>'',urls:new Map(),refs:'',history:'',composer:''});
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;script&gt;/);
});
