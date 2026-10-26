import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProfileCandidate,mergeProfile} from '../../workspace/character-profile.js';

test('人物 AI 候选只接收资料字段，拒绝无效结果',()=>{
  const candidate=parseProfileCandidate('```json\n{"name":"林舟","gender":"男","folder":"boss","customFields":[{"name":"职业","value":"游侠"}]}\n```');
  assert.equal(candidate.name,'林舟');
  assert.equal(candidate.folder,undefined);
  assert.throws(()=>parseProfileCandidate('[]'));
  assert.throws(()=>parseProfileCandidate('{}'));
  assert.throws(()=>parseProfileCandidate('{"gender":42}'));
});

test('确认填入只补全空白字段，保留原资料、图片及属性',()=>{
  const original={name:'杨帆',gender:'',files:{portrait:{fileId:'portrait'}},attributes:[{name:'生命',value:'100'}],customFields:[{name:'职业',value:'船长'},{name:'年龄',value:''}]};
  const candidate=parseProfileCandidate('{"name":"林舟","gender":"男","faction":"海港","customFields":[{"name":"职业","value":"游侠"},{"name":"年龄","value":"25"},{"name":"性格","value":"沉稳"}]}');
  const merged=mergeProfile(original,candidate);
  assert.equal(merged.name,'杨帆');
  assert.equal(merged.gender,'男');
  assert.equal(merged.occupation,'船长');
  assert.equal(merged.age,'25');
  assert.equal(merged.personality,'沉稳');assert.deepEqual(merged.customFields,[]);
  assert.deepEqual(merged.files,original.files);
  assert.deepEqual(merged.attributes,original.attributes);
  assert.equal(original.gender,'');
});
import {normalizeCharacterFields,renderCharacterFixedFields,voicePreviewRequest} from '../../workspace/character-fields.js';
test('常用自定义字段迁入固定字段，冲突与特殊字段不丢失，迁移幂等',()=>{const c={personality:'谨慎',files:{portrait:{fileId:'p'}},customFields:[{name:'身份',value:'领航员'},{name:'性格',value:'开朗'},{name:'外貌',value:'蓝衣'},{name:'幸运物',value:'贝壳'}]};const next=normalizeCharacterFields(c);assert.equal(next.identity,'领航员');assert.equal(next.personality,'谨慎');assert.equal(next.appearance,'蓝衣');assert.deepEqual(next.customFields.map(f=>f.name),['性格','幸运物']);assert.deepEqual(normalizeCharacterFields(next),next);assert.equal(c.identity,undefined);assert.equal(next.files.portrait.fileId,'p');});
test('固定字段始终显示并转义内容，试听请求使用性格和说话方式',()=>{const c={identity:'领航员',personality:'外冷内热',appearance:'<script>',speechStyle:'短句，直率'};const html=renderCharacterFixedFields(c);assert.ok(html.includes('data-char-field="identity"'));assert.ok(html.includes('data-char-field="background"'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(voicePreviewRequest(c).includes('外冷内热'));assert.ok(voicePreviewRequest(c).includes('character.speech'));assert.ok(voicePreviewRequest(c).includes('不自动合成音频'));});
