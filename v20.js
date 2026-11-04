/* دفتر حسابات ۲۰ — اسناد یکپارچه و فورم‌های چندردیفه.
   Only UI metadata and NEW journal postings are changed. Historical records are NOT rewritten.
*/
(()=>{'use strict';
const C=window.MC14,$=id=>document.getElementById(id);if(!C)return;
const ver='20.0.0';
function title(){document.title='دفتر حسابات';if($('appVersion'))$('appVersion').textContent=ver;}
// Number sequences are independent for each sarraf and for inbound/outbound remittances.
function syncNumbers(kind){
 const p='v13-'+kind,input=$(p+'-number'),name=$(p+'-account')?.value.trim();if(!input)return;
 const editing=C.state.hwEdit;
 if(editing){const original=C.records.find(r=>r.transferId===editing&&r.hawalaRole==='principal');input.value=original?.documentNo||input.value;input.readOnly=true;return;}
 input.readOnly=false;if(!name){input.value='';return}
 if(input.dataset.manual==='1')return;
 input.value=C.getNextDoc?.(kind,name)||'1';
}
function numberField(kind){
 const p='v13-'+kind,form=$(p+'-form'),account=$(p+'-account');if(!form||!account||$(p+'-number'))return;
 const field=document.createElement('div');field.className='field v20-slot v20-doc-number';
 field.innerHTML=`<label for="${p}-number">نمبر ${kind==='in'?'حواله وارده':'حواله صادره'}</label><input id="${p}-number" type="text" inputmode="numeric" autocomplete="off" maxlength="15" placeholder="شماره خودکار" required aria-label="نمبر عددی حواله"/>`;
 const parent=account.closest('.field');parent.insertAdjacentElement('afterend',field);
 const input=$(p+'-number');
 input.addEventListener('input',()=>{input.value=input.value.replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/\D/g,'');input.dataset.manual='1'});
 account.addEventListener('change',()=>{input.dataset.manual='0';syncNumbers(kind)});
 form.addEventListener('reset',()=>{input.dataset.manual='0';setTimeout(()=>syncNumbers(kind),0)});
 syncNumbers(kind);
}
function fieldClass(form,id,slot){const el=$(id);if(!el)return;const field=el.closest('.field');if(field&&form.contains(field))field.classList.add('v20-field-'+slot)}
function hawalaLayout(kind){
 const p='v13-'+kind,form=$(p+'-form');if(!form)return;
 numberField(kind);
 form.classList.add('v20-hawala-layout');
 for(const [id,slot] of Object.entries({account:'account',number:'number',date:'date',amount:'amount',currency:'currency',rate:'rate',operation:'operation',converted:'converted','converted-currency':'converted-currency',fee:'fee','fee-currency':'fee-currency',note:'note',darak:'darak'}))fieldClass(form,p+'-'+id,slot);
 // Card layout has no non-functional helper text; the actual description entry stays.
 form.querySelectorAll('.v19-same-hint,.v16-number-preview,.v13-floating-note,.v15-hawala-extra').forEach(el=>el.remove());
 const kicker=form.querySelector('.v19-form-kicker');kicker?.querySelector('small')?.remove();kicker?.querySelector('.v19-kicker-mark')?.remove();
 const peerHelp=form.querySelector('.v17-peer-fee small');if(peerHelp)peerHelp.remove();
 if($('v13-'+kind+'-darak-wrap'))$('v13-'+kind+'-darak-wrap').classList.add('v20-field-darak');
 const method=form.querySelector('.field:has(.v13-mode)');if(method)method.classList.add('v20-field-mode');
 form.querySelector('.v13-form-submit')?.classList.add('v20-form-submit');
 for(const f of [...form.children])if(f.classList?.contains('v15-hawala-extra'))f.classList.add('v20-form-extras');
}
function otherLayouts(){
 const journal=$('entryForm');journal?.classList.add('v20-journal-layout');
 const exchange=$('exchangeForm');exchange?.classList.add('v20-exchange-layout');
 for(const form of [journal,exchange]){form?.querySelector('.v19-form-kicker small')?.remove();form?.querySelector('.v19-kicker-mark')?.remove()}
 $('page-exchange')?.querySelector('.exchange-title>.small')?.remove();
}
function restoreVisible(){
 for(const kind of ['in','out']){hawalaLayout(kind);syncNumbers(kind)}
 otherLayouts();title();
 // Hide obsolete pin buttons in all account fields, as requested.
 document.querySelectorAll('.v17-pin').forEach(el=>el.remove());
}
function ensurePending(){
 const detail=$('v13-detail');
 if(C.state.account==='پرداخت نشده'&&detail&&!detail.hidden&&!$('v14-pending'))C.showPage('accounts');
}
function init(){restoreVisible();
 document.body.addEventListener('click',e=>{if(e.target.closest('[data-open-account]'))setTimeout(ensurePending,0)});
 const originalOpen=C.openAccount;C.openAccount=name=>{originalOpen(name);setTimeout(ensurePending,0)};

 const oldRender=C.onAfterRender,oldPage=C.onPage;
 C.onAfterRender=()=>{oldRender?.();restoreVisible();ensurePending()};
 C.onPage=page=>{oldPage?.(page);restoreVisible()};
 window.MC20={VERSION:ver,syncNumbers};
}
try{init()}catch(err){console.error('دفتر حسابات ۲۰:',err)}
})();
