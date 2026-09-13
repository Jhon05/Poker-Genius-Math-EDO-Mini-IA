"""Independent symbolic/numeric checks of selected bank families, not an LLM verdict.
Requires Python 3, Node.js and sympy. Also inventories all 500 without rewriting keys.
"""
from pathlib import Path
import json,re,subprocess,math,collections
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application
ROOT=Path(__file__).resolve().parents[1]
code="const fs=require('fs'),vm=require('vm');global.window=global;for(const f of ['bank/base_bank.js','bank/extended_bank.js','questions.js'])vm.runInThisContext(fs.readFileSync(f,'utf8'));console.log(JSON.stringify(PokerQuestions.all()));"
qs=json.loads(subprocess.check_output(['node','-e',code],cwd=ROOT,text=True));t=S.Symbol('t',positive=True);s=S.Symbol('s',positive=True);Y=S.Symbol('Y');A=S.Symbol('A');I=S.Symbol('I');rows=[]
def coeff(z):return int(z) if z not in ['','-','+'] else (-1 if z=='-' else 1)
def braced(st,k):
 if st[k]!='{':return st[k],k+1
 depth=1;i=k+1
 while depth and i<len(st):
  depth+=(st[i]=='{')-(st[i]=='}');i+=1
 if depth:raise ValueError('unbalanced braces')
 return st[k+1:i-1],i

def expr(st):
 st=st.replace('\\(','').replace('\\)','').replace('\\,','').replace('\\left','').replace('\\right','').replace('Y(s)','Y')
 st=re.sub(r'u_(\d+)\(t\)',lambda m:'Heaviside(t-'+m[1]+')',st)
 while '\\frac' in st:
  k=st.rfind('\\frac');a,e=braced(st,k+5);b,f=braced(st,e);st=st[:k]+'(('+a+')/('+b+'))'+st[f:]
 st=re.sub(r'e\^\{([^{}]+)\}',r'exp(\1)',st)
 for f in ['sin','cos','cosh','sinh']:st=st.replace('\\'+f,f)
 st=st.replace('^','**').replace('{','(').replace('}',')').replace('−','-')
 if not re.fullmatch(r'[a-zA-Z0-9\s()+*/.\-]+',st):raise ValueError('unsupported expression '+st)
 names=set(re.findall(r'[a-zA-Z]+',st))
 if not names<={'s','t','Y','A','I','exp','sin','cos','cosh','sinh','Heaviside'}:raise ValueError('unknown identifiers')
 return parse_expr(st,local_dict={'s':s,'t':t,'Y':Y,'A':A,'I':I,'exp':S.exp,'sin':S.sin,'cos':S.cos,'cosh':S.cosh,'sinh':S.sinh,'Heaviside':S.Heaviside},transformations=standard_transformations+(implicit_multiplication_application,))
def matrix(st):
 m=re.search(r'\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}',st)
 if not m:raise ValueError('matrix not found')
 return S.Matrix([[expr(v) for v in row.split('&')] for row in m[1].split('\\\\')])
def vector(st):
 k=st.index('\\binom')+6;a,j=braced(st,k);b,_=braced(st,j);return S.Matrix([expr(a),expr(b)])
def numeric_expected(q):
 p=q['prompt']
 if 'det A' in p or '\\det A' in p:
  if 'pmatrix' in p:return matrix(p).det(),'determinant'
  v=[int(x) for x in re.findall(r'\\\((-?\d+)\\\)',p)];return math.prod(v),'eigenvalue_product'
 if '\\operatorname{tr}A' in p:
  if 'pmatrix' in p:return S.trace(matrix(p)),'matrix_trace'
  return sum(int(x) for x in re.findall(r'\\\((-?\d+)\\\)',p)),'eigenvalue_sum'
 if 'entero \\(C\\)' in p:return math.factorial(int(re.search(r't\^(\d+)',p)[1])),'power_laplace'
 if 'abscisa' in p:return coeff(re.search(r'e\^\{(-?\d*)t\}',p)[1]),'exponential_abscissa'
 if 'entero \\(k\\)' in p:return int(re.search(r'F\(s\)=(\d+)/',p)[1]),'inverse_sine'
 if '\\delta' in p:
  m=int(re.search(r'(\d+)y',p)[1]);j=int(re.search(r'=(\d+)\\delta',p)[1]);return S.Rational(j,m),'impulse_jump'
 if 'Y+Cs+D' in p:return -int(re.search(r'y\(0\)=(-?\d+)',p)[1]),'initial_derivative_sign'
 if 'retrasa' in p:return abs(coeff(re.search(r'e\^\{(-?\d*)s\}',p)[1])),'time_delay'
 if 'Ct' in p:return matrix(p)[0,1],'jordan_nilpotent'
 if 'frecuencia angular' in p:return S.sqrt(int(re.search(r'A\^2=-(\d+)I',p)[1])),'oscillator_frequency'
 if 'residencia' in p:
  V,Q=map(int,re.search(r'volumen (\d+) L con salida (\d+)',p).groups());return S.Rational(V,Q),'residence_time'
 raise ValueError('numeric family unhandled')
