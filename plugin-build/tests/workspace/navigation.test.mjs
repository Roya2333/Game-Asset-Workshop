import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveNavigation,readView,saveView} from '../../workspace/navigation.js';
const project={id:'p',docs:[{id:'world',type:'script'},{id:'person',type:'character'},{id:'track',type:'music'}]};
test('恢复上次文档、板块、页签及筛选条件',()=>{
  assert.deepEqual(resolveNavigation(project,{type:'music',selected:'track',tab:'refs',query:'音乐'}),{type:'music',selected:'track',tab:'refs',special:null,query:'音乐'});
  assert.equal(resolveNavigation(project,{special:'settings'}).special,'settings');
});
test('已删除文档和无效状态安全回退，空板块仍保留选择',()=>{
  assert.equal(resolveNavigation(project,{type:'character',selected:'deleted'}).selected,'person');
  assert.equal(resolveNavigation(project,{type:'sound',selected:'deleted'}).type,'sound');
  assert.equal(resolveNavigation(project,{type:'bad',tab:'bad',special:'bad'}).tab,'preview');
});
test('按项目及标签页记忆位置，不缓存 API 密钥',()=>{
  const mock=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};};const local=mock(),session=mock();
  const state={projectId:'p',type:'character',selected:'person',tab:'preview',special:null,query:''};saveView(local,session,state);
  assert.deepEqual(readView(local,'nw-view:p'),state);assert.deepEqual(readView(session,'nw-current-view'),state);
  assert.equal(readView({getItem:()=>'{bad'},'bad'),null);
});
