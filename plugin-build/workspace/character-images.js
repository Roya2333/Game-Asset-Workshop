export const candidateKey = key => 'candidate:' + key;
export function imageParameters(settings={}) {
  const width=Number(settings.width??1024),height=Number(settings.height??1024);
  if (!Number.isInteger(width)||!Number.isInteger(height)||width<64||height<64||width>8192||height>8192) throw Error('图片宽高须为 64 至 8192 的整数，具体尺寸需图片模型支持');
  const format=settings.format||'png';
  if (!['png','jpeg','webp'].includes(format)) throw Error('不支持的图片格式');
  if (settings.transparent&&format==='jpeg') throw Error('JPEG 不支持透明背景，请选择 PNG 或 WebP');
  return {size:width+'x'+height,output_format:format,background:settings.transparent?'transparent':'opaque'};
}
export function imageFileType(bytes) {
  if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return {mime:'image/png',extension:'png'};
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return {mime:'image/jpeg',extension:'jpg'};
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return {mime:'image/webp',extension:'webp'};
  throw Error('图片接口返回了无法识别的图片格式');
}
export function displayedImage(files, key) {
  return files[candidateKey(key)] || files[key];
}
export function imageReference(files, key) {
  const current = displayedImage(files,key);
  if (current) return {image:current, kind:'current'};
  if (key.startsWith('view-')) {
    const portrait = files.portrait || displayedImage(files,'portrait');
    if (portrait) return {image:portrait, kind:'portrait'};
  }
  return {image:null, kind:null};
}
export function stageImage(files, key, image) {
  if(files[candidateKey(key)])files['history:'+key+':'+crypto.randomUUID()]={...files[candidateKey(key)]};
  files[candidateKey(key)] = {...image, confirmedAt:null};
}
export function confirmImage(files, key, historyId, time=Date.now()) {
  const next = displayedImage(files,key);
  if (!next) throw Error('请先上传或生成图片');
  if (files[candidateKey(key)] && files[key]) files['history:'+key+':'+historyId] = {...files[key]};
  files[key] = {...next, confirmedAt:time};
  delete files[candidateKey(key)];
  return files[key];
}
