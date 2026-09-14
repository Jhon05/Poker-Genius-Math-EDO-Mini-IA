"""Static package/source validation; not inference or LMS certification."""
from pathlib import Path, PurePosixPath
import argparse,hashlib,json,re,subprocess,sys,zipfile,xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from package_scorm import included_paths

def digest(b):return hashlib.sha256(b).hexdigest()
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.base=''
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='base':self.base=a.get('href','');return
  for k in (['src'] if tag in ['script','img','iframe','audio','video','source'] else ['href'] if tag in ['link','a'] else []):
   if a.get(k):self.links.append(a[k])

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--original',required=True);args=ap.parse_args();checks=[]
 def check(name,passed,**details):checks.append({'name':name,'pass':bool(passed),**details})
 paths={p.relative_to(ROOT).as_posix():p for p in included_paths()}
 ns={'cp':'http://www.imsproject.org/xsd/imscp_rootv1p1p2','adlcp':'http://www.adlnet.org/xsd/adlcp_rootv1p2'}
 tree=ET.parse(ROOT/'imsmanifest.xml');res=tree.findall('.//cp:resource',ns)
 check('one_SCORM12_sco',len(res)==1 and res[0].get('{'+ns['adlcp']+'}scormtype')=='sco')
 check('launch_index_root',res[0].get('href')=='index.html' and 'index.html' in paths)
 check('scorm12_metadata',tree.find('.//cp:schemaversion',ns).text=='1.2')
 check('manifest_version',tree.getroot().get('version')=='7.2.2' and 'V722' in tree.getroot().get('identifier','') and 'SAFE_AUDITADA' in tree.getroot().get('identifier',''))
 check('organization_links_one_sco',tree.find('.//cp:item',ns).get('identifierref')==res[0].get('identifier'))
 names=[x.get('href') for x in tree.findall('.//cp:file',ns)]
 check('manifest_unique',len(names)==len(set(names)))
 check('manifest_complete',set(names)==set(paths)-{'imsmanifest.xml'},missing=sorted(set(paths)-set(names)-{'imsmanifest.xml'}),extra=sorted(set(names)-set(paths)))
 for n in names:check('manifest_resource:'+n,n in paths and not PurePosixPath(n).is_absolute() and '..' not in PurePosixPath(n).parts)
 for n,p in paths.items():
  if p.suffix=='.html' and not n.startswith(('legacy_validation/','validation/audit_v72/')):
   h=Links();h.feed(p.read_text())
   for link in h.links:
    u=urlsplit(link)
    if u.scheme or u.netloc or not u.path:continue
    # A document-level base applies to its resource URLs. No javascript template strings are parsed as tags.
    dest=(p.parent/(h.base or './')/unquote(u.path)).resolve()
    try:relative=dest.relative_to(ROOT).as_posix()
    except ValueError:relative='OUTSIDE_PACKAGE'
    check('html_resource:'+n+':'+link,relative in paths,path=relative)
 for n,p in sorted(paths.items()):
  if p.suffix in ['.js','.cjs'] and not n.startswith(('legacy_validation/','validation/audit_v72/')):
   proc=subprocess.run(['node','--check',str(p)],capture_output=True,text=True,timeout=30)
   check('javascript_parse:'+n,proc.returncode==0,error=proc.stderr[:800] if proc.returncode else None)
 app=(ROOT/'app.js').read_text();pre=(ROOT/'genie/PreloadPanel.js').read_text();tutor=(ROOT/'genie/TutorPanel.js').read_text();worker=(ROOT/'genie/GenieWorker.js').read_text();conf=(ROOT/'genie/config.js').read_text();local=(ROOT/'genie/LocalModelProvider.js').read_text()
 check('no_test_hooks_in_production','__P72_TEST__' not in app)
 check('no_native_confirm_in_preload','confirm(' not in pre)
 check('chat_local_uses_shared_preload','PreloadPanel.open' in tutor)
 check('runtime_pinned','@mlc-ai/web-llm@0.2.85' in conf)
 check('actual_runtime_import_and_model_engine','await import(u.href)' in worker and 'MLCEngine' in worker and 'engine.chat.completions.create' in worker)
 check('no_unsubstantiated_winner','G.config.recommendedDefault=null' in conf)
 check('local_default_not_cloud',"provider:'local'" in conf and "cloud:{enabled:false" in conf)
 check('real_smoke_gate','liveInference' in local and 'responseNonEmpty' in local and 'encodingValid' in local)
 check('cancel_barrier','cancelling' in local and 'cancelTimeoutMs' in local)
 production='\n'.join(p.read_text(errors='replace') for n,p in paths.items() if p.suffix=='.js' and not n.startswith(('validation/','legacy_validation/')))
 check('no_private_api_keys',not re.search(r'\bsk-[A-Za-z0-9_-]{20,}',production))
 check('no_model_weights_bundled',not any(n.endswith(('.bin','.safetensors','.gguf')) for n in paths))
 required=['VALIDACION_V721_GENIUS_RUNTIME.md','TEST_RESULTS_V721_GENIUS_RUNTIME.json','LOCAL_TEST_INSTRUCTIONS.md','BRIGHTSPACE_TEST_CHECKLIST.md','MODEL_SELECTION_REPORT.md','EXTERNAL_DEPENDENCIES.md','validation/GENIUS_CAPABILITY_TEST_RESULTS.json','validation/LIVE_INFERENCE_RESULTS.json','validation/MODEL_BENCHMARK_RESULTS_V721.json','validation/CACHE_TEST_RESULTS.json','validation/BROWSER_RUNTIME_TEST_RESULTS.json','validation/PACKAGE_TEST_RESULTS_V721.json','validation/SCORM_REGRESSION_RESULTS.json','validation/BENCHMARK_RUBRIC.md','validation/benchmark.html','validation/review.html','serve_local.bat','serve_local.py']
 for n in required:check('required_delivery:'+n,n in paths)
 with zipfile.ZipFile(args.original) as z:old={n:z.read(n) for n in z.namelist() if not n.endswith('/')}
 same=[];modified=[];removed=[];preserved=[]
 for n,b in old.items():
  if n not in paths:removed.append(n)
  elif paths[n].read_bytes()==b:same.append(n)
  else:modified.append(n)
  if n.startswith(('assets/','bank/','mathjax/','reino_calculator/')) or n in ['poker.js','questions.js','scorm.js','styles.css','interactive_graphs.js','reino_calculator_bridge.js']:
   ok=n in paths and digest(b)==digest(paths[n].read_bytes());check('preserved_sha256:'+n,ok);preserved.append({'path':n,'unchanged':ok,'sha256':digest(b)})
 check('all_original_paths_retained',not removed,removed=removed)
 oa=old['app.js'].decode();rule_names=['resolveFold','confirmBet','decisionCard','newHand','resolveRescue','parseNumeric','orderIsCorrect','finishIfTerminalAfterSettlement','terminalBankReason'];rules=[]
 for n in rule_names:
  pattern=r'^(?:async )?function '+re.escape(n)+r'\([^\n]+';a=re.search(pattern,oa,re.M);b=re.search(pattern,app,re.M)
  check('rule_function_found:'+n,bool(a and b))
  if a and b:check('unchanged_rule_function:'+n,a.group()==b.group());rules.append(n)
 a=re.search(r'function answerCorrect\([\s\S]*?\n}\n',oa);b=re.search(r'function answerCorrect\([\s\S]*?\n}\n',app);check('unchanged_entire_answerCorrect',bool(a and b) and a.group()==b.group())
 check('unchanged_final_grade_expression',all(t in oa and t in app for t in ['state.pokerGrade=round2(state.grade);state.finalGrade=round2(clamp(state.grade,0,5));state.grade=state.finalGrade','function money(n){return round2(n).toFixed(2)}']))
 inventory={'version':'7.2.2-safe-audited','baseArchiveName':Path(args.original).name,'baseArchiveSHA256':digest(Path(args.original).read_bytes()),'unchanged':sorted(same),'modified':sorted(modified),'removed':sorted(removed),'added':sorted(set(paths)-set(old)),'comparedRuleFunctions':rules,'preservedResources':preserved}
 (ROOT/'validation/FILE_INVENTORY_V721.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
 out={'version':'7.2.2-safe-audited','kind':'STATIC_PACKAGE_AND_SOURCE_REGRESSION','executed':True,'liveInferenceExecuted':False,'realBrightspaceExecuted':False,'xmlSchemaXSDValidation':'not_run_no_official_local_xsd_supplied','total':len(checks),'passed':sum(c['pass'] for c in checks),'failed':[c for c in checks if not c['pass']],'preservedResourceCount':len(preserved),'packageFileCount':len(paths),'results':checks}
 (ROOT/'validation/PACKAGE_TEST_RESULTS_V721.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 print(json.dumps({k:v for k,v in out.items() if k!='results'},ensure_ascii=False,indent=2));raise SystemExit(bool(out['failed']))
if __name__=='__main__':main()
