(()=>{
'use strict'; const G=window.GeniusMath;
const C={
  "laplace_definition": {
    "id": "laplace_definition",
    "title": "Definición de Laplace",
    "latex": "F(s)=\\mathcal L\\{f\\}(s)=\\int_0^\\infty e^{-st}f(t)\\,dt",
    "conditions": "Cuando la integral impropia converge. Orden exponencial y continuidad seccional son condiciones suficientes en un semiplano."
  },
  "laplace_linearity": {
    "id": "laplace_linearity",
    "title": "Linealidad",
    "latex": "\\mathcal L\\{\\alpha f+\\beta g\\}=\\alpha F+\\beta G",
    "conditions": "En un semiplano común de convergencia."
  },
  "laplace_exp": {
    "id": "laplace_exp",
    "title": "Exponencial",
    "latex": "\\mathcal L\\{e^{at}\\}=\\frac1{s-a}",
    "conditions": "Para a real, Re(s)>a."
  },
  "laplace_power": {
    "id": "laplace_power",
    "title": "Potencias",
    "latex": "\\mathcal L\\{t^n\\}=\\frac{n!}{s^{n+1}}",
    "conditions": "n entero no negativo y Re(s)>0."
  },
  "laplace_sin": {
    "id": "laplace_sin",
    "title": "Seno",
    "latex": "\\mathcal L\\{\\sin(bt)\\}=\\frac{b}{s^2+b^2}",
    "conditions": "b real; Re(s)>0 es suficiente."
  },
  "laplace_cos": {
    "id": "laplace_cos",
    "title": "Coseno",
    "latex": "\\mathcal L\\{\\cos(bt)\\}=\\frac{s}{s^2+b^2}",
    "conditions": "b real y Re(s)>0."
  },
  "laplace_cosh": {
    "id": "laplace_cosh",
    "title": "Coseno hiperbólico",
    "latex": "\\mathcal L\\{\\cosh(bt)\\}=\\frac{s}{s^2-b^2}",
    "conditions": "b real y Re(s)>|b|."
  },
  "shift_s": {
    "id": "shift_s",
    "title": "Traslación en s",
    "latex": "\\mathcal L\\{e^{at}f(t)\\}(s)=F(s-a)",
    "conditions": "Si F converge en Re(s)>c, la expresión trasladada converge en Re(s)>c+a para a real."
  },
  "shift_derivation": {
    "id": "shift_derivation",
    "title": "Origen del signo de la traslación",
    "latex": "\\int_0^\\infty e^{-st}e^{at}f(t)\\,dt=\\int_0^\\infty e^{-(s-a)t}f(t)\\,dt=F(s-a)",
    "conditions": "En el semiplano donde converge la integral; -st+at=-(s-a)t."
  },
  "time_multiply": {
    "id": "time_multiply",
    "title": "Multiplicación por t",
    "latex": "\\mathcal L\\{t f(t)\\}=-F\\prime(s)",
    "conditions": "Donde se justifica derivar bajo la integral, por ejemplo dentro del semiplano de convergencia para f de orden exponencial."
  },
  "laplace_integral": {
    "id": "laplace_integral",
    "title": "Integral temporal",
    "latex": "\\mathcal L\\left\\{\\int_0^t f(\\tau)\\,d\\tau\\right\\}=\\frac{F(s)}s",
    "conditions": "En un semiplano común de convergencia, s no nulo."
  },
  "inverse_repeated": {
    "id": "inverse_repeated",
    "title": "Polo repetido",
    "latex": "\\mathcal L^{-1}\\left\\{\\frac{1}{(s-a)^m}\\right\\}=\\frac{t^{m-1}}{(m-1)!}e^{at}",
    "conditions": "m entero positivo."
  },
  "derivative_first": {
    "id": "derivative_first",
    "title": "Primera derivada",
    "latex": "\\mathcal L\\{y\\prime\\}=sY(s)-y(0^+)",
    "conditions": "Hipótesis de regularidad y crecimiento que permiten integrar por partes."
  },
  "derivative_second": {
    "id": "derivative_second",
    "title": "Segunda derivada",
    "latex": "\\mathcal L\\{y\\prime\\prime\\}=s^2Y(s)-s y(0^+)-y\\prime(0^+)",
    "conditions": "Derivadas con crecimiento adecuado; convención unilateral."
  },
  "shift_t": {
    "id": "shift_t",
    "title": "Retraso temporal",
    "latex": "\\mathcal L\\{u(t-a)f(t-a)\\}=e^{-as}F(s)",
    "conditions": "a no negativo; las funciones se interpretan causalmente."
  },
  "impulse": {
    "id": "impulse",
    "title": "Impulso de Dirac",
    "latex": "\\mathcal L\\{\\delta(t-a)\\}=e^{-as}",
    "conditions": "a no negativo, con convención causal unilateral en el origen."
  },
  "impulse_jump": {
    "id": "impulse_jump",
    "title": "Salto en un oscilador",
    "latex": "m\\,[y\\prime]_{a^-}^{a^+}=J,\\qquad [y]_{a^-}^{a^+}=0",
    "conditions": "Para m y c,k constantes, m>0, impulso Jδ(t-a), y sin otros términos singulares. Se obtiene integrando alrededor de a."
  },
  "vector_jump": {
    "id": "vector_jump",
    "title": "Salto de estado",
    "latex": "[X]_{a^-}^{a^+}=b",
    "conditions": "Sistema X′=AX+g+bδ(t-a), A acotada localmente y g integrable localmente; evento aislado."
  },
  "convolution": {
    "id": "convolution",
    "title": "Convolución causal",
    "latex": "(f*g)(t)=\\int_0^t f(\\tau)g(t-\\tau)\\,d\\tau,\\qquad \\mathcal L\\{f*g\\}=F(s)G(s)",
    "conditions": "Existencia de las integrales y un semiplano común de convergencia."
  },
  "periodic": {
    "id": "periodic",
    "title": "Laplace de una señal periódica",
    "latex": "\\mathcal L\\{f\\}(s)=\\frac{\\int_0^T e^{-st}f(t)\\,dt}{1-e^{-sT}}",
    "conditions": "f periódica de período T>0, integrable sobre un período; Re(s)>0 es suficiente."
  },
  "partial_fractions": {
    "id": "partial_fractions",
    "title": "Fracciones parciales: estructura",
    "latex": "\\frac{P(s)}{(s-a)^2(s-b)}=\\frac{A}{s-a}+\\frac{B}{(s-a)^2}+\\frac{C}{s-b}",
    "conditions": "P de grado menor que 3 y a distinto de b. Multiplicar por el denominador y comparar coeficientes; si es impropia, dividir primero."
  },
  "system_laplace": {
    "id": "system_laplace",
    "title": "Sistema transformado",
    "latex": "(sI-A)\\widehat X(s)=X(0^+)+\\widehat g(s)",
    "conditions": "A matriz constante, X′=AX+g. Invertir sI-A solo fuera de su espectro y dentro del semiplano de convergencia."
  },
  "spectrum": {
    "id": "spectrum",
    "title": "Valores y vectores propios",
    "latex": "\\det(A-\\lambda I)=0,\\qquad Av=\\lambda v,\\quad v\\ne0",
    "conditions": "A matriz cuadrada."
  },
  "trace_det": {
    "id": "trace_det",
    "title": "Traza y determinante en dimensión dos",
    "latex": "\\lambda_1+\\lambda_2=\\operatorname{tr}A,\\qquad\\lambda_1\\lambda_2=\\det A",
    "conditions": "Autovalores contados con multiplicidad algebraica."
  },
  "exp_matrix": {
    "id": "exp_matrix",
    "title": "Matriz exponencial",
    "latex": "X(t)=e^{At}X(0),\\qquad \\frac{d}{dt}e^{At}=Ae^{At}",
    "conditions": "Sistema homogéneo con A constante."
  },
  "fundamental": {
    "id": "fundamental",
    "title": "Matriz fundamental",
    "latex": "\\Phi\\prime(t)=A(t)\\Phi(t),\\qquad \\det\\Phi(t)\\ne0",
    "conditions": "Columnas linealmente independientes; coeficientes continuos en el intervalo."
  },
  "liouville": {
    "id": "liouville",
    "title": "Fórmula de Liouville",
    "latex": "W(t)=W(t_0)\\exp\\left(\\int_{t_0}^t\\operatorname{tr}A(\\tau)\\,d\\tau\\right)",
    "conditions": "W=det Φ para un sistema lineal de primer orden con A continua."
  },
  "duhamel": {
    "id": "duhamel",
    "title": "Fórmula de Duhamel",
    "latex": "X(t)=e^{At}X(0)+\\int_0^t e^{A(t-\\tau)}g(\\tau)\\,d\\tau",
    "conditions": "A constante; g localmente integrable. Convención causal para impulsos."
  },
  "variation": {
    "id": "variation",
    "title": "Variación de parámetros",
    "latex": "X(t)=\\Phi(t)\\left[\\Phi(t_0)^{-1}X(t_0)+\\int_{t_0}^t\\Phi(\\tau)^{-1}g(\\tau)\\,d\\tau\\right]",
    "conditions": "Φ es una matriz fundamental invertible de X′=A(t)X."
  },
  "equilibrium": {
    "id": "equilibrium",
    "title": "Particular constante",
    "latex": "X_p=-A^{-1}b",
    "conditions": "X′=AX+b, con b constante y A invertible. Si A es singular se resuelve AXp=-b y se comprueba compatibilidad."
  },
  "jordan": {
    "id": "jordan",
    "title": "Bloque de Jordan de índice dos",
    "latex": "e^{(\\lambda I+N)t}=e^{\\lambda t}(I+tN)",
    "conditions": "N²=0; λI y N conmutan."
  },
  "osc_matrix": {
    "id": "osc_matrix",
    "title": "Exponencial de una matriz oscilatoria",
    "latex": "e^{At}=I\\cos(\\omega t)+\\frac{A}{\\omega}\\sin(\\omega t)",
    "conditions": "A²=-ω²I, ω>0."
  },
  "balance": {
    "id": "balance",
    "title": "Balance de cantidad",
    "latex": "\\frac{dx_i}{dt}=\\sum_j q_{ji}\\frac{x_j}{V_j}-\\sum_jq_{ij}\\frac{x_i}{V_i}+\\text{aporte externo}-\\text{eliminación}",
    "conditions": "Mezcla perfecta y flujos coherentes con los volúmenes. Si cambia V debe modelarse también."
  },
  "conservation": {
    "id": "conservation",
    "title": "Conservación de masa",
    "latex": "\\frac{d}{dt}\\left(\\mathbf 1^T X\\right)=\\mathbf 1^TAX,\\qquad \\mathbf1^TA=0",
    "conditions": "Sistema homogéneo cerrado; la última condición equivale a suma nula de cada columna."
  },
  "residence": {
    "id": "residence",
    "title": "Tiempo de residencia ideal",
    "latex": "\\tau=\\frac{V}{q}",
    "conditions": "Volumen constante V>0 y caudal q>0; unidades de tiempo."
  },
  "mechanics": {
    "id": "mechanics",
    "title": "Sistema mecánico lineal",
    "latex": "Mx\\prime\\prime+Cx\\prime+Kx=F(t)",
    "conditions": "Matrices de masa, amortiguamiento y rigidez. Para disipación, C semidefinida positiva; estabilidad requiere hipótesis adicionales."
  },
  "modes": {
    "id": "modes",
    "title": "Modos normales sin amortiguamiento",
    "latex": "Kv=\\omega^2 Mv",
    "conditions": "M definida positiva y K simétrica en el modelo mecánico conservativo."
  },
  "rlc": {
    "id": "rlc",
    "title": "Circuito RLC en serie",
    "latex": "Lq\\prime\\prime+Rq\\prime+\\frac qC=E(t),\\qquad i=q\\prime",
    "conditions": "L,C positivos; q es carga y E es voltaje aplicado. No confundir q con caudal de un tanque."
  }
};
G.FormulaCatalog={all:()=>Object.values(C),get:id=>C[id]||null,expand(text,allowed){const set=new Set(allowed||[]);return String(text||'').replace(/\[\[formula:([a-z_]+)\]\]/g,(_,id)=>{if(!set.has(id)||!C[id])throw Error('Fórmula no autorizada');return `\\[${C[id].latex}\\]\n${C[id].conditions}`})}};
})();
