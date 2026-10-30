// The public GitHub client talks directly to Google, without a ChatGPT domain hop.
export function googleApiTransport(url,fetcher=fetch) {
 return async(path,options={})=>{
  const method=options.method||'GET';
  if(!((method==='GET'&&['/api/status','/api/models'].includes(path))||(method==='POST'&&path==='/api/chat')))throw Error('Неизвестный метод API');
  const controller=new AbortController();let timedOut=false;
  const abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},path==='/api/chat'?300000:60000);
  try {
   // text/plain avoids a CORS preflight that Apps Script cannot handle.
   const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action:'web-api',path,method,body:options.body}),signal:controller.signal,credentials:'omit',redirect:'follow',cache:'no-store'});
   if(!response.ok)throw Error('Сервер Google: HTTP '+response.status);
   let result;try{result=await response.json();}catch{throw Error('Сервер Google вернул неверный ответ');}
   if(!Number.isInteger(result.status)||result.status<200||result.status>599||typeof result.body!=='string')throw Error('Шлюз Google не выполнил запрос');
   return new Response(result.body,{status:result.status,headers:{'Content-Type':result.contentType||'application/json'}});
  }catch(error){if(timedOut)throw Error('Сервер Google не ответил за отведённое время. Повторите запрос.');if(error instanceof TypeError)throw Error('Браузер не может связаться с сервером Google. Проверьте доступ к script.google.com.');throw error;}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
 };
}
