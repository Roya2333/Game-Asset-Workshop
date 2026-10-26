import test from 'node:test';
import assert from 'node:assert/strict';
import {stripGPTAPISettings} from '../../workspace/gpt-settings.js';
test('移除文字图片的旧配置与密钥，保留音乐和其他偏好',()=>{
 const old={local:{'nw-api':'legacy','nw-media-api:p':JSON.stringify({image:{base:'old'},music:{model:'music'}}),'nw-last-view':'view'},session:{'nw-key':'text','nw-media-key:p:image':'image','nw-media-key:p:music':'music'}};
 const clean=stripGPTAPISettings(old);
 assert.equal(clean.local['nw-api'],undefined);
 assert.equal(clean.session['nw-key'],undefined);
 assert.equal(clean.session['nw-media-key:p:image'],undefined);
 assert.deepEqual(JSON.parse(clean.local['nw-media-api:p']),{music:{model:'music'}});
 assert.equal(clean.session['nw-media-key:p:music'],'music');
 assert.equal(clean.local['nw-last-view'],'view');
 assert.equal(old.local['nw-api'],'legacy');
});
