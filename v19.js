/* دفتر حسابات ۱۹ — same-currency invariant, treasury-only funds guard, client-friendly forms.
 * Non-destructive: never rewrites or migrates earlier vouchers.
 * A transferId is ONE business voucher; ledger postings remain separate by account.
 */
(()=>{'use strict';
 const C=window.MC14,$=id=>document.getElementById(id);if(!C)return;
 const VERSION='19.0.0';
 const epsilon=1e-7;
 const number=n=>Number(n)||0;
 // Match the physical treasury projection used by v13.accountSource('خزانه').
 function cashEffect(r){
  const amount=number(r?.amount);
  if(r?.name==='خزانه'){
   if(r.mode==='hawala-settlement')return -amount;
   if(r.mode==='opening')return amount;
   if(Number.isFinite(r.ledgerDelta))return Number(r.ledgerDelta);
   if(Number.isFinite(r.cashDirection))return Math.sign(r.cashDirection)*amount;
   return C.delta(r);
  }
  // A noncash customer entry hits the physical treasury only in treasury mode.
  if(r?.mode==='treasury'||(r?.mode==='exchange'&&r.exchangeMode==='treasury'))return C.delta(r);
  return 0;
 }
 function treasuryProjection(rows){const m=new Map();for(const r of rows){const d=cashEffect(r);if(Math.abs(d)<epsilon)continue;const cur=r.currency||'AFN';m.set(cur,(m.get(cur)||0)+d)}return m}
 function shortfall(current,added,removed){
  const cash=new Map(current),old=treasuryProjection(removed),incoming=treasuryProjection(added);
  const currencies=new Set([...old.keys(),...incoming.keys()]);
  for(const cur of currencies){
   const change=number(incoming.get(cur))-number(old.get(cur));
   // Do not block unchanged/positive cash or ANY non-treasury account—even if an old cash balance is negative.
   if(change>=-epsilon)continue;
   const available=number(cash.get(cur))-number(old.get(cur));
   const need=-change;
   if(available+epsilon<need)return {currency:cur,available,required:need,missing:need-available};
  }
  return null;
 }
 function checkCashBatch(add=[],remove=[],action='ثبت سند'){
  const current=new Map(C.actualBalances('خزانه'));
  const issue=shortfall(current,add,remove);
  if(!issue)return true;
  const msg=`⚠️ موجودی خزانه کافی نیست\nعملیات: ${action}\nارز: ${issue.currency}\nموجودی خزانه: ${C.fmt(issue.available)} ${issue.currency}\nمبلغ مورد نیاز: ${C.fmt(issue.required)} ${issue.currency}\nمقدار کمبود: ${C.fmt(issue.missing)} ${issue.currency}\nسند ثبت نشد.`;
  alert(msg);return false;
 }
 // Retain old integration points. Both current and legacy write paths call this shared guard.
 window.MC18={...(window.MC18||{}),effect:cashEffect,checkCashBatch};
 function syncSameCurrency(kind){
  const p='v13-'+kind,from=$(p+'-currency'),to=$(p+'-converted-currency'),rate=$(p+'-rate'),operation=$(p+'-operation'),converted=$(p+'-converted'),amount=$(p+'-amount'),form=$(p+'-form');
  if(!from||!to||!form)return;
  const same=from.value===to.value;
  form.classList.toggle('v19-same-currency',same);
  if(rate)rate.disabled=same;
  if(operation)operation.disabled=same;
  if(same){rate.value='1';operation.value='multiply';const a=C.parsedAmount(amount.value);converted.value=a>0?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(a):'';converted.readOnly=true}
  else converted.readOnly=false;
  const hint=$(p+'-amount-hint');if(hint)hint.remove();
 }
 function adornForm(kind){
  const p='v13-'+kind,form=$(p+'-form');if(!form)return;
  form.classList.add('v19-hawala-form');
  const fields=[...form.children].filter(x=>x.classList?.contains('field')&&!x.querySelector('.v13-mode')&&!x.id.endsWith('-darak-wrap'));
  form.style.setProperty('--v19-cols',String(fields.length));
  if(!$(p+'-form-eyebrow')){
   const node=document.createElement('div');node.id=p+'-form-eyebrow';node.className='v19-form-kicker';
   node.innerHTML=`<span class="v19-kicker-icon">${kind==='in'?'↙':'↗'}</span><span><strong>فرم ${kind==='in'?'حواله وارده':'حواله صادره'}</strong><small>ثبت دقیق، سند یکتا و محاسبهٔ یکپارچهٔ مبلغ</small></span><span class="v19-kicker-mark">${kind==='in'?'INCOMING':'OUTGOING'}</span>`;
   form.prepend(node);
  }
  for(const id of ['currency','converted-currency','amount'])$(p+'-'+id)?.addEventListener('input',()=>syncSameCurrency(kind));
  for(const id of ['currency','converted-currency'])$(p+'-'+id)?.addEventListener('change',()=>syncSameCurrency(kind));
  form.addEventListener('reset',()=>setTimeout(()=>syncSameCurrency(kind),0));
  syncSameCurrency(kind);
 }
 function addAppTitle(){
  document.title='دفتر حسابات — نسخه ۱۹';
  if($('appVersion'))$('appVersion').textContent=VERSION;
  document.querySelectorAll('.v14-version').forEach(x=>x.textContent='نسخه ۱۹');
 }
 function installOtherFormHeaders(){
  for(const [id,text,desc,mark] of [['entryForm','روزنامچه','ثبت گرفت و طلب در یک سند','JOURNAL'],['exchangeForm','تبادله اسعار','ثبت تبدیل ارز با نرخ دقیق و یک سند یکتا','EXCHANGE']]){
   const form=$(id);if(!form||form.querySelector('.v19-form-kicker'))continue;
   const header=document.createElement('div');header.className='v19-form-kicker';header.innerHTML=`<span class="v19-kicker-icon">≋</span><span><strong>${text}</strong><small>${desc}</small></span><span class="v19-kicker-mark">${mark}</span>`;form.prepend(header);
  }
 }
 function init(){adornForm('in');adornForm('out');installOtherFormHeaders();addAppTitle();
  const after=C.onAfterRender,page=C.onPage;
  C.onAfterRender=()=>{after?.();addAppTitle();syncSameCurrency('in');syncSameCurrency('out')};
  C.onPage=n=>{page?.(n);addAppTitle();if(n==='hawalaIn')syncSameCurrency('in');if(n==='hawalaOut')syncSameCurrency('out')};
  window.MC19={VERSION,cashEffect,treasuryProjection,shortfall,checkCashBatch,syncSameCurrency};
 }
 try{init()}catch(e){console.error('دفتر حسابات نسخه ۱۹',e)}
})();
