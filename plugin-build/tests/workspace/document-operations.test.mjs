import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isLockedDefault,lockProjectDefaults,moveFolders} from '../../workspace/document-operations.js';
import {initialProject,serializeMD,parseMD} from '../../workspace/core.js';
test('默认条目锁定，自建条目可删除，迁移不改变内容',()=>{
  const p=initialProject();lockProjectDefaults(p);assert.ok(p.docs.every(isLockedDefault));
  const custom={id:'custom',type:'item',title:'自建',md:'正文'};p.docs.push(custom);assert.equal(isLockedDefault(custom),false);assert.equal(lockProjectDefaults(p),false);assert.equal(custom.md,'正文');
  assert.equal(parseMD(serializeMD(p.docs[0])).meta.locked_default,'true');
});
test('移动目标包含当前板块已有分类和固定分类',()=>{
  assert.ok(moveFolders({type:'item'},[{type:'item',folder:'武器'}]).includes('武器'));
  assert.ok(moveFolders({type:'script'},[]).includes('世界观'));
  assert.ok(moveFolders({type:'character'},[]).includes('主角'));
});
