/* دفتر حسابات ۱۸ — unified-document UI and treasury safety. Original v17 remains intact. */
(()=>{'use strict';
 const C=window.MC14,$=id=>document.getElementById(id);if(!C)return;
 // Each transfer/remittance is a single document identified by transferId;
 // its internal postings are deliberately retained for accurate per-account balances.
 function effect(r){
  if(r.name==='خزانه'){
   if(r.mode==='opening')return Number(r.amount)||0;
   if(r.mode==='hawala-settlement')return -(Number(r.amount)||0);
   return Number.isFinite(r.ledgerDelta)?Number(r.ledgerDelta):Number.isFinite(r.cashDirection)?Number(r.cashDirection)*Number(r.amount||0):C.delta(r);
  }
  if(r.mode==='treasury'||(r.mode==='exchange'&&r.exchangeMode==='treasury'))return C.delta(r);
  return 0;
 }
 function checkCashBatch(add=[],remove=[],action='ثبت سند'){
  const balances=new Map(C.actualBalances('خزانه'));
  const currencies=new Set([...add,...remove].map(r=>r.currency||'AFN'));
  for(const cur of currencies){
   const current=Number(balances.get(cur)||0);
   const old=remove.filter(r=>(r.currency||'AFN')===cur).reduce((n,r)=>n+effect(r),0);
   const incoming=add.filter(r=>(r.currency||'AFN')===cur).reduce((n,r)=>n+effect(r),0);
   const needed=Math.max(0,-incoming),available=current-old;
   if(available+incoming < -0.000001){
    alert(`⚠️ موجودی خزانه کافی نیست\nعملیات: ${action}\nارز: ${cur}\nموجودی قابل استفاده: ${C.fmt(available)} ${cur}\nمبلغ مورد نیاز: ${C.fmt(needed)} ${cur}\nکمبود: ${C.fmt(Math.max(0,needed-available))} ${cur}`);
    return false;
   }
  }
  return true;
 }
 window.MC18={checkCashBatch,effect};
 function update(){document.title='دفتر حسابات — نسخه ۱۸';if($('appVersion'))$('appVersion').textContent='18.0.0';document.querySelectorAll('.v14-version').forEach(x=>x.textContent='نسخه ۱۸');}
 function pendingInsideAccount(){const pending=$('v14-pending'),detail=$('v13-detail');if(!pending||!detail)return;
  if(C.state.account==='پرداخت نشده'&&!detail.hidden){pending.classList.add('v18-pending-inside');const header=$('v13-detail-balances');if(header&&pending.parentElement!==detail)header.insertAdjacentElement('afterend',pending)}else pending.remove();
 }
 function decorate(){update();document.querySelectorAll('.v13-hawala-in,.v13-hawala-out').forEach(e=>e.classList.add('v18-horizontal-form'));pendingInsideAccount();}
 // Restore the unpaid list only within the account sheet; do not display it in the accounts overview.
 const oldAfter=C.onAfterRender;C.onAfterRender=()=>{oldAfter?.();decorate()};
 const oldPage=C.onPage;C.onPage=p=>{oldPage?.(p);decorate()};
 document.body.addEventListener('click',e=>{if(e.target.closest('[data-open-account]'))setTimeout(decorate,40)});
 decorate();
})();
