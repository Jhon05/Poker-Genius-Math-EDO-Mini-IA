"""Review UI tests with explicit non-inference fixture; local helper HTTP tests."""
import asyncio,json,subprocess,sys,time,urllib.request,urllib.error,socket
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];rows=[]
def check(name,ok,**d):rows.append({'name':name,'pass':bool(ok),**d})
async def ui():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=await b.new_page(accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  html=(ROOT/'validation/review.html').read_text().replace('<script src="review.js"></script>','');await page.set_content(html);await page.add_script_tag(content=(ROOT/'validation/review.js').read_text());check('empty_review_has_no_scores',await page.locator('#scores select').count()==10 and not await page.locator('#download').is_enabled())
  source={'version':'7.2.1-rc1','stage':'A','model':'TEST_FIXTURE_NOT_LLM','liveInferenceExecuted':False,'status':'completed','conversations':[{'id':'fixture-1','family':'FAMILIA_DE_PRUEBA','profile':'humano','questionId':'fixture','visiblePrompt':'Texto de prueba <img src=x onerror="window.__INJECTED__=1">','plannedTurns':1,'turns':[{'student':'<script>window.__INJECTED__=2</script>','assistant':'Texto fijo exclusivo del test, NO una respuesta de un LLM.'}]}]}
  await page.locator('#file').set_input_files({'name':'fixture.json','mimeType':'application/json','buffer':json.dumps(source).encode()});await page.wait_for_function('!document.getElementById("download").disabled');check('false_inference_remains_visible','NO declara inferencia real' in await page.locator('#status').inner_text());check('untrusted_text_not_html',await page.locator('#transcript script, #context img').count()==0 and await page.evaluate('!window.__INJECTED__'));check('all_scores_start_unreviewed',await page.evaluate('[...document.querySelectorAll("#scores select")].every(s=>s.value==="")'))
  await page.locator('#save').click();check('reviewer_required','identificador' in await page.locator('#status').inner_text());await page.locator('#reviewer').fill('REVISOR-FIXTURE')
  for el in await page.locator('#scores select').all():await el.select_option('3')
  await page.locator('#score-mathematicalCorrectness').select_option('4');await page.locator('#score-disclosurePolicy').select_option('4');await page.locator('#notes').fill('Evaluación ficticia para probar el formulario, no calidad pedagógica.');await page.locator('#save').click();check('count_updates','1 de 1' in await page.locator('#count').inner_text())
  async with page.expect_download() as info:await page.locator('#download').click()
  dl=await info.value;out=json.loads(Path(await dl.path()).read_text());check('export_keeps_live_false',out['liveInferenceExecuted'] is False);check('export_preserves_transcript',out['conversations'][0]['turns']==source['conversations'][0]['turns']);check('review_source_not_generated',out['conversations'][0]['humanReview']['source']=='independent_human_review_required');check('review_saved_scores',out['conversations'][0]['humanReview']['scores']['continuity']==3);check('no_uncaught_ui_errors',not errors,errors=errors);await b.close()
def server():
 with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
 proc=subprocess.Popen([sys.executable,str(ROOT/'serve_local.py'),'--port',str(port),'--no-browser'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  for _ in range(60):
   try:
    with urllib.request.urlopen(f'http://localhost:{port}/',timeout=1) as response:text=response.read().decode();break
   except (urllib.error.URLError,OSError):time.sleep(.1)
  else:raise RuntimeError('El helper no inició.')
  check('helper_serves_index','preloadGeniusBtn' in text)
  with urllib.request.urlopen(f'http://localhost:{port}/genie/GenieWorker.js',timeout=3) as response:check('helper_worker_javascript_mime','javascript' in response.headers.get('Content-Type',''));check('helper_nosniff_header',response.headers.get('X-Content-Type-Options')=='nosniff')
  try:urllib.request.urlopen(urllib.request.Request(f'http://localhost:{port}/',headers={'Host':'untrusted.example'}),timeout=3);check('helper_rejects_nonlocal_host',False)
  except urllib.error.HTTPError as e:check('helper_rejects_nonlocal_host',e.code==403)
  try:urllib.request.urlopen(urllib.request.Request(f'http://localhost:{port}/',data=b'test',method='POST'),timeout=3);check('helper_does_not_accept_uploads',False)
  except urllib.error.HTTPError as e:check('helper_does_not_accept_uploads',e.code==501)
  with urllib.request.urlopen(f'http://localhost:{port}/validation/benchmark.html',timeout=3) as response:check('helper_serves_benchmark',b'benchmark_runner.js' in response.read())
 finally:proc.terminate();proc.wait(timeout=5)
asyncio.run(ui());server();result={'version':'7.2.1-rc1','kind':'REVIEW_DOM_EXPLICIT_FIXTURE_AND_LOOPBACK_HTTP','executed':True,'liveInferenceExecuted':False,'realBrightspaceExecuted':False,'total':len(rows),'passed':sum(x['pass'] for x in rows),'failed':[x for x in rows if not x['pass']],'results':rows};(ROOT/'validation/REVIEW_SERVER_TEST_RESULTS_V721.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='results'},indent=2));raise SystemExit(bool(result['failed']))
