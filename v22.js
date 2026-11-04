/* دفتر حسابات 22 — final business-form arrangement.
 * Existing inputs, IDs, event handlers, voucher groups and storage remain intact.
 * Only DOM presentation and missing 'بدون مدرک' registration are completed.
 * Exchange profit/loss is a preview, NOT an unapproved ledger posting.
 */
(()=>{'use strict';
 const C=window.MC14, $=id=>document.getElementById(id);if(!C)return;
 const VERSION='22.0.0';
 const make=(tag,cls)=>{const el=document.createElement(tag);el.className=cls;return el};
 const field=id=>$(id)?.closest('.field')||null;
 const append=(parent,...children)=>children.filter(Boolean).forEach(el=>parent.append(el));
 function rename(id,text){const f=field(id),lab=f?.querySelector('label');if(lab){lab.textContent=text;lab.setAttribute('for',id)}}
 function nextVoucherId(){return String(Math.max(999,...C.records.map(r=>Number(r.displayId)).filter(n=>Number.isSafeInteger(n)&&n>=1000))+1)}
 function syncId(kind){const prefix='v13-'+kind,el=$(prefix+'-visible-id');if(!el)return;
  const editing=C.state.hwEdit;const old=editing?C.records.find(r=>r.transferId===editing&&r.hawalaRole==='principal'):null;
  el.value=old?C.shortId(old):nextVoucherId();
 }
 function methodChoice(name,value,text){const label=document.createElement('label');label.className='v22-mode-choice';label.innerHTML=`<input type="radio" name="${name}" value="${value}"><span>${text}</span>`;return label}
 function hawalaModes(kind){
  const name='v13-'+kind+'-mode',wrap=$('v13-'+kind+'-form')?.querySelector('.v13-mode');if(!wrap)return;
  // Preserve existing checked state and event listeners. New option behaves like the native radios.
  let radios=[...wrap.querySelectorAll(`input[name="${name}"]`)];
  if(!radios.some(x=>x.value==='none')){
   const lbl=methodChoice(name,'none','بدون مدرک');
   lbl.querySelector('input').addEventListener('change',()=>{$('v13-'+kind+'-darak-wrap').hidden=true});
   wrap.append(lbl);radios=[...wrap.querySelectorAll(`input[name="${name}"]`)];
  }
  for(const radio of radios){const label=radio.closest('label');if(label)label.classList.add('v22-mode-choice');
   if(kind==='out'&&radio.value==='unpaid')label?.classList.add('v22-obsolete-mode');
  }
  const ordering=kind==='in'?['darak','none','unpaid','treasury']:['darak','none','treasury'];
  for(const v of ordering){const node=radios.find(r=>r.value===v)?.closest('label');if(node)wrap.append(node)}
  // New documents: incoming is pending; outgoing is treasury. Editing maintains saved mode.
  if(!C.state.hwEdit){const def=kind==='in'?'unpaid':'treasury';const r=radios.find(x=>x.value===def);if(r&&![...radios].some(x=>x.checked&&x.value!==def))r.checked=true}
 }
 function hawala(kind){const prefix='v13-'+kind,form=$(prefix+'-form');if(!form||form.dataset.v22Layout)return;
  form.dataset.v22Layout='1';form.classList.add('v22-form','v22-hawala',kind==='in'?'v22-in':'v22-out');
  hawalaModes(kind);
  const kicker=form.querySelector('.v19-form-kicker');
  const primary=make('div','v22-primary v22-row');
  const secondary=make('div','v22-secondary v22-row');
  const advanced=make('div','v22-advanced');
  const methods=make('div','v22-methods');
  const actions=make('div','v22-actions');
  const docId=make('div','field v22-document-id');
  docId.innerHTML=`<label for="${prefix}-visible-id">آی‌دی</label><input type="text" id="${prefix}-visible-id" readonly aria-label="آی‌دی سند؛ خودکار" tabindex="-1"/>`;
  const fee=make('div','v22-fee-pair');
  append(fee,field(prefix+'-fee'),field(prefix+'-fee-currency'));
  const number=field(prefix+'-number');
  const mode=form.querySelector('.field:has(.v13-mode)');
  const peer=$(`${prefix}-darak-wrap`);
  const submit=form.querySelector('.v13-form-submit');
  const idInputs=[prefix+'-amount',prefix+'-converted'];
  rename(prefix+'-date','تاریخ');rename(prefix+'-account','اسم حساب');rename(prefix+'-rate','نرخ');
  rename(prefix+'-currency','واحد ارز');rename(prefix+'-operation','عملیه');rename(prefix+'-converted','مقدار مبادله');
  rename(prefix+'-converted-currency','واحد ارز');rename(prefix+'-fee','مفاد حواله');
  rename(prefix+'-fee-currency','ارز مفاد');rename(prefix+'-note','تشریحات');
  rename(prefix+'-number',kind==='in'?'شماره وارده':'شماره صادره');
  // Outgoing is the existing "طلب" accounting direction, not an accidental "گرفت" debit.
  rename(prefix+'-amount',kind==='in'?'گرفت':'طلب');
  const idField=docId;idField.classList.add('v22-col-id');
  const group=[idField,field(prefix+'-date'),field(prefix+'-account'),field(prefix+'-amount'),field(prefix+'-currency'),field(prefix+'-rate'),field(prefix+'-operation'),field(prefix+'-converted'),field(prefix+'-converted-currency')];
  group.forEach((f,i)=>f?.classList.add('v22-col-'+['id','date','account','amount','currency','rate','operation','converted','target-currency'][i]));
  append(primary,...group);
  const sarraf=kind==='out'?field(prefix+'-sarraf-fee'):null;
  append(secondary,fee,sarraf,number,field(prefix+'-note'));
  const retained=[...form.children].filter(n=>n!==kicker&&n!==mode&&n!==peer&&n!==submit&&n!==primary&&n!==secondary&&n!==advanced&&n!==methods&&n!==actions&&n.classList?.contains('field'));
  retained.forEach(node=>advanced.append(node));
  append(methods,mode,peer);
  append(actions,submit);
  append(form,primary,secondary,advanced,methods,actions);
  if(kicker)form.insertBefore(kicker,primary);
  form.querySelectorAll('.v19-form-kicker small,.v19-kicker-mark').forEach(el=>el.remove());
  // Keep the form's existing listeners; changing account, mode, date and money still fires them.
  form.addEventListener('reset',()=>setTimeout(()=>syncId(kind),30));
  syncId(kind);
 }
 function journal(){const form=$('entryForm');if(!form||form.dataset.v22Layout)return;
  form.dataset.v22Layout='1';form.classList.add('v22-form','v22-journal');
  const stack=form.querySelector('.journal-stack');if(!stack)return;
  const row=make('div','v22-journal-primary v22-row');
  const methods=make('div','v22-methods');
  const date=field('date'),name=field('name'),note=field('note');
  append(row,date,name,stack.querySelector('.amount-row'),note);
  append(methods,stack.querySelector('.mode-block'),$('darakPick'));
  append(stack,row,methods);
  rename('note','تشریحات');
 }
 function exchange(){const form=$('exchangeForm');if(!form||form.dataset.v22Layout)return;
  form.dataset.v22Layout='1';form.classList.add('v22-form','v22-exchange');
  const primary=make('div','v22-exchange-primary v22-row');
  const secondary=make('div','v22-exchange-secondary v22-row');
  const methods=make('div','v22-methods');
  const actions=make('div','v22-actions');
  const fromPair=field('exchangeFromAmount')?.closest('.exchange-pair');
  const toPair=field('exchangeToAmount')?.closest('.exchange-pair');
  const rateControl=$('exchangeRateInput')?.closest('.exchange-rate-controls');
  const rate=field('exchangeRateInput'),operation=rateControl?.querySelector(':scope > div:not(.field)');
  rename('exchangeFromAccount','اسم حساب');rename('exchangeFromAmount','گرفت');rename('exchangeFromCurrency','واحد ارز');
  rename('exchangeRateInput','نرخ');rename('exchangeToAmount','مقدار مبادله');rename('exchangeToCurrency','واحد ارز');
  rename('exchangeDate','تاریخ');rename('exchangeNote','تشریحات');
  const opWrapper=make('div','v22-operation');
  if(operation)opWrapper.append(operation);
  append(primary,field('exchangeDate'),field('exchangeFromAccount'),field('exchangeFromAmount'),field('exchangeFromCurrency'),rate,opWrapper,field('exchangeToAmount'),field('exchangeToCurrency'));
  // The original wrappers can be removed once their actual inputs have been moved.
  for(const wrap of [fromPair,toPair,rateControl])if(wrap&&wrap.childElementCount===0)wrap.remove();
  const profit=make('div','field v22-profit-field');
  profit.innerHTML='<label>مفاد صرافی (محاسبهٔ خرید / فروش)</label><output id="v22-exchange-profit" class="v22-profit-result" aria-live="polite">—</output>';
  append(secondary,profit,field('exchangeNote'));
  const mode=form.querySelector('.mode-block'),peer=$('exchangeDarakPick');
  append(methods,mode,peer);
  for(const inp of form.querySelectorAll('input[name="exchangeModeChoice"][value="none"]'))inp.closest('label')?.classList.add('v22-obsolete-mode');
  append(actions,$('exchangeSubmit'),$('exchangeCancel'));
  const header=form.querySelector('.v19-form-kicker');
  append(form,primary,secondary,methods,actions);
  if(header)form.insertBefore(header,primary);
  for(const id of ['exchangeFromAmount','exchangeToAmount','exchangeRateInput','exchangeFromCurrency','exchangeToCurrency']){
   $(id)?.addEventListener('input',updateExchangeProfit);
   $(id)?.addEventListener('change',updateExchangeProfit);
  }
  form.addEventListener('reset',()=>setTimeout(updateExchangeProfit,40));
  updateExchangeProfit();
 }
 // Exchanging USD -> AFN at a buying rate yields estimated gross spread
 // (configured selling rate - executed buying rate) * amount of USD.
 // AFN -> USD is the analogous sell: (executed selling - configured buying)*USD.
 // No invented P&L is posted to the ledger; only this displayed estimate is computed.
 function exchangeProfit(){
  const a=C.parsedAmount($('exchangeFromAmount')?.value||''),b=C.parsedAmount($('exchangeToAmount')?.value||'');
  const from=$('exchangeFromCurrency')?.value,to=$('exchangeToCurrency')?.value;
  if(!(a>0&&b>0))return {text:'مبلغ و نرخ را وارد کنید.',type:'neutral'};
  if(from===to)return {text:'۰ '+(to||'AFN')+' · ارز یکسان',type:'neutral'};
  let unit, actual,volume,orientation;
  if(to==='AFN'&&from!=='AFN'){unit=from;actual=b/a;volume=a;orientation='buy'}
  else if(from==='AFN'&&to!=='AFN'){unit=to;actual=a/b;volume=b;orientation='sell'}
  else return {text:'محاسبهٔ مفاد برای این جفت ارز نیازمند نرخ خرید و فروش مرجع است.',type:'neutral'};
  const rules=C.settings.ratesV14?.[unit],buy=Number(rules?.buy),sell=Number(rules?.sell);
  if(!(buy>0&&sell>0)||Math.abs(buy-1)<1e-9&&Math.abs(sell-1)<1e-9){return {text:`نرخ خرید و فروش ${unit} را در تنظیمات شرکت تعیین کنید.`,type:'neutral'}}
  const result=(orientation==='buy'?sell-actual:actual-buy)*volume;
  const label=result>0.005?'مفاد تخمینی':result<-.005?'ضرر تخمینی':'مفاد / ضرر صفر';
  return {text:`${label}: ${C.fmt(Math.abs(result))} AFN`,type:result>.005?'positive':result<-.005?'negative':'neutral',value:result};
 }
 function updateExchangeProfit(){const box=$('v22-exchange-profit');if(!box)return;
  const result=exchangeProfit();box.textContent=result.text;box.className='v22-profit-result v22-profit-'+result.type;
 }
 function labelUpdates(){
  document.title='دفتر حسابات';
  if($('appVersion'))$('appVersion').textContent=VERSION;
  document.querySelectorAll('.v14-version').forEach(e=>e.hidden=true);
  document.querySelectorAll('.v14-brand span').forEach(e=>e.textContent='مدیریت حرفه‌ای صرافی');
  document.querySelectorAll('.v15-dash-heading small').forEach(e=>e.textContent='مدیریت حرفه‌ای صرافی');
  for(const e of document.querySelectorAll('.v15-stat-row button span,.v14-metric span:not(.v14-metric-icon)')){
   if((e.textContent||'').includes('تعهدات پرداخت'))e.textContent='پرداخت نشده';
  }
  // Footer watermark in the main page is intentionally untouched.
  document.querySelectorAll('.v14-sidebar-foot').forEach(el=>el.remove());
  const heading=$('v16-account-vouchers')?.querySelector('.v16-ledger-heading h3');
  if(heading?.textContent?.includes('راپور حواله‌های پرداخت‌نشده'))heading.textContent='اسناد پرداخت نشده';
 }
 function sync(){labelUpdates();syncId('in');syncId('out');updateExchangeProfit()}
 function init(){hawala('in');hawala('out');journal();exchange();sync();
  const prevAfter=C.onAfterRender,prevPage=C.onPage;
  C.onAfterRender=()=>{prevAfter?.();sync()};
  C.onPage=p=>{prevPage?.(p);sync()};
  document.addEventListener('change',e=>{if(e.target.matches('input[name="v13-in-mode"],input[name="v13-out-mode"]')){
   for(const kind of ['in','out']){const p='v13-'+kind;if(e.target.name===p+'-mode')$(p+'-darak-wrap').hidden=e.target.value!=='darak'}
  }});
  window.MC22={VERSION,exchangeProfit};
 }
 try{init()}catch(e){console.error('دفتر حسابات ۲۲:',e)}
})();
