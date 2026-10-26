import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recycleDocument,restoreEntry,purgeEntry,recycle} from '../../workspace/recycle-bin.js';
import {initializeDefaults} from '../../workspace/core.js';
test('默认内容可移入垃圾桶，恢复保留 ID、附件和引用',()=>{const p={docs:[{id:'a',title:'默认',lockedDefault:true,images:[{fileId:'f'}]},{id:'b',refs:['a'],participants:['a']}]};const entry=recycleDocument(p,'a');assert.equal(p.docs.length,1);assert.deepEqual(p.docs[0].refs,['a']);restoreEntry(p,entry.id);assert.equal(p.docs[1].images[0].fileId,'f');assert.equal(p.docs[1].id,'a');assert.equal(p.trash.length,0);});
test('彻底删除才清理引用，字段和参考图也可恢复',()=>{const p={docs:[{id:'a',character:{attributes:[{name:'生命'}]},images:[]},{id:'b',refs:['a']}]};const e=recycleDocument(p,'a');purgeEntry(p,e.id);assert.deepEqual(p.docs[0].refs,[]);const image=recycle(p,'reference-image',{fileId:'f'},{docId:'b',index:0});restoreEntry(p,image.id);assert.equal(p.docs[0].images[0].fileId,'f');});
test('已完成模板初始化后删除内容，刷新不会重新生成',()=>{const p={docs:[],contentTemplatesInitialized:true,generationSettingsVersion:1};assert.equal(initializeDefaults(p),false);assert.deepEqual(p.docs,[]);});
