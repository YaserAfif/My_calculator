/* دفتر حسابات 16 — single voucher workspace, explicit cash direction, tiered fees,
   flexible remittance fields and unpaid-first account view. Local financial data never
   leaves this device unless the user exports it. © Yaser Afif, 2026. */
(()=>{'use strict';
 const C=window.MC14; if(!C) return;
 const $=id=>document.getElementById(id);
 const S=v=>C.safe(String(v??'')), num=v=>C.parsedAmount(String(v??'').replace(/,/g,'')), fmt=v=>C.fmt(Number(v||0));
 const cur=r=>r.currency||'AFN', amount=(v,c)=>`${fmt(v)} ${S(c)}`;
 const feeAmount=(amount,fee)=>{
   const a=Number(amount),t=Number(fee?.threshold),v=Number(fee?.value);
   if(!Number.isFinite(a)||a<=0||!Number.isFinite(t)||t<=0||!Number.isFinite(v)||v<0)return 0;
   return Math.round((Math.ceil(Math.round(a*100)/Math.round(t*100))*v)*100)/100;
 };
 window.MC16={VERSION:'16.0.0',feeAmount};
 const canEdit=()=>{if(window.LICENSE_CAN_WRITE===true)return true;alert('برای تغییر اطلاعات، لایسنس فعال یا مهلت مجاز آفلاین لازم است.');return false};
 const config=()=>C.settings.hawalaFieldsV16||{sender:true,receiver:true};
 const setVersion=()=>{document.title='دفتر حسابات — نسخه ۱۶';if($('appVersion'))$('appVersion').textContent='16.0.0';document.querySelectorAll('.v14-version').forEach(x=>x.textContent='نسخه ۱۶');const license=$('licenseOverlay')?.querySelector('h2 span');if(license)license.textContent='نسخهٔ ۱۶';};
 function bootSettings(){const root=$('page-settings');if(!root||$('v16-field-settings'))return;const details=document.createElement('details');details.id='v16-field-settings';details.className='v13-accordion';details.innerHTML=`<summary>فورم‌ها و نمایش جزئیات حواله</summary><div class="v13-inner"><p class="v16-muted">فرستنده و گیرنده اختیاری هستند. خاموش‌کردن هر گزینه تنها فیلد را پنهان می‌کند و اطلاعات اسناد قبلی پاک نمی‌شود.</p><div class="v16-setting-grid"><label class="v16-toggle-row"><span>نمایش فرستنده در حواله</span><input id="v16-use-sender" type="checkbox"/></label><label class="v16-toggle-row"><span>نمایش گیرنده در حواله</span><input id="v16-use-receiver" type="checkbox"/></label></div><p class="v16-muted">منطق پول نقد: طلب = ورود به خزانه (سبز)، گرفت = خروج از خزانه (سرخ). درک و بدون مدرک خزانه را تغییر نمی‌دهند.</p></div>`;root.append(details);
  const flags=config();$('v16-use-sender').checked=flags.sender!==false;$('v16-use-receiver').checked=flags.receiver!==false;
  for(const [field,id] of [['sender','v16-use-sender'],['receiver','v16-use-receiver']])$(id).onchange=e=>{if(!canEdit()){e.target.checked=!e.target.checked;return}C.settings.hawalaFieldsV16={...config(),[field]:e.target.checked};C.persistMeta();syncHawalaFields()};
 }
 function syncHawalaFields(){for(const kind of ['in','out'])for(const [field,enabled]of Object.entries({sender:config().sender!==false,receiver:config().receiver!==false})){
  const input=$(`v13-${kind}-${field}`);if(!input)continue;const wrap=input.closest('.field');if(wrap)wrap.hidden=!enabled;input.disabled=!enabled;
  // Existing saved sender/receiver data is retained; hide from form only.
 }}
 function getRule(account){return C.rule?.(account)||C.settings.sarrafRules?.[account]||{fees:{},sequence:{in:1,out:1}}}
 const previewState={in:{manual:false},out:{manual:false}};
 function recommendFee(kind,reason='amount'){
  const p='v13-'+kind,account=$(p+'-account')?.value?.trim(),c=$(p+'-currency')?.value,amt=num($(p+'-amount')?.value),rule=getRule(account)?.fees?.[c];
  if(!$(p+'-fee'))return;
  // A hand-entered fee is deliberately retained until the amount/account/currency changes.
  if(reason==='input'&&previewState[kind].manual)return;
  if(rule&&Number(rule.threshold)>0&&Number(rule.value)>=0){
   const calculated=feeAmount(amt,rule);$(p+'-fee').value=Number.isFinite(calculated)?fmt(calculated):'0';$(p+'-fee-currency').value=c;previewState[kind].manual=false;
  }
 }
 function paintMode(){
  const journal=$('entryForm');if(journal){const mode=$('entryMode')?.value||document.querySelector('[name=modeChoice]:checked')?.value;
   const isCash=mode==='treasury',incoming=!!$('talabAmount')?.value.trim(),outgoing=!!$('gotAmount')?.value.trim(),active=isCash&&(incoming||outgoing);
   journal.classList.toggle('v16-flow-in',active&&incoming);journal.classList.toggle('v16-flow-out',active&&outgoing);journal.classList.toggle('v16-neutral',!active);
   journal.querySelectorAll('input[name=modeChoice]').forEach(x=>{const label=x.closest('label');if(label){label.classList.toggle('v16-mode-in',x.checked&&isCash&&incoming);label.classList.toggle('v16-mode-out',x.checked&&isCash&&outgoing)}});
  }
  for(const kind of ['in','out']){const p='v13-'+kind,form=$(p+'-form');if(!form)continue;const method=form.querySelector(`input[name="${p}-mode"]:checked`)?.value;
   const cash=method==='treasury';form.classList.toggle('v16-flow-in',cash&&kind==='out');form.classList.toggle('v16-flow-out',cash&&kind==='in');form.classList.toggle('v16-neutral',!cash);
   form.querySelectorAll(`input[name="${p}-mode"]`).forEach(x=>{const label=x.closest('label');if(label){label.classList.toggle('v16-mode-in',x.checked&&cash&&kind==='out');label.classList.toggle('v16-mode-out',x.checked&&cash&&kind==='in')}});
  }
 }
 function docIdFor(kind){const p='v13-'+kind,acct=$(p+'-account')?.value.trim(),editing=C.state.hwEdit;
  if(editing){return C.records.find(r=>r.transferId===editing&&r.hawalaRole==='principal')?.documentNo||'در حال ویرایش'}
  if(!acct)return 'حساب صراف را انتخاب کنید';
  return C.getNextDoc?.(kind,acct)||'ثبت خودکار';
 }
 function previewDoc(kind){const p='v13-'+kind,host=$(`v16-doc-preview-${kind}`);if(!host)return;const account=$(p+'-account')?.value.trim()||'',rule=getRule(account)?.fees?.[$(p+'-currency')?.value];host.innerHTML=`<span>نمبر پیشنهادی: <strong dir="ltr">${S(docIdFor(kind))}</strong></span><span>مفاد خودکار: <strong>${rule&&Number(rule.threshold)>0?S(amount(feeAmount(num($(p+'-amount')?.value),rule),$(p+'-currency')?.value)):'تنظیم نشده'}</strong></span>`}
 function initForms(){for(const kind of ['in','out']){
  const p='v13-'+kind,f=$(p+'-form');if(!f||f.dataset.v16)return;f.dataset.v16='1';const bar=document.createElement('div');bar.className='v16-number-preview v13-full';bar.id=`v16-doc-preview-${kind}`;f.insertBefore(bar,f.firstChild);
  for(const type of ['account','currency','amount']){const field=$(p+'-'+type);if(!field)continue;
   field.addEventListener('input',()=>{if(type==='amount'||type==='currency'||type==='account')recommendFee(kind,type);previewDoc(kind)},false);
   field.addEventListener('change',()=>{recommendFee(kind,type);previewDoc(kind)},false);
  }
  $(p+'-fee')?.addEventListener('input',()=>{previewState[kind].manual=true});
  f.addEventListener('change',paintMode);
  f.addEventListener('reset',()=>{previewState[kind].manual=false;setTimeout(()=>{previewDoc(kind);paintMode()},0)});
  previewDoc(kind);
 }
  const journal=$('entryForm');if(journal){journal.addEventListener('input',paintMode);journal.addEventListener('change',paintMode);journal.addEventListener('reset',()=>setTimeout(paintMode,0));}
  paintMode();syncHawalaFields();
 }
 // A voucher is a single business document with multiple balanced ledger postings.
 const voucherKey=r=>r.transferId||r.documentId||(r.mode==='imported'&&r.documentNo&&r.importFile?`import:${r.importFile}:${r.documentNo}:${r.date}`:String(r.id));
 const voucherHead=r=>C.records.find(x=>x.transferId===r.transferId&&x.hawalaRole==='principal')||r;
 const voucherType=r=>r.mode==='hawala'?(r.hawalaKind==='in'?'حواله وارده':'حواله صادره'):r.mode==='hawala-settlement'?'پرداخت حواله':r.mode==='exchange'?'تبادله':r.mode==='opening'?'بیلانس اولیه':r.mode==='imported'?'سند انتقالی':r.mode==='darak'?'انتقال بین حساب‌ها':'روزنامچه';
 const moneyCell=(lines,type)=>{const totals=new Map();for(const r of lines){const c=cur(r);totals.set(c,(totals.get(c)||0)+C.delta(r))}return [...totals].filter(([,sum])=>type==='payment'?sum>0.000001:sum< -0.000001).map(([c,sum])=>`<span class="v16-money ${type==='payment'?'v16-green':'v16-red'}">${amount(Math.abs(sum),c)}</span>`).join('')||'—'};
 let lastDocAccount='',lastDocSig='';
 function renderAccountVouchers(force=false){const name=C.state.account,detail=$('v13-detail');if(!detail||!name||detail.hidden)return;const isDue=name==='پرداخت نشده',all=C.ledger(C.accountSource(name));
  let block=$('v16-account-vouchers');if(!block){block=document.createElement('section');block.id='v16-account-vouchers';block.className='v16-ledger-card';const menu=$('v13-account-action-menu');menu.insertAdjacentElement('afterend',block);
  block.addEventListener('click',e=>{const b=e.target.closest('[data-v16-voucher],[data-v16-settle]');if(!b)return;if(b.hasAttribute('data-v16-voucher')){
   const id=b.dataset.v16Voucher;if(window.MC15?.openVoucher)window.MC15.openVoucher(id);
   else{const row=C.records.find(r=>String(r.id)===id);alert('سند '+(row?.documentNo||id))}
  }else C.openSettle?.(b.dataset.v16Settle)});
  }
  const sig=[name,C.records.length,C.records.at(-1)?.id,C.state.search,C.state.currency,C.state.from,C.state.to,C.state.sort,C.state.page].join('|');if(!force&&sig===lastDocSig&&name===lastDocAccount)return;lastDocSig=sig;lastDocAccount=name;
  let rows=all.filter(r=>(!C.state.currency||cur(r)===C.state.currency)&&(!C.state.from||r.date>=C.state.from)&&(!C.state.to||r.date<=C.state.to));
  const query=(C.state.search||'').trim().toLowerCase();if(query)rows=rows.filter(r=>[r.note,r.documentNo,r.name,r.senderName,r.receiverName,r.externalId].join(' ').toLowerCase().includes(query));
  if(C.state.sort==='incoming')rows=rows.filter(r=>r.hawalaKind==='in');else if(C.state.sort==='outgoing')rows=rows.filter(r=>r.hawalaKind==='out');
  const groups=new Map();for(const r of rows){const key=voucherKey(r);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)}
  let docs=[...groups.values()].reverse();if(C.state.sort==='id')docs.sort((a,b)=>String(voucherHead(b[0]).documentNo||b[0].id).localeCompare(String(voucherHead(a[0]).documentNo||a[0].id),undefined,{numeric:true}));
  // Pagination at document level, not individual ledger posting level.
  const totalDocs=docs.length;C.state.page=Math.max(1,C.state.page);docs=docs.slice(0,C.state.page*30);
  const content=docs.map(postings=>{const first=postings[0],head=voucherHead(first),bal=[...new Map(postings.map(r=>[cur(r),r.closingBalance])).entries()].map(([c,v])=>`<span class="v16-money">${amount(v,c)}</span>`).join('');return `<tr><td>${S(C.dateText(first.date))}<div class="v16-sub">${S(C.shortId(head))}</div></td><td><b>${S(voucherType(head))}</b><small>${S(head.note||first.note||'—')}</small></td><td class="v16-red">${moneyCell(postings,'debt')}</td><td class="v16-green">${moneyCell(postings,'payment')}</td><td>${bal}</td><td><button type="button" class="v16-small-btn" data-v16-voucher="${S(head.id||first.id)}">مشاهدهٔ سند</button></td></tr>`}).join('');
  block.innerHTML=`<div class="v16-ledger-heading"><div><h3>${isDue?'راپور حواله‌های پرداخت‌نشده':'دفتر اسناد یکپارچه'}</h3><p>${isDue?'نمای پیش‌فرض حساب پرداخت‌نشده: تعهدات معلق و پرداخت‌های مرتبط':'هر شماره سند یک بار نمایش داده می‌شود؛ مفاد و حرکات مرتبط داخل همان سند هستند.'}</p></div><span>${fmt(groups.size)} سند</span></div>${isDue?pendingReport():''}<div class="v16-table-scroll"><table class="v16-ledger-table"><thead><tr><th>تاریخ / آی‌دی</th><th>نوع / تشریحات</th><th class="v16-red">گرفت −</th><th class="v16-green">طلب +</th><th>ماندهٔ ارز</th><th>سند</th></tr></thead><tbody>${content||'<tr><td colspan="6">سندی برای این فیلتر پیدا نشد.</td></tr>'}</tbody></table></div><div class="v17-load-marker" data-v17-account-more>${fmt(docs.length)} از ${fmt(totalDocs)} سند ${docs.length<totalDocs?'· برای ادامه پایین بروید':''}</div>`;
  if(docs.length<totalDocs&&'IntersectionObserver'in window){const marker=block.querySelector('[data-v17-account-more]');const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();C.state.page++;renderAccountVouchers(true)}},{rootMargin:'220px'});if(marker)io.observe(marker)}
  detail.classList.add('v16-ledger-active');detail.classList.toggle('v16-pending-active',isDue);
 }
 function pendingReport(){const data=C.pendingData?.()||[];
  const groups=new Map();for(const x of data){const c=cur(x.r);groups.set(c,(groups.get(c)||0)+x.remaining)};
  const sums=[...groups].map(([c,a])=>`<span class="v16-pending-total">${amount(a,c)}</span>`).join('')||'<span>حوالهٔ معلق وجود ندارد</span>';
  return `<section class="v16-pending-summary"><div class="v16-pending-stats"><strong>ماندهٔ پرداخت‌نشده</strong>${sums}<small>${fmt(data.length)} حواله باز</small></div><div class="v16-pending-list">${data.map(x=>{const r=x.r,paid=Math.max(0,r.amount-x.remaining);return `<div class="v16-pending-item"><div><b>${S(r.documentNo||'—')}</b> <span>${S(C.dateText(r.date))}</span><small>${S(r.receiverName||r.note||'حواله وارده')}</small></div><span class="v16-pending-mount">${amount(x.remaining,cur(r))}<small>${paid>0?'پرداخت قسمی':'پرداخت‌نشده'}</small></span><button class="v16-small-btn v16-pay" data-v16-settle="${S(r.transferId)}">پرداخت</button></div>`}).join('')||'<p>تمام حواله‌های این حساب تسویه شده‌اند.</p>'}</div></section>`;
 }
 let reportPage=1;
 function renderUnifiedReport(){const base=$('v15-report'),account=C.state.reportAccount;if(!base)return;let block=$('v16-voucher-report');if(!block){block=document.createElement('section');block.id='v16-voucher-report';base.append(block);
  block.addEventListener('click',e=>{const btn=e.target.closest('[data-v16-report-open],[data-v16-report-prev],[data-v16-report-next]');if(!btn)return;
   if(btn.dataset.v16ReportOpen){window.MC15?.openVoucher?.(btn.dataset.v16ReportOpen)}
   if(btn.hasAttribute('data-v16-report-prev'))reportPage=Math.max(1,reportPage-1);
   if(btn.hasAttribute('data-v16-report-next'))reportPage++;
   renderUnifiedReport();
  });block.addEventListener('change',e=>{if(e.target.id==='v16-report-count'){reportSize=Number(e.target.value)||20;reportPage=1;renderUnifiedReport()}});
 }
 if(!account){block.innerHTML='';return}
 const rows=window.MC15?.readReport?.()||[],grouped=new Map();
 for(const r of rows){const key=voucherKey(r);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r)}
 const docs=[...grouped.values()];reportPage=Math.max(1,reportPage);
 const html=docs.slice(0,reportPage*30).map(postings=>{const first=postings[0],h=voucherHead(first);
   const balances=[...new Map(postings.map(r=>[cur(r),r.closingBalance])).entries()].map(([c,v])=>`<span class="v16-money">${amount(v,c)}</span>`).join('');
   return `<tr><td>${S(C.dateText(first.date))}<small>${S(C.shortId(h))}</small></td><td>${S(voucherType(h))}<small>${S(h.note||first.note||'—')}</small></td><td>${moneyCell(postings,'debt')}</td><td>${moneyCell(postings,'payment')}</td><td>${balances||'—'}</td><td><button type="button" class="v16-small-btn" data-v16-report-open="${S(h.id||first.id)}">جزئیات</button></td></tr>`;
 }).join('');
 block.innerHTML=`<div class="v16-ledger-heading"><div><h3>راپور سندهای یکتا</h3><p>مفاد، مبلغ حواله و ثبت خزانه از یک شماره سند باز می‌شوند. جزئیات هر ثبت در داخل سند محفوظ است.</p></div><span>${fmt(docs.length)} سند</span></div><div class="v16-table-scroll"><table class="v16-ledger-table"><thead><tr><th>تاریخ / آی‌دی</th><th>نوع و تشریحات</th><th class="v16-red">گرفت</th><th class="v16-green">طلب</th><th>مانده‌ها</th><th>سند</th></tr></thead><tbody>${html||'<tr><td colspan="6">در این فیلتر سندی یافت نشد.</td></tr>'}</tbody></table></div><div class="v17-load-marker" data-v17-report-more>${fmt(Math.min(reportPage*30,docs.length))} از ${fmt(docs.length)} سند ${reportPage*30<docs.length?'· برای ادامه پایین بروید':''}</div>`;
 if(reportPage*30<docs.length&&'IntersectionObserver'in window){const marker=block.querySelector('[data-v17-report-more]');const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();reportPage++;renderUnifiedReport()}},{rootMargin:'220px'});if(marker)io.observe(marker)}
 base.classList.add('v16-report-active');
 }
 function dashboardRefresh(){const host=$('v15-quickbar')?.querySelector('.v15-actions')||$('v14-dashboard')?.querySelector('.v14-welcome');if(!host||$('v16-refresh'))return;
  const b=document.createElement('button');b.type='button';b.id='v16-refresh';b.className='v16-refresh';b.textContent='⟳ تازه‌سازی';b.title='فقط نمایش حساب‌ها را تازه می‌کند؛ بدون خروج از حساب یا نیاز به اینترنت';host.append(b);
  b.onclick=()=>{const txt=b.textContent;b.disabled=true;b.textContent='✓ تازه شد';C.render();C.onPage?.('dashboard');setVersion();b.disabled=false;setTimeout(()=>{if(b.isConnected)b.textContent=txt},750)};
 }
 function wireAccount(){const root=$('page-accounts');if(!root)return;
  root.addEventListener('click',e=>{if(e.target.closest('[data-open-account]'))setTimeout(()=>{lastDocSig='';renderAccountVouchers(true)},0)});
  root.addEventListener('input',e=>{if(e.target.matches('#v13-detail-search,#v13-detail-sort,#v13-detail-from,#v13-detail-to'))setTimeout(()=>renderAccountVouchers(true),0)});
  root.addEventListener('change',e=>{if(e.target.matches('#v13-detail-sort,#v13-detail-from,#v13-detail-to'))setTimeout(()=>renderAccountVouchers(true),0)});
  $('v13-detail-pager')?.addEventListener('click',()=>setTimeout(()=>renderAccountVouchers(true),0));
 }
 function run(){setVersion();bootSettings();initForms();dashboardRefresh();wireAccount();renderUnifiedReport();
  const oldAfter=C.onAfterRender,oldPage=C.onPage;
  C.onAfterRender=()=>{oldAfter?.();setVersion();dashboardRefresh();syncHawalaFields();paintMode();renderAccountVouchers(true);renderUnifiedReport()};
  C.onPage=p=>{oldPage?.(p);setVersion();if(p==='accounts')setTimeout(()=>renderAccountVouchers(true),0);if(p==='dashboard')dashboardRefresh();if(p==='reports')setTimeout(renderUnifiedReport,0);if(p==='hawalaIn'||p==='hawalaOut'){syncHawalaFields();paintMode();previewDoc(p==='hawalaIn'?'in':'out')}};
  document.addEventListener('click',e=>{if(e.target.closest('[data-v13-allreport],[data-v13-navigate],[data-v14-page]'))setTimeout(()=>{setVersion();renderAccountVouchers(true)},10)});
  document.getElementById('page-reports')?.addEventListener('input',()=>{reportPage=1;setTimeout(renderUnifiedReport,0)});
  window.MC16={...window.MC16,refresh:()=>{C.render();setVersion();},pendingReport,voucherKey,config};
 }
 try{run()}catch(e){console.error('دفتر حسابات نسخه ۱۶:',e)}
})();
