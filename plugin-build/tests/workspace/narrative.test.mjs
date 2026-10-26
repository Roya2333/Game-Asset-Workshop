import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialProject,initializeNarrative,isChapter} from '../../workspace/core.js';
import {CONTENT_FIELDS} from '../../workspace/content-forms.js';
test('新增独立剧本和锁定默认章节，初始化不重复创建',()=>{const p=initialProject();assert.equal(p.docs.filter(d=>d.type==='narrative').length,1);assert.ok(p.docs.find(d=>d.type==='narrative').lockedDefault);assert.equal(initializeNarrative(p),false);assert.ok(CONTENT_FIELDS.narrative);});
test('迁移已有章节保留 ID、资料和人物关系，总设定不变',()=>{const p={docs:[{id:'c',type:'script',folder:'章节设定',title:'第一章',md:'原文',participants:['person']},{id:'w',type:'script',folder:'世界观',title:'背景'}]};initializeNarrative(p);assert.equal(p.docs[0].type,'narrative');assert.equal(p.docs[0].id,'c');assert.deepEqual(p.docs[0].participants,['person']);assert.equal(p.docs[0].md,'原文');assert.equal(p.docs[1].type,'script');assert.ok(isChapter(p.docs[0]));});
