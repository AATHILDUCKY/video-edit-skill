/* Small loopback server with media-range support. Used by studio and deterministic renderer. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.mp4':'video/mp4','.webm':'video/webm','.m4a':'audio/mp4','.wav':'audio/wav','.ogg':'audio/ogg','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
async function serve(root,port=0){
 root=path.resolve(root);
 const server=http.createServer((req,res)=>{
  let target;try{target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname))}catch(_){res.writeHead(400);res.end();return}
  if(target===root)target=path.join(root,'edit.html');
  if(!target.startsWith(root+path.sep)||!['GET','HEAD'].includes(req.method)){res.writeHead(403);res.end();return}
  fs.stat(target,(err,stat)=>{
   if(err||!stat.isFile()){res.writeHead(404);res.end();return}
   let start=0,end=stat.size-1,status=200;
   const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
   if(range){status=206;if(range[1]){start=Number(range[1]);if(range[2])end=Number(range[2])}else if(range[2])start=Math.max(0,stat.size-Number(range[2]));end=Math.min(end,stat.size-1)}
   if(start>end||start>=stat.size||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return}
   const headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-store'};
   if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
   res.writeHead(status,headers);if(req.method==='HEAD')res.end();else fs.createReadStream(target,{start,end}).on('error',()=>res.destroy()).pipe(res);
  });
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)});
 return {server,url:`http://127.0.0.1:${server.address().port}`};
}
module.exports={serve};
if(require.main===module)serve(path.resolve(__dirname,'..'),Number(process.env.PORT)||4173).then(({url})=>console.log(`Video Edit Studio: ${url}/edit.html\nKeep this terminal open while editing. Ctrl+C stops the local studio.`)).catch(e=>{console.error(e.message);process.exitCode=1});
