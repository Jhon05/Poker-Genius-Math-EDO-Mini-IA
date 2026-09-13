(function(global){
'use strict';
const NS='http://www.w3.org/2000/svg';
let graphSeq=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=v=>{if(!Number.isFinite(v))return '—';const a=Math.abs(v);if(a>=1000||a>0&&a<1e-3)return v.toExponential(2);return String(Math.round(v*1000)/1000);};
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function svgEl(name,attrs={}){const n=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))if(v!==null&&v!==undefined)n.setAttribute(k,String(v));return n;}
function model(spec){
  const p=spec.params||{};
  switch(spec.kind){
    case 'quadraticVertex': return {domain:spec.domain||[0,Math.max(5,p.m+2)],series:[{type:'curve',fn:x=>p.A-p.B*(x-p.m)**2,label:spec.legend?.[0]||'Objetivo'}],markers:[{x:p.m,y:p.A}]};
    case 'policyLine': return {domain:spec.domain||[0,p.xMax||8],series:[{type:'curve',fn:x=>p.k*x,label:spec.legend?.[0]||'Política'}],markers:p.markerX!=null?[{x:p.markerX,y:p.k*p.markerX}]:[]};
    case 'sqrtValue': return {domain:spec.domain||[0,p.xMax||9],series:[{type:'curve',fn:x=>p.A*Math.sqrt(Math.max(0,x)),label:spec.legend?.[0]||'Función valor'}],markers:[]};
    case 'discreteLinear': {const pts=Array.from({length:(p.T??6)+1},(_,t)=>({x:t,y:p.a+p.b*t}));return {domain:[0,p.T??6],series:[{type:'points',points:pts,label:spec.legend?.[0]||'Trayectoria'}],markers:[]};}
    case 'discretePoints': {const pts=(p.values||[]).map((y,x)=>({x,y}));return {domain:[0,Math.max(1,pts.length-1)],series:[{type:'points',points:pts,label:spec.legend?.[0]||'Trayectoria'}],markers:[]};}
    case 'affineMap': {const d=spec.domain||[0,p.xMax||8];const f=x=>p.rho*x+p.b;return {domain:d,series:[{type:'curve',fn:f,label:spec.legend?.[0]||'Dinámica'},{type:'curve',fn:x=>x,label:spec.legend?.[1]||'45°',dash:true}],markers:p.ss!=null?[{x:p.ss,y:p.ss}]:[]};}
    case 'switchLine': {const d=spec.domain||[0,p.xMax||8];const f=x=>p.slope*(x-p.theta);return {domain:d,series:[{type:'curve',fn:f,label:spec.legend?.[0]||'ΔH'}],markers:[{x:p.theta,y:0}]};}
    case 'convexControl': {const d=spec.domain||[0,1],f=x=>p.A+p.B*(x-p.h)**2;return {domain:d,series:[{type:'curve',fn:f,label:spec.legend?.[0]||'Objetivo'}],markers:[{x:0,y:f(0)},{x:1,y:f(1)}]};}
    case 'lineRoot': {const d=spec.domain||[0,p.xMax||8],f=x=>p.a+p.b*x;return {domain:d,series:[{type:'curve',fn:f,label:spec.legend?.[0]||'Residual'}],markers:p.root!=null?[{x:p.root,y:0}]:[]};}
    case 'solowMap': {const d=spec.domain||[0,p.xMax||Math.max(12,(p.ss||4)*1.6)],f=x=>p.c*Math.sqrt(Math.max(0,x))+(1-p.delta)*x;return {domain:d,series:[{type:'curve',fn:f,label:spec.legend?.[0]||'Transición'},{type:'curve',fn:x=>x,label:spec.legend?.[1]||'45°',dash:true}],markers:p.ss!=null?[{x:p.ss,y:p.ss}]:[]};}
    case 'logObjective': {const eps=Math.max(.05,p.x*.02),d=spec.domain||[eps,p.x-eps],f=c=>Math.log(c)+p.gamma*Math.log(p.x-c);return {domain:d,series:[{type:'curve',fn:f,label:spec.legend?.[0]||'Objetivo'}],markers:p.opt!=null?[{x:p.opt,y:f(p.opt)}]:[]};}
    case 'marginalIntersection': {const d=spec.domain||[0,p.xMax||Math.max(6,(p.opt||2)+2)],mb=x=>p.a-p.b*x,mc=x=>p.c+p.d*x;return {domain:d,series:[{type:'curve',fn:mb,label:spec.legend?.[0]||'Beneficio marginal'},{type:'curve',fn:mc,label:spec.legend?.[1]||'Costo marginal',dash:true}],markers:p.opt!=null?[{x:p.opt,y:mb(p.opt)}]:[]};}
    default: return {domain:[0,10],series:[{type:'curve',fn:x=>x,label:'y=x'}],markers:[]};
  }
}
function sampleCurve(fn,a,b,n=220){const pts=[];for(let i=0;i<=n;i++){const x=a+(b-a)*i/n,y=fn(x);if(Number.isFinite(y))pts.push({x,y});}return pts;}
function inferRange(m,spec){if(spec.range)return spec.range.slice();const vals=[];for(const s of m.series){if(s.type==='curve')for(const p of sampleCurve(s.fn,m.domain[0],m.domain[1],120))vals.push(p.y);else for(const p of s.points||[])if(Number.isFinite(p.y))vals.push(p.y);}for(const p of m.markers||[])if(Number.isFinite(p.y))vals.push(p.y);if(!vals.length)return[-1,1];let lo=Math.min(...vals),hi=Math.max(...vals);if(lo===hi){lo-=1;hi+=1;}const pad=(hi-lo)*.12||1;lo-=pad;hi+=pad;if(lo>0&&lo-pad<0)lo=0;if(hi<0&&hi+pad>0)hi=0;return[lo,hi];}
function render(container,spec,opts={}){
  if(!container||!spec)return;
  const mini=!!opts.mini;
  const clipId=`igraph-clip-${++graphSeq}`;
  container.innerHTML='';container.classList.add('igraph-root');if(mini)container.classList.add('igraph-mini');
  const eq=document.createElement('div');eq.className='igraph-equation';eq.innerHTML=esc(spec.latex||'').replace(/\n/g,'<br>');container.appendChild(eq);
  const shell=document.createElement('div');shell.className='igraph-shell';container.appendChild(shell);
  const svg=svgEl('svg',{viewBox:'0 0 800 470',role:'img','aria-label':spec.alt||spec.title||'Gráfica matemática interactiva'});svg.classList.add('igraph-svg');shell.appendChild(svg);
  const badge=document.createElement('div');badge.className='igraph-coord';badge.textContent='x = —   y = —';shell.appendChild(badge);
  const xLab=document.createElement('div');xLab.className='igraph-axis-label igraph-axis-x';xLab.innerHTML=esc(spec.xLabelLatex||'\\(x\\)');shell.appendChild(xLab);
  const yLab=document.createElement('div');yLab.className='igraph-axis-label igraph-axis-y';yLab.innerHTML=esc(spec.yLabelLatex||'\\(y\\)');shell.appendChild(yLab);
  const m=model(spec),initial={x:m.domain.slice(),y:inferRange(m,spec)},view={x:initial.x.slice(),y:initial.y.slice(),grid:true};
  const margin={l:74,r:25,t:25,b:62},W=800,H=470,pw=W-margin.l-margin.r,ph=H-margin.t-margin.b;
  const X=x=>margin.l+(x-view.x[0])/(view.x[1]-view.x[0])*pw,Y=y=>margin.t+(view.y[1]-y)/(view.y[1]-view.y[0])*ph;
  const invX=px=>view.x[0]+(px-margin.l)/pw*(view.x[1]-view.x[0]),invY=py=>view.y[1]-(py-margin.t)/ph*(view.y[1]-view.y[0]);
  function nice(v){const e=Math.floor(Math.log10(Math.max(1e-12,Math.abs(v))));const f=v/10**e;const n=f<1.5?1:f<3?2:f<7?5:10;return n*10**e;}
  function ticks(a,b,n=7){const step=nice((b-a)/n),start=Math.ceil(a/step)*step,out=[];for(let v=start;v<=b+step*1e-9;v+=step)out.push(Math.abs(v)<1e-10?0:v);return out;}
  function pathFrom(points){let d='';let started=false;for(const p of points){if(p.x<view.x[0]-1e-9||p.x>view.x[1]+1e-9||p.y<view.y[0]-10*(view.y[1]-view.y[0])||p.y>view.y[1]+10*(view.y[1]-view.y[0]))continue;d+=(started?'L':'M')+X(p.x).toFixed(2)+','+Y(p.y).toFixed(2);started=true;}return d;}
  function draw(){
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    const defs=svgEl('defs'),clip=svgEl('clipPath',{id:clipId}),clipRect=svgEl('rect',{x:margin.l,y:margin.t,width:pw,height:ph,rx:8});clip.appendChild(clipRect);defs.appendChild(clip);svg.appendChild(defs);
    const bg=svgEl('rect',{x:margin.l,y:margin.t,width:pw,height:ph,rx:8,class:'igraph-bg'});svg.appendChild(bg);
    const xt=ticks(view.x[0],view.x[1]),yt=ticks(view.y[0],view.y[1]);
    if(view.grid){for(const x of xt)svg.appendChild(svgEl('line',{x1:X(x),x2:X(x),y1:margin.t,y2:margin.t+ph,class:'igraph-grid'}));for(const y of yt)svg.appendChild(svgEl('line',{x1:margin.l,x2:margin.l+pw,y1:Y(y),y2:Y(y),class:'igraph-grid'}));}
    const xAxisY=(view.y[0]<=0&&view.y[1]>=0)?Y(0):margin.t+ph;const yAxisX=(view.x[0]<=0&&view.x[1]>=0)?X(0):margin.l;
    svg.appendChild(svgEl('line',{x1:margin.l,x2:margin.l+pw,y1:xAxisY,y2:xAxisY,class:'igraph-axis'}));svg.appendChild(svgEl('line',{x1:yAxisX,x2:yAxisX,y1:margin.t,y2:margin.t+ph,class:'igraph-axis'}));
    for(const x of xt){const tx=svgEl('text',{x:X(x),y:margin.t+ph+24,'text-anchor':'middle',class:'igraph-tick'});tx.textContent=fmt(x);svg.appendChild(tx);}for(const y of yt){const ty=svgEl('text',{x:margin.l-12,y:Y(y)+4,'text-anchor':'end',class:'igraph-tick'});ty.textContent=fmt(y);svg.appendChild(ty);}
    const plotLayer=svgEl('g',{'clip-path':`url(#${clipId})`});svg.appendChild(plotLayer);
    m.series.forEach((s,i)=>{if(s.type==='curve'){const pts=sampleCurve(s.fn,view.x[0],view.x[1],320);plotLayer.appendChild(svgEl('path',{d:pathFrom(pts),class:`igraph-curve series-${i}${s.dash?' dashed':''}`}));}else{const pts=s.points||[];let d='';for(let j=0;j<pts.length;j++){const p=pts[j];if(p.x<view.x[0]||p.x>view.x[1])continue;d+=(d?'L':'M')+X(p.x)+','+Y(p.y);}plotLayer.appendChild(svgEl('path',{d,class:`igraph-discrete-line series-${i}`}));for(const p of pts)if(p.x>=view.x[0]&&p.x<=view.x[1]&&p.y>=view.y[0]&&p.y<=view.y[1])plotLayer.appendChild(svgEl('circle',{cx:X(p.x),cy:Y(p.y),r:5,class:`igraph-point series-${i}`}));}});
    for(const p of m.markers||[])if(p.x>=view.x[0]&&p.x<=view.x[1]&&p.y>=view.y[0]&&p.y<=view.y[1]){plotLayer.appendChild(svgEl('circle',{cx:X(p.x),cy:Y(p.y),r:7,class:'igraph-marker'}));}
    if(!mini){const v=svgEl('line',{x1:0,x2:0,y1:margin.t,y2:margin.t+ph,class:'igraph-crosshair hidden'}),h=svgEl('line',{x1:margin.l,x2:margin.l+pw,y1:0,y2:0,class:'igraph-crosshair hidden'});v.dataset.cross='v';h.dataset.cross='h';svg.appendChild(v);svg.appendChild(h);}
  }
  draw();
  let legend=null;if(spec.legend?.length){legend=document.createElement('div');legend.className='igraph-legend';legend.innerHTML=spec.legend.map((l,i)=>`<span class="legend-${i}"><i></i>${esc(l)}</span>`).join('');container.appendChild(legend);}
  if(!mini){
    const tools=document.createElement('div');tools.className='igraph-tools';tools.innerHTML='<button type="button" data-act="zin">＋</button><button type="button" data-act="zout">−</button><button type="button" data-act="reset">100%</button><button type="button" data-act="grid">Cuadrícula</button><button type="button" data-act="tikz">TikZ</button><span>Rueda: zoom · arrastra: desplazar · cursor: coordenadas</span>';container.appendChild(tools);
    const tikz=document.createElement('div');tikz.className='igraph-tikz hidden';tikz.innerHTML='<b>Código TikZ/PGFPlots parametrizado (vista docente)</b><pre></pre>';tikz.querySelector('pre').textContent=spec.tikz||'% TikZ no disponible';container.appendChild(tikz);
    function zoom(f,cx=(view.x[0]+view.x[1])/2,cy=(view.y[0]+view.y[1])/2){const hx=(view.x[1]-view.x[0])*f/2,hy=(view.y[1]-view.y[0])*f/2;view.x=[cx-hx,cx+hx];view.y=[cy-hy,cy+hy];draw();}
    tools.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.act;if(!a)return;if(a==='zin')zoom(.8);if(a==='zout')zoom(1.25);if(a==='reset'){view.x=initial.x.slice();view.y=initial.y.slice();draw();}if(a==='grid'){view.grid=!view.grid;draw();}if(a==='tikz')tikz.classList.toggle('hidden');});
    let drag=null;
    svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H,cx=invX(px),cy=invY(py);zoom(e.deltaY<0?.86:1.16,cx,cy);},{passive:false});
    svg.addEventListener('pointerdown',e=>{const r=svg.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,vx:view.x.slice(),vy:view.y.slice(),rw:r.width,rh:r.height};svg.setPointerCapture?.(e.pointerId);});
    svg.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H;if(px>=margin.l&&px<=margin.l+pw&&py>=margin.t&&py<=margin.t+ph){badge.textContent=`x = ${fmt(invX(px))}   y = ${fmt(invY(py))}`;const v=svg.querySelector('[data-cross="v"]'),h=svg.querySelector('[data-cross="h"]');if(v&&h){v.classList.remove('hidden');h.classList.remove('hidden');v.setAttribute('x1',px);v.setAttribute('x2',px);h.setAttribute('y1',py);h.setAttribute('y2',py);}}if(drag){const dx=(e.clientX-drag.x)/drag.rw*W,dy=(e.clientY-drag.y)/drag.rh*H,rx=(drag.vx[1]-drag.vx[0]),ry=(drag.vy[1]-drag.vy[0]);view.x=[drag.vx[0]-dx/pw*rx,drag.vx[1]-dx/pw*rx];view.y=[drag.vy[0]+dy/ph*ry,drag.vy[1]+dy/ph*ry];draw();}});
    const end=()=>{drag=null;};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('pointerleave',()=>{if(!drag){const v=svg.querySelector('[data-cross="v"]'),h=svg.querySelector('[data-cross="h"]');v?.classList.add('hidden');h?.classList.add('hidden');}});
  }
  if(!mini&&global.MathJax?.typesetPromise)requestAnimationFrame(()=>global.MathJax.typesetPromise([container]).catch(()=>{}));
}
global.ECOMAT_GRAPHS={render,model,fmt};
})(window);
