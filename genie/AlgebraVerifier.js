/* Exact rational-polynomial algebra, NOT a general symbolic EDO solver.
   No eval/new Function, sampling, or LLM verdict. Unsupported syntax => unknown. */
(()=>{'use strict';const G=window.GeniusMath;const MAX_TERMS=96;
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t}return a||1n};
const rat=(n,d=1n)=>{if(n.toString().length>1200||d.toString().length>1200)throw Error('coefficient_limit');if(d===0n)throw Error('division_by_zero');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return[n/g,d/g]};
const add=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>rat(a[0]*b[0],a[1]*b[1]),neg=a=>[-a[0],a[1]],eq=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const cpoly=n=>new Map(n[0]!==0n?[['',n]]:[]),one=()=>cpoly(rat(1n));
function monomial(a,b){const d={};for(const k of [a,b])for(const x of k.split(',').filter(Boolean)){const [v,e]=x.split(':');d[v]=(d[v]||0)+Number(e)}if(Object.values(d).reduce((a,b)=>a+b,0)>12)throw Error('degree_limit');return Object.keys(d).sort().map(v=>`${v}:${d[v]}`).join(',')}
function padd(a,b){const c=new Map(a);for(const [k,v]of b){const n=add(c.get(k)||rat(0n),v);if(n[0])c.set(k,n);else c.delete(k)}if(c.size>MAX_TERMS)throw Error('term_limit');return c}
function pneg(a){return new Map([...a].map(([k,v])=>[k,neg(v)]))}
function pmul(a,b){let c=new Map();for(const [ka,va]of a)for(const [kb,vb]of b)c=padd(c,new Map([[monomial(ka,kb),mul(va,vb)]]));return c}
function peq(a,b){return a.size===b.size&&[...a].every(([k,v])=>b.has(k)&&eq(v,b.get(k)))}
const frac=p=>({n:p,d:one()}),zero=()=>frac(new Map());
function fadd(a,b){return{n:padd(pmul(a.n,b.d),pmul(b.n,a.d)),d:pmul(a.d,b.d)}}
function fmul(a,b){return{n:pmul(a.n,b.n),d:pmul(a.d,b.d)}}
function fdiv(a,b){if(!b.n.size)throw Error('division_by_zero');return{n:pmul(a.n,b.d),d:pmul(a.d,b.n)}}
function fpow(a,n){if(n===0&&!a.n.size)throw Error('undefined_zero_power');if(Math.abs(n)>8)throw Error('power_limit');if(n<0)return fpow(fdiv(frac(one()),a),-n);let r=frac(one());for(let i=0;i<n;i++)r=fmul(r,a);return r}
function normalize(s){s=String(s).trim().replace(/\\\(|\\\)|\\\[|\\\]/g,'').replace(/\\left|\\right/g,'').replace(/\\cdot|\\times/g,'*').replace(/[−–]/g,'-');
 // Balanced LaTeX fractions, not a regex guess at nested braces.
 function braced(str,start){if(str[start]!=='{')throw Error('latex_fraction');let depth=1,i=start+1;for(;i<str.length&&depth;i++){if(str[i]==='{')depth++;if(str[i]==='}')depth--}if(depth)throw Error('latex_braces');return[str.slice(start+1,i-1),i]}
 let guard=0;while(s.includes('\\frac')){if(++guard>16)throw Error('fraction_limit');const i=s.lastIndexOf('\\frac');let k=i+5;while(s[k]===' ')k++;const [a,end]=braced(s,k);k=end;while(s[k]===' ')k++;const [b,end2]=braced(s,k);s=s.slice(0,i)+`((${a})/(${b}))`+s.slice(end2)}
 return s.replace(/[{}]/g,m=>m==='{'?'(':')');}
