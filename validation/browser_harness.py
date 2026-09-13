"""Offline DOM integration harness. No browser navigation, real model, or real LMS.
Chromium policy blocks all URL navigation; HTML/CSS/JS bytes are injected unchanged,
with image URL resolution and localStorage fixtures provided by the harness.
IndexedDB remains real (and rejects opaque-origin access); failure handling is tested.
"""
import re,json,base64,mimetypes
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
APP_HOOK=r'''window.__P72_TEST__={getState:()=>state,setState:s=>state=s,freshState,startCardQuestion,openQuestionModal,openPreAnswerGenius,closeGeniusPanel,askGeniusMath,cancelGenius,submitNormalQuestion,submitTransferQuestion,beginTransfer,updateQuestionLearningRecord,buildSuspend,hydrateSuspend,normalizeRestoredState,saveLocal,saveState,loadSaved,continueGame,startNewGame,closeQuestion,answerCorrect,renderAnswerArea,renderAcademicPrompt,buildDetailedReport,finishGame,prepareFinish,finalizePreparedAttempt,initStart,studentAttemptBlocked,identityKey,remainingSeconds,teacherNew,showEndScreen,userProfile,openAttemptHistory,ensureCurrentReport,decisionCard,beginBetting,confirmBet,resolveFold,newHand};'''
def asset_data(path):
 return 'data:'+str(mimetypes.guess_type(str(path))[0] or 'application/octet-stream')+';base64,'+base64.b64encode(path.read_bytes()).decode()
ASSETS={str(p.relative_to(ROOT)):asset_data(p) for p in (ROOT/'assets').rglob('*') if p.is_file()}
html=(ROOT/'index.html').read_text()
INLINE=re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',html,re.S)
SCRIPTS=re.findall(r'<script[^>]*\bsrc="([^"]+)"[^>]*>',html)
html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S)
html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html)
for key,value in ASSETS.items():html=html.replace('src="'+key+'"','src="'+value+'"')
css='\n'.join((ROOT/f).read_text() for f in ['styles.css','genie/tutor-v72.css','genie/runtime-v721.css'])
css=re.sub(r'url\(([\'\"]?)([^)\'\"]+)\1\)',lambda m:'url("'+ASSETS.get(m.group(2),m.group(2))+'")',css)
HTML=html.replace('</head>','<style>'+css+'</style></head>')
async def load_page(browser,storage=None,lms=None,instrument=True,viewport=None):
 page=await browser.new_page(viewport=viewport or {'width':1440,'height':1000})
 page.set_default_timeout(8000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:d.accept())
 await page.set_content(HTML,wait_until='domcontentloaded')
 await page.evaluate('''({storage,assets,lms})=>{
 const data=new Map(Object.entries(storage||{}));const ls={getItem:k=>data.has(String(k))?data.get(String(k)):null,setItem:(k,v)=>data.set(String(k),String(v)),removeItem:k=>data.delete(String(k)),clear:()=>data.clear(),key:n=>[...data.keys()][n]??null,get length(){return data.size}};
 Object.defineProperty(window,'localStorage',{value:ls,configurable:true});window.__STORAGE_FIXTURE__=()=>Object.fromEntries(data);
 const desc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...desc,set(v){desc.set.call(this,assets[v]||v)}});
 if(lms){const values={...lms};const log=[];window.__LMS_FIXTURE__={values,log};window.API={LMSInitialize:()=>{log.push(['initialize']);return 'true'},LMSGetValue:k=>values[k]||'',LMSSetValue:(k,v)=>{log.push(['set',k,v]);values[k]=v;return 'true'},LMSCommit:()=>{log.push(['commit']);return 'true'},LMSFinish:()=>{log.push(['finish']);return 'true'},LMSGetLastError:()=> '0'};}
 }''',{'storage':storage or {},'assets':ASSETS,'lms':lms})
 for code in INLINE:await page.add_script_tag(content=code)
 # MathJax is loaded before app in this harness; package uses defer.
 for script in SCRIPTS:
  code=(ROOT/script).read_text()
  if script=='app.js' and instrument:code=code.replace("document.readyState==='loading'?",APP_HOOK+"\ndocument.readyState==='loading'?")
  await page.add_script_tag(content=code)
 await page.wait_for_timeout(200)
 return page,errors
