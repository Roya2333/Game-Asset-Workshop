import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildProjectOverview} from '../../workspace/overview.js';
test('全量资料包含正式资料、可空字段、人物附件及候选历史',()=>{
  const md=buildProjectOverview({id:'p',name:'项目',docs:[{id:'a',type:'script',title:'章节',md:'# 正文\n世界规则',participants:['b'],versions:[{id:'v',md:'旧稿',label:'旧版本'}]},{id:'b',type:'character',title:'人物',md:'',character:{name:'',gender:'',files:{front:{fileId:'f',name:'正面.png'}}}}],tasks:[{id:'t',docId:'a',title:'任务',status:'done',prompt:'输入要求',result:'候选稿'}]});
  for(const text of ['世界规则','人物附件','正面.png','未填写','旧稿','候选稿','ID：b','空白表示未设定'])assert.ok(md.includes(text),text);
  assert.ok(!md.includes('undefined'));
});
test('空项目也能导出可读总览，不依赖任何已填写内容',()=>{
  const md=buildProjectOverview({id:'p',docs:[],tasks:[]});assert.match(md,/未命名项目/);assert.match(md,/暂无内容/);
});
