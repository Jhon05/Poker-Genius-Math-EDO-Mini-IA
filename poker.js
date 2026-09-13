(()=>{
'use strict';
const RANKS='23456789TJQKA';
const SUITS='SHDC';
const SUIT_SYMBOL={S:'♠',H:'♥',D:'♦',C:'♣'};
const SUIT_NAME={S:'picas',H:'corazones',D:'diamantes',C:'tréboles'};
const RANK_VALUE=Object.fromEntries([...RANKS].map((r,i)=>[r,i+2]));
const VALUE_RANK=Object.fromEntries([...RANKS].map((r,i)=>[i+2,r]));
function createDeck(){const d=[];for(const s of SUITS)for(const r of RANKS)d.push(r+s);return d;}
function rankValue(card){return RANK_VALUE[card[0]]||0;}
function suit(card){return card[1];}
function label(card){const r=card[0]==='T'?'10':card[0];return `${r}${SUIT_SYMBOL[card[1]]||''}`;}
function longLabel(card){const map={A:'As',K:'Rey',Q:'Reina',J:'Jota',T:'10'};return `${map[card[0]]||card[0]} de ${SUIT_NAME[card[1]]||card[1]}`;}
function shuffle(arr,rng=Math.random){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function straightHigh(values){const u=[...new Set(values)].sort((a,b)=>b-a);if(u.includes(14))u.push(1);for(let i=0;i<=u.length-5;i++){let ok=true;for(let k=1;k<5;k++)if(u[i+k]!==u[i]-k){ok=false;break;}if(ok)return u[i];}return 0;}
function evaluate5(cards){if(!Array.isArray(cards)||cards.length!==5)throw new Error('evaluate5 requiere 5 cartas');
 const vals=cards.map(rankValue).sort((a,b)=>b-a), suits=cards.map(suit), flush=suits.every(s=>s===suits[0]), sh=straightHigh(vals);
 const counts=new Map();for(const v of vals)counts.set(v,(counts.get(v)||0)+1);
 const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 let category,tiebreak,name;
 if(flush&&sh){category=8;tiebreak=[sh];name=sh===14?'Escalera real':'Escalera de color';}
 else if(groups[0][1]===4){category=7;tiebreak=[groups[0][0],groups.find(g=>g[1]===1)[0]];name='Póker';}
 else if(groups[0][1]===3&&groups[1]?.[1]===2){category=6;tiebreak=[groups[0][0],groups[1][0]];name='Full house';}
 else if(flush){category=5;tiebreak=[...vals];name='Color';}
 else if(sh){category=4;tiebreak=[sh];name='Escalera';}
 else if(groups[0][1]===3){category=3;tiebreak=[groups[0][0],...groups.filter(g=>g[1]===1).map(g=>g[0]).sort((a,b)=>b-a)];name='Trío';}
 else if(groups[0][1]===2&&groups[1]?.[1]===2){const pairs=groups.filter(g=>g[1]===2).map(g=>g[0]).sort((a,b)=>b-a);const kicker=groups.find(g=>g[1]===1)[0];category=2;tiebreak=[pairs[0],pairs[1],kicker];name='Doble pareja';}
 else if(groups[0][1]===2){const p=groups[0][0],ks=groups.filter(g=>g[1]===1).map(g=>g[0]).sort((a,b)=>b-a);category=1;tiebreak=[p,...ks];name='Pareja';}
 else{category=0;tiebreak=[...vals];name='Carta alta';}
 return{category,tiebreak,name,cards:[...cards]};
}
function cmpEval(a,b){if(a.category!==b.category)return a.category>b.category?1:-1;const n=Math.max(a.tiebreak.length,b.tiebreak.length);for(let i=0;i<n;i++){const x=a.tiebreak[i]||0,y=b.tiebreak[i]||0;if(x!==y)return x>y?1:-1;}return 0;}
function combos5(cards){const out=[];const n=cards.length;for(let a=0;a<n-4;a++)for(let b=a+1;b<n-3;b++)for(let c=b+1;c<n-2;c++)for(let d=c+1;d<n-1;d++)for(let e=d+1;e<n;e++)out.push([cards[a],cards[b],cards[c],cards[d],cards[e]]);return out;}
function bestOf(cards){if(cards.length<5)throw new Error('bestOf requiere al menos 5 cartas');let best=null;for(const c of combos5(cards)){const ev=evaluate5(c);if(!best||cmpEval(ev,best)>0)best=ev;}return best;}
function compareHands(holeA,holeB,board){const a=bestOf([...holeA,...board]);const b=bestOf([...holeB,...board]);return{cmp:cmpEval(a,b),a,b};}
function describeEval(ev){const r=v=>VALUE_RANK[v]==='T'?'10':(VALUE_RANK[v]||v);switch(ev.category){case 8:return ev.tiebreak[0]===14?'Escalera real':`Escalera de color hasta ${r(ev.tiebreak[0])}`;case 7:return `Póker de ${r(ev.tiebreak[0])}`;case 6:return `Full house: ${r(ev.tiebreak[0])} sobre ${r(ev.tiebreak[1])}`;case 5:return `Color, carta alta ${r(ev.tiebreak[0])}`;case 4:return `Escalera hasta ${r(ev.tiebreak[0])}`;case 3:return `Trío de ${r(ev.tiebreak[0])}`;case 2:return `Doble pareja ${r(ev.tiebreak[0])}-${r(ev.tiebreak[1])}`;case 1:return `Pareja de ${r(ev.tiebreak[0])}`;default:return `Carta alta ${r(ev.tiebreak[0])}`;}}
function sampleWithoutReplacement(arr,n,rng=Math.random){const a=[...arr];for(let i=0;i<n;i++){const j=i+Math.floor(rng()*(a.length-i));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n);}
/* Equity epistemicamente limpia: SOLO recibe cartas propias de la Mesa y comunitarias públicas.
   No usa ni elimina las cartas privadas reales del estudiante. */
 function estimateDealerEquity(dealerHole,board,samples=260,rng=Math.random){const known=new Set([...dealerHole,...board]);const pool=createDeck().filter(c=>!known.has(c));const needBoard=5-board.length;let w=0,t=0;const take=2+needBoard;for(let i=0;i<samples;i++){const s=sampleWithoutReplacement(pool,take,rng),opp=s.slice(0,2),future=s.slice(2),fullBoard=[...board,...future];const r=compareHands(dealerHole,opp,fullBoard).cmp;if(r>0)w++;else if(r===0)t++;}return (w+0.5*t)/samples;}
const api={RANKS,SUITS,SUIT_SYMBOL,createDeck,shuffle,label,longLabel,evaluate5,bestOf,compareHands,cmpEval,describeEval,estimateDealerEquity,rankValue};
if(typeof window!=='undefined')window.PokerEngine=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
