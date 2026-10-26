export function normalizeMediaConfig(input){
  const base=String(input.base||'').trim().replace(/\/+$/,'');
  if(base){let u;try{u=new URL(base);}catch{throw Error('请输入有效的 API 地址，或留空');}if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('API 地址应为不含凭据、查询或片段的 HTTP / HTTPS 地址');}
  const testPath=String(input.testPath||'').trim();if(testPath&&(testPath.startsWith('//')||/^[a-z]+:/i.test(testPath)))throw Error('检测路径应填写同一服务下的相对路径');
  return {base,model:String(input.model||'').trim(),testPath,imageEdit:!!input.imageEdit};
}
