export function parseSheet(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&(quoted||cell==='')){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c==='\t'||c==='\n'||c==='\r')){row.push(cell);cell='';if(c!=='\t'){rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else cell+=c;}
 if(quoted)throw Error('粘贴内容的引号未闭合');row.push(cell);rows.push(row);if(rows.length>1&&rows.at(-1).length===1&&rows.at(-1)[0]==='')rows.pop();if(rows.length>1000||rows.reduce((n,r)=>n+r.length,0)>20000)throw Error('一次最多粘贴 1000 行、20000 个单元格');return rows;
}
export function planSheetPaste({text,rows,fields,startRow,startColumn,options={}}){
 const matrix=parseSheet(text),changes=[];
 if(startRow<0||startColumn<0)throw Error('请选择有效单元格');
 for(let r=0;r<matrix.length;r++)for(let c=0;c<matrix[r].length;c++){const key=fields[startColumn+c];if(!key)throw Error('粘贴列数超过表格范围，请从正确列开始');let value=matrix[r][c];if(options[key]&&!options[key].includes(value))throw Error('第 '+(r+1)+' 行的 '+key+' 不在可选值中：'+value);changes.push({row:startRow+r,key,value,id:rows[startRow+r]?.id});}
 return {changes,newRows:Math.max(0,startRow+matrix.length-rows.length),cells:changes.length};
}
