(()=>{
'use strict';
const PASSING_GRADE_5=3.0,MAX_SUSPEND_BYTES=3800;
function utf8Length(s){try{return new TextEncoder().encode(String(s||'')).length}catch(_){try{return unescape(encodeURIComponent(String(s||''))).length}catch(__){return String(s||'').length}}}
function findAPI(w){let cur=w,guard=0;while(cur&&guard++<20){try{if(cur.API_1484_11)return{api:cur.API_1484_11,ver:'2004'};if(cur.API)return{api:cur.API,ver:'1.2'};if(cur.parent&&cur.parent!==cur)cur=cur.parent;else break}catch(_){break}}try{if(w.opener&&w.opener!==w)return findAPI(w.opener)}catch(_){}return null}
function yes(v){return String(v).toLowerCase()==='true'}
function withoutTrackingText(...values){const text=values.map(v=>String(v||'')).join(' ').replace(/\s+/g,' ').trim().toLowerCase();return /without\s*tracking/.test(text)}
function teacherRoleText(...values){const text=values.map(v=>String(v||'')).join(' ').replace(/\s+/g,' ').trim().toLowerCase();return /(^|[^a-záéíóúñ])(instructor|teacher|faculty|professor|docente|profesor|facilitator|facilitador)([^a-záéíóúñ]|$)/i.test(text)}
function instructorShellHint(){let cur=window,guard=0;while(cur&&guard++<8){let p=null;try{p=cur.parent}catch(_){break}if(!p||p===cur)break;try{const d=p.document,txt=String(d?.body?.innerText||'').replace(/\s+/g,' ').slice(0,180000);if(/\bAdministrar curso\b/i.test(txt)||/\bCourse Admin(?:istration)?\b/i.test(txt)||/\bManage Course\b/i.test(txt))return true}catch(_){break}cur=p}try{const o=window.opener;if(o&&o!==window){const txt=String(o.document?.body?.innerText||'').replace(/\s+/g,' ').slice(0,180000);if(/\bAdministrar curso\b/i.test(txt)||/\bCourse Admin(?:istration)?\b/i.test(txt)||/\bManage Course\b/i.test(txt))return true}}catch(_){}return false}
function compactSuspend(s){if(!s)return'';let c;try{c=JSON.parse(JSON.stringify(s))}catch(_){return''}const pack=()=>{try{return JSON.stringify(c)}catch(_){return''}};let txt=pack();if(utf8Length(txt)<=MAX_SUSPEND_BYTES)return txt;
 delete c.le;txt=pack();if(utf8Length(txt)<=MAX_SUSPEND_BYTES)return txt;
 if(c.h?.ps)for(const p of Object.values(c.h.ps)){if(p&&typeof p==='object'){delete p.tl;delete p.pn;delete p.g}}txt=pack();if(utf8Length(txt)<=MAX_SUSPEND_BYTES)return txt;
 if(Array.isArray(c.h?.bs)&&c.h.bs.length>12)c.h.bs=c.h.bs.slice(-12);if(Array.isArray(c.h?.cg)&&c.h.cg.length>9)c.h.cg=c.h.cg.slice(-9);txt=pack();if(utf8Length(txt)<=MAX_SUSPEND_BYTES)return txt;
 return'';
}
const bridge={
 api:null,ver:null,initialized:false,finished:false,started:Date.now(),studentName:'',studentId:'',lessonMode:'normal',launchData:'',previewMode:false,withoutTrackingMode:false,roleHint:'student',roleSource:'scorm-tracked-default',lastCommitOk:null,
 init(){
  if(this.initialized)return true;
  const f=findAPI(window);if(!f)return false;this.api=f.api;this.ver=f.ver;
  try{this.initialized=yes(this.ver==='2004'?this.api.Initialize(''):this.api.LMSInitialize(''))}catch(_){this.initialized=false}
  if(this.initialized){
   this.studentName=this.get('cmi.core.student_name','cmi.learner_name')||'';
   this.studentId=this.get('cmi.core.student_id','cmi.learner_id')||'';
   this.lessonMode=(this.get('cmi.core.lesson_mode','cmi.mode')||'normal').toLowerCase();
   this.launchData=this.get('cmi.launch_data','cmi.launch_data')||'';
   this.withoutTrackingMode=withoutTrackingText(this.studentName,this.studentId,this.lessonMode,this.launchData);
   this.previewMode=this.withoutTrackingMode||/browse|review/.test(this.lessonMode||'');
   const launchTeacher=teacherRoleText(this.launchData),shellTeacher=!this.previewMode&&instructorShellHint();
   if(this.withoutTrackingMode){this.roleHint='teacher_without';this.roleSource='without-tracking-identity'}
   else if(this.previewMode){this.roleHint='teacher_preview';this.roleSource='lesson-mode-'+this.lessonMode}
   else if(launchTeacher){this.roleHint='teacher_tracked';this.roleSource='launch-data'}
   else if(shellTeacher){this.roleHint='teacher_tracked';this.roleSource='brightspace-instructor-shell'}
   else{this.roleHint='student';this.roleSource='scorm-tracked-default'};
   // En Preview/Review y, especialmente, en "Without Tracking, Preview",
   // no se escribe absolutamente nada en el intento SCORM.
   if(!this.previewMode){
    const st=this.ver==='2004'?this.get('cmi.core.lesson_status','cmi.completion_status'):this.get('cmi.core.lesson_status','cmi.completion_status');
    if(!st||/not attempted|unknown/i.test(st)){
     this.set('cmi.core.lesson_status','cmi.completion_status','incomplete');
     if(this.ver==='2004')this.set('cmi.core.lesson_status','cmi.success_status','unknown');
    }
    this.set('cmi.core.exit','cmi.exit','suspend');
    this.commit();
   }
  }
  return this.initialized;
 },
 get(k12,k04){if(!this.initialized)return'';try{return this.ver==='2004'?this.api.GetValue(k04):this.api.LMSGetValue(k12)}catch(_){return''}},
 set(k12,k04,v){if(!this.initialized||this.previewMode)return false;try{return yes(this.ver==='2004'?this.api.SetValue(k04,String(v)):this.api.LMSSetValue(k12,String(v)))}catch(_){return false}},
 commit(){if(!this.initialized||this.finished||this.previewMode)return false;try{this.lastCommitOk=yes(this.ver==='2004'?this.api.Commit(''):this.api.LMSCommit(''));return this.lastCommitOk}catch(_){this.lastCommitOk=false;return false}},
 loadSuspend(){this.init();if(!this.initialized||this.previewMode)return null;const raw=this.get('cmi.suspend_data','cmi.suspend_data');if(!raw)return null;try{return JSON.parse(raw)}catch(_){return null}},
 save(_grade5,suspend){this.init();if(!this.initialized||this.previewMode)return false;const txt=compactSuspend(suspend);if(suspend&&!txt)return false;if(txt)this.set('cmi.suspend_data','cmi.suspend_data',txt);this.set('cmi.core.exit','cmi.exit','suspend');return this.commit()},
 setScore(grade5){if(this.previewMode)return null;const g=Math.max(0,Math.min(5,Number(grade5)||0));this.set('cmi.core.score.raw','cmi.score.raw',g.toFixed(2));this.set('cmi.core.score.min','cmi.score.min','0');this.set('cmi.core.score.max','cmi.score.max','5');if(this.ver==='2004')this.set('cmi.score.scaled','cmi.score.scaled',(g/5).toFixed(4));return g},
 finish(grade5,suspend){
  if(this.finished)return true;this.init();if(!this.initialized||this.previewMode)return false;
  this.save(null,suspend);const g=this.setScore(grade5),sec=Math.max(0,Math.floor((Date.now()-this.started)/1000));
  if(this.ver==='2004'){
   this.set('cmi.session_time','cmi.session_time',`PT${Math.floor(sec/3600)}H${Math.floor(sec%3600/60)}M${sec%60}S`);
   this.set('cmi.completion_status','cmi.completion_status','completed');
   this.set('cmi.success_status','cmi.success_status',g>=PASSING_GRADE_5?'passed':'failed');
   this.set('cmi.exit','cmi.exit','');this.commit();try{this.finished=yes(this.api.Terminate(''))}catch(_){}
  }else{
   const h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');
   this.set('cmi.core.session_time','cmi.session_time',`${h}:${m}:${s}`);
   this.set('cmi.core.lesson_status','cmi.completion_status',g>=PASSING_GRADE_5?'passed':'failed');
   this.set('cmi.core.exit','cmi.exit','');this.commit();try{this.finished=yes(this.api.LMSFinish(''))}catch(_){}
  }
  return this.finished;
 },
 beginAttempt(){
  this.init();if(!this.initialized||this.previewMode)return false;
  this.finished=false;this.started=Date.now();
  this.set('cmi.core.lesson_status','cmi.completion_status','incomplete');
  if(this.ver==='2004')this.set('cmi.core.lesson_status','cmi.success_status','unknown');
  this.set('cmi.suspend_data','cmi.suspend_data','');
  this.set('cmi.core.exit','cmi.exit','suspend');
  return this.commit();
 },
 getAttempt(){
  this.init();if(!this.initialized)return{connected:false,completed:false,status:'',scoreRaw:null,grade5:null,suspend:null};
  if(this.withoutTrackingMode)return{connected:true,completed:false,status:'without_tracking_preview',scoreRaw:null,grade5:null,suspend:null};
  if(this.previewMode)return{connected:true,completed:false,status:'preview',scoreRaw:null,grade5:null,suspend:null};
  let status='';if(this.ver==='2004'){const c=this.get('cmi.core.lesson_status','cmi.completion_status')||'',s=this.get('cmi.core.lesson_status','cmi.success_status')||'';status=`${c} ${s}`.trim()}else status=this.get('cmi.core.lesson_status','cmi.completion_status')||'';
  const raw=this.get('cmi.core.score.raw','cmi.score.raw'),scoreRaw=raw===''?null:Number(raw),suspend=this.loadSuspend();
  const completed=/passed|failed|completed/i.test(status)||!!suspend?.fin;
  const grade5=Number.isFinite(scoreRaw)?Math.max(0,Math.min(5,scoreRaw<=5?scoreRaw:scoreRaw/20)):(Number.isFinite(Number(suspend?.fg))?Number(suspend.fg):null);
  return{connected:true,completed,status,scoreRaw:Number.isFinite(scoreRaw)?scoreRaw:null,grade5,suspend};
 },
 isLMS(){return this.init()},
 getStudent(){this.init();return{name:this.studentName,id:this.studentId,connected:this.initialized,version:this.ver||'',lessonMode:this.lessonMode||'normal',withoutTracking:!!this.withoutTrackingMode,preview:!!this.previewMode,profile:this.getProfile(),roleHint:this.roleHint||'',roleSource:this.roleSource||'',launchData:this.launchData||''}},
 isPreviewMode(){this.init();return !!this.initialized&&this.previewMode},
 isWithoutTrackingMode(){this.init();return !!this.initialized&&this.withoutTrackingMode},
 isTeacherTrackedMode(){this.init();return !!this.initialized&&!this.previewMode&&this.roleHint==='teacher_tracked'},
 getProfile(){this.init();return !this.initialized?'local':this.withoutTrackingMode?'teacher_without':this.previewMode?'teacher_preview':this.roleHint==='teacher_tracked'?'teacher_tracked':'student'},
 getStatus(){return{connected:this.initialized,version:this.ver||'',studentName:this.studentName,studentId:this.studentId,lastCommitOk:this.lastCommitOk,finished:this.finished,lessonMode:this.lessonMode||'normal',withoutTracking:!!this.withoutTrackingMode,previewMode:!!this.previewMode,profile:this.getProfile(),roleHint:this.roleHint||'',roleSource:this.roleSource||'',attempt:this.getAttempt()}}
};
window.POKER_SCORM=bridge;
addEventListener('pagehide',()=>{try{if(bridge.initialized&&!bridge.finished&&!bridge.previewMode)bridge.commit()}catch(_){}});
})();