def mc_expected(q):
 p=q['prompt'];f=q['family'];ans=q['answer']
 if f.startswith('L-MC-EXP'):
  a=coeff(re.search(r'e\^\{(-?\d*)t\}',p)[1]);return S.simplify(expr(ans)-1/(s-a))==0,'laplace_exponential'
 if f.startswith('L-MC-SIN'):
  w=int(re.search(r'\\sin\((\d+)t\)',p)[1]);return S.simplify(expr(ans)-w/(s*s+w*w))==0,'laplace_sine'
 if f.startswith('L-MC-POW'):
  n=int(re.search(r't\^(\d+)',p)[1]);return S.simplify(expr(ans)-S.factorial(n)/s**(n+1))==0,'laplace_power'
 if f.startswith('L-MC-SHIFT'):
  a=coeff(re.search(r'e\^\{(-?\d*)t\}',p)[1]);w=int(re.search(r'\\cos\((\d+)t\)',p)[1]);return S.simplify(expr(ans)-(s-a)/((s-a)**2+w*w))==0,'laplace_shift_sign'
 if f.startswith('L-MC-INV'):
  m=re.search(r'(\d+)/\(s([+-]\d+)\)\^2',p);k=int(m[1]);a=-int(m[2]);return S.simplify(expr(ans)-k*t*S.exp(a*t))==0,'inverse_repeated_pole'
 if f.startswith('P-MC-DER2'):
  y0=int(re.search(r'y\(0\)=(-?\d+)',p)[1]);v0=int(re.search(r"y'\(0\)=(-?\d+)",p)[1]);return S.simplify(expr(ans)-(s*s*Y-s*y0-v0))==0,'initial_conditions_laplace'
 if f.startswith('P-MC-IMP'):
  m=int(re.search(r'(\d+)y',p)[1]);j=int(re.search(r'=(\d+)\\delta',p)[1]);return expr(ans)==S.Rational(j,m),'impulse_jump'
 if f.startswith('P-MC-CONV'):
  factors=re.findall(r'\\\((.*?)\\\)',ans);x,y=map(expr,factors);actual=S.laplace_transform(x,t,s,noconds=True)*S.laplace_transform(y,t,s,noconds=True);n,w2=map(int,re.search(r's\^(\d+)\(s\^2\+(\d+)\)',p).groups());return S.simplify(actual-1/(s**n*(s*s+w2)))==0,'convolution_product'
 if f.startswith('P-MC-PVI'):
  w2=int(re.search(r"y''\+(\d+)y",p)[1]);z=expr(ans);y0=int(re.search(r'y\(0\)=(-?\d+)',p)[1]);v0=int(re.search(r"y'\(0\)=(-?\d+)",p)[1]);return S.simplify(S.diff(z,t,2)+w2*z)==0 and z.subs(t,0)==y0 and S.diff(z,t).subs(t,0)==v0,'ODE_and_initial_conditions'
 if f.startswith('SL-MC-MAT'):return S.simplify(matrix(ans)-(s*S.eye(2)-matrix(p)))==S.zeros(2),'system_laplace_signs'
 if f.startswith('SL-MC-DIAG'):
  a,b=map(int,re.search(r"x'=(-?\d+)x,\\;y'=(-?\d+)y",p).groups());v=vector(ans);return S.simplify(v.diff(t)-S.diag(a,b)*v)==S.zeros(2,1) and v.subs(t,0)==S.Matrix([int(re.search(r'x\(0\)=(-?\d+)',p)[1]),int(re.search(r'y\(0\)=(-?\d+)',p)[1])]),'diagonal_system_solution'
 if f.startswith('SL-MC-IMP'):return vector(ans)==vector(p),'vector_impulse_jump'
 if f.startswith('SL-MC-INT'):return S.simplify(expr(ans)-Y/s)==0,'integral_laplace'
 if f.startswith('H-MC-CLASS'):
  M=matrix(p);ev=M.eigenvals();real=all(S.im(v)==0 for v in ev);neg=all(S.re(v)<0 for v in ev);pos=all(S.re(v)>0 for v in ev)
  if M.det()<0:expected='Punto silla.'
  elif all(S.re(v)==0 and S.im(v)!=0 for v in ev):expected='Centro.'
  elif real:
   improper=len(ev)==1 and M!=list(ev)[0]*S.eye(2);expected=('Nodo impropio ' if improper else 'Nodo ')+('estable.' if neg else 'inestable.')
  else:expected='Espiral '+('estable.' if neg else 'inestable.')
  return ans==expected,'spectral_classification'
 if f.startswith('H-MC-EV'):
  lam=int(re.search(r'\\lambda=(-?\d+)',p)[1]);v=vector(ans);return matrix(p)*v==lam*v and v!=S.zeros(2,1),'eigenvector_equation'
 if f.startswith('H-MC-EXP'):
  a,b=map(int,re.search(r'\\operatorname\{diag\}\((-?\d+),(-?\d+)\)',p).groups());F=matrix(ans);return S.simplify(F.diff(t)-S.diag(a,b)*F)==S.zeros(2) and F.subs(t,0)==S.eye(2),'matrix_exponential_IVP'
 if f.startswith('NH-MC-JORDAN'):
  M=matrix(p);F=matrix(ans)*S.exp(M[0,0]*t);return S.simplify(F.diff(t)-M*F)==S.zeros(2) and F.subs(t,0)==S.eye(2),'jordan_matrix_IVP'
 raise NotImplementedError
