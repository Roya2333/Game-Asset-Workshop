import {escapeHTML as e} from './core.js';
export const aggregateType=type=>type==='item'||type==='skill';
export const tableLabel=type=>type==='item'?'道具':'技能';
export function aggregateTables(project,type){return project.contentTables?.[type]||[];}
export function aggregateRows(project,type,tableId=''){return (project.docs||[]).filter(d=>d.type===type&&(!tableId||d.details?.tableId===tableId));}
export function addAggregateTable(project,type,name,id){if(!aggregateType(type)||!name.trim())throw Error('请输入表名');if(aggregateTables(project,type).some(t=>t.name===name.trim()))throw Error('同名表已存在');project.contentTables||={};project.contentTables[type]||=[];project.contentTables[type].push({id,name:name.trim()});return id;}
export function renderAggregateDirectory(project,type,{selected='',query='',icon}){
 const label=tableLabel(type),tables=[{id:'',name:label+'总表'},...aggregateTables(project,type)];
 return `<div class="directory-head"><div class="section-title"><h2>${label}表</h2><button class="icon-btn" data-aggregate-new="${type}" aria-label="新增${label}表" title="新增表">${icon('plus')}</button></div><div class="search">${icon('search')}<input id="search" placeholder="搜索全部${label}信息…" value="${e(query)}" aria-label="搜索目录"></div></div><div class="directory-tools"><span>${tables.length} 张表</span><button class="btn subtle" data-aggregate-new="${type}">新增表</button></div><div class="directory-scroll">${tables.map(t=>`<button class="doc-item ${selected===t.id?'active':''}" data-aggregate-table="${e(t.id)}" data-aggregate-type="${type}">${icon('grid')}<span><strong>${e(t.name)}</strong><small>${aggregateRows(project,type,t.id).length} 项${t.id?'':' · 包含所有'+label}</small></span></button>`).join('')}</div><div class="directory-foot">选择表后查看全部行，图标与音效共用条目。</div>`;
}
