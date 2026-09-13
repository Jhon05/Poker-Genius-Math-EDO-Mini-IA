from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def ck(name, ok, **d): checks.append({'name':name,'pass':bool(ok),**d})
class P(HTMLParser):
    def __init__(self): super().__init__(); self.urls=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for k in ('src','href'):
            if a.get(k): self.urls.append(a[k])
idx=(ROOT/'index.html').read_text(encoding='utf-8')
p=P();p.feed(idx)
local=[u for u in p.urls if not urlsplit(u).scheme and not urlsplit(u).netloc and urlsplit(u).path]
ck('index_has_no_root_absolute_static_urls', all(not urlsplit(u).path.startswith('/') for u in local), bad=[u for u in local if urlsplit(u).path.startswith('/')])
conf=(ROOT/'genie/config.js').read_text(encoding='utf-8')
ck('package_root_resolves_from_config_script', "document.currentScript?.src" in conf and "new URL('../',scriptURL).href" in conf)
probe=(ROOT/'genie/GenieCapabilityProbe.js').read_text(encoding='utf-8')
ck('probe_accepts_https', "location.protocol==='https:'" in probe)
ck('probe_accepts_localhost', "['localhost','127.0.0.1','[::1]']" in probe)
ck('probe_remedy_mentions_https', 'GitHub Pages' in probe and 'Brightspace' in probe)
app=(ROOT/'app.js').read_text(encoding='utf-8')
ck('standalone_https_label', 'MODO WEB · SIN LMS' in app)
ck('scorm_adapter_present',(ROOT/'scorm.js').exists())
ck('github_nojekyll_present',(ROOT/'.nojekyll').exists())
ck('github_checklist_present',(ROOT/'GITHUB_PAGES_TEST_CHECKLIST.md').exists())
ck('dual_readme_present',(ROOT/'DUAL_DEPLOYMENT_README.md').exists())
ns={'cp':'http://www.imsproject.org/xsd/imscp_rootv1p1p2','adlcp':'http://www.adlnet.org/xsd/adlcp_rootv1p2'}
t=ET.parse(ROOT/'imsmanifest.xml'); r=t.find('.//cp:resource',ns)
ck('scorm_launch_index',r is not None and r.get('href')=='index.html')
ck('scorm_type_sco',r is not None and r.get('{'+ns['adlcp']+'}scormtype')=='sco')
ck('manifest_root',(ROOT/'imsmanifest.xml').parent==ROOT)
out={'kind':'DUAL_GITHUB_PAGES_AND_SCORM_STATIC_VALIDATION','executed':True,'total':len(checks),'passed':sum(c['pass'] for c in checks),'failed':[c for c in checks if not c['pass']],'results':checks}
(ROOT/'validation/DUAL_HOSTING_RESULTS.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k!='results'},ensure_ascii=False,indent=2))
raise SystemExit(bool(out['failed']))
