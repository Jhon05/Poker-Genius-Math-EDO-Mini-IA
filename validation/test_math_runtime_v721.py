"""Supplementary exact EDO certificates. These are not new bank questions or LLM answers."""
from pathlib import Path
import json
import sympy as S
R=Path(__file__).resolve().parents[1];t=S.symbols('t',positive=True);s=S.symbols('s',positive=True);r,a,b=S.symbols('r a b',real=True);rows=[]
def test(name,condition,scope):rows.append({'name':name,'passed':bool(condition),'scope':scope})
def eq(x):return S.simplify(x)==0
for y in [S.exp(-2*t),3*S.exp(-2*t)]:test('linear_first_order_'+str(y),eq(S.diff(y,t)+2*y),'first_order')
y=S.Rational(1,2)+3*S.exp(-t*t);test('variable_coefficient_integrating_factor',eq(S.diff(y,t)+2*t*y-t),'first_order')
for y in [S.exp(t),S.exp(2*t)]:test('distinct_characteristic_roots_'+str(y),eq(S.diff(y,t,2)-3*S.diff(y,t)+2*y),'second_order')
for y in [S.exp(-t),t*S.exp(-t)]:test('repeated_root_'+str(y),eq(S.diff(y,t,2)+2*S.diff(y,t)+y),'second_order')
for y in [S.exp(-t)*S.cos(2*t),S.exp(-t)*S.sin(2*t)]:test('complex_roots_'+str(y),eq(S.diff(y,t,2)+2*S.diff(y,t)+5*y),'second_order')
y=t**r;test('Cauchy_Euler_indicial_identity',eq((t*t*S.diff(y,t,2)+a*t*S.diff(y,t)+b*y)/y-(r*(r-1)+a*r+b)),'Cauchy_Euler_t_positive')
for y in [t,t*S.log(t)]:test('Cauchy_Euler_repeated_root_'+str(y),eq(t*t*S.diff(y,t,2)-t*S.diff(y,t)+y),'Cauchy_Euler_t_positive')
for y,F in [(S.exp(2*t)*S.cos(3*t),(s-2)/((s-2)**2+9)),(t*t,2/s**3),(S.Heaviside(t-2)*(t-2),S.exp(-2*s)/s**2),(S.DiracDelta(t-3),S.exp(-3*s))]:
 test('Laplace_'+str(y),eq(S.laplace_transform(y,t,s,noconds=True)-F),'Laplace_region_of_convergence_required')
y=S.exp(2*t)*S.cos(3*t);Y=S.laplace_transform(y,t,s,noconds=True);test('Laplace_second_derivative_initial_signs',eq(S.laplace_transform(S.diff(y,t,2),t,s,noconds=True)-(s*s*Y-s*y.subs(t,0)-S.diff(y,t).subs(t,0))),'initial_conditions')
F=1/((s+1)**2*(s+2));y=S.exp(-2*t)+(t-1)*S.exp(-t);test('partial_fraction_repeated_pole_inverse',eq(S.laplace_transform(y,t,s,noconds=True)-F),'partial_fractions_and_inverse')
for A in [S.Matrix([[-1,1],[0,-1]]),S.Matrix([[0,-1],[1,0]]),S.diag(-1,-2)]:
 E=(t*A).exp();test('matrix_exponential_IVP_'+str(A),S.simplify(E.diff(t)-A*E)==S.zeros(2) and E.subs(t,0)==S.eye(2),'systems')
for A,expected in [(S.diag(-1,-2),'stable'),(S.diag(-1,2),'saddle'),(S.Matrix([[0,-1],[1,0]]),'center')]:
 vals=list(A.eigenvals());actual='saddle' if A.det()<0 else 'stable' if all(S.re(v)<0 for v in vals) else 'center' if all(S.re(v)==0 and S.im(v)!=0 for v in vals) else 'other';test('spectral_classification_'+expected,actual==expected,'linear_system_stability')
out={'version':'7.2.2-safe-audited','tool':'sympy '+S.__version__,'kind':'EXACT_SYMBOLIC_CERTIFICATES_NOT_LLM','executed':True,'liveInferenceExecuted':False,'total':len(rows),'passed':sum(x['passed'] for x in rows),'failed':[x for x in rows if not x['passed']],'results':rows,'limitations':'These supplementary certificates do not independently certify all 500 questions, graphics or all alternative orderings. No bank content changed.'}
(R/'validation/MATHEMATICAL_REGRESSION_V721.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in out.items() if k!='results'},ensure_ascii=False,indent=2));raise SystemExit(bool(out['failed']))
