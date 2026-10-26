import test from 'node:test';
import assert from 'node:assert/strict';
import {displayedImage,stageImage,confirmImage} from '../../workspace/character-images.js';
import {serializeMD,parseMD} from '../../workspace/core.js';

test('图片生成与再次修改不会覆盖正式图，确认后才替换并保留旧图',()=>{
  const files={'view-正面':{fileId:'original',confirmedAt:1}};
  stageImage(files,'view-正面',{fileId:'candidate1'});
  stageImage(files,'view-正面',{fileId:'candidate2'});
  assert.equal(files['view-正面'].fileId,'original');
  assert.equal(displayedImage(files,'view-正面').fileId,'candidate2');
  confirmImage(files,'view-正面','history',10);
  assert.equal(files['view-正面'].fileId,'candidate2');
  assert.equal(files['view-正面'].confirmedAt,10);
  assert.equal(files['history:view-正面:history'].fileId,'original');
  assert.equal(files['candidate:view-正面'],undefined);
});

test('表情候选与确认状态随人物元数据往返，空图片不可确认',()=>{
  const files={};
  assert.throws(()=>confirmImage(files,'expression-开心','x'));
  stageImage(files,'expression-开心',{fileId:'happy',name:'happy.png'});
  const doc={id:'person',type:'character',title:'人物',md:'',character:{files}};
  const restored=JSON.parse(parseMD(serializeMD(doc)).meta.character);
  assert.equal(displayedImage(restored.files,'expression-开心').confirmedAt,null);
  confirmImage(restored.files,'expression-开心','x',12);
  assert.equal(restored.files['expression-开心'].confirmedAt,12);
});

test('三视图默认参考正式主角图，修改已有三视图时使用当前图',async()=>{
  const {imageReference}=await import('../../workspace/character-images.js');
  const files={portrait:{fileId:'portrait'},'candidate:portrait':{fileId:'pending-portrait'}};
  for(const view of ['正面','侧面','背面'])assert.equal(imageReference(files,'view-'+view).image.fileId,'portrait');
  stageImage(files,'view-正面',{fileId:'front'});
  assert.equal(imageReference(files,'view-正面').image.fileId,'front');
  assert.equal(imageReference(files,'expression-开心').image,null);
  assert.equal(imageReference({},'view-正面').image,null);
  assert.equal(imageReference({'candidate:portrait':{fileId:'pending'}},'view-侧面').image.fileId,'pending');
});

test('全局图片参数生成实际接口字段并校验透明格式和尺寸',async()=>{
  const {imageParameters,imageFileType}=await import('../../workspace/character-images.js');
  assert.deepEqual(imageParameters(),{size:'1024x1024',output_format:'png',background:'opaque'});
  assert.deepEqual(imageParameters({width:768,height:1536,format:'webp',transparent:true}),{size:'768x1536',output_format:'webp',background:'transparent'});
  assert.throws(()=>imageParameters({width:''}));
  assert.throws(()=>imageParameters({height:1.5}));
  assert.throws(()=>imageParameters({format:'jpeg',transparent:true}));
  assert.equal(imageFileType(new Uint8Array([255,216,255])).extension,'jpg');
  assert.equal(imageFileType(new Uint8Array([137,80,78,71])).mime,'image/png');
});
