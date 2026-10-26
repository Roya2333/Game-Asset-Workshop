import test from 'node:test';
import assert from 'node:assert/strict';
import {WORKFLOW,renderPlanningList,renderLinkedMedia} from '../../workspace/workflow.js';
import {resolveNavigation} from '../../workspace/navigation.js';
const icon=()=>'';
test('图标与音效视图读取列表同一条目，不创建重复数据',()=>{const project={docs:[{id:'item1',type:'item',title:'旧名称',details:{name:'新名称',purpose:'恢复生命',customFields:[{name:'重量',value:'2'}]}}]};for(const mode of ['icons','sounds']){const html=renderLinkedMedia(project,'item',mode,{urls:new Map(),icon});assert.match(html,/新名称/);assert.match(html,/恢复生命/);}assert.equal(project.docs.length,1);assert.match(renderPlanningList(project,'item',{icon}),/重量/);assert.match(renderPlanningList(project,'item',{icon}),/是否消耗/);});
test('保存的工作流视图恢复并保留章节选择',()=>{const project={docs:[{id:'chapter2',type:'narrative'}]};const view=resolveNavigation(project,{type:'narrative',selected:'chapter2',tab:'story'});assert.equal(view.tab,'story');assert.equal(view.selected,'chapter2');assert.ok(WORKFLOW.some(([type,mode])=>type==='narrative'&&mode==='dialogue'));});
test('音效服务未接入时不伪造可用生成，用户字段安全转义',()=>{const project={docs:[{id:'s',type:'skill',title:'<script>',details:{effect:'伤害'}}]};const html=renderLinkedMedia(project,'skill','sounds',{urls:new Map(),icon});assert.match(html,/暂不可用/);assert.match(html,/disabled/);assert.match(html,/释放音效要求/);assert.match(html,/命中 \/ 生效音效要求/);assert.ok(!html.includes('<script>'));});
