import asyncio,json,re
from pathlib import Path
from playwright.async_api import async_playwright
from browser_harness import load_page,ROOT
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page,errors=await load_page(b)
  r=await page.evaluate(r'''async()=>{await MathJax.startup.promise;const seen=new Map();for(const q of PokerQuestions.all()){for(const text of [q.prompt,q.hint,q.solution,q.explanation,...q.options||[]]){for(const match of String(text||'').matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)){const tex=match[1]??match[2];if(!seen.has(tex))seen.set(tex,q.id)}}}for(const f of GeniusMath.FormulaCatalog.all())seen.set(f.latex,'CATALOG:'+f.id);const bad=[];for(const [tex,id]of seen){try{const n=await MathJax.tex2svgPromise(tex,{display:true});const e=n.querySelector('[data-mml-node="merror"]');if(e)bad.push({id,tex,message:e.getAttribute('data-mjx-error')||e.textContent})}catch(e){bad.push({id,tex,message:e.message})}}return {totalUniqueExpressions:seen.size,errors:bad}}''')
  # Evaluate the original module worker in a Blob solely to test its real ping handler.
  worker_code=(ROOT/'genie/GenieWorker.js').read_text()
  ping=await page.evaluate('''async(code)=>{try{return await new Promise(resolve=>{const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));const w=new Worker(url,{type:'module'});const timeout=setTimeout(()=>{w.terminate();URL.revokeObjectURL(url);resolve({status:'timeout'})},3000);w.onmessage=e=>{clearTimeout(timeout);w.terminate();URL.revokeObjectURL(url);resolve({status:'passed',reply:e.data})};w.onerror=e=>{clearTimeout(timeout);w.terminate();resolve({status:'blocked',message:e.message})};w.postMessage({id:1,type:'ping'})})}catch(e){return{status:'blocked',message:e.message}}}''',worker_code)
  out={'version':'7.2.2-safe-audited','kind':'MathJax_parse_only_not_mathematical_proof','mathjax':r,'worker_ping':ping,'pageErrors':errors,'liveModelInference':False}
  (ROOT/'validation/MATHJAX_WORKER_RESULTS.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
