import {displayedImage,imageParameters} from './character-images.js';
export function threeViewRequest(doc,request=''){
 const reference=displayedImage(doc.character?.files||{},'portrait');if(!reference?.fileId)throw Error('请先生成或添加人物主图，再一键生成三视图');
 const parameters=imageParameters(doc.character?.imageSettings||{});
 return '为当前人物一键生成三视图，分别执行正面、侧面、背面三个任务，不生成三视图拼接图。参考主图 fileId='+reference.fileId+'；每张规格='+JSON.stringify(parameters)+'。先读取人物资料与参考图；分别调用 prepare_image_request，slot 依次为 view-正面、view-侧面、view-背面；使用宿主原生作图生成三张独立图片。三张均为单人全身、相同站姿和比例、保持同一人物的脸型、发型、服装、配色与画风，侧面为严格侧视、背面为背视，干净背景，无文字。参考图未展示的服装细节在三张中保持一致，不修改人物资料。每生成一张，重新 read_content 取最新 revision，再 save_asset 到对应 slot，作为待修改候选，保留旧图。逐项报告成功或失败，不把提示词当作生成结果。补充要求：'+(request.trim()||'无');
}

export function expressionBatchRequest(doc,defaults){
 const c=doc.character||{},reference=(c.files?.portrait||displayedImage(c.files||{},'portrait'));if(!reference?.fileId)throw Error('请先生成或添加人物主图，再生成表情包');
 const expressions=[...new Set([...defaults,...(c.expressions||[])].map(x=>String(x).trim()).filter(Boolean))];if(!expressions.length)throw Error('请先添加表情');
 const parameters=imageParameters(c.imageSettings||{}),tasks=expressions.map(emotion=>({emotion,slot:'expression-'+emotion,parameters,request:c.imageRequests?.['expression-'+emotion]||''}));
 return '一键生成当前人物的全部表情包，共 '+tasks.length+' 张独立图片，不制作拼图或表情合集大图。自动采用页面全局属性：'+JSON.stringify(parameters)+'。参考人物主图 fileId='+reference.fileId+'，先用 read_asset 读取。保持人物五官、发型、服装、画风、镜头和构图一致，只改变表情与必要的细微姿态。使用人物设定决定表情表现，每张体现对应情绪。任务清单：'+JSON.stringify(tasks)+'。逐项调用 prepare_image_request，传入对应 slot、width、height；按当前格式和透明背景要求调用宿主原生作图。每项生成真实图片后重新 read_content 获取最新 revision，再 save_asset 到对应 expression 槽位，设为待修改候选并保留旧图。原生工具不能满足的尺寸/格式/透明要求须明确报告，不能伪称符合。逐项报告完成、失败或未执行，不把描述当成图片。';
}
