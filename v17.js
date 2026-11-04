/* دفتر حسابات ۱۷ — enhancements layered on the original v16 design.
 * No destructive data migration. Internal UUIDs are retained for referential integrity;
 * numeric IDs are separate human-facing document identifiers.
 * © 2026 Yaser Afif.
 */
(()=>{'use strict';
 const C=window.MC14,$=id=>document.getElementById(id);
 if(!C)return;
 const esc=v=>C.safe(String(v??''));
 const version='17.0.0';
 function setVersion(){
  document.title='دفتر حسابات — نسخه ۱۷';
  if($('appVersion'))$('appVersion').textContent=version;
  document.querySelectorAll('.v14-version').forEach(x=>x.textContent='نسخه ۱۷');
  const license=$('licenseOverlay')?.querySelector('h2 span');if(license)license.textContent='نسخهٔ ۱۷';
 }
 // Keep importer in Settings only. No buttons in the top bar, dashboard or sidebar.
 function cleanNavigation(){document.querySelectorAll('#v14-appbar [data-v15-import],#v14-sidebar [data-v15-import],#v15-quickbar [data-v15-dash-import]').forEach(el=>el.remove());}
 // Unpaid-remittance operations remain accessible inside the "پرداخت نشده" account.
 function cleanAccountList(){const p=$('v14-pending');if(p&&C.state.account!=='پرداخت نشده')p.remove();}
 // Pin a chosen account on repeated submissions, including changing the pinned account.
 function installPin(formId,accountId){
  const form=$(formId),field=$(accountId);if(!form||!field||field.dataset.v17Pin)return;
  field.dataset.v17Pin='1';
  const button=document.createElement('button');button.type='button';button.className='v17-pin';button.textContent='📌';button.title='حفظ حساب بعد از ثبت سند';button.setAttribute('aria-pressed','false');
  const anchor=field.nextElementSibling?.classList.contains('account-combobox')?field.nextElementSibling:field;
  anchor.insertAdjacentElement('afterend',button);
  let pinned=false,selected='';
  button.onclick=()=>{pinned=!pinned;selected=field.value;button.classList.toggle('is-pinned',pinned);button.setAttribute('aria-pressed',String(pinned));button.title=pinned?'سنجاق فعال است؛ برای آزادکردن کلیک کنید':'حفظ حساب بعد از ثبت سند'};
  for(const event of ['change','input'])field.addEventListener(event,()=>{if(pinned&&field.value)selected=field.value});
  // Capture before the original submit handler resets the form.
  form.addEventListener('submit',()=>{
   if(!pinned)return;selected=field.value||selected;
   setTimeout(()=>{if(!pinned||!selected)return;const option=field.tagName==='SELECT'?[...field.options].some(o=>o.value===selected):true;if(!option)return;
    field.value=selected;field.dispatchEvent(new Event('change',{bubbles:true}));
    if(typeof syncAccountCombos==='function')syncAccountCombos();
   },30);
  },true);
 }
 function pins(){
  for(const [form,field] of [['entryForm','name'],['entryForm','darakAccount'],['exchangeForm','exchangeFromAccount'],['exchangeForm','exchangeDarakAccount'],['v13-in-form','v13-in-account'],['v13-in-form','v13-in-darak'],['v13-out-form','v13-out-account'],['v13-out-form','v13-out-darak']])installPin(form,field);
 }
 // Interactive Afghan Hijri-Shamsi picker; ISO Gregorian stays in the saved records.
 const months=['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'];
 const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});
 const parts=iso=>{const date=new Date((/^\d{4}-\d\d-\d\d$/.test(iso)?iso:new Date().toISOString().slice(0,10))+'T12:00:00Z');const a=Object.fromEntries(fmt.formatToParts(date).filter(x=>['year','month','day'].includes(x.type)).map(x=>[x.type,Number(x.value)]));return [a.year,a.month,a.day]};
 const key=(y,m,d)=>y*400+m*32+d;
 function toISO(y,m,d){
  const wanted=key(y,m,d);let lo=Math.floor(Date.UTC(y+620,0,1)/86400000),hi=Math.floor(Date.UTC(y+623,0,1)/86400000);
  while(lo<=hi){const mid=Math.floor((lo+hi)/2),iso=new Date(mid*86400000).toISOString().slice(0,10),[jy,jm,jd]=parts(iso),v=key(jy,jm,jd);if(v===wanted)return iso;if(v<wanted)lo=mid+1;else hi=mid-1}return null;
 }
 function showDate(input){
  const initial=parts(input.value);let [year,month,day]=initial;
  let overlay=$('v17-calendar');if(!overlay){overlay=document.createElement('div');overlay.id='v17-calendar';document.body.append(overlay)}
  overlay.hidden=false;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','تقویم هجری شمسی');
  const close=()=>{overlay.hidden=true};
  function draw(){
   const first=toISO(year,month,1),next=month===12?toISO(year+1,1,1):toISO(year,month+1,1);
   if(!first||!next){overlay.innerHTML='<button data-j-close>بستن</button><p>این تاریخ در محدودهٔ تقویم نیست.</p>';return}
   const count=Math.round((Date.parse(next)-Date.parse(first))/86400000);
   const weekday=(new Date(first+'T12:00:00Z').getUTCDay()+1)%7;
   const cells=Array.from({length:weekday},()=>'<span></span>').join('')+Array.from({length:count},(_,i)=>`<button type="button" data-j-day="${i+1}" class="${day===i+1?'selected':''}">${i+1}</button>`).join('');
   overlay.innerHTML=`<div class="v17-calendar-card"><div class="v17-calendar-head"><div><strong>تقویم هجری شمسی</strong><small>ماه‌های افغانستان</small></div><button type="button" data-j-close aria-label="بستن">×</button></div><div class="v17-calendar-nav"><button type="button" data-j-prev aria-label="ماه قبل">‹</button><select data-j-month aria-label="ماه">${months.map((n,i)=>`<option value="${i+1}" ${month===i+1?'selected':''}>${n}</option>`).join('')}</select><select data-j-year aria-label="سال">${Array.from({length:201},(_,i)=>1300+i).map(y=>`<option value="${y}" ${year===y?'selected':''}>${y}</option>`).join('')}</select><button type="button" data-j-next aria-label="ماه بعد">›</button></div><div class="v17-calendar-days">${['ش','ی','د','س','چ','پ','ج'].map(x=>`<b>${x}</b>`).join('')}${cells}</div><div class="v17-calendar-foot"><button type="button" data-j-today>امروز</button><button type="button" data-j-clear>پاک‌کردن</button><span>تاریخ ذخیره‌شده به‌صورت استاندارد و سازگار با راپورها است.</span></div></div>`;
   overlay.querySelector('[data-j-close]').onclick=close;
   overlay.querySelector('[data-j-prev]').onclick=()=>{month--;if(month<1){month=12;year--}day=1;draw()};
   overlay.querySelector('[data-j-next]').onclick=()=>{month++;if(month>12){month=1;year++}day=1;draw()};
   overlay.querySelector('[data-j-month]').onchange=e=>{month=Number(e.target.value);day=1;draw()};
   overlay.querySelector('[data-j-year]').onchange=e=>{year=Number(e.target.value);day=1;draw()};
   overlay.querySelectorAll('[data-j-day]').forEach(btn=>btn.onclick=()=>{const iso=toISO(year,month,Number(btn.dataset.jDay));if(!iso)return;input.value=iso;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close()});
   overlay.querySelector('[data-j-today]').onclick=()=>{input.value=C.today();input.dispatchEvent(new Event('change',{bubbles:true}));close()};
   overlay.querySelector('[data-j-clear]').onclick=()=>{if(input.required)return;input.value='';input.dispatchEvent(new Event('change',{bubbles:true}));close()};
  }
  overlay.onclick=e=>{if(e.target===overlay)close()};draw();
 }
 function enhanceDates(){
  document.querySelectorAll('input[type="date"]:not([data-v17-date])').forEach(input=>{
   input.dataset.v17Date='1';input.classList.add('v17-native-date');
   const btn=document.createElement('button');btn.type='button';btn.className='v17-date-trigger';btn.setAttribute('aria-label','انتخاب تاریخ هجری شمسی');
   input.insertAdjacentElement('afterend',btn);
   const update=()=>{if(!input.isConnected)return;const [y,m,d]=parts(input.value);btn.textContent=input.value?`${d} ${months[m-1]} ${y}  ▾`:'انتخاب تاریخ شمسی  ▾'};
   btn.onclick=()=>showDate(input);input.addEventListener('change',update);input.addEventListener('input',update);update();
  });
 }
 // Account details are a true same-page sheet. The old account list remains underneath.
 function accountOpen(){if(!$('v13-detail')||$('v13-detail').hidden)return;document.body.classList.add('v17-account-open');let backdrop=$('v17-account-backdrop');if(!backdrop){backdrop=document.createElement('div');backdrop.id='v17-account-backdrop';document.body.append(backdrop);backdrop.onclick=()=>{$('v13-back-accounts')?.click()}}backdrop.hidden=false;}
 function accountClose(){document.body.classList.remove('v17-account-open');if($('v17-account-backdrop'))$('v17-account-backdrop').hidden=true}
 function sheetEditor(){
  const page=[...document.querySelectorAll('.page')].find(x=>x.classList.contains('active'));
  if(!page||!['page-journal','page-exchange','page-hawalaIn','page-hawalaOut'].includes(page.id))return;
  accountClose();document.querySelectorAll('.v17-editor-sheet').forEach(x=>x.classList.remove('v17-editor-sheet'));
  page.classList.add('v17-editor-sheet');document.body.classList.add('v17-editor-open');
  let close=$('v17-editor-close');if(!close){close=document.createElement('button');close.id='v17-editor-close';close.type='button';close.textContent='× بستن ویرایش';document.body.append(close);close.onclick=closeEditor}
  close.hidden=false;
  const form=page.querySelector('form');if(form&&!form.dataset.v17EditClose){form.dataset.v17EditClose='1';form.addEventListener('submit',()=>setTimeout(()=>{if(!document.body.classList.contains('v17-editor-open'))return;if(page.id==='page-journal'&&$('editId')?.value)return;if(page.id==='page-exchange'&&$('exchangeEditId')?.value)return;if(page.id.startsWith('page-hawala')&&C.state.hwEdit)return;closeEditor()},130));}
 }
 function closeEditor(){if($('editId')?.value)$('cancelEdit')?.click();if($('exchangeEditId')?.value)$('exchangeCancel')?.click();if(C.state.hwEdit){C.state.hwEdit='';for(const kind of ['in','out']){const form=$('v13-'+kind+'-form');if(form)form.reset()}}document.body.classList.remove('v17-editor-open');document.querySelectorAll('.v17-editor-sheet').forEach(x=>x.classList.remove('v17-editor-sheet'));if($('v17-editor-close'))$('v17-editor-close').hidden=true;C.showPage(C.state.account?'accounts':'dashboard');if(C.state.account&&$('v13-detail')&&!$('v13-detail').hidden)accountOpen()}
 function rowsClickable(){
  document.body.addEventListener('click',e=>{
   if(e.target.closest('button,a,input,select,textarea,label'))return;
   const tr=e.target.closest('#v16-account-vouchers tbody tr,#v16-voucher-report tbody tr,#v15-report-body tr,.v15-daily-table tbody tr,#v13-detail-body tr');
   if(!tr)return;const btn=tr.querySelector('[data-v16-voucher],[data-v16-report-open],[data-v15-voucher],[data-v15-view],[data-v13-edit]');
   if(!btn)return;const id=btn.dataset.v16Voucher||btn.dataset.v16ReportOpen||btn.dataset.v15Voucher||btn.dataset.v15View||btn.dataset.v13Edit;
   if(id)window.MC15?.openVoucher?.(id);
  });
  document.body.addEventListener('click',e=>{if(e.target.closest('[data-open-account]'))setTimeout(accountOpen,0)});
  $('v13-back-accounts')?.addEventListener('click',accountClose);
  const original=C.openAccount;C.openAccount=name=>{original(name);accountOpen()};
  const edit=C.editLedgerRecord;C.editLedgerRecord=id=>{edit(id);setTimeout(sheetEditor,0)};
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('v17-calendar')&&!$('v17-calendar').hidden)$('v17-calendar').hidden=true;else if(document.body.classList.contains('v17-editor-open'))closeEditor();else if(document.body.classList.contains('v17-account-open'))$('v13-back-accounts')?.click()});
 }
 function cleanForm(){for(const kind of ['in','out']){const p='v13-'+kind;$(p+'-source')?.closest('.field')?.remove();$(p+'-fee-default')?.remove();}
 }
 function refresh(){setVersion();cleanNavigation();cleanAccountList();enhanceDates();cleanForm();}
 function init(){refresh();pins();rowsClickable();
  const oldAfter=C.onAfterRender,oldPage=C.onPage;
  C.onAfterRender=()=>{oldAfter?.();refresh()};
  C.onPage=page=>{oldPage?.(page);refresh();if(page!=='accounts'&&!document.body.classList.contains('v17-editor-open'))accountClose()};
  // Dynamically created payment sheets can contain date inputs.
  const observer=new MutationObserver(()=>{enhanceDates();cleanAccountList()});observer.observe(document.body,{subtree:true,childList:true});
  window.MC17={VERSION:version,toISO,parts,recordDelta:C.delta};
 }
 try{init()}catch(err){console.error('دفتر حسابات ۱۷:',err)}
})();
