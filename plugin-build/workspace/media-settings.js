export function createMediaSettings({showModal}){
 const message='音乐和音效按用户选择使用 GPT 内置能力，不配置外部 API。当前宿主未向本插件开放音乐或音效文件生成工具，暂时可生成设计要求并管理已有素材。';
 return {rows:()=>'<div class="settings-row"><div><strong>音乐与音效 · GPT 内置能力</strong><small>'+message+'</small></div></div>',show:()=>showModal('音乐与音效', '<p>'+message+'</p>'),save:()=>{throw Error('此版本无需配置音乐 API');},test:()=>{throw Error('当前宿主未提供原生音乐或音效生成工具');}};
}
