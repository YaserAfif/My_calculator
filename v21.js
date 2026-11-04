/* دفتر حسابات 21 — fee ledger rules, signed daily carry-forward, authorization of
   historical cash movements, unified remittance toggles and financial UX.
   Does not rewrite historical records. All amounts remain stored per currency. */
(()=>{'use strict';
const C=window.MC14,$=id=>document.getElementById(id);
if(!C)return;
const VERSION='21.0.0', EPS=1e-7;
const today=()=>C.today(), amount=x=>Number(x)||0;
const effect=r=>window.MC19?.cashEffect?.(r)||0;
const label=(name)=>String(name||'');
const notify=(message,kind='success')=>{
 let toast=$('v21-toast');if(!toast){toast=document.createElement('div');toast.id='v21-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(toast)}
 toast.textContent=message;toast.className='v21-toast '+(kind==='error'?'v21-error':'v21-success');toast.hidden=false;
 clearTimeout(notify.timeout);notify.timeout=setTimeout(()=>toast.hidden=true,5400);
};
// SHA-256 of a salted PIN is a local usability gate only, not server-verified RBAC.
async function fingerprint(pin,salt){
 if(!globalThis.crypto?.subtle)throw Error('بررسی رمز مدیر به اتصال امن HTTPS نیاز دارد.');
 const bytes=new TextEncoder().encode(salt+':'+pin);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
const pinSetting=()=>C.settings.managerPinV21;
async function validatePin(pin){const cfg=pinSetting();return Boolean(cfg&&pin&&await fingerprint(pin,cfg.salt)===cfg.digest)}
async function configurePin(){
 if(!C.isWritable()){notify('برای تنظیم رمز مدیر، اجازهٔ ویرایش لازم است.','error');return}
 const prev=pinSetting();
 if(prev){const old=prompt('برای تغییر رمز، رمز فعلی مدیر را وارد کنید:');if(old===null)return;if(!await validatePin(old)){notify('رمز قبلی مدیر درست نیست.','error');return}}
 const first=prompt('رمز تأیید مدیر را تعیین کنید (حداقل ۶ رقم یا حرف). این رمز برای اسناد خزانه با تاریخ گذشته لازم است:');
 if(first===null)return;if(first.length<6){notify('رمز باید حداقل ۶ کاراکتر باشد.','error');return}
 const second=prompt('رمز مدیر را دوباره وارد کنید:');if(second!==first){notify('رمزها یکسان نیستند.','error');return}
 const salt=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const digest=await fingerprint(first,salt);
 C.settings.managerPinV21={salt,digest,createdAt:new Date().toISOString()};C.persistMeta();notify('رمز تأیید مدیر در همین دستگاه تنظیم شد.');refreshSettings();
}
const reportDeltaMap=(rows,multiplier)=>{
 const m=new Map();for(const r of rows||[]){const v=effect(r);if(Math.abs(v)<EPS)continue;
  const key=String(r.date||today())+'|'+(r.currency||'AFN');m.set(key,(m.get(key)||0)+multiplier*v)}return m;
};
// Approval required ONLY if a cash-impacting historical day changes. Changing an
// old memo or a no-cash record is allowed without PIN.
async function authorizeBackdate(added=[],removed=[],action='سند'){
 const changes=reportDeltaMap(added,1);for(const [k,v] of reportDeltaMap(removed,-1))changes.set(k,(changes.get(k)||0)+v);
 const backdated=[...changes].filter(([k,v])=>k.slice(0,10)<today()&&Math.abs(v)>EPS);
 if(!backdated.length)return true;
 if(!pinSetting()){notify('برای ثبت خزانه در تاریخ گذشته، ابتدا در تنظیمات رمز تأیید مدیر را تعیین کنید.','error');return false}
 const summary=backdated.map(([key,v])=>`${C.dateText(key.split('|')[0])}، ${key.split('|')[1]}: ${v>=0?'+':''}${C.fmt(v)}`).join('\n');
 const pin=prompt(`تغییرات خزانه در تاریخ گذشته نیازمند تأیید مدیر است.\n${action}\n${summary}\n\nرمز مدیر را وارد کنید:`);
 if(pin===null)return false;
 if(!await validatePin(pin)){notify('تأیید مدیر ناموفق بود؛ سند ذخیره نشد.','error');return false}
 return true;
}
// Carry-forward of each date is computed, not duplicated as an actual journal entry.
function dayBalances(day){
 const result=[];
 for(const acct of C.accounts){
  const rows=C.accountSource(acct.name),curs=new Set(rows.map(r=>r.currency||'AFN'));
  for(const cur of curs){let opening=0,movement=0;
   for(const r of rows){if((r.currency||'AFN')!==cur)continue;const v=C.delta(r);if(r.date<day)opening+=v;else if(r.date===day)movement+=v}
   if(Math.abs(opening)+Math.abs(movement)<EPS)continue;
   result.push({account:acct.name,currency:cur,opening,movement,closing:opening+movement});
  }
 }
 return result;
}
// Supplement current-balance checks with historical daily cash checks so adding
// a backdated withdrawal cannot temporarily overdraw treasury on that day.
function checkPastCashHistory(added=[],removed=[]){
 const cashRows=[...added,...removed].filter(r=>Math.abs(effect(r))>EPS);
 const pastDates=cashRows.filter(r=>r.date&&r.date<today()).map(r=>r.date);
 if(!pastDates.length)return true;
 const first=pastDates.sort()[0],existing=C.records.filter(r=>!removed.includes(r)),projected=[...existing,...added];
 function daily(rows){const buckets=new Map();for(const r of rows){if(!r.date||r.date>today())continue;const delta=effect(r),key=(r.currency||'AFN')+'|'+r.date;buckets.set(key,(buckets.get(key)||0)+delta)}return buckets}
 const oldMap=daily(C.records),newMap=daily(projected);
 const currencies=new Set(cashRows.map(r=>r.currency||'AFN'));
 for(const cur of currencies){const dates=new Set([...oldMap.keys(),...newMap.keys()].filter(k=>k.startsWith(cur+'|')).map(k=>k.slice(cur.length+1)));let old=0,now=0;
  for(const date of [...dates].sort()){old+=amount(oldMap.get(cur+'|'+date));now+=amount(newMap.get(cur+'|'+date));if(date<first)continue;
   if(now < -EPS && now < old-EPS){
    alert(`⚠️ موجودی خزانه در تاریخ ${C.dateText(date)} برای ${cur} کافی نیست.\nبیلانس خزانه در آن روز پس از تغییر: ${C.fmt(now)} ${cur}\nسند ثبت نشد.`);return false;
   }
  }
 }
 return true;
}
function attachDailyGuard(){if(!window.MC18?.checkCashBatch)return;const prev=window.MC18.checkCashBatch;
 window.MC18.checkCashBatch=(add=[],remove=[],action='ثبت سند')=>prev(add,remove,action)&&checkPastCashHistory(add,remove);
}
function refreshStatusColor(){
 const els=['status','exchangeStatus','v13-in-status','v13-out-status'];for(const id of els){const el=$(id);if(!el)continue;
  const message=(el.textContent||'').trim();if(!message){el.classList.remove('v21-success-text','v21-error-text');continue}
  const success=/ثبت شد|ویرایش شد|ذخیره شد|تغییرات ذخیره|با موفقیت|موفقانه|انتقال بین|اصلاح شد/.test(message);
  el.classList.toggle('v21-success-text',success);el.classList.toggle('v21-error-text',!success);
 }
}
function initMessageObserver(){for(const id of ['status','exchangeStatus','v13-in-status','v13-out-status']){
 const el=$(id);if(el&&!el.dataset.v21Watching){el.dataset.v21Watching='1';new MutationObserver(refreshStatusColor).observe(el,{characterData:true,childList:true,subtree:true})}}
 refreshStatusColor();
}
function ensureDate(input){if(input&&!input.value){input.value=today();input.dispatchEvent(new Event('change',{bubbles:true}))}}
function refreshForm(){
 for(const id of ['date','exchangeDate','v13-in-date','v13-out-date','v14-settle-date'])ensureDate($(id));
 for(const kind of ['in','out']){
  const prefix='v13-'+kind;
  $(prefix+'-tracking')?.closest('.field')?.remove();$(prefix+'-peer-fee')?.closest('.v17-peer-fee')?.remove();
  const field=$(prefix+'-fee')?.closest('.field')?.querySelector('label');if(field)field.textContent='مفاد حواله';
  const form=$(prefix+'-form');if(form){form.classList.add('v21-hawala');
   const sarraf=$(prefix+'-sarraf-fee');if(sarraf) sarraf.closest('.field')?.classList.add('v21-sarraf-fee');
  }
 }
 if($('appVersion'))$('appVersion').textContent=VERSION;
 document.title='دفتر حسابات';
 const version=$('licenseOverlay')?.querySelector('h2 span');if(version)version.hidden=true;
 document.querySelectorAll('.v14-version').forEach(e=>e.hidden=true);
 initMessageObserver();
}
function installDailyReport(){
 const parent=$('page-settings');if(!parent||$('v21-day-close'))return;
 const section=document.createElement('details');section.id='v21-day-close';section.className='v13-accordion';
 section.innerHTML=`<summary>اختتام روز و انتقال بیلانس</summary><div class="v13-inner"><p class="v21-help">بیلانس آغاز هر روز، همان بیلانس پایان روز پیش است. این راپور از اسناد واقعی محاسبه می‌شود و هیچ مبلغ تکراری در خزانه ثبت نمی‌کند. تاریخ اسناد قدیمی حفظ می‌شود.</p><div class="v21-manager-actions"><label>تاریخ راپور <input id="v21-close-date" type="date" /></label><button type="button" class="secondary" id="v21-close-show">نمایش بیلانس‌های روز</button></div><div id="v21-close-report" class="v21-day-report"></div></div>`;
 parent.append(section);
 $('v21-close-date').value=today();$('v21-close-show').onclick=()=>renderDailyReport();
 const approvals=document.createElement('details');approvals.id='v21-manager-settings';approvals.className='v13-accordion';approvals.innerHTML=`<summary>تأیید مدیر برای اسناد قدیمی خزانه</summary><div class="v13-inner"><p class="v21-help">سند بدون اثر بر خزانه می‌تواند با تاریخ گذشته ثبت شود. هر تغییر پول خزانه در تاریخ گذشته، به تأیید مدیر نیاز دارد. رمز این بخش فقط در همین مرورگر بررسی می‌شود و جایگزین دسترسی مدیریتی تأییدشده از سرور نیست.</p><div class="v21-manager-actions"><button type="button" class="secondary" id="v21-set-manager-pin">تعیین / تغییر رمز مدیر</button><span id="v21-manager-state"></span></div></div>`;
 parent.append(approvals);
 $('v21-set-manager-pin').onclick=()=>configurePin().catch(e=>notify(e.message,'error'));
 refreshSettings();
}
function refreshSettings(){const state=$('v21-manager-state');if(state)state.textContent=pinSetting()?'رمز تأیید محلی تنظیم شده است.':'هنوز رمز تأیید مدیر تنظیم نشده است.'}
function renderDailyReport(){const date=$('v21-close-date')?.value||today(),host=$('v21-close-report');if(!host)return;
 const rows=dayBalances(date);if(!rows.length){host.innerHTML='<p>در این روز بیلانسی موجود نیست.</p>';return}
 const safe=C.safe;
 host.innerHTML=`<div class="v21-day-heading"><strong>بیلانس آغاز و پایان روز ${safe(C.dateText(date))}</strong><button type="button" class="secondary" id="v21-copy-day">کاپی راپور</button></div><div class="v21-day-wrap"><table><thead><tr><th>حساب</th><th>ارز</th><th>آغاز روز</th><th>تغییر روز</th><th>پایان روز</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe(r.account)}</td><td>${safe(r.currency)}</td><td>${C.fmt(r.opening)}</td><td>${C.fmt(r.movement)}</td><td>${C.fmt(r.closing)}</td></tr>`).join('')}</tbody></table></div>`;
 $('v21-copy-day').onclick=async()=>{const content=`راپور اختتام روز ${C.dateText(date)}\n`+rows.map(r=>`${r.account} | ${r.currency} | آغاز: ${C.fmt(r.opening)} | تغییرات: ${C.fmt(r.movement)} | پایان: ${C.fmt(r.closing)}`).join('\n');
 try{await navigator.clipboard.writeText(content);notify('راپور روز کاپی شد.')}catch{notify('کاپی خودکار ممکن نشد؛ از متن راپور کاپی بگیرید.','error')}};
}
function install(){attachDailyGuard();installDailyReport();refreshForm();
 const after=C.onAfterRender,page=C.onPage;
 C.onAfterRender=()=>{after?.();refreshForm()};
 C.onPage=pageName=>{page?.(pageName);refreshForm()};
 // Payment modal forms are created on demand.
 const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&n.querySelector?.('#v14-settle-date'))))ensureDate($('v14-settle-date'))});
 observer.observe(document.body,{childList:true,subtree:true});
 window.MC21={VERSION,notify,authorizeBackdate,dayBalances,checkPastCashHistory,refreshUI:refreshForm};
}
try{install()}catch(error){console.error('دفتر حسابات ۲۱:',error)}
})();