function parse(source){const s=normalize(source);if(s.length>600||!/^[0-9a-zA-Z+*/^().\s-]+$/.test(s))throw Error('unsupported_syntax');
 const raw=s.match(/\d+(?:\.\d+)?|[a-zA-Z]+|[+*/^().-]/g)||[];let tokens=[];
 for(let i=0;i<raw.length;i++){const t=raw[i];if(/^[a-zA-Z]+$/.test(t)&&t.length!==1)throw Error('unsupported_function');const prev=raw[i-1];if(i&&(/^[a-zA-Z0-9]/.test(t)||t==='(')&&(/^[a-zA-Z0-9]/.test(prev)||prev===')'))tokens.push('*');tokens.push(t)}let i=0;
 function atom(){const t=tokens[i++];if(t==='('){const v=expr();if(tokens[i++]!==')')throw Error('parentheses');return v}if(/^\d/.test(t||'')){const [a,b='']=t.split('.');return frac(cpoly(rat(BigInt(a+b),10n**BigInt(b.length))))}if(/^[a-zA-Z]$/.test(t||''))return frac(new Map([[t+':1',rat(1n)]]));throw Error('token')}
 function power(){let a=atom();if(tokens[i]==='^'){i++;let sign=1;if(tokens[i]==='-'){sign=-1;i++}else if(tokens[i]==='+')i++;let wrap=false;if(tokens[i]==='('){wrap=true;i++;if(tokens[i]==='-'){sign=-1;i++}}const n=tokens[i++];if(!/^\d+$/.test(n||''))throw Error('integer_exponent');if(wrap&&tokens[i++]!==')')throw Error('integer_exponent');a=fpow(a,sign*Number(n))}return a}
 function unary(){if(tokens[i]==='+'){i++;return unary()}if(tokens[i]==='-'){i++;const a=unary();return{n:pneg(a.n),d:a.d}}return power()}
 function term(){let a=unary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=unary();a=op==='*'?fmul(a,b):fdiv(a,b)}return a}
 function expr(){let a=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=term();a=fadd(a,op==='+'?b:{n:pneg(b.n),d:b.d})}return a}
 const out=expr();if(i!==tokens.length||!out.d.size)throw Error('incomplete_expression');return out;
}
function identity(left,right){try{const a=parse(left),b=parse(right);return{status:peq(pmul(a.n,b.d),pmul(b.n,a.d))?'verified':'not_identity',scope:'rational_identity',conditions:'Solo donde están definidos ambos miembros; no certifica que se haya planteado correctamente la EDO.',method:'exact_rational_polynomial'}}catch(e){return{status:'unknown',scope:'unsupported',reason:e.message,method:'exact_rational_polynomial'}}}
function residual(s){const xs=s.split('=');if(xs.length!==2)throw Error('one_equality_required');const a=parse(xs[0]),b=parse(xs[1]);return fadd(a,{n:pneg(b.n),d:b.d})}
function proportional(a,b){if(a.size!==b.size||!a.size)return !a.size&&!b.size;const [k,v]=a.entries().next().value;if(!b.has(k))return false;const ratio=rat(v[0]*b.get(k)[1],v[1]*b.get(k)[0]);return [...a].every(([j,c])=>b.has(j)&&eq(c,mul(b.get(j),ratio)))}
function witness(a,b){const vars=new Set();for(const p of [a.n,b.n,a.d,b.d])for(const key of p.keys())for(const t of key.split(',').filter(Boolean))vars.add(t.split(':')[0]);const vs=[...vars];if(vs.length>3)return null;const values=[0,1,-1,2,-2,3,-3];function value(p,env){let total=rat(0n);for(const [key,coef]of p){let v=coef;for(const t of key.split(',').filter(Boolean)){const [x,k]=t.split(':');v=mul(v,rat(BigInt(env[x])**BigInt(k)))}total=add(total,v)}return total[0]===0n}function seek(i,env){if(i===vs.length){if(value(a.d,env)||value(b.d,env))return null;return value(a.n,env)!==value(b.n,env)?{...env}:null}for(const v of values){env[vs[i]]=v;const w=seek(i+1,env);if(w)return w}return null}return seek(0,{})}
function equations(before,after){try{const a=residual(before),b=residual(after);if(!peq(a.d,b.d)&&(!peq(a.d,one())||!peq(b.d,one())))return{status:'unknown',reason:'changed_domain',scope:'equation_equivalence'};if(proportional(a.n,b.n))return{status:'verified',scope:'equation_equivalence',method:'exact_nonzero_constant_multiple'};const w=witness(a,b);return w?{status:'not_equivalent',scope:'equation_equivalence',method:'exact_counterexample',counterexample:w}:{status:'unknown',scope:'equation_equivalence',reason:'not_certified_by_constant_multiple'};}catch(e){return{status:'unknown',scope:'unsupported',reason:e.message}}}
function work(text){const lines=String(text).split(/\n|;/).map(x=>x.trim()).filter(Boolean);if(!lines.length||lines.length>16)return{status:'unknown',reason:'work_length'};
 const checked=[];if(lines.length===1){const parts=lines[0].split('=');if(parts.length<2)return{status:'unknown',reason:'no_equality'};for(let i=1;i<parts.length;i++){const r=identity(parts[i-1],parts[i]);checked.push(r);if(r.status!=='verified')return{...r,firstUnverifiedStep:i,checked}}}
 else for(let i=1;i<lines.length;i++){const r=equations(lines[i-1],lines[i]);checked.push(r);if(r.status!=='verified')return{...r,firstUnverifiedStep:i+1,checked}};
 return{status:'verified',scope:lines.length===1?'rational_identity':'equation_equivalence',checked,method:'exact_algebra',conditions:'Se comprueba álgebra, no la pertinencia del modelo diferencial ni condiciones iniciales.'};}
G.AlgebraVerifier={identity,equations,work};})();
