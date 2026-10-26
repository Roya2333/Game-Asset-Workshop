export function stripGPTAPISettings(preferences={}){
 const cleaned={local:{...(preferences.local||{})},session:{...(preferences.session||{})}};
 for(const area of Object.values(cleaned))for(const key of Object.keys(area)){
  if(key==='nw-api'||key==='nw-key'||(/^nw-media-key:/.test(key)&&key.endsWith(':image')))delete area[key];
  else if(key.startsWith('nw-media-api:')){
   try{const value=JSON.parse(area[key]);area[key]=JSON.stringify(value.music?{music:value.music}:{});}catch{delete area[key];}
  }
 }
 return cleaned;
}
