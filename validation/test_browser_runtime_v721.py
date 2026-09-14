"""Real Chromium DOM; explicit localStorage/SCORM fixtures. Not live LLM or real LMS."""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
from browser_harness import load_page
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'validation';E=OUT/'evidence_v721';E.mkdir(exist_ok=True)
rows=[]
def check(name,passed,**detail):
 rows.append(dict(name=name,pass_=bool(passed),**detail));print(name,bool(passed),flush=True)
 (E/'runtime_partial.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
async def main():
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  p,errors=await load_page(browser,viewport={'width':1440,'height':960});dialogs=[];p.on('dialog',lambda d:dialogs.append(d.message))
  await p.wait_for_function('GeniusMath.PreloadPanel.getReport()?.durationMs>=0')
  actual=await p.evaluate('GeniusMath.PreloadPanel.getReport()')
  actual['testContext']='Actual probe inside DOM-injected opaque-origin Chromium. Not a localhost or target-device test.'
  (OUT/'GENIUS_CAPABILITY_TEST_RESULTS.json').write_text(json.dumps(actual,ensure_ascii=False,indent=2))
  check('probe_actually_ran',actual['executed'] and len(actual['checks'])>=10)
  check('opaque_origin_not_claimed_compatible',not actual['supported'])
  check('idle_no_attempt_no_deadline',await p.evaluate('!__P72_TEST__.getState().startedAt&&!__P72_TEST__.getState().deadlineAt'))
  await p.locator('#preloadGeniusBtn').click();check('no_native_confirm_for_preload',not dialogs)
  check('integrated_dialog_visible',await p.locator('#geniusCapabilityOverlay').is_visible())
  check('aria_modal_and_title',await p.locator('.genius-cap-dialog').get_attribute('aria-modal')=='true' and bool(await p.locator('#geniusCapTitle').inner_text()))
  check('background_inert',await p.locator('#startScreen').evaluate('(e)=>e.inert'))
  check('preparation_disabled_when_incompatible',not await p.locator('#geniusPrepare').is_enabled())
  check('cause_visible',bool(await p.locator('#geniusCapabilitySummary').inner_text()) and 'localhost' in await p.locator('#geniusCapabilitySummary').inner_text())
  check('no_generic_only_failure','IA no disponible aquí; el juego y la guía siguen disponibles' not in await p.locator('#geniusCapabilitySummary').inner_text())
  check('only_safe_light_profile_exposed',await p.locator('#geniusCapProfile option').count()==1 and await p.locator('#geniusCapProfile').input_value()=='light')
  check('no_large_model_options_in_safe_build',await p.locator('#geniusCapProfile').locator('option[value=standard],option[value=advanced]').count()==0)
  check('download_estimate_labeled','estimación' in await p.locator('#geniusModelSize').inner_text())
  check('model_memory_not_fake_measurement','no VRAM medida' in await p.locator('#geniusModelMemory').inner_text())
  check('safe_model_is_06b','0.6B' in await p.locator('#geniusModelName').inner_text())
  check('profile_synced_with_chat',await p.locator('#genieProfile').input_value()=='light')
  await p.screenshot(path=str(E/'desktop_compatibility.png'))
  for _ in range(14):await p.keyboard.press('Tab')
  check('focus_trapped',await p.evaluate("document.getElementById('geniusCapabilityOverlay').contains(document.activeElement)"))
  await p.keyboard.press('Escape');check('escape_closes',not await p.locator('#geniusCapabilityOverlay').is_visible());check('focus_restored',await p.evaluate("document.activeElement.id==='preloadGeniusBtn'"));check('background_restored',not await p.locator('#startScreen').evaluate('(e)=>e.inert'))
  # Event payloads are deliberately simulated diagnostic failures, not network measurements.
  for label,raw,stage,code in [('runtime','Failed to fetch','runtime','RUNTIME_IMPORT_FAILED'),('weights','Failed to fetch','weights','RESOURCE_ACCESS_FAILED'),('quota','QuotaExceededError','weights','STORAGE_FAILURE'),('memory','GPU device lost','generation','GPU_RESOURCE_FAILURE'),('protocol','Smoke JSON inválido','warming','MODEL_PROTOCOL_FAILED')]:
   d=await p.evaluate("({raw,stage})=>{const d=GeniusMath.RuntimeDiagnostics.classify(Error(raw),stage);window.dispatchEvent(new CustomEvent('genius:model-state',{detail:{status:'error',diagnostic:d}}));return d}",dict(raw=raw,stage=stage))
   check('simulated_diagnostic_'+label,d['code']==code and d['cause'] in await p.locator('#preloadGeniusStatus').inner_text(),fixture=True)
  await p.locator('#studentName').fill('Nico · prueba local');await p.locator('#startBtn').click();await p.locator('#closeGuideBtn').click()
  check('game_starts_after_diagnostics',await p.locator('#gameScreen').is_visible())
  check('academic_hour_starts_only_now',await p.evaluate('__P72_TEST__.getState().deadlineAt-__P72_TEST__.getState().startedAt===3600000'))
  grade=await p.evaluate('__P72_TEST__.getState().grade');await p.locator('[data-zone]:not([disabled])').first.click();await p.locator('#hintBtn').click()
  await p.locator('#genieLoadBtn').click();check('chat_load_uses_same_panel',await p.locator('#geniusCapabilityOverlay').is_visible());check('chat_load_no_native_confirm',not dialogs)
  await p.locator('#geniusDismiss').click();await p.locator('#genieGuideBtn').click();check('fallback_clearly_not_llm','sin IA' in await p.locator('#genieHelpBadge').inner_text());check('fallback_has_no_chat_send',not await p.locator('#genieForm').is_visible())
  check('no_grade_penalty_for_failed_or_guided_use',await p.evaluate('__P72_TEST__.getState().grade')==grade)
  await p.locator('#genieCloseBtn').click();await p.evaluate("__P72_TEST__.prepareFinish('Prueba de cierre local')")
  check('report_before_local_closure',await p.evaluate('__P72_TEST__.getState().awaitingFinalize&&__P72_TEST__.getState().reportArchived'))
  check('local_end_explains_new_trial','comenzar otra prueba' in await p.locator('#endText').inner_text())
  check('local_end_not_pending_Brightspace','cierre formal en Brightspace' not in await p.locator('#endText').inner_text())
  check('local_close_action_named','CERRAR INTENTO LOCAL' in await p.locator('#finalizeAttemptBtn').inner_text())
  await p.screenshot(path=str(E/'local_pending_report.png'))
  await p.locator('#viewReportBtn').click();await p.wait_for_function("document.querySelector('.genius-report-overlay')&&!document.querySelector('.genius-report-overlay').hidden")
  check('report_viewer_is_sandboxed',await p.locator('.genius-report-overlay iframe').get_attribute('sandbox')=='')
  check('report_viewer_received_generated_html','Genius Math' in (await p.locator('.genius-report-overlay iframe').get_attribute('srcdoc') or ''))
  preview=await p.locator('.genius-report-overlay iframe').get_attribute('srcdoc')
  check('report_viewer_exposes_all_sections_without_scripts','.report-panel{display:block!important}' in preview and '<script' not in preview)
  check('report_viewer_blocks_external_requests',"default-src 'none'" in preview)
  await p.locator('.genius-report-overlay button').click();check('report_viewer_returns_to_result',await p.locator('#endScreen').is_visible())
  before=await p.evaluate('__STORAGE_FIXTURE__()');check('report_evidence_in_storage',any('report_fallback' in k for k in before))
  # Simulated reload reproduces ended-pending flow without browser URL navigation.
  restored,rerr=await load_page(browser,storage=before);await restored.locator('#studentName').fill('Nico · prueba local');await restored.evaluate('__P72_TEST__.initStart()')
  check('pending_resume_action_visible','REVISAR INTENTO TERMINADO' in await restored.locator('#continueBtn').inner_text())
  await restored.locator('#continueBtn').click();await restored.wait_for_function("!document.getElementById('finalizeAttemptBtn').disabled")
  check('pending_report_restored',await restored.evaluate('__P72_TEST__.getState().reportArchived'))
  await restored.locator('#finalizeAttemptBtn').click();await restored.wait_for_function("document.getElementById('startScreen').classList.contains('active')")
  check('local_close_returns_menu_without_reload',await restored.locator('#startScreen').is_visible());check('local_new_attempt_enabled',await restored.locator('#startBtn').is_enabled())
  after=await restored.evaluate('__STORAGE_FIXTURE__()');check('local_close_did_not_delete_reports',all(k in after for k in before if 'report_fallback' in k))
  check('local_history_preserved','1 informe' in await restored.locator('#attemptHistorySummary').inner_text())
  await restored.locator('#startBtn').click();check('new_local_game_fresh',await restored.evaluate('__P72_TEST__.getState().gameActive&&!__P72_TEST__.getState().finished&&__P72_TEST__.getState().C===0'))
  check('local_restore_no_uncaught_errors',not rerr,errors=rerr);await restored.close();await p.close()
  # Genuine SCORM adapter with explicit API fixture: initialize, suspend, score, commit, finish.
  for mode,values in [('student',{'cmi.core.student_name':'Alumno de prueba','cmi.core.student_id':'V721STUDENT','cmi.core.lesson_mode':'normal','cmi.core.lesson_status':'not attempted'}),('preview',{'cmi.core.student_name':'Preview Without Tracking','cmi.core.student_id':'V721PREVIEW','cmi.core.lesson_mode':'browse'})]:
   page,errs=await load_page(browser,lms=values);await page.locator('#startBtn').click();await page.evaluate("__P72_TEST__.prepareFinish('Regresión SCORM instrumentada')");await page.locator('#finalizeAttemptBtn').click()
   if mode=='student':
    check('student_scorm_finished',await page.evaluate("__LMS_FIXTURE__.log.some(x=>x[0]==='finish')"));check('student_single_attempt_locked',await page.evaluate('__P72_TEST__.studentAttemptBlocked()'));await page.locator('#teacherNewBtn').click();check('student_menu_cannot_restart',not await page.locator('#startBtn').is_enabled())
    check('student_grade_scale_preserved',await page.evaluate("+__LMS_FIXTURE__.values['cmi.core.score.max']===5&&+__LMS_FIXTURE__.values['cmi.core.score.raw']>=0&&+__LMS_FIXTURE__.values['cmi.core.score.raw']<=5"))
    check('student_suspend_no_transcript',await page.evaluate("!String(__LMS_FIXTURE__.values['cmi.suspend_data']).includes('turns')"))
   else:
    check('preview_close_returns_menu',await page.locator('#startScreen').is_visible());check('preview_no_grade_writes',await page.evaluate("__LMS_FIXTURE__.log.every(x=>!['set','commit','finish'].includes(x[0]))"));check('preview_allows_new_attempt',await page.locator('#startBtn').is_enabled())
   check(mode+'_no_uncaught_errors',not errs,errors=errs);await page.close()
  mobile,me=await load_page(browser,viewport={'width':390,'height':844});await mobile.locator('#preloadGeniusBtn').click();await mobile.wait_for_function('GeniusMath.PreloadPanel.getReport()?.durationMs>=0');bounds=await mobile.locator('.genius-cap-dialog').bounding_box()
  check('mobile_dialog_inside_viewport',bounds['x']>=0 and bounds['y']>=0 and bounds['x']+bounds['width']<=391 and bounds['y']+bounds['height']<=845,bounds=bounds)
  check('mobile_no_horizontal_overflow',await mobile.locator('.genius-cap-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
  await mobile.screenshot(path=str(E/'mobile_compatibility.png'));await mobile.locator('#geniusDismiss').click();check('mobile_returns_to_game_menu',await mobile.locator('#startScreen').is_visible());check('mobile_no_uncaught_errors',not me,errors=me);await mobile.close();await browser.close()
 result={'version':'7.2.2-safe-audited','kind':'BROWSER_DOM_WITH_EXPLICIT_STORAGE_AND_LMS_FIXTURES','executed':True,'liveInferenceExecuted':False,'realBrightspaceExecuted':False,'total':len(rows),'passed':sum(r['pass_'] for r in rows),'failed':[r for r in rows if not r['pass_']],'results':rows}
 (OUT/'BROWSER_RUNTIME_TEST_RESULTS.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='results'},ensure_ascii=False,indent=2))
 if result['failed']:raise SystemExit(1)
asyncio.run(main())
