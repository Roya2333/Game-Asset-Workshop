import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMediaConfig} from '../../workspace/media-api.js';
test('音乐配置可全部留空，拒绝危险地址和跨站检测路径',()=>{
  assert.deepEqual(normalizeMediaConfig({}),{base:'',model:'',testPath:'',imageEdit:false});
  assert.throws(()=>normalizeMediaConfig({base:'javascript:alert(1)'}));
  assert.throws(()=>normalizeMediaConfig({base:'https://user:password@example.com'}));
  assert.throws(()=>normalizeMediaConfig({testPath:'//other.example'}));
  assert.equal(normalizeMediaConfig({base:'https://example.com/v1/',model:' music '}).model,'music');
});
