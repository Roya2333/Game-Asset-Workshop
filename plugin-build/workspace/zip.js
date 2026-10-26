const enc=new TextEncoder(),dec=new TextDecoder();
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data){let crc=0xffffffff;for(const n of data)crc=table[(crc^n)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;}
export async function createZIP(files){
  const chunks=[],central=[];let offset=0,centralSize=0;
  for(const file of files){const name=enc.encode(file.name),data=typeof file.data==='string'?enc.encode(file.data):new Uint8Array(await file.data.arrayBuffer());const crc=crc32(data);const h=new Uint8Array(30+name.length),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);h.set(name,30);
    const c=new Uint8Array(46+name.length),w=new DataView(c.buffer);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x800,true);w.setUint32(16,crc,true);w.setUint32(20,data.length,true);w.setUint32(24,data.length,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);c.set(name,46);chunks.push(h,data);central.push(c);offset+=h.length+data.length;centralSize+=c.length;
  }
  const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);return new Blob([...chunks,...central,end],{type:'application/zip'});
}
export async function readZIP(blob){
  if(blob.size>100*1024*1024)throw Error('压缩包超过 100 MB，请拆分后导入');
  const buf=await blob.arrayBuffer(),v=new DataView(buf),bytes=new Uint8Array(buf);let end=bytes.length-22;
  while(end>=Math.max(0,bytes.length-65557)&&v.getUint32(end,true)!==0x06054b50)end--;
  if(end<Math.max(0,bytes.length-65557))throw Error('无法识别 ZIP 文件');
  const count=v.getUint16(end+10,true);if(count>2000)throw Error('压缩包文件过多');let pos=v.getUint32(end+16,true),total=0;const result=[];
  for(let i=0;i<count;i++){
    if(v.getUint32(pos,true)!==0x02014b50)throw Error('压缩包目录损坏');
    const method=v.getUint16(pos+10,true),size=v.getUint32(pos+20,true),unpacked=v.getUint32(pos+24,true),n=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),local=v.getUint32(pos+42,true),name=dec.decode(bytes.slice(pos+46,pos+46+n));
    total+=unpacked;if(total>150*1024*1024)throw Error('解压后文件超过限制');if(name.startsWith('/')||name.split(/[\\/]/).includes('..'))throw Error('压缩包包含不安全路径');
    const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);const packed=bytes.slice(start,start+size);let data;
    if(method===0)data=packed;else if(method===8)data=new Uint8Array(await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());else throw Error('暂不支持此压缩格式');
    if(data.length!==unpacked||crc32(data)!==v.getUint32(pos+16,true))throw Error('文件校验失败');if(!name.endsWith('/'))result.push({name,data});pos+=46+n+extra+comment;
  }return result;
}
