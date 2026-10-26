import {uid} from '../../../workspace/core.js';

// Synthetic fixtures for automated tests only. Never read a user's project.
export function fixtureProject(){
  const add=(id,type,title,folder,body,status='confirmed')=>({id,type,title,folder,status,md:`# ${title}\n\n${body}`,refs:[],images:[],versions:[],updated:Date.now()});
  return {id:uid(),name:'Automated test fixture',description:'Synthetic data for serialization and reference checks',docs:[
    add('world','script','测试世界观','世界观','TEST_WORLD_REFERENCE'),
    add('chapter1','script','测试章节','章节设定','TEST_CHAPTER_CONTENT','draft'),
    add('style','script','测试规范','创作规范','TEST_STYLE_REFERENCE'),
    add('char1','character','测试人物 A','主要人物','TEST_CHARACTER_REFERENCE'),
    add('item1','item','测试道具 A','关键道具','TEST_ITEM_REFERENCE'),
    add('skill1','skill','测试技能 A','探索技能','TEST_SKILL_REFERENCE'),
    add('term1','term','测试词条 A','世界术语','TEST_TERM_REFERENCE')
  ],tasks:[],created:Date.now()};
}
