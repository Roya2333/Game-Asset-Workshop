import {test} from 'node:test';
import assert from 'node:assert/strict';
import {skillSettings,skillImagePrompt,renderSkills,parseSkillBatch} from '../../workspace/skills.js';
import {imageParameters} from '../../workspace/character-images.js';
test('技能默认风格与图片规格进入生成提示词和接口参数',()=>{
 const settings=skillSettings({skillSettings:{style:'像素风蓝色魔法',width:512,height:256,format:'webp',transparent:true}});
 const prompt=skillImagePrompt({title:'冰箭',details:{description:'凝结寒冰',effect:'减速'}},settings);
 for(const value of ['冰箭','凝结寒冰','减速','像素风蓝色魔法','512×256','透明背景'])assert.ok(prompt.includes(value));
 assert.deepEqual(imageParameters(settings),{size:'512x256',output_format:'webp',background:'transparent'});
});
test('技能风格安全展示，生成时按钮禁用且不恢复详情入口',()=>{
 const html=renderSkills({docs:[{id:'s',title:'冰箭',type:'skill'}],skillSettings:{style:'<script>bad</script>'}},{busy:true,icon:()=>''});
 assert.ok(html.includes('data-skill-style'));assert.ok(html.includes('data-skill-generate="s" disabled'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('详情'));
});

test('批量技能响应校验数量和完整字段，支持 JSON 代码块',()=>{
 const rows=[{name:'冰箭',description:'寒冰箭矢',effect:'造成伤害并减速'}];
 assert.deepEqual(parseSkillBatch(JSON.stringify({skills:rows}),1),rows);
 assert.deepEqual(parseSkillBatch('```json\n'+JSON.stringify(rows)+'\n```',1),rows);
 assert.throws(()=>parseSkillBatch(JSON.stringify(rows),2),/数量/);
 assert.throws(()=>parseSkillBatch(JSON.stringify([{name:'冰箭'}]),1),/不完整/);
 assert.throws(()=>parseSkillBatch('非 JSON',1));
});
