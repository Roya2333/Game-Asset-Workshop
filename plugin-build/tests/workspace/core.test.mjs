import {fixtureProject} from './fixtures/project.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialProject,parseMD,serializeMD,markdown,buildPrompt,safePath,directoryGroups,initializeDefaults,isChapter,referenceDocs,TYPES,template} from '../../workspace/core.js';
import {createZIP,readZIP} from '../../workspace/zip.js';

test('MD 保存保留自定义元数据和正文，中文可往返',()=>{
  const doc={id:'test',type:'script',title:'世界观',folder:'世界/背景',status:'draft',md:'---\ncustom_field: keep-me\n---\n\n# 世界观\n\n内容不丢失。'};
  const result=parseMD(serializeMD(doc));assert.equal(result.meta.custom_field,'keep-me');assert.equal(result.meta.id,'test');assert.match(result.body,/内容不丢失/);
  assert.equal(JSON.parse(result.meta.folder),'世界/背景');assert.equal(JSON.parse(result.meta.title),'世界观');
});
test('MD 导出使用当前引用，覆盖已导入的旧引用元数据',()=>{
  const md=serializeMD({id:'d',type:'script',status:'draft',title:'改名后',folder:'新分类',refs:['new'],images:[],md:'---\nreferences: ["old"]\n---\n\n# 原标题'});
  assert.deepEqual(JSON.parse(parseMD(md).meta.references),['new']);assert.equal(JSON.parse(parseMD(md).meta.title),'改名后');
});
test('预览转义脚本并拒绝危险链接',()=>{
  const html=markdown('# 测试\n<script>alert(1)</script>\n[危险](javascript:alert)\n[正常](https://example.com)');
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));assert.ok(html.includes('href="https://example.com"'));
});
test('提示词包含指定文档、图片用途和保留要求',()=>{
  const p=fixtureProject();const prompt=buildPrompt({doc:p.docs[3],refs:[p.docs[0]],images:[{name:'服饰.png',note:'只参考布料',avoid:'现代装饰'}],action:'生成立绘',request:'换冬装',preserve:'保留面容'});
  for(const value of ['世界观总纲','只参考布料','现代装饰','保留面容','换冬装'])assert.ok(prompt.includes(value));
});
test('ZIP 包完整保留中文 MD 和二进制附件',async()=>{
  const raw=new Uint8Array([0,1,127,255]);const blob=await createZIP([{name:'剧本/世界观.md',data:'# 世界\n\n雾海'},{name:'资源/图.png',data:new Blob([raw])}]);
  const files=await readZIP(blob);assert.equal(files.length,2);assert.equal(new TextDecoder().decode(files[0].data),'# 世界\n\n雾海');assert.deepEqual(files[1].data,raw);
});
test('损坏的 ZIP 校验失败',async()=>{
  const blob=await createZIP([{name:'a.md',data:'hello'}]);const bytes=new Uint8Array(await blob.arrayBuffer());bytes[34]^=1;await assert.rejects(()=>readZIP(new Blob([bytes])));
});
test('安全文件路径不允许目录穿越',()=>{assert.ok(!safePath('../../a').split('/').includes('..'));});
test('剧本固定文件夹始终存在且优先显示，删除全部内容后仍保留',()=>{
  assert.deepEqual(directoryGroups('script',[]),['世界观','派系','组织','玩法','道具设定','技能设定']);
  assert.deepEqual(directoryGroups('script',[{folder:'章节设定'},{folder:'世界观'}]),['世界观','派系','组织','玩法','道具设定','技能设定','章节设定']);
  assert.deepEqual(directoryGroups('character',[]),['主角','配角','怪物','boss','其他']);
});
test('章节参与人物去重加入 AI 参考，并保存到 MD',()=>{
  const p=fixtureProject(),chapter=p.docs.find(d=>d.id==='chapter1');chapter.participants=['char1'];chapter.refs=['char1','world'];
  assert.ok(isChapter(chapter));assert.ok(!isChapter(p.docs[0]));
  const refs=referenceDocs(chapter,p.docs);assert.equal(refs.filter(d=>d.id==='char1').length,1);
  assert.deepEqual(JSON.parse(parseMD(serializeMD(chapter)).meta.participants),['char1']);
  assert.ok(buildPrompt({doc:chapter,refs,action:'完善章节'}).includes('灰绿色眼睛'));
});
test('音乐与音效具有独立类型和 MD 模板',()=>{
  assert.equal(TYPES.script.label,'策划文档');assert.equal(TYPES.music.label,'音乐');assert.equal(TYPES.sound.label,'音效');
  assert.match(template('music','主题曲'),/循环与过渡要求/);assert.match(template('sound','开门声'),/材质与空间/);
});

test('每个板块有默认文档，固定文件夹各有一份，无案例资源',()=>{const p=initialProject();for(const type of Object.keys(TYPES))assert.ok(p.docs.some(d=>d.type===type));for(const folder of ['世界观','派系','组织','玩法','道具设定','技能设定'])assert.ok(p.docs.some(d=>d.type==='script'&&d.folder===folder));assert.deepEqual(p.tasks,[]);assert.ok(p.docs.every(d=>d.images.length===0&&!d.media));});
test('默认文档只补充一次，保留已有内容，删除后不会重建',()=>{const p={docs:[{id:'mine',type:'character',title:'我的人物',md:'用户内容'}]};assert.ok(initializeDefaults(p));assert.equal(p.docs.filter(d=>d.type==='character').length,1);assert.equal(p.docs[0].md,'用户内容');p.docs=p.docs.filter(d=>d.type!=='item');assert.equal(initializeDefaults(p),false);assert.ok(!p.docs.some(d=>d.type==='item'));});

test('人物功能框元数据保存并用于章节 AI 参考',()=>{
  const character={id:'person',type:'character',title:'测试人物',md:'# 旧资料',character:{name:'测试人物',gender:'女',faction:'山海',category:'好人',speech:'你好',files:{'voice-开心':{fileId:'voice',name:'开心.wav'}}}};
  const serialized=serializeMD(character);
  assert.deepEqual(JSON.parse(parseMD(serialized).meta.character),character.character);
  const prompt=buildPrompt({doc:{title:'章节',md:'章节内容'},refs:[character],images:[],action:'续写'});
  assert.match(prompt,/山海/);
  assert.match(prompt,/好人/);
});
