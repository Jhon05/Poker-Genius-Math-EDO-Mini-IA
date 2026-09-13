"""Static package and source-preservation checks. Not SCORM certification.
Usage: python validation/test_package.py --original path/to/original.zip
"""
from pathlib import Path
import argparse,hashlib,json,re,subprocess,zipfile,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
def digest(b):return hashlib.sha256(b).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--original');args=ap.parse_args();checks=[]
 def check(name,passed,**details):checks.append({'name':name,'pass':bool(passed),**details})
 paths={str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts}
 tree=ET.parse(ROOT/'imsmanifest.xml');ns={'cp':'http://www.imsproject.org/xsd/imscp_rootv1p1p2','adlcp':'http://www.adlnet.org/xsd/adlcp_rootv1p2'}
 resources=tree.findall('.//cp:resource',ns);check('one_sco',len(resources)==1 and resources[0].get('{'+ns['adlcp']+'}scormtype')=='sco');check('launch_index',resources[0].get('href')=='index.html');check('scorm_12_metadata',tree.find('.//cp:schemaversion',ns).text=='1.2');check('manifest_v72','V72' in tree.getroot().get('identifier',''))
 manifest=[n.get('href') for n in tree.findall('.//cp:file',ns)];check('unique_manifest_entries',len(manifest)==len(set(manifest)))
 for name in manifest:check('manifest_resource:'+name,name in paths and '..' not in Path(name).parts)
 html=(ROOT/'index.html').read_text();scripts=re.findall(r'<script[^>]*src="([^"]+)"',html);check('no_legacy_classifier_loaded',not any('ScopeClassifier' in p for p in scripts));check('no_fake_provider_main',"provider:'local'" in (ROOT/'genie/config.js').read_text());check('model_weights_external_declared',not any(x.endswith('.bin') for x in paths))
 for name in scripts+re.findall(r'<link[^>]*href="([^"]+)"',html):check('entry_dependency:'+name,name in paths)
 for name in sorted(paths):
  if name.endswith('.js') and not name.startswith('legacy_validation/'):
   p=subprocess.run(['node','--check',str(ROOT/name)],capture_output=True,text=True)
   check('javascript_parse:'+name,p.returncode==0,error=p.stderr[:1000] if p.returncode else None)
 cases=json.loads((ROOT/'validation/BENCHMARK_CASES.json').read_text());check('benchmark_20_profiles',len(cases['profiles'])==20);check('benchmark_8_families',len(cases['families'])==8);check('benchmark_long_22_turns',max(len(x['messages']) for x in cases['profiles'])>=22)
 app=(ROOT/'app.js').read_text();check('test_hooks_not_in_production','__P72_TEST__' not in app);check('runtime_pinned','@mlc-ai/web-llm@0.2.85' in (ROOT/'genie/config.js').read_text());check('local_worker_real_import',"await import(m.runtimeURL)" in (ROOT/'genie/GenieWorker.js').read_text());check('no_embedded_private_api_key',not re.search(r'\bsk-[A-Za-z0-9_-]{20,}', '\n'.join((ROOT/x).read_text() for x in scripts)))
 preservation={'status':'not_run_original_not_supplied','entries':[]};changes={}
 if args.original:
  with zipfile.ZipFile(args.original) as z:
   old={n:z.read(n) for n in z.namelist() if not n.endswith('/')};same=[];modified=[];removed=[]
   for n,b in old.items():
    if n not in paths:removed.append(n)
    elif (ROOT/n).read_bytes()==b:same.append(n)
    else:modified.append(n)
   for name in sorted(old):
    if name.startswith(('assets/','bank/','mathjax/','reino_calculator/')) or name in ['poker.js','questions.js','scorm.js','styles.css','interactive_graphs.js','reino_calculator_bridge.js']:
     ok=name in paths and digest(old[name])==digest((ROOT/name).read_bytes());check('preserved_sha256:'+name,ok);preservation['entries'].append({'path':name,'unchanged':ok,'sha256':digest(old[name])})
   # These grading and game-rule functions are single-line in the supplied version.
   oa=old['app.js'].decode();function_names=['answerCorrect','scoreForReport','money','resolveShowdown','resolveFold','confirmBet','decisionCard','newHand']
   compared=[]
   for name in function_names:
    pattern=r'^function '+re.escape(name)+r'\([^\n]+';a=re.search(pattern,oa,re.M);b=re.search(pattern,app,re.M)
    if a and b:check('unchanged_rule_function:'+name,a.group()==b.group());compared.append(name)
   changes={'unchanged':sorted(same),'modified':sorted(modified),'removed_original_paths':sorted(removed),'added':sorted(paths-set(old)),'note':'Removed original paths for prior validation and legacy classifier are retained under legacy_validation/. Original README is replaced by current instructions.','comparedRuleFunctions':compared}
  preservation['status']='passed' if all(x['unchanged'] for x in preservation['entries']) else 'failed'
  (ROOT/'validation/FILE_INVENTORY_V72.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2))
 out={'version':'7.2.0-rc1','kind':'static_manifest_source_integrity_not_lms_certification','executed':True,'total':len(checks),'passed':sum(c['pass'] for c in checks),'failed':[c for c in checks if not c['pass']],'xmlSchemaXSDValidation':'not_run_no_local_xsd_supplied','realBrightspace':'not_run','preservation':preservation,'results':checks}
 (ROOT/'validation/PACKAGE_TEST_RESULTS.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in out.items() if k not in ['results','preservation']},ensure_ascii=False,indent=2));raise SystemExit(bool(out['failed']))
if __name__=='__main__':main()
