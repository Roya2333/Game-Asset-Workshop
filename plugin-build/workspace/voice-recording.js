export function encodeMonoWav(buffer){
 const frames=buffer.length,channels=buffer.numberOfChannels,bytes=new ArrayBuffer(44+frames*2),view=new DataView(bytes);
 const text=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
 text(0,'RIFF');view.setUint32(4,36+frames*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,frames*2,true);
 const samples=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));
 for(let i=0;i<frames;i++){const sample=Math.max(-1,Math.min(1,samples.reduce((sum,c)=>sum+c[i],0)/channels));view.setInt16(44+i*2,Math.round(sample*(sample<0?32768:32767)),true);}
 return new Blob([bytes],{type:'audio/wav'});
}
export function createMicrophoneRecorder({mediaDevices=globalThis.navigator?.mediaDevices,Recorder=globalThis.MediaRecorder,AudioContextImpl=globalThis.AudioContext||globalThis.webkitAudioContext,onTick=()=>{},onError=()=>{},maxSeconds=60}={}){
 let stream,recorder,timer,context,closed=false,pending=false,resolveStop,rejectStop;const chunks=[];
 const cleanup=()=>{clearInterval(timer);stream?.getTracks().forEach(track=>track.stop());stream=null;};
 return {
 async start(){
  if(!mediaDevices?.getUserMedia||!Recorder||!AudioContextImpl)throw Error('当前插件窗口不支持麦克风录音，请更新桌面客户端，或使用上传音频');
  if(pending||recorder)throw Error('录音已经开始');pending=true;
  try{stream=await mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(closed){cleanup();return;}
   const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(type=>Recorder.isTypeSupported?.(type));
   recorder=new Recorder(stream,mime?{mimeType:mime}:{});
   recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
   recorder.onerror=event=>{cleanup();const error=Error(event.error?.message||'录音失败，请重试');rejectStop?.(error);onError(error);};
   recorder.onstop=async()=>{cleanup();if(closed){resolveStop?.(null);return;}try{const source=new Blob(chunks,{type:recorder.mimeType});if(!source.size)throw Error('未录到声音，请检查麦克风');context=new AudioContextImpl();const decoded=await context.decodeAudioData(await source.arrayBuffer());const wav=encodeMonoWav(decoded);await context.close();context=null;resolveStop?.(wav);}catch(err){rejectStop?.(err);} };
   recorder.start(250);const began=Date.now();timer=setInterval(()=>{const seconds=Math.floor((Date.now()-began)/1000);onTick(seconds);if(seconds>=maxSeconds)this.stop();},250);
  }catch(err){cleanup();if(err.name==='NotAllowedError'||err.name==='SecurityError')throw Error('未获得麦克风权限，请允许此插件使用麦克风后重试');if(err.name==='NotFoundError')throw Error('未找到麦克风，请连接设备后重试');throw err;}finally{pending=false;}
 },
 stop(){if(!recorder||recorder.state==='inactive')return this.result;this.result=new Promise((resolve,reject)=>{resolveStop=resolve;rejectStop=reject;});recorder.stop();return this.result;},
 dispose(){closed=true;cleanup();if(recorder?.state==='recording')recorder.stop();context?.close().catch(()=>{});},
 };
}
export function openVoiceRecorder({modal,showModal,onSave,toast}){
 showModal('录制人物参考声音','<p class="text-muted">建议录制 6–20 秒清晰、自然的人声，避免背景音乐。最长 60 秒，录音只保存在本机。</p><p role="status" data-record-state>准备就绪，点击开始录音</p><audio controls data-record-preview hidden style="width:100%"></audio>','<button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-record-start>开始录音</button><button class="btn danger" data-record-stop disabled>停止录音</button><button class="btn primary" data-record-save disabled>使用这段录音</button>');
 const state=modal.querySelector('[data-record-state]'),start=modal.querySelector('[data-record-start]'),stop=modal.querySelector('[data-record-stop]'),save=modal.querySelector('[data-record-save]'),preview=modal.querySelector('[data-record-preview]');let session,recording,previewURL,processing=false;
 const finish=async()=>{if(processing||!session)return;processing=true;stop.disabled=true;state.textContent='正在处理录音…';try{recording=await session.stop();if(!modal.open||!recording)return;previewURL=URL.createObjectURL(recording);preview.src=previewURL;preview.hidden=false;save.disabled=false;state.textContent='录音已完成，可试听后保存';}catch(err){state.textContent=err.message;toast(err.message,true);}finally{start.disabled=false;start.textContent='重新录音';processing=false;}};
 start.onclick=async()=>{session?.dispose();if(previewURL)URL.revokeObjectURL(previewURL);recording=null;save.disabled=true;preview.hidden=true;preview.removeAttribute('src');start.disabled=true;state.textContent='正在请求麦克风权限…';session=createMicrophoneRecorder({onError:err=>{state.textContent=err.message;stop.disabled=true;start.disabled=false;},onTick:seconds=>{state.textContent='录音中 '+seconds+' / 60 秒';if(seconds>=60)finish();},maxSeconds:61});try{await session.start();if(!modal.open)return;state.textContent='录音中 0 / 60 秒';stop.disabled=false;}catch(err){state.textContent=err.message;start.disabled=false;}};
 stop.onclick=finish;
 save.onclick=async()=>{if(!recording)return;save.disabled=true;start.disabled=true;try{await onSave(recording);modal.close();toast('录音已保存为人物参考声音');}catch(err){toast(err.message,true);save.disabled=false;start.disabled=false;}};
 modal.addEventListener('close',()=>{session?.dispose();if(previewURL)URL.revokeObjectURL(previewURL);},{once:true});
}