for q in sorted(qs,key=lambda x:x['id']):
 try:
  if q['type']=='numeric':expected,method=numeric_expected(q);ok=S.Rational(str(q['answer']))==expected;rows.append({'id':q['id'],'status':'passed' if ok else 'failed','method':method,'expected':str(expected),'reference':q['answer']})
  elif q['sourceType']=='multiple_choice':
   try:ok,method=mc_expected(q);rows.append({'id':q['id'],'status':'passed' if ok else 'failed','method':method})
   except NotImplementedError:pass
 except Exception as e:rows.append({'id':q['id'],'status':'not_checked_parser_limit','reason':str(e)})
# Exact forced-system, modes and partial-fraction certificates independent of the keys.
cert=[]
for a,b in [(1,2),(2,3),(-1,3),(0,4)]:
 F=1/((s+a)*(s+b));apart=S.apart(F,s);cert.append({'name':f'partial_fractions_{a}_{b}','passed':S.cancel(F-apart)==0,'decomposition':str(apart)})
M=S.Matrix([[-1,1],[1,-1]]);cert.append({'name':'closed_two_tanks_conservation','passed':S.ones(1,2)*M==S.zeros(1,2)})
for mode,lam in [(S.Matrix([1,1]),0),(S.Matrix([1,-1]),-2)]:cert.append({'name':'tank_mode_'+str(lam),'passed':M*mode==lam*mode})
z=1-S.exp(-t);cert.append({'name':'step_and_duhamel_graph_IVP','passed':S.simplify(S.diff(z,t)+z-1)==0 and z.subs(t,0)==0})
# Source redundancy is inventoried, not silently erased or relabelled as new questions.
def norm(x):return re.sub(r'\s+',' ',re.sub(r'(?:variante|versión)\s*\d+','',x,flags=re.I)).strip()
groups=collections.defaultdict(list)
for q in qs:groups[norm(q['prompt'])].append(q['id'])
dup=[ids for ids in groups.values() if len(ids)>1]
result={'version':'7.2.1-rc1','tool':'sympy '+S.__version__,'originalQuestions':len(qs),'independentChecksPassed':sum(r['status']=='passed' for r in rows),'failures':[r for r in rows if r['status']=='failed'],'parserLimits':[r for r in rows if r['status']=='not_checked_parser_limit'],'unreviewedByThisIndependentScript':len(qs)-sum(r['status'] in ['passed','failed'] for r in rows),'checks':rows,'symbolicCertificates':cert,'sourceDuplicatePromptGroups':dup,'duplicatePolicy':'Original 500 and answer keys preserved. Repeated labels/variants are not counted as independent new concepts.','scope':'Independent checks for the listed families only; not a proof of mathematical correctness of all 500, graphics or alternative orderings.'}
(ROOT/'validation/MATH_AUDIT_RESULTS.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['checks','sourceDuplicatePromptGroups']},ensure_ascii=False,indent=2));print('duplicate groups:',len(dup))
