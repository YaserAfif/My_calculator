/* دفتر حسابات v24 — single-file JavaScript bundle. Keep the original execution order. */
if (typeof document === 'undefined') {
/* ===== PWA service worker (runs only in service-worker context) ===== */
const CACHE_NAME = 'mycalc-v24-2-cloud-sync-v1';
const ASSETS = ['./','./index.html','./app.js','./style.css','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon.svg'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('mycalc-v13-preview-')||k.startsWith('mycalc-v14-')||k.startsWith('mycalc-v15-')||k.startsWith('mycalc-v16-')||k.startsWith('mycalc-v17-')||k.startsWith('mycalc-v18-')||k.startsWith('mycalc-v19-')||k.startsWith('mycalc-v20-')||k.startsWith('mycalc-v21-')||k.startsWith('mycalc-v22-')||k.startsWith('mycalc-v23-')||k.startsWith('mycalc-v24-'))&&k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
  return response;
 }).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});

} else {
/* ===== License configuration ===== */
// Public, browser-safe configuration. Never use a service_role or secret key here.
window.APP_LICENSE_CONFIG = {
  supabaseUrl: 'https://mwiqghudgpexdezejcdb.supabase.co',
  publicAnonKey: 'sb_publishable_RCERhHo9huOHlFy2oZaf_Q_NIjVd_OR',
  functionName: 'license',
};

window.LICENSE_ENABLED=true;window.LICENSE_CAN_WRITE=false;

/* ===== Main application from index.html ===== */
function syncAmountFields(active){const got=$('gotAmount'),talab=$('talabAmount');const g=got.value.trim()!=='';const t=talab.value.trim()!=='';got.disabled=t;talab.disabled=g;got.setAttribute('aria-label','مبلغ گرفت');talab.setAttribute('aria-label','مبلغ طلب');}

function latinDigits(value){return String(value??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٫]/g,'.').replace(/[٬،,\s]/g,'').replace(/[^0-9.]/g,'')}
function parsedAmount(value){const n=Number(latinDigits(value));return Number.isFinite(n)?n:NaN}
function formatAmountTyping(value){let clean=latinDigits(value);let parts=clean.split('.');const whole=(parts.shift()||'').replace(/^0+(?=\d)/,'');const decimals=parts.join('').slice(0,2);return (whole?whole.replace(/\B(?=(\d{3})+(?!\d))/g,','):'')+(clean.includes('.')?'.'+decimals:'')}
for(const id of ['gotAmount','talabAmount']){const input=document.getElementById(id);input.addEventListener('input',()=>{const before=input.value,position=input.selectionStart??before.length,prior=formatAmountTyping(before.slice(0,position));input.value=formatAmountTyping(before);try{input.setSelectionRange(prior.length,prior.length)}catch(e){};syncAmountFields()})}
const $=id=>document.getElementById(id);
const menuToggle=document.getElementById('menuToggle'),mainMenu=document.getElementById('mainMenu');function closeMenu(){mainMenu.classList.remove('open');menuToggle.classList.remove('open');menuToggle.setAttribute('aria-expanded','false')}menuToggle.addEventListener('click',()=>{const open=!mainMenu.classList.contains('open');mainMenu.classList.toggle('open',open);menuToggle.classList.toggle('open',open);menuToggle.setAttribute('aria-expanded',String(open))});document.addEventListener('click',e=>{if(!e.target.closest('.menu-shell'))closeMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
// Keep floating control within the visible viewport while mobile keyboard is open.
function positionFloatingMenu(){const vv=window.visualViewport;if(!vv)return;const obscured=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);const bottom=Math.max(18,obscured+12);document.querySelector('.menu-shell').style.bottom=bottom+'px';const nav=document.getElementById('mainMenu');nav.style.maxHeight=Math.max(130,Math.min(350,vv.height-105))+'px'}
if(window.visualViewport){window.visualViewport.addEventListener('resize',positionFloatingMenu);window.visualViewport.addEventListener('scroll',positionFloatingMenu)}window.addEventListener('resize',positionFloatingMenu);positionFloatingMenu();
function resetAmountFields(){ $('gotAmount').value='';$('talabAmount').value='';syncAmountFields(); }
for(const id of ['gotAmount','talabAmount']){const el=$(id);el.addEventListener('input',()=>syncAmountFields());el.addEventListener('focus',()=>syncAmountFields());el.addEventListener('blur',()=>setTimeout(()=>syncAmountFields(),0));}
const APP_VERSION='24.2.0';const DEFAULT_ACCOUNTS=['خزانه','مصارف','پرداخت نشده'];
let CURRENCIES_KEY='hesabket.currencies.v8';let currencies=['AFN','USD','PKR'];let STORAGE_KEY='hesabket.records.v1', ACCOUNTS_KEY='hesabket.accounts.v3', SETTINGS_KEY='hesabket.settings.v3';let accounts=[],settings={calendar:'jalali',theme:'light',title:'دفتر حسابات',accent:'green'};let records=[];
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}$('date').value=today();
function makeId(){return globalThis.crypto?.randomUUID?.()||String(Date.now())+Math.random()}
// A signed amount has one meaning everywhere: positive = طلب, negative = گرفت.
// Existing remittance roles retain their historical meaning, even if the old type flag was reversed.
function recordDelta(r){
 const a=Number(r.amount)||0;
 if(Number.isFinite(r.cashDelta))return Number(r.cashDelta);
 if(Number.isFinite(r.ledgerDelta))return Number(r.ledgerDelta);
 if(r.mode==='opening')return a;
 if(r.mode==='hawala'){
  if(r.hawalaRole==='principal')return (r.hawalaKind==='in'?1:-1)*a;
  if(r.hawalaRole==='settlement')return (r.name==='پرداخت نشده'?1:(r.hawalaKind==='in'?-1:1))*a;
  if(r.hawalaRole==='fee-deduction'||r.hawalaRole==='fee-peer-debit')return -a;
  if(['fee-cash','fee-profit','fee-peer-credit','fee-treasury','fee-sarraf-credit','fee-sarraf-cash'].includes(r.hawalaRole))return a;
 }
 if(r.mode==='hawala-settlement')return -a;
 return (r.type==='payment'?1:-1)*a;
}
function numericVoucherId(r){
 if(Number.isSafeInteger(Number(r?.displayId))&&Number(r.displayId)>=1000)return String(r.displayId);
 const key=String(r?.transferId||r?.documentId||r?.id||'');
 const list=records.map(x=>String(x.transferId||x.documentId||x.id||''));
 return String(1000+list.indexOf(key));
}
function assignVoucherIds(){
 const used=new Set(records.map(x=>Number(x.displayId)).filter(x=>Number.isSafeInteger(x)&&x>=1000));
 const groups=new Map();for(const r of records){const k=String(r.transferId||r.documentId||r.id);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
 let next=Math.max(999,...used)+1;
 for(const rows of groups.values()){let id=rows.map(x=>Number(x.displayId)).find(x=>Number.isSafeInteger(x)&&x>=1000);if(!id){while(used.has(next))next++;id=next++;used.add(id)}for(const row of rows)row.displayId=id;}
}

function load(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');const arr=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.transactions)?raw.transactions:[]);records=arr.filter(r=>r&&typeof r.name==='string'&&Number.isFinite(Number(r.amount??r.price))).map(r=>({...r,id:r.id||makeId(),name:r.name.trim(),type:r.type==='payment'?'payment':'debt',amount:Math.abs(Number(r.amount??r.price)),date:r.date||today(),note:String(r.note||''),mode:r.mode||'none',createdAt:r.createdAt||new Date().toISOString(),currency:r.currency||'AFN',transferId:r.transferId||null,counterAccount:r.counterAccount||'',exchangeSide:r.exchangeSide||'',exchangePeerCurrency:r.exchangePeerCurrency||'',exchangeAccount:r.exchangeAccount||'',exchangeRate:Number(r.exchangeRate)||null,exchangeOperation:r.exchangeOperation==='divide'?'divide':'multiply',exchangeMode:['treasury','none','darak'].includes(r.exchangeMode)?r.exchangeMode:null,cashDirection:r.cashDirection===null||r.cashDirection===undefined?null:Number(r.cashDirection),ledgerDelta:Number.isFinite(r.ledgerDelta)?r.ledgerDelta:null}));}catch(e){records=[]}}
function save(){if(!window.LICENSE_CAN_WRITE)return false;try{assignVoucherIds();localStorage.setItem(STORAGE_KEY,JSON.stringify(records));window.DH_SYNC?.localChanged();return true}catch(e){$('status').textContent='ذخیره‌سازی ناموفق بود؛ فضای مرورگر را بررسی کن.';return false}}
function fmt(n){return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(n)||0)}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function getCustomers(currencyFilter="AFN"){const map=new Map();for(const a of accounts){const key=a.name.trim().toLocaleLowerCase();map.set(key,{key,name:a.name,debt:0,payment:0,balance:0,count:0})}for(const r of records.filter(r=>(r.currency||"AFN")===currencyFilter)){const key=r.name.trim().toLocaleLowerCase();if(!map.has(key))map.set(key,{key,name:r.name,debt:0,payment:0,balance:0,count:0});const c=map.get(key);const delta=recordDelta(r);if(delta>=0)c.payment+=delta;else c.debt-=delta;c.balance=c.payment-c.debt;c.count++}return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'fa'))}
function balanceAfterEach(source=records){const balances=new Map();return source.map(r=>{const k=r.name.trim().toLocaleLowerCase()+'|'+(r.currency||'AFN'),prev=balances.get(k)||0,bal=prev+recordDelta(r);balances.set(k,bal);return {...r,balance:bal}})}
function statusHTML(balance){if(balance>0)return `<span class="pill pill-credit">طلبکار: ${fmt(balance)}</span>`;if(balance<0)return `<span class="pill pill-debt">بدهکار: ${fmt(Math.abs(balance))}</span>`;return `<span class="pill pill-paid">تصفیه شده</span>`}

const paginationState={};
function initPagination(){
 for(const key of ['accountsRows','customerRows','customerReportRows','reportRows','transactionRows']){
   paginationState[key]={page:1,size:30};
   $('pageSize-'+key).addEventListener('change',e=>{
     paginationState[key].size=Number(e.target.value)||20;
     paginationState[key].page=1;
     refreshPaginated(key);
   });
 }
 document.querySelectorAll('[data-pager]').forEach(button=>button.addEventListener('click',()=>{
   const key=button.dataset.pager;
   paginationState[key].page+=Number(button.dataset.step);
   refreshPaginated(key);
 }));
}
function refreshPaginated(key){
 if(key==='customerReportRows')renderCustomerReportRows();
 else if(key==='reportRows')renderReport();
 else render();
}
function pageReset(key){if(paginationState[key])paginationState[key].page=1}
function renderPage(key,rows,toHtml){
 const state=paginationState[key]||{page:1,size:30};
 state.page=Math.max(1,state.page);state.size=30;
 const count=Math.min(rows.length,state.page*30);
 $(key).innerHTML=rows.slice(0,count).map(toHtml).join('');
 const wrap=$('pagination-'+key);if(wrap)wrap.style.display='none';
 const host=$(key).closest('.tablewrap')||$(key).parentElement;
 let marker=$('v17-more-'+key);
 if(!marker){marker=document.createElement('div');marker.id='v17-more-'+key;marker.className='v17-load-marker';host.insertAdjacentElement('afterend',marker)}
 marker.textContent=count+' از '+rows.length+' سند'+(count<rows.length?' · برای ادامه پایین بروید':'');
 marker.hidden=rows.length<=30;
 if(count<rows.length&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();state.page++;refreshPaginated(key)}},{rootMargin:'220px'});io.observe(marker)}
}

initPagination();

function render(){
 const allCurrencies=[...new Set([...currencies,...records.map(r=>r.currency||'AFN')])];
 $('dashboardCurrencySummary').innerHTML=allCurrencies.map(cur=>{const cs=getCustomers(cur),active=cs.filter(c=>c.count),debt=active.reduce((s,c)=>s+Math.max(0,-c.balance),0),credit=active.reduce((s,c)=>s+Math.max(0,c.balance),0),treasury=records.filter(r=>(r.currency||'AFN')===cur&&(r.mode==='treasury'||(r.mode==='exchange'?(r.exchangeMode==='treasury'||(!r.exchangeMode&&r.name==='خزانه')):false))).reduce((s,r)=>s+recordDelta(r),0);
 return `<div class="currency-summary-card"><span class="currency-token" style="background:${currencyColor(cur)}">${esc(cur)}</span><div class="mini-values"><div><span class="small">بدهکاری</span><strong class="red">${fmt(debt)}</strong></div><div><span class="small">طلب</span><strong class="blue">${fmt(credit)}</strong></div></div><div class="treasury-amount">تغییرات خزانه: <span dir="ltr">${fmt(treasury)}</span> ${esc(cur)}</div></div>`}).join('');
 $('dashboardCountSummary').textContent=`${fmt(accounts.length)} حساب • ${fmt(records.length)} ثبت`; 
 const cq=$('searchCustomers').value.trim().toLocaleLowerCase();
 const sumRows=[];for(const cur of allCurrencies){for(const c of getCustomers(cur)){if(c.count&&c.name.toLocaleLowerCase().includes(cq))sumRows.push({c,cur})}}
 sumRows.sort((a,b)=>a.c.name.localeCompare(b.c.name,'fa')||a.cur.localeCompare(b.cur));
 renderPage('customerRows',sumRows,({c,cur})=>`<tr><td>${esc(c.name)}</td><td><span class="currency-token" style="background:${currencyColor(cur)}">${esc(cur)}</span></td><td class="amount">${fmt(c.debt)}</td><td class="amount">${fmt(c.payment)}</td><td>${statusHTML(c.balance)} <button class="secondary account-summary-action" data-report="${esc(c.key)}" data-report-currency="${esc(cur)}" type="button">راپور</button></td></tr>`);
 $('customersEmpty').style.display=sumRows.length?'none':'block';
 const reportName=$('reportAccount').value.trim().toLocaleLowerCase(),selectedCurrency=$('reportCurrency').value;
 const tx=balanceAfterEach(records.filter(r=>r.name.trim().toLocaleLowerCase()===reportName&&(r.currency||'AFN')===selectedCurrency));
 const q=$('searchTransactions').value.trim().toLocaleLowerCase();
 const ts=tx.map((r,i)=>({...r,index:i})).filter(r=>r.name.toLocaleLowerCase().includes(q)||r.note.toLocaleLowerCase().includes(q)).reverse();
 renderPage('transactionRows',ts,r=>`<tr><td>${fmt(r.index+1)}</td><td>${esc(r.name)}</td><td><span class="${r.type==='payment'?'type-talab':'type-got'}">${r.type==='payment'?'طلب':'گرفت'}</span></td><td class="amount ${r.type==='payment'?'type-talab':'type-got'}">${r.type==='payment'?'+':'−'}${fmt(r.amount)} ${esc(r.currency||'AFN')}</td><td>${esc(displayDate(r.date))}</td><td>${statusHTML(r.balance)}</td><td>${esc(r.note||'—')} ${r.mode==='darak'?`<div class="small">درک: ${esc(r.counterAccount||'—')}</div>`:''}</td><td><div class="rowbuttons"><button class="secondary" data-edit="${esc(r.id)}" type="button">ویرایش</button><button class="danger" data-delete="${esc(r.id)}" type="button">حذف</button></div></td></tr>`);
 $('transactionsEmpty').style.display=ts.length?'none':'block';renderAccounts();renderReport();
}
$('entryForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const name=$('name').value.trim(),currency=$('currency').value,mode=$('entryMode').value,gotRaw=$('gotAmount').value,paidRaw=$('talabAmount').value,amount=parsedAmount(gotRaw||paidRaw),date=$('date').value||today(),type=gotRaw?'debt':'payment',note=$('note').value.trim(),editId=$('editId').value;
 const counterAccount=mode==='darak'?$('darakAccount').value:'';
 if(!name||!accounts.some(a=>a.name===name)||(!gotRaw&&!paidRaw)||(gotRaw&&paidRaw)||!Number.isFinite(amount)||amount<=0||!date||!currencies.includes(currency)){$('status').textContent='حساب، مبلغ معتبر، ارز و تاریخ را بررسی کن.';return}
 if(mode==='darak'&&(!counterAccount||counterAccount===name||!accounts.some(a=>a.name===counterAccount))){$('status').textContent='برای درک، یک حساب دیگر انتخاب کن.';return}
 const previous=records;
 let next=[...records],base;
 if(editId){const original=next.find(r=>String(r.id)===String(editId));if(!original){$('status').textContent='معامله برای ویرایش پیدا نشد.';cancelEdit();return}
   next=next.filter(r=>r.id!==original.id&&!(original.transferId&&r.transferId===original.transferId));
   base={...original,name,type,amount,date,note,mode,currency,counterAccount:mode==='darak'?counterAccount:'',transferId:mode==='darak'?(original.transferId||makeId()):null,cashDirection:mode==='treasury'?(type==='payment'?1:-1):null};
 }else{base={id:makeId(),name,type,amount,date,note,mode,currency,createdAt:new Date().toISOString(),transferId:mode==='darak'?makeId():null,counterAccount:mode==='darak'?counterAccount:'',cashDirection:mode==='treasury'?(type==='payment'?1:-1):null}}
 next.push(base);
 if(mode==='darak')next.push({id:makeId(),name:counterAccount,type:type==='debt'?'payment':'debt',amount,date,note,mode,currency,createdAt:base.createdAt,transferId:base.transferId,counterAccount:name});
 const journalAdded=next.filter(r=>!previous.includes(r)), journalRemoved=previous.filter(r=>!next.includes(r));
 if(window.MC18&&!window.MC18.checkCashBatch(journalAdded,journalRemoved,'روزنامچه')){$('status').textContent='موجودی خزانه کافی نیست.';return}
 if(window.MC21&&!await window.MC21.authorizeBackdate(journalAdded,journalRemoved,'روزنامچه')){$('status').textContent='ثبت تغییرات خزانه در تاریخ گذشته تأیید نشد.';return}
 records=next;
 if(!save()){records=previous;return}
 render();$('entryForm').reset();$('date').value=today();setMode('treasury');resetAmountFields();cancelEdit();updateJalaliPreview();syncAccountCombos();$('status').textContent=mode==='darak'?'انتقال بین هر دو حساب ثبت شد.':editId?'تغییرات ذخیره شد.':'معامله ثبت شد.';
});
function cancelEdit(){ $('editId').value=''; $('editingNote').style.display='none'; $('submitEntry').textContent='＋ ثبت در دفتر حساب'; $('cancelEdit').style.display='none'; }
$('cancelEdit').addEventListener('click',()=>{cancelEdit();$('entryForm').reset();$('date').value=today();setMode('treasury');resetAmountFields();updateJalaliPreview();$('status').textContent='ویرایش لغو شد.'});
$('transactionRows').addEventListener('click',e=>{
 const edit=e.target.closest('[data-edit]');
 if(edit){const r=records.find(x=>String(x.id)===edit.dataset.edit);if(!r)return;
   if(r.mode==='exchange'){openExchangeForEdit(r);return}
   showPage('journal');$('editId').value=r.id;$('name').value=r.name;populateDarakAccounts();resetAmountFields();$(r.type==='payment'?'talabAmount':'gotAmount').value=formatAmountTyping(String(r.amount));syncAmountFields();$('date').value=r.date;setMode(r.mode||'none');if(r.mode==='darak')$('darakAccount').value=r.counterAccount||'';setCurrency(r.currency||'AFN');$('note').value=r.note||'';updateJalaliPreview();syncAccountCombos();
   $('editingNote').style.display='block';$('submitEntry').textContent='ذخیره تغییرات';$('cancelEdit').style.display='block';$('status').textContent='';
   $('entryForm').scrollIntoView({behavior:'smooth',block:'start'});return}
 const b=e.target.closest('[data-delete]');if(!b)return;const r=records.find(x=>String(x.id)===b.dataset.delete);if(!r)return;
 if(confirm(`ثبت ${r.type==='payment'?'طلب':'گرفت'} ${fmt(r.amount)} ${r.currency||'AFN'} برای «${r.name}»${r.transferId?' و ثبت مقابل آن در درک':''} حذف شود؟`)){
  const previous=records;records=records.filter(x=>r.transferId?x.transferId!==r.transferId:String(x.id)!==String(r.id));if(!save())records=previous;else render();
 }
});
$('searchCustomers').addEventListener('input',()=>{pageReset('customerRows');render()});$('searchTransactions').addEventListener('input',()=>{pageReset('transactionRows');render()});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}function xEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}function crc32(bytes){let c=-1;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xEDB88320:0)}return(c^-1)>>>0}function zipStore(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];for(const[name,content]of files){const nb=enc.encode(name),data=typeof content==='string'?enc.encode(content):content,crc=crc32(data);const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(nb.length),...u16(0),...nb,...data]);parts.push(local);const cd=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...nb]);central.push(cd);offset+=local.length}const csize=central.reduce((s,x)=>s+x.length,0),count=central.length;const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(count),...u16(count),...u32(csize),...u32(offset),...u16(0)]);return new Blob([...parts,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}function colName(n){let s='';while(n){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s}
let activeReportKey=null;
let activeReportCurrency='AFN';
function renderCustomerReportRows(){
 if(!activeReportKey)return;
 const tx=balanceAfterEach(records.filter(r=>r.name.trim().toLocaleLowerCase()===activeReportKey&&(r.currency||'AFN')===activeReportCurrency));
 renderPage('customerReportRows',tx,r=>`<tr><td>${esc(displayDate(r.date))}</td><td><span class="${r.type==='payment'?'type-talab':'type-got'}">${r.type==='payment'?'طلب':'گرفت'}</span></td><td class="amount">${r.type==='payment'?'+':'−'}${fmt(r.amount)} ${esc(activeReportCurrency)}</td><td>${statusHTML(r.balance)}</td><td>${esc(documentNote(r))}</td></tr>`);
 $('customerReportEmpty').style.display=tx.length?'none':'block';
}
function showCustomerReport(key){
 const cur=$('reportCurrency').value||'AFN';const c=getCustomers(cur).find(x=>x.key===key);if(!c)return;
 activeReportKey=key;activeReportCurrency=cur;pageReset('customerReportRows');
 $('customerReportTitle').textContent='راپور حساب: '+c.name+' — '+cur;
 $('customerReportSummary').innerHTML=`<div class="stats"><div class="stat"><div class="small">مجموع گرفت</div><div class="value red">${fmt(c.debt)}</div><div class="small">${esc(cur)}</div></div><div class="stat"><div class="small">مجموع طلب</div><div class="value green">${fmt(c.payment)}</div><div class="small">${esc(cur)}</div></div><div class="stat"><div class="small">باقی حساب</div><div class="value">${statusHTML(c.balance)}</div></div><div class="stat"><div class="small">تعداد معاملات</div><div class="value">${fmt(c.count)}</div></div></div>`;
 renderCustomerReportRows();$('customerReportCard').style.display='block';$('customerReportCard').scrollIntoView({behavior:'smooth',block:'start'});
}
$('customerRows').addEventListener('click',e=>{const b=e.target.closest('[data-report]');if(!b)return;openAccountReport(b.dataset.report,b.dataset.reportCurrency)});
$('closeCustomerReport').addEventListener('click',()=>{$('customerReportCard').style.display='none';activeReportKey=null});
function exportReportExcel(type='filtered'){
 const isCustomer=type==='customer';
 if(isCustomer&&!activeReportKey){alert('اول حساب را انتخاب کنید.');return}
 const account=isCustomer?accounts.find(a=>a.name.toLocaleLowerCase()===activeReportKey)?.name:$('reportAccount').value;
 const currency=isCustomer?activeReportCurrency:$('reportCurrency').value;
 if(!account){alert('اول حساب مورد نظر را انتخاب کنید.');return}
 const rows=isCustomer?records.filter(r=>r.name.toLocaleLowerCase()===activeReportKey&&(r.currency||'AFN')===currency):filteredReport();
 const ordered=[...rows].sort((a,b)=>a.date.localeCompare(b.date)||String(a.createdAt).localeCompare(String(b.createdAt)));
 const withBalances=balanceAfterEach(ordered);
 const count=ordered.length;
 const got=ordered.filter(r=>r.type==='debt').reduce((s,r)=>s+r.amount,0);
 const talab=ordered.filter(r=>r.type==='payment').reduce((s,r)=>s+r.amount,0);
 const section=isCustomer?'تمام معاملات حساب':$('reportSection').selectedOptions[0]?.textContent||'معاملات حساب';
 const dateRange=isCustomer?'تمام تاریخ‌ها':`${$('reportFrom').value?displayDate($('reportFrom').value):'ابتدا'} تا ${$('reportTo').value?displayDate($('reportTo').value):'امروز'}`;
 const data=[
  {cells:[settings.title+' — صورت‌حساب رسمی'],style:1,merge:true},
  {cells:['حساب: '+account+'    |    ارز: '+currency],style:2,merge:true},
  {cells:['بخش: '+section+'    |    تاریخ گزارش: '+displayDate(today())],style:2,merge:true},
  {cells:['بازه: '+dateRange],style:2,merge:true},
  {cells:[],style:0},
  {cells:['تعداد اسناد',count,'مجموع گرفت',got,'مجموع طلب',talab,'باقی حساب',got-talab],style:6},
  {cells:[],style:0},
  {cells:['ردیف','تاریخ','حساب','نوع ثبت','مبلغ','ارز','طریقه ثبت','باقی حساب','توضیحات'],style:3},
  ...withBalances.map((r,i)=>({cells:[i+1,displayDate(r.date),r.name,r.type==='debt'?'گرفت':'طلب',r.type==='debt'?r.amount:-r.amount,r.currency||'AFN',modeLabel(r.mode,r.exchangeMode),r.balance,documentNote(r)],style:i%2?4:7})),
  {cells:[],style:0},
  {cells:['پایان راپور — تهیه‌شده توسط '+settings.title],style:2,merge:true},
 ];
 const styles=[0,1,2,3,4,5,6,7];
 const rowXML=data.map((row,ri)=>{
   const num=ri+1;const cells=row.cells.map((v,ci)=>{
     const ref=colName(ci+1)+num;
     let style=row.style;if(ci===4||ci===7||(num===6&&ci%2===1))style=5;
     if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}" s="${style}" t="n"><v>${v}</v></c>`;
     return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xEsc(v??'')}</t></is></c>`;
   }).join('');
   return `<row r="${num}" ht="${row.style===1?39:row.style===3?29:25}" customHeight="1">${cells}</row>`;
 }).join('');
 const endRow=data.length;
 const merges=data.map((r,i)=>r.merge?`<mergeCell ref="A${i+1}:I${i+1}"/>`:'').filter(Boolean);
 const styleXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="165" formatCode="#,##0.##;[Red](#,##0.##)"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="19"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FF14543C"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF176B51"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF3EE"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF4F7F5"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFDCE8E0"/></bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
 const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="3" width="26" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/><col min="5" max="5" width="20" customWidth="1"/><col min="6" max="6" width="12" customWidth="1"/><col min="7" max="7" width="17" customWidth="1"/><col min="8" max="8" width="23" customWidth="1"/><col min="9" max="9" width="46" customWidth="1"/></cols><sheetData>${rowXML}</sheetData><mergeCells count="${merges.length}">${merges.join('')}</mergeCells><autoFilter ref="A8:I${Math.max(8,endRow-2)}"/><printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.55" bottom="0.55" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/></worksheet>`;
 const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="صورت حساب" sheetId="1" r:id="rId1"/></sheets></workbook>';
 const contentTypes='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
 const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 const wbRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 download(zipStore([['[Content_Types].xml',contentTypes],['_rels/.rels',rels],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',wbRels],['xl/styles.xml',styleXml],['xl/worksheets/sheet1.xml',sheet]]),`rapor-${currency}-${today()}.xlsx`);
}
$('exportCustomerXlsx').addEventListener('click',()=>exportReportExcel('customer'));
$('exportXlsx').addEventListener('click',()=>exportReportExcel('filtered'));
$('reportXlsx').addEventListener('click',()=>exportReportExcel('filtered'));
function openPrintableReport(isCustomer=false){
 const account=isCustomer?accounts.find(a=>a.name.toLocaleLowerCase()===activeReportKey)?.name:$('reportAccount').value;
 const currency=isCustomer?activeReportCurrency:$('reportCurrency').value;
 if(!account){alert('اول حساب را انتخاب کنید.');return}
 const rows=(isCustomer?records.filter(r=>r.name.toLocaleLowerCase()===activeReportKey&&(r.currency||'AFN')===currency):filteredReport()).sort((a,b)=>a.date.localeCompare(b.date)||String(a.createdAt).localeCompare(String(b.createdAt)));
 const totalGot=rows.reduce((s,r)=>s+(r.type==='debt'?r.amount:0),0),totalPaid=rows.reduce((s,r)=>s+(r.type==='payment'?r.amount:0),0);
 const section=isCustomer?'تمام معاملات حساب':$('reportSection').selectedOptions[0]?.textContent||'تمام معاملات';
 const period=isCustomer?'تمام تاریخ‌ها':`${$('reportFrom').value?displayDate($('reportFrom').value):'ابتدا'} — ${$('reportTo').value?displayDate($('reportTo').value):'امروز'}`;
 const balances=balanceAfterEach(rows);
 const tab=balances.map((r,i)=>`<tr><td>${fmt(i+1)}</td><td>${esc(displayDate(r.date))}</td><td>${esc(r.type==='debt'?'گرفت':'طلب')}</td><td dir="ltr">${fmt(r.amount)}</td><td>${esc(modeLabel(r.mode,r.exchangeMode))}</td><td dir="ltr">${fmt(r.balance)}</td><td class="note">${esc(documentNote(r))}${r.mode==='darak'?'<div>درک: '+esc(r.counterAccount||'—')+'</div>':''}</td></tr>`).join('');
 const doc=`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>راپور ${esc(account)} — ${esc(currency)}</title><style>
 @page{size:A4 landscape;margin:14mm 13mm 16mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#20322a;font:12px/1.7 Tahoma,Arial,sans-serif;print-color-adjust:exact;-webkit-print-color-adjust:exact}main{max-width:1100px;margin:25px auto;padding:0 20px}.head{display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:3px solid #176b51;padding-bottom:14px}.logo{width:52px;height:52px;background:#176b51;border-radius:12px;color:white;font-size:24px;display:grid;place-items:center;font-weight:bold}h1{margin:0;font-size:23px;color:#176b51}.sub{color:#668477;font-size:11px}.meta{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 15px;margin:17px 0;background:#f0f6f1;padding:12px;border-radius:8px}.meta b{color:#16523c}.totals{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:14px 0}.totals>div{border:1px solid #cfdfd5;border-radius:8px;padding:8px 12px}.totals span{display:block;font-size:11px;color:#62786c}.totals strong{display:block;font-size:17px;direction:ltr;text-align:right}table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:12px}th{background:#176b51;color:white;text-align:right;padding:8px 7px;font-size:11px}td{padding:7px;border-bottom:1px solid #e0eae4;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#f5f9f6}th:first-child,td:first-child{width:6%}th:nth-child(2),td:nth-child(2){width:17%}th:nth-child(3),td:nth-child(3){width:10%}th:nth-child(4),td:nth-child(4){width:14%}th:nth-child(5),td:nth-child(5){width:13%}th:nth-child(6),td:nth-child(6){width:14%}tr{break-inside:avoid}thead{display:table-header-group}.note{white-space:normal}footer{border-top:1px solid #cfdfd5;margin-top:23px;padding:10px 0;text-align:center;color:#789184;font-size:10px}.controls{display:flex;justify-content:center;padding:12px;gap:9px}.controls button{background:#176b51;color:#fff;border:0;border-radius:8px;padding:9px 25px;cursor:pointer}@media print{main{margin:0;max-width:none;padding:0}.controls{display:none}footer{position:static}}
 </style></head><body><div class="controls"><button onclick="window.print()">چاپ یا ذخیره PDF</button><button type="button" onclick="if(window.opener&&!window.opener.closed){window.opener.focus();window.close()}else{location.href='${esc(location.href)}'}" style="background:#eaf2ed;color:#176b51">↩ برگشت / بستن</button></div><main><div class="head"><div><h1>${esc(settings.title)}</h1><div class="sub">صورت‌حساب و راپور اختصاصی</div></div><div class="logo">د</div></div><div class="meta"><div><b>حساب:</b> ${esc(account)}</div><div><b>ارز:</b> ${esc(currency)}</div><div><b>بخش:</b> ${esc(section.trim())}</div><div><b>بازه:</b> ${esc(period)}</div><div><b>تاریخ تهیه:</b> ${esc(displayDate(today()))}</div><div><b>تعداد اسناد:</b> ${fmt(rows.length)}</div></div><div class="totals"><div><span>مجموع گرفت</span><strong>${fmt(totalGot)}</strong></div><div><span>مجموع طلب</span><strong>${fmt(totalPaid)}</strong></div><div><span>باقی حساب</span><strong>${fmt(totalGot-totalPaid)}</strong></div><div><span>واحد ارز</span><strong>${esc(currency)}</strong></div></div><table><thead><tr><th>#</th><th>تاریخ</th><th>نوع</th><th>مبلغ</th><th>طریقه</th><th>باقی حساب</th><th>توضیحات</th></tr></thead><tbody>${tab||'<tr><td colspan="7">سندی موجود نیست</td></tr>'}</tbody></table><footer>طراحی و ساخت: یاسر عفیف • © 2026 تمامی حقوق محفوظ است • afifweb.vercel.app</footer></main></body></html>`;
 const win=window.open('','_blank');
 if(!win){alert('مرورگر پنجره راپور را مسدود کرده است. اجازه Pop-up را فعال کنید.');return}
 win.document.open();win.document.write(doc);win.document.close();win.focus();
}
$('printReport').addEventListener('click',()=>openPrintableReport(false));
$('customerPdf').addEventListener('click',()=>openPrintableReport(true));
$('backup').addEventListener('click',()=>{const data={app:'HesabKet',version:APP_VERSION,exportedAt:new Date().toISOString(),transactions:records,accounts,settings,currencies};download(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),'hesab-ket-backup-'+today()+'.json')});$('restoreBtn').addEventListener('click',()=>$('restoreFile').click());$('restoreFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const obj=JSON.parse(await file.text()),arr=Array.isArray(obj)?obj:(obj.transactions||obj.records);if(!Array.isArray(arr)||!arr.every(r=>r&&typeof r.name==='string'&&Number.isFinite(Number(r.amount??r.price))&&r.date))throw Error('bad');if(!confirm(`تعداد ${arr.length} معامله از پشتیبان جایگزین تمام حساب‌های فعلی شود؟`))return;records=arr.map(r=>({...r,id:r.id||makeId(),name:r.name.trim(),type:r.type==='payment'?'payment':'debt',amount:Math.abs(Number(r.amount??r.price)),date:r.date,note:String(r.note||''),mode:r.mode||'none',createdAt:r.createdAt||new Date().toISOString(),currency:r.currency||'AFN',transferId:r.transferId||null,counterAccount:r.counterAccount||'',exchangeSide:r.exchangeSide||'',exchangePeerCurrency:r.exchangePeerCurrency||'',exchangeAccount:r.exchangeAccount||'',exchangeRate:Number(r.exchangeRate)||null,exchangeOperation:r.exchangeOperation==='divide'?'divide':'multiply',cashDirection:r.cashDirection??null,ledgerDelta:r.ledgerDelta??null}));if(Array.isArray(obj.currencies))currencies=[...new Set(['AFN',...obj.currencies.filter(c=>typeof c==='string'&&/^[A-Z]{2,8}$/.test(c))])];currencies=[...new Set([...currencies,...records.map(r=>r.currency||'AFN')])];if(Array.isArray(obj.accounts))accounts=obj.accounts.filter(a=>a&&typeof a.name==='string');if(obj.settings&&typeof obj.settings==='object')settings={...settings,...obj.settings};saveCurrencies();renderCurrencies();reconcileAccounts();save();persistMeta();applySettings();render();alert('پشتیبان بازیابی شد.')}catch(err){alert('فایل پشتیبان معتبر نیست.')}finally{e.target.value=''}});

function jalali(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return date||'';const d=new Date(date+'T12:00:00');if(Number.isNaN(d.getTime()))return date;return new Intl.DateTimeFormat('fa-AF-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(d).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632))}
function displayDate(date){return settings.calendar==='jalali'?jalali(date):date}
function updateJalaliPreview(){$('jalaliPreview').textContent='تاریخ شمسی: '+jalali($('date').value)}
$('date').addEventListener('change',updateJalaliPreview);
function loadMeta(){try{const a=JSON.parse(localStorage.getItem(ACCOUNTS_KEY)||'[]');accounts=Array.isArray(a)?a:[]}catch(e){accounts=[]}try{settings={...settings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch(e){}}
function persistMeta(){if(!window.LICENSE_CAN_WRITE)return;localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(accounts));localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));window.DH_SYNC?.localChanged()}
function reconcileAccounts(){
 let changed=false;
 for(const n of DEFAULT_ACCOUNTS){
   if(!accounts.some(a=>a.name.trim().toLocaleLowerCase()===n.toLocaleLowerCase())){
     accounts.push({id:makeId(),name:n,phone:'',system:true});changed=true;
   }
 }
 for(const r of records){
   if(!accounts.some(a=>a.name.trim().toLocaleLowerCase()===r.name.trim().toLocaleLowerCase())){
      accounts.push({id:makeId(),name:r.name,phone:''});changed=true;
   }
 }
 if(changed)persistMeta();populateAccounts();
}
// A searchable, verified account selector. Text is not considered an account until
// the user chooses one of the actual account names in the dropdown.
const accountCombos=new Map();
function normalizeAccountSearch(value){return String(value||'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLocaleLowerCase('fa')}
function createAccountCombo(id){
 const select=$(id);if(!select||accountCombos.has(id))return;
 const required=select.required;select.required=false;select.classList.add('account-source');
 const wrap=document.createElement('div');wrap.className='account-combobox';
 const textInput=document.createElement('input');textInput.type='text';textInput.className='account-search';textInput.autocomplete='off';textInput.spellcheck=false;
 textInput.placeholder='نام حساب را جستجو و انتخاب کنید';textInput.required=required;
 textInput.setAttribute('role','combobox');textInput.setAttribute('aria-autocomplete','list');textInput.setAttribute('aria-expanded','false');
 const list=document.createElement('div');list.className='account-options';list.hidden=true;list.id='results-'+id;list.setAttribute('role','listbox');textInput.setAttribute('aria-controls',list.id);
 const symbol=document.createElement('span');symbol.className='search-symbol';symbol.textContent='⌕';symbol.setAttribute('aria-hidden','true');
 wrap.append(textInput,symbol,list);select.insertAdjacentElement('afterend',wrap);
 const state={select,input:textInput,list,wrap};accountCombos.set(id,state);
 function close(){list.hidden=true;textInput.setAttribute('aria-expanded','false')}
 function show(){
  const term=normalizeAccountSearch(textInput.value),values=[...select.options].map(o=>o.value).filter(Boolean),matches=values.filter(v=>normalizeAccountSearch(v).includes(term)).slice(0,40);
  list.replaceChildren();
  if(!matches.length){const msg=document.createElement('div');msg.className='account-no-match';msg.textContent='حساب پیدا نشد';list.append(msg)}
  else for(const value of matches){const option=document.createElement('button');option.type='button';option.className='account-option';option.textContent=value;option.setAttribute('role','option');option.setAttribute('aria-selected',String(select.value===value));option.addEventListener('pointerdown',e=>e.preventDefault());option.addEventListener('click',()=>{select.value=value;textInput.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));close();textInput.focus()});list.append(option)}
  const rect=wrap.getBoundingClientRect(),vp=window.visualViewport,visibleBottom=vp?vp.height+vp.offsetTop:window.innerHeight;
  wrap.classList.toggle('is-up',visibleBottom-rect.bottom<165&&rect.top>180);
  list.hidden=false;textInput.setAttribute('aria-expanded','true');
 }
 textInput.addEventListener('focus',show);
 textInput.addEventListener('input',()=>{select.value='';show()});
 textInput.addEventListener('keydown',e=>{if(e.key==='Escape'){close();textInput.value=select.value||''}else if(e.key==='ArrowDown'){e.preventDefault();if(list.hidden)show();list.querySelector('button')?.focus()}else if(e.key==='Enter'&&!list.hidden){e.preventDefault();list.querySelector('button')?.click()}});
 list.addEventListener('keydown',e=>{if(e.key==='Escape'){close();textInput.focus()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){const buttons=[...list.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);buttons[Math.min(buttons.length-1,Math.max(0,i+(e.key==='ArrowDown'?1:-1)))]?.focus();e.preventDefault()}});
 document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close()});
 textInput.addEventListener('blur',()=>{setTimeout(()=>{if(!wrap.contains(document.activeElement))close()},90)});
 state.sync=()=>{textInput.value=select.value||'';if(!list.hidden)show()};
 state.sync();
}
function syncAccountCombos(){for(const combo of accountCombos.values())combo.sync()}
function initAccountCombos(){for(const id of ['name','darakAccount','exchangeFromAccount','exchangeDarakAccount'])createAccountCombo(id);syncAccountCombos()}
function populateAccounts(){
 const opts=accounts.map(a=>`<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');
 for(const id of ['name','reportAccount']){const el=$(id),old=el.value;el.innerHTML='<option value="">انتخاب حساب...</option>'+opts;el.value=old}
 populateDarakAccounts();populateExchangeAccounts();syncAccountCombos();
}
function populateDarakAccounts(){const target=$('darakAccount'),old=target.value,main=$('name').value;target.innerHTML='<option value="">انتخاب حساب درک...</option>'+accounts.filter(a=>a.name!==main).map(a=>`<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');target.value=old;if(target.selectedIndex<0)target.value='';syncAccountCombos()}
$('name').addEventListener('change',populateDarakAccounts);
function openAccountReport(key,cur){const a=accounts.find(x=>x.name.trim().toLocaleLowerCase()===key);if(!a)return;showPage('reports');$('reportAccount').value=a.name;if(cur&&currencies.includes(cur))$('reportCurrency').value=cur;pageReset('reportRows');pageReset('transactionRows');render();}
function renderAccounts(){
 renderPage('accountsRows',accounts,a=>{const balances=currencies.map(cur=>{const c=getCustomers(cur).find(x=>x.key===a.name.toLocaleLowerCase());return c&&c.count?`<span class="currency-amount-tag"><span class="currency-token" style="background:${currencyColor(cur)}">${esc(cur)}</span>${statusHTML(c.balance)}</span>`:''}).filter(Boolean).join('');
 return `<tr><td>${esc(a.name)} ${DEFAULT_ACCOUNTS.includes(a.name)?'<span class="chip">پیش‌فرض</span>':''}</td><td>${esc(a.phone||'—')}</td><td class="multi-balances">${balances||'بدون معامله'}</td><td><div class="rowbuttons"><button class="secondary" type="button" data-acc-report="${esc(a.name.toLocaleLowerCase())}">راپور</button><button class="danger" type="button" data-acc-del="${esc(a.id)}">حذف</button></div></td></tr>`});
}
$('accountForm').addEventListener('submit',e=>{e.preventDefault();const name=$('accountName').value.trim(),phone=$('accountPhone').value.trim();if(!name)return;if(accounts.some(a=>a.name.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('این حساب قبلاً ثبت شده است.');return}accounts.push({id:makeId(),name,phone});persistMeta();populateAccounts();render();$('accountForm').reset()});
$('accountsRows').addEventListener('click',e=>{const del=e.target.closest('[data-acc-del]'),rep=e.target.closest('[data-acc-report]');if(rep){const key=rep.dataset.accReport;const first=records.find(r=>r.name.toLocaleLowerCase()===key);openAccountReport(key,first?.currency||'AFN');return}if(!del)return;const a=accounts.find(x=>String(x.id)===del.dataset.accDel);if(!a)return;if(DEFAULT_ACCOUNTS.includes(a.name)){alert('این حساب، حساب پیش‌فرض سیستم است و حذف نمی‌شود.');return}if(records.some(r=>r.name.toLocaleLowerCase()===a.name.toLocaleLowerCase())){alert('حساب دارای معامله را نمی‌توان حذف کرد. نخست معاملات مربوط را بررسی کنید.');return}if(confirm('حساب «'+a.name+'» حذف شود؟')){accounts=accounts.filter(x=>x!==a);persistMeta();populateAccounts();render()}});
function modeLabel(mode,exchangeMethod){return mode==='treasury'?'خزانه':mode==='darak'?'درک':mode==='exchange'?'تبادله'+(exchangeMethod?' («'+(exchangeMethod==='treasury'?'خزانه':exchangeMethod==='darak'?'درک':'بدون مدرک')+'»)':''):'بدون مدرک'}
function documentNote(r){let result=r.note||'';if(r.mode==='exchange'){
 const other=records.find(x=>r.transferId&&x.transferId===r.transferId&&x.id!==r.id&&x.mode==='exchange');
 const text='تبادله '+(r.exchangeSide==='out'?'پرداخت':'دریافت')+': '+fmt(r.amount)+' '+(r.currency||'AFN')+(other?' ⇄ '+fmt(other.amount)+' '+(other.currency||'AFN'):'')+(r.exchangeMode==='darak'?' / حساب مقابل: '+(r.exchangeAccount||'—'):'');
 result+=(result?' | ':'')+text;
 }return result||'—'}
function filteredReport(){const name=$('reportAccount').value.toLocaleLowerCase(),section=$('reportSection').value,from=$('reportFrom').value,to=$('reportTo').value;if(!name)return [];return records.filter(r=>r.name.toLocaleLowerCase()===name&&(r.currency||'AFN')===$('reportCurrency').value&&(section==='account'||r.mode===section||(r.mode==='exchange'&&r.exchangeMode===section))&&(!from||r.date>=from)&&(!to||r.date<=to)).sort((a,b)=>a.date.localeCompare(b.date)||String(a.createdAt).localeCompare(String(b.createdAt)))}
function renderReport(){if(!$('reportAccount').value){$('reportSummary').textContent='برای مشاهده راپور، نخست یک حساب انتخاب کنید.';renderPage('reportRows',[],()=> '');renderPage('transactionRows',[],()=> '');$('transactionsEmpty').style.display='block';return}const rows=filteredReport(),got=rows.filter(r=>r.type==='debt').reduce((s,r)=>s+r.amount,0),paid=rows.filter(r=>r.type==='payment').reduce((s,r)=>s+r.amount,0),cash=rows.reduce((s,r)=>s+((r.mode==='treasury'||(r.mode==='exchange'?(r.exchangeMode==='treasury'||(!r.exchangeMode&&r.name==='خزانه')):false))?(r.type==='payment'?r.amount:-r.amount):0),0);$('reportSummary').textContent=`تعداد: ${fmt(rows.length)} | مجموع گرفت: ${fmt(got)} ${$('reportCurrency').value} | مجموع طلب: ${fmt(paid)} ${$('reportCurrency').value} | تغییرات خزانه: ${fmt(cash)} ${$('reportCurrency').value}`;renderPage('reportRows',rows,r=>`<tr><td>${esc(displayDate(r.date))}</td><td>${esc(r.name)}</td><td>${r.type==='payment'?'طلب':'گرفت'}</td><td>${fmt(r.amount)}</td><td>${modeLabel(r.mode)}</td><td>${esc(documentNote(r))}${r.mode==='darak'?`<div class="small">درک: ${esc(r.counterAccount||'—')}</div>`:''}</td></tr>`)}
$('generateReport').addEventListener('click',renderReport);$('reportAccount').addEventListener('change',()=>{pageReset('reportRows');pageReset('transactionRows');render()});$('reportSection').addEventListener('change',()=>{pageReset('reportRows');renderReport()});$('reportCurrency').addEventListener('change',()=>{pageReset('reportRows');pageReset('transactionRows');render()});$('reportFrom').addEventListener('change',()=>{pageReset('reportRows');renderReport()});$('reportTo').addEventListener('change',()=>{pageReset('reportRows');renderReport()});

const accentThemes={green:['#176b51','#176b51'],blue:['#2563eb','#2563eb'],violet:['#7c3aed','#7c3aed'],rose:['#be185d','#be185d'],amber:['#b45309','#b45309'],teal:['#0f766e','#0f766e'],ocean:['#2563eb','linear-gradient(135deg,#2563eb,#06b6d4)'],sunset:['#e11d48','linear-gradient(135deg,#e11d48,#f59e0b)'],forest:['#047857','linear-gradient(135deg,#047857,#0ea5e9)'],royal:['#7c3aed','linear-gradient(135deg,#7c3aed,#db2777)']};
let pendingAccent=null;
function applyAccent(name){const theme=accentThemes[name]||accentThemes.green;document.body.style.setProperty('--green',theme[0]);document.body.style.setProperty('--accent-gradient',theme[1]);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme[0]);document.querySelectorAll('[data-accent]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.accent===name)))}
$('themeColors').addEventListener('click',e=>{const b=e.target.closest('[data-accent]');if(!b)return;pendingAccent=b.dataset.accent;applyAccent(pendingAccent)});
function applySettings(){document.body.classList.toggle('dark',settings.theme==='dark');$('calendarSetting').value=settings.calendar;$('themeSetting').value=settings.theme;$('appTitle').value=settings.title;document.querySelector('header h1').textContent=settings.title;document.title=settings.title;pendingAccent=accentThemes[settings.accent]?settings.accent:'green';applyAccent(pendingAccent);updateJalaliPreview()}
$('saveSettings').addEventListener('click',()=>{settings={...settings,calendar:$('calendarSetting').value,theme:$('themeSetting').value,title:$('appTitle').value.trim()||'دفتر حسابات',accent:pendingAccent||'green'};persistMeta();applySettings();render();alert('تنظیمات ذخیره شد.')});
$('settingsBackup').addEventListener('click',()=>$('backup').click());$('settingsRestore').addEventListener('click',()=>$('restoreBtn').click());
let reportReturnPage='accounts';
function showPage(page){const active=document.querySelector('.page.active')?.id.replace('page-','');if(page==='reports'&&active&&active!=='reports')reportReturnPage=active;closeMenu();document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===page));window.scrollTo({top:0,behavior:'smooth'})}
$('backFromReports').addEventListener('click',()=>showPage(reportReturnPage));
document.querySelectorAll('#mainMenu button[data-page]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showPage(b.dataset.page)}));

function setMode(mode){if(!['treasury','none','darak'].includes(mode))mode='none';$('entryMode').value=mode;document.querySelectorAll('input[name="modeChoice"]').forEach(x=>x.checked=x.value===mode);$('darakPick').hidden=mode!=='darak';if(mode==='darak')populateDarakAccounts();else $('darakAccount').value='';syncAccountCombos()}
document.querySelectorAll('input[name="modeChoice"]').forEach(x=>x.addEventListener('change',()=>setMode(x.value)));
const palette=['#176b51','#1769ae','#a05b15','#7c3fb4','#ad3b64','#237c88','#925a19','#3e648f'];function currencyColor(code){const i=currencies.indexOf(code);return palette[(i<0?0:i)%palette.length]}
function setCurrency(code){if(!currencies.includes(code))code='AFN';$('currency').value=code;$('currencyTrigger').textContent=code+' ▾';$('currencyTrigger').style.background=currencyColor(code);$('currencyList').hidden=true;$('currencyTrigger').setAttribute('aria-expanded','false')}
function saveCurrencies(){if(!window.LICENSE_CAN_WRITE)return;localStorage.setItem(CURRENCIES_KEY,JSON.stringify(currencies));window.DH_SYNC?.localChanged()}
function renderCurrencies(){const curr=$('currency').value,rep=$('reportCurrency').value||'AFN';$('currencyList').innerHTML=currencies.map(c=>`<button type="button" data-cur="${esc(c)}" style="background:${currencyColor(c)}">${esc(c)}</button>`).join('');$('reportCurrency').innerHTML=currencies.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');$('reportCurrency').value=currencies.includes(rep)?rep:'AFN';$('currencyManageList').innerHTML=currencies.map(c=>`<label><span class="currency-token" style="background:${currencyColor(c)}">${esc(c)}</span> ${c==='AFN'?'پیش‌فرض':`<button type="button" data-remove-cur="${esc(c)}" class="danger" style="min-height:30px;padding:4px 8px">حذف</button>`}</label>`).join('');setCurrency(curr);populateExchangeCurrencies()}
$('currencyTrigger').addEventListener('click',()=>{const list=$('currencyList');list.hidden=!list.hidden;$('currencyTrigger').setAttribute('aria-expanded',String(!list.hidden))});$('currencyList').addEventListener('click',e=>{const b=e.target.closest('[data-cur]');if(b)setCurrency(b.dataset.cur)});
document.addEventListener('click',e=>{if(!e.target.closest('.currency-picker')){$('currencyList').hidden=true;$('currencyTrigger').setAttribute('aria-expanded','false')}});
$('addCurrency').addEventListener('click',()=>{const code=$('newCurrency').value.trim().toUpperCase();if(!/^[A-Z]{2,8}$/.test(code)){alert('کد ارز را با ۲ تا ۸ حرف انگلیسی وارد کن.');return}if(currencies.includes(code)){alert('این ارز موجود است.');return}currencies.push(code);saveCurrencies();renderCurrencies();setCurrency(code);render();$('newCurrency').value=''});
$('currencyManageList').addEventListener('click',e=>{const b=e.target.closest('[data-remove-cur]');if(!b)return;const c=b.dataset.removeCur;if(records.some(r=>(r.currency||'AFN')===c)){alert('این ارز معامله دارد و حذف آن مجاز نیست.');return}currencies=currencies.filter(x=>x!==c);saveCurrencies();renderCurrencies();render()});
try{const a=JSON.parse(localStorage.getItem(CURRENCIES_KEY)||'[]');if(Array.isArray(a))currencies=[...new Set(['AFN','USD','PKR',...a.filter(x=>typeof x==='string'&&/^[A-Z]{2,8}$/.test(x))])]}catch(e){}

let deferredInstallPrompt=null;

function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function showInstallHelp(text){const element=$('installHelp');element.hidden=false;element.textContent=text;window.setTimeout(()=>{element.hidden=true},12500)}
function syncInstallButtons(){for(const id of ['settingsInstall']){const b=$(id);if(!b)continue;b.textContent=isStandalone()?'✓ برنامه نصب است':'⬇ نصب برنامه';b.disabled=isStandalone()}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;syncInstallButtons()});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;syncInstallButtons();showInstallHelp('برنامه با موفقیت نصب شد.')});
async function installProgram(){
 if(isStandalone())return;
 if(deferredInstallPrompt){
  const prompt=deferredInstallPrompt;deferredInstallPrompt=null;
  try{await prompt.prompt();const result=await prompt.userChoice;if(result?.outcome==='dismissed')showInstallHelp('نصب لغو شد؛ هر زمان می‌توانی دوباره اقدام کنی.');}catch(e){showInstallHelp('از گزینه نصب برنامه در منوی مرورگر استفاده کن.')}return;
 }
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(ios)showInstallHelp('در Safari دکمه اشتراک‌گذاری (Share) را بزن، سپس Add to Home Screen / افزودن به صفحه اصلی را انتخاب کن. در Chrome آیفون نیز از منوی اشتراک‌گذاری گزینه Add to Home Screen را جست‌وجو کن.');
 else showInstallHelp('در Chrome یا Edge از منوی ⋮ گزینه Install app / نصب برنامه را انتخاب کن. در نسخه‌های پشتیبانی‌شده آیکن نصب کنار نوار آدرس دیده می‌شود.');
}
$('settingsInstall').addEventListener('click',installProgram);
syncInstallButtons();$('appVersion').textContent=APP_VERSION;

/* Currency exchange: two linked ledger entries, different currencies, no silent rate conversion. */
function populateExchangeAccounts(){
 for(const id of ['exchangeFromAccount','exchangeDarakAccount']){
  const el=$(id),old=el.value,from=$('exchangeFromAccount').value;
  const options=accounts.filter(a=>id!=='exchangeDarakAccount'||a.name!==from);
  el.innerHTML='<option value="">انتخاب حساب...</option>'+options.map(a=>`<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');
  el.value=options.some(a=>a.name===old)?old:(id==='exchangeFromAccount'?'خزانه':'');
 }
 syncExchangeDestination();syncAccountCombos();
}
function exchangeMode(){return document.querySelector('input[name="exchangeModeChoice"]:checked')?.value||'treasury'}
function setExchangeMode(mode){
 if(!['treasury','none','darak'].includes(mode))mode='treasury';
 document.querySelectorAll('input[name="exchangeModeChoice"]').forEach(r=>r.checked=r.value===mode);
 $('exchangeDarakPick').hidden=mode!=='darak';
 if(mode!=='darak')$('exchangeDarakAccount').value='';
 syncExchangeDestination();syncAccountCombos();
}
function syncExchangeDestination(){
 const from=$('exchangeFromAccount').value,other=$('exchangeDarakAccount').value;
 const target=$('exchangeToAccount');
 target.value=exchangeMode()==='darak'?other:from;
}
$('exchangeFromAccount').addEventListener('change',()=>{
 const target=$('exchangeDarakAccount'),old=target.value;
 target.innerHTML='<option value="">انتخاب حساب...</option>'+accounts.filter(a=>a.name!==$('exchangeFromAccount').value).map(a=>`<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');
 target.value=old&&old!==$('exchangeFromAccount').value?old:'';
 syncExchangeDestination();syncAccountCombos();
});
$('exchangeDarakAccount').addEventListener('change',syncExchangeDestination);
document.querySelectorAll('input[name="exchangeModeChoice"]').forEach(r=>r.addEventListener('change',()=>setExchangeMode(r.value)));
function populateExchangeCurrencies(){for(const id of ['exchangeFromCurrency','exchangeToCurrency']){const el=$(id),old=el.value;el.innerHTML=currencies.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');el.value=currencies.includes(old)?old:(id==='exchangeToCurrency'?(currencies.find(c=>c!=='AFN')||'AFN'):'AFN')}}
function exchangeDatePreview(){$('exchangeJalali').textContent='تاریخ شمسی: '+jalali($('exchangeDate').value)}
function exchangeOperation(){return document.querySelector('input[name="exchangeOperation"]:checked')?.value==='divide'?'divide':'multiply'}
// Exchange inputs are bidirectional. The field last edited by the user is authoritative.
// Rate precision is intentionally higher than transaction (2 decimals), so a manually
// rounded received amount survives save/edit without introducing a monetary difference.
function formatRateTyping(value){
 const clean=latinDigits(value),parts=clean.split('.');
 const whole=(parts.shift()||'').replace(/^0+(?=\d)/,'');
 const decimals=parts.join('').slice(0,12);
 return (whole?whole.replace(/\B(?=(\d{3})+(?!\d))/g,','):'')+(clean.includes('.')?'.'+decimals:'');
}
function effectiveExchangeRate(amount,received,operation){
 const value=operation==='multiply'?received/amount:amount/received;
 return Number.isFinite(value)&&value>0?Number(value.toFixed(12)):NaN;
}
// v24: edit either side; the chosen operation and rate stay authoritative.
let exchangeLastEdited='amount';
function exchangeRatePreview(changed='rate'){
 const from=$('exchangeFromAmount'),to=$('exchangeToAmount'),rateInput=$('exchangeRateInput');
 const ca=$('exchangeFromCurrency').value,cb=$('exchangeToCurrency').value,op=exchangeOperation();
 if(changed==='amount')exchangeLastEdited='amount';
 if(changed==='received')exchangeLastEdited='received';
 const rate=parsedAmount(rateInput.value),a=parsedAmount(from.value),b=parsedAmount(to.value);
 const money=(el,n)=>{if(Number.isFinite(n)&&n>0)el.value=formatAmountTyping(String(Number(n.toFixed(2))))};
 if(rate>0&&ca!==cb&&changed!=='keep'){
  if(changed==='received'||(changed==='rate'&&exchangeLastEdited==='received')||((changed==='operation'||changed==='currency')&&exchangeLastEdited==='received')){
   if(b>0)money(from,op==='multiply'?b/rate:b*rate);
  }else if(changed==='amount'||changed==='rate'||changed==='operation'||changed==='currency'){
   if(a>0)money(to,op==='multiply'?a*rate:a/rate);
  }
 }
 const received=parsedAmount(to.value),principal=parsedAmount(from.value);
 $('exchangeRate').textContent=principal>0&&received>0&&rate>0&&ca!==cb
 ? `${fmt(principal)} ${ca} ${op==='multiply'?'×':'÷'} ${rateInput.value} ≈ ${fmt(received)} ${cb}`
 : 'مبلغ، نرخ مثبت و دو ارز متفاوت را انتخاب کنید.';
}
function bindExchangeNumericInput(id,formatter,source){
 $(id).addEventListener('input',()=>{
  const el=$(id),before=el.value,position=el.selectionStart??before.length;
  el.value=formatter(before);
  try{const next=formatter(before.slice(0,position)).length;el.setSelectionRange(next,next)}catch(e){}
  exchangeRatePreview(source);
 });
}
bindExchangeNumericInput('exchangeFromAmount',formatAmountTyping,'amount');
bindExchangeNumericInput('exchangeRateInput',formatRateTyping,'rate');
bindExchangeNumericInput('exchangeToAmount',formatAmountTyping,'received');
for(const id of ['exchangeFromCurrency','exchangeToCurrency'])$(id).addEventListener('change',()=>exchangeRatePreview('currency'));
for(const input of document.querySelectorAll('input[name="exchangeOperation"]'))input.addEventListener('change',()=>exchangeRatePreview('operation'));
$('exchangeDate').addEventListener('change',exchangeDatePreview);
function resetExchange(){const edit=$('exchangeEditId');edit.value='';$('exchangeForm').reset();$('exchangeRateInput').value='';$('exchangeToAmount').value='';$('exchangeFromAccount').value='خزانه';setExchangeMode('treasury');$('exchangeFromCurrency').value='AFN';$('exchangeToCurrency').value=currencies.find(c=>c!=='AFN')||'AFN';$('exchangeDate').value=today();$('exchangeSubmit').textContent='ثبت تبادله';$('exchangeCancel').hidden=true;$('exchangeStatus').textContent='';exchangeDatePreview();exchangeRatePreview();syncAccountCombos()}
function openExchangeForEdit(r){const twin=records.find(x=>x.transferId&&x.transferId===r.transferId&&x.id!==r.id&&x.mode==='exchange');if(!twin){alert('ثبت مقابل تبادله پیدا نشد.');return}
 const outgoing=r.exchangeSide==='out'?r:twin,incoming=r.exchangeSide==='in'?r:twin;
 resetExchange();showPage('exchange');$('exchangeEditId').value=outgoing.transferId;$('exchangeFromAccount').value=outgoing.name;const savedMode=outgoing.exchangeMode||(outgoing.name!==incoming.name?'darak':(outgoing.name==='خزانه'?'treasury':'none'));setExchangeMode(savedMode);if(savedMode==='darak'){$('exchangeDarakAccount').value=incoming.name;syncExchangeDestination();}$('exchangeFromCurrency').value=outgoing.currency;$('exchangeToCurrency').value=incoming.currency;$('exchangeFromAmount').value=formatAmountTyping(String(outgoing.amount));$('exchangeRateInput').value=formatRateTyping(String(outgoing.exchangeRate||effectiveExchangeRate(outgoing.amount,incoming.amount,outgoing.exchangeOperation)));$('exchangeToAmount').value=formatAmountTyping(String(incoming.amount));document.querySelector('input[name="exchangeOperation"][value="'+(outgoing.exchangeOperation==='divide'?'divide':'multiply')+'"]').checked=true;exchangeRatePreview('keep');$('exchangeDate').value=outgoing.date;$('exchangeNote').value=outgoing.note||'';$('exchangeSubmit').textContent='ذخیره تغییرات تبادله';$('exchangeCancel').hidden=false;exchangeDatePreview();exchangeRatePreview('keep');syncAccountCombos()}
$('exchangeCancel').addEventListener('click',resetExchange);
$('exchangeForm').addEventListener('submit',async e=>{e.preventDefault();const from=$('exchangeFromAccount').value,to=$('exchangeToAccount').value,ca=$('exchangeFromCurrency').value,cb=$('exchangeToCurrency').value,a=parsedAmount($('exchangeFromAmount').value),b=parsedAmount($('exchangeToAmount').value),rate=parsedAmount($('exchangeRateInput').value),operation=exchangeOperation(),date=$('exchangeDate').value||today(),note=$('exchangeNote').value.trim(),editId=$('exchangeEditId').value;
 const exists=name=>accounts.some(x=>x.name===name);const registrationMode=exchangeMode();
 if(registrationMode==='darak'&&(!to||from===to||!exists(to))){$('exchangeStatus').textContent='برای درک، حساب مقابل دیگری را جستجو و انتخاب کنید.';return}
 if(!exists(from)||!exists(to)||!currencies.includes(ca)||!currencies.includes(cb)||ca===cb||!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(rate)||a<=0||b<=0||rate<=0||!date){$('exchangeStatus').textContent='حساب‌ها، دو ارز متفاوت، تاریخ و مبلغ‌های مثبت را بررسی کنید.';return}
 const prior=records;let next=[...records],id=editId||makeId(),now=new Date().toISOString();if(editId){if(next.filter(r=>r.transferId===editId&&r.mode==='exchange').length!==2){$('exchangeStatus').textContent='اسناد تبادله برای ویرایش کامل نیستند.';return}next=next.filter(r=>r.transferId!==editId)}
 next.push({id:makeId(),name:from,type:'debt',amount:a,date,note,mode:'exchange',currency:ca,createdAt:now,transferId:id,counterAccount:to,exchangeSide:'out',exchangePeerCurrency:cb,exchangeAccount:to,exchangeRate:rate,exchangeOperation:operation,exchangeMode:registrationMode});
 next.push({id:makeId(),name:to,type:'payment',amount:b,date,note,mode:'exchange',currency:cb,createdAt:now,transferId:id,counterAccount:from,exchangeSide:'in',exchangePeerCurrency:ca,exchangeAccount:from,exchangeRate:rate,exchangeOperation:operation,exchangeMode:registrationMode});
 const exchangeAdded=next.filter(r=>!prior.includes(r)), exchangeRemoved=prior.filter(r=>!next.includes(r));
 if(window.MC18&&!window.MC18.checkCashBatch(exchangeAdded,exchangeRemoved,'تبادله')){$('exchangeStatus').textContent='موجودی خزانه کافی نیست.';return}
 if(window.MC21&&!await window.MC21.authorizeBackdate(exchangeAdded,exchangeRemoved,'تبادله')){$('exchangeStatus').textContent='ثبت تغییرات خزانه در تاریخ گذشته تأیید نشد.';return}
 records=next;if(!save()){records=prior;$('exchangeStatus').textContent='خطا در ذخیره تبادله.';return}render();resetExchange();$('exchangeStatus').textContent=editId?'تبادله و مشخصات سند یکپارچه اصلاح شد.':'تبادله با یک سند یکپارچه ثبت شد.';
});
/* Destructive reset: backed by explicit typed confirmation, scoped only to this app. */
$('startClearData').addEventListener('click',()=>{$('clearDataPanel').hidden=false;$('clearDataText').value='';$('confirmClearData').disabled=true;$('clearDataText').focus()});
$('cancelClearData').addEventListener('click',()=>{$('clearDataPanel').hidden=true;$('clearDataText').value=''});
$('clearDataText').addEventListener('input',()=>{$('confirmClearData').disabled=$('clearDataText').value.trim()!=='حذف'});
$('confirmClearData').addEventListener('click',async()=>{if($('clearDataText').value.trim()!=='حذف')return;
 if(!confirm('همهٔ معاملات و حساب‌ها در تمام دستگاه‌های متصل به همین حساب حذف شوند؟ پیش از ادامه پشتیبان بگیرید.'))return;
 try{
  if(window.DH_SYNC)await window.DH_SYNC.clearAll();
  else throw Error('همگام‌سازی فعال نیست؛ برای حذف امن داده‌ها به اینترنت وصل شوید.');
  for(const key of [STORAGE_KEY,ACCOUNTS_KEY,SETTINGS_KEY,CURRENCIES_KEY])localStorage.removeItem(key);
  location.reload();
 }catch(e){alert('حذف انجام نشد: '+e.message)}
});



const legacyStorageKeys={records:'hesabket.records.v1',accounts:'hesabket.accounts.v3',settings:'hesabket.settings.v3',currencies:'hesabket.currencies.v8'};
let currentLicenseUserId=null;
window.licenseSwitchUser=function(uid){
 if(!/^[a-f0-9-]{36}$/i.test(uid)||currentLicenseUserId===uid)return;
 currentLicenseUserId=uid;
 const suffix='.uid.'+uid;
 const scoped={records:legacyStorageKeys.records+suffix,accounts:legacyStorageKeys.accounts+suffix,settings:legacyStorageKeys.settings+suffix,currencies:legacyStorageKeys.currencies+suffix};
 const alreadyScoped=Object.values(scoped).some(key=>localStorage.getItem(key)!==null);
 const existingLegacy=localStorage.getItem(legacyStorageKeys.records)||localStorage.getItem(legacyStorageKeys.accounts);
 const migrationOwner=localStorage.getItem('hesabket.legacy.import-owner.v12');
 if(!alreadyScoped&&existingLegacy&&!migrationOwner){
  if(confirm('حساب‌های قدیمی این دستگاه به حساب کاربری کنونی انتقال داده شوند؟ اطلاعات قدیمی به‌عنوان نسخهٔ پشتیبان باقی می‌مانند.')){
   for(const category of Object.keys(scoped)){
    const val=localStorage.getItem(legacyStorageKeys[category]);if(val!==null)localStorage.setItem(scoped[category],val);
   }
   localStorage.setItem('hesabket.legacy.import-owner.v12',uid);
  }
 }
 STORAGE_KEY=scoped.records;ACCOUNTS_KEY=scoped.accounts;SETTINGS_KEY=scoped.settings;CURRENCIES_KEY=scoped.currencies;
 records=[];accounts=[];settings={calendar:'jalali',theme:'light',title:'دفتر حسابات',accent:'green'};currencies=['AFN'];
 load();loadMeta();try{const a=JSON.parse(localStorage.getItem(CURRENCIES_KEY)||'[]');if(Array.isArray(a))currencies=[...new Set(['AFN','USD','PKR',...a.filter(x=>typeof x==='string'&&/^[A-Z]{2,8}$/.test(x))])]}catch{}
 currencies=[...new Set([...currencies,...records.map(r=>r.currency||'AFN')])];
 renderCurrencies();reconcileAccounts();resetExchange();applySettings();render();
};

load();loadMeta();const discovered=records.map(r=>r.currency||'AFN').filter(c=>/^[A-Z]{2,8}$/.test(c));currencies=[...new Set([...currencies,...discovered])];saveCurrencies();renderCurrencies();initAccountCombos();setMode('treasury');reconcileAccounts();resetExchange();applySettings();render();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./app.js').catch(()=>{}));


/* ===== Scripts v13 (execution order preserved) ===== */
/* دفتر حسابات 13 — account workspace and inward/outward remittances.
 * © 2026 Yaser Afif. No payment/identity secrets are embedded in the client.
 * Data format is additive; previous records and accounts are preserved.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const alphabet=['#439b7a','#2384cd','#f7a941','#8c6ccc','#d77c7b','#21968a'];
const names={exchange:'تبادله',darak:'درک',treasury:'خزانه',none:'بدون مدرک',hawala:'حواله'};
const state={account:'',currency:'',search:'',from:'',to:'',sort:'date',page:1,pageSize:30,reportAccount:'',reportCurrency:'',reportFrom:'',reportTo:'',reportPage:1,reportSize:30,hwEdit:'',hwKind:'in'};
let visibleAccountRecords=[],visibleReportRecords=[];
const categories=['مشتری','صراف','شرکت','بانک','کاربر','خزانه','مصارف','سایر'];
const label=e=>e==='debt'?'گرفت':'طلب';
const norm=s=>String(s||'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/\s+/g,' ').trim().toLocaleLowerCase('fa');
const allCurrencies=()=>[...new Set([...currencies,...records.map(r=>r.currency||'AFN')])];
const currentAccount=()=>accounts.find(a=>a.name===state.account);
const safe=s=>esc(s);
const ordered=rows=>rows.map((r,i)=>({...r,__originalOrder:i})).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||a.__originalOrder-b.__originalOrder);
// v16 canonical ledger: signed movements for cash and unpaid are explicit, and
// never inferred by reversing debtor/creditor signs from ordinary accounts.
const signedMovement=r=>recordDelta(r);
const ledger=rows=>{const m=new Map();return ordered(rows).map(r=>{const key=r.currency||'AFN',v=(m.get(key)||0)+signedMovement(r);m.set(key,v);return {...r,closingBalance:Math.round(v*1000000)/1000000}})};
const cashSign=r=>{
 if(Number.isFinite(r.cashDirection))return Math.sign(r.cashDirection)*Number(r.amount||0);
 if(Number.isFinite(r.ledgerDelta))return Number(r.ledgerDelta);
 // Legacy hawala and initial-cash postings already use 'debt' for cash-in.
 if(r.mode==='hawala'||r.mode==='hawala-settlement'||r.mode==='opening')return recordDelta(r);
 // A direct journal receipt ('طلب') is physical cash-in, 'گرفت' cash-out.
 return (r.type==='payment'?1:-1)*Number(r.amount||0);
};
const accountSource=name=>{
 const direct=records.filter(r=>r.name===name);
 if(name==='خزانه'){
  const cashRows=direct.map(r=>{const delta=cashSign(r);return {...r,cashDelta:delta,type:delta>=0?'payment':'debt'};});
  const derived=records.filter(r=>r.name!=='خزانه'&&(r.mode==='treasury'||(r.mode==='exchange'&&r.exchangeMode==='treasury'))).map(r=>{const delta=recordDelta(r);return {...r,name:'خزانه',cashOrigin:r.name,cashDelta:delta,type:delta>=0?'payment':'debt',note:'اثر خزانه: '+r.name+(r.note?' — '+r.note:'')};});
  return [...cashRows,...derived];
 }
 if(name==='پرداخت نشده')return direct.map(r=>{const delta=r.mode==='hawala'&&r.hawalaRole==='settlement'?Number(r.amount||0):r.mode==='hawala-settlement'?-Number(r.amount||0):recordDelta(r);return {...r,cashDelta:delta,type:delta>=0?'payment':'debt',pendingProjection:true}});
 return direct.map(r=>{const delta=recordDelta(r);return {...r,cashDelta:delta,type:delta>=0?'payment':'debt'}});
};
const actualBalances=name=>{const m=new Map();for(const r of accountSource(name)){const cur=r.currency||'AFN';m.set(cur,(m.get(cur)||0)+signedMovement(r))}return [...m.entries()].map(([cur,v])=>[cur,Math.round(v*1000000)/1000000]);};
const dateText=v=>displayDate(v);
const methods={in:'حواله وارده',out:'حواله صادره'};
const currencyTag=cur=>`<span class="currency-token" style="background:${currencyColor(cur)}">${safe(cur)}</span>`;
function balanceMarkup(name,clickable=true){const values=actualBalances(name);return values.length?values.map(([cur,v])=>`<${clickable?"button":"span"} type="button" class="v13-balance ${v>=0?'is-positive':'is-negative'}" ${clickable?`data-currency-report="${safe(cur)}" data-account="${safe(name)}"`:""}>${currencyTag(cur)} <strong dir="ltr">${fmt(Math.abs(v))}</strong> ${name==='پرداخت نشده'?'در انتظار پرداخت':v>0?'طلبکار':v<0?'بدهکار':'تصفیه'}</${clickable?"button":"span"}>`).join(''):'<span class="small">بدون معامله</span>';}
function makeCategories(){return categories.map(x=>`<option value="${safe(x)}">${safe(x)}</option>`).join('')}
function dashboard(){return `<section class="v13-panel" id="v13-home"><div class="v13-top"><h2>حساب‌های داشبورد</h2><button class="v13-button" type="button" data-v13-settings>شخصی‌سازی ⚙</button></div><div class="v13-accounts" id="v13-home-list"></div></section>`}
function accountsView(){return `<section class="v13-panel"><div class="v13-top"><h2>حساب‌ها</h2><button type="button" class="primary" id="v13-open-new" style="width:auto;margin:0">＋ افزودن حساب</button></div><div id="v13-create" hidden><form id="v13-create-form" class="v13-forms"><div class="field v13-full"><label>نام حساب</label><input id="v13-new-name" required maxlength="100" placeholder="نام مشتری یا صراف یا شرکت"/></div><div class="field"><label>دسته‌بندی</label><select id="v13-new-category">${makeCategories()}</select></div><div class="field"><label>شماره تماس (اختیاری)</label><input id="v13-new-phone" maxlength="50"/></div><div class="field"><label>ایمیل (اختیاری)</label><input id="v13-new-email" type="email" maxlength="160"/></div><div class="field v13-full"><label>آدرس (اختیاری)</label><input id="v13-new-address" maxlength="260"/></div><button class="primary v13-full" type="submit">ذخیره حساب</button></form></div><div class="v13-toolbar"><input id="v13-account-search" placeholder="⌕ جستجو نام حساب..."/><select id="v13-account-category"><option value="">تمام دسته‌ها</option>${makeCategories()}</select></div><div class="v13-accounts" id="v13-account-list"></div><div class="v13-pager" id="v13-account-pager"></div></section>
<section class="v13-panel" id="v13-detail" hidden><div class="v13-account-head"><div><h2 id="v13-detail-title"></h2><div class="v13-hint" id="v13-detail-meta"></div></div><button class="v13-button" id="v13-back-accounts" type="button">↩ بازگشت</button></div><div class="v13-balances" id="v13-detail-balances"></div><div class="v13-actions"><button type="button" class="v13-button" data-v13-allreport>راپور تمام ارزها</button><button type="button" class="v13-button" id="v13-share-balance">شریک‌سازی بیلانس</button><button type="button" class="v13-button" id="v13-account-edit">ویرایش حساب</button></div><div class="v13-toolbar"><input id="v13-detail-search" placeholder="جستجو در معاملات..."/><select id="v13-detail-sort"><option value="date">تاریخ / آی‌دی</option><option value="id">آی‌دی</option><option value="incoming">شماره وارده</option><option value="outgoing">شماره صادره</option></select></div><div class="v13-filters"><input id="v13-detail-from" type="date" aria-label="از تاریخ"/><input id="v13-detail-to" type="date" aria-label="تا تاریخ"/></div><div class="v13-account-buttons" id="v13-account-action-menu" style="margin-top:10px"></div><div class="v13-report-table-wrap"><table class="v13-doc-table"><thead><tr><th>تاریخ / سند</th><th>تشریحات</th><th>گرفت</th><th>طلب</th><th>مانده حساب</th><th>عملیات</th></tr></thead><tbody id="v13-detail-body"></tbody></table></div><div class="v13-pager" id="v13-detail-pager"></div></section>`}
function reportView(){return `<section class="v13-panel" id="v13-report-card"><div class="v13-top"><h2>راپور حساب</h2><button class="v13-button" type="button" id="v13-report-back">↩ برگشت</button></div><div class="v13-filters"><select id="v13-report-account" aria-label="حساب"><option value="">انتخاب حساب...</option></select><select id="v13-report-currency" aria-label="ارز"><option value="">تمام ارزها</option></select><input type="date" id="v13-report-from" aria-label="از تاریخ"/><input type="date" id="v13-report-to" aria-label="تا تاریخ"/></div><div class="v13-actions"><button class="v13-button" id="v13-report-print">چاپ / PDF</button><button class="v13-button" id="v13-report-excel">خروجی Excel</button></div><div id="v13-report-summary" class="v13-balance-summary"></div><div class="v13-report-table-wrap"><table class="v13-doc-table"><thead><tr><th>تاریخ / سند</th><th>تشریحات</th><th>گرفت</th><th>طلب</th><th>مانده حساب</th></tr></thead><tbody id="v13-report-body"></tbody></table></div><div class="v13-pager" id="v13-report-pager"></div></section>`}
function hawalaForm(kind){const word=methods[kind],prefix=`v13-${kind}`;return `<section class="v13-panel v13-hawala-${kind}"><div class="v13-top"><h2>${word}</h2><button class="v13-button" type="button" data-hawala-cancel>↩ بازگشت</button></div><form id="${prefix}-form" class="v13-forms" autocomplete="off"><div class="field v13-full"><label>اسم حساب</label><input id="${prefix}-account" list="v13-account-options" required placeholder="نام حساب را بنویسید" autocomplete="off"/></div><div class="field"><label>${kind==='in'?'گرفت':'طلب'} (مبلغ اصلی)</label><input inputmode="decimal" id="${prefix}-amount" placeholder="0" required/></div><div class="field"><label>واحد پولی</label><select id="${prefix}-currency"></select></div><div class="field"><label>نرخ تبادله</label><input id="${prefix}-rate" inputmode="decimal" value="1" required/></div><div class="field"><label>عملیه</label><select id="${prefix}-operation"><option value="multiply">× ضرب</option><option value="divide">÷ تقسیم</option></select></div><div class="field"><label>مقدار مبادله</label><input id="${prefix}-converted" inputmode="decimal" placeholder="0" required/></div><div class="field"><label>ارز مبادله</label><select id="${prefix}-converted-currency"></select></div><div class="field"><label>مفاد حواله</label><input id="${prefix}-fee" inputmode="decimal" value="0"/></div><div class="field"><label>ارز مفاد</label><select id="${prefix}-fee-currency"></select></div>${kind==='out'?`<div class="field v21-sarraf-fee"><label>مفاد صراف</label><input id="${prefix}-sarraf-fee" inputmode="decimal" value="0" placeholder="0"/></div>`:''}<div class="field"><label>تاریخ</label><input id="${prefix}-date" type="date" required/></div><div class="field v13-full"><label>تشریحات</label><input id="${prefix}-note" maxlength="240" placeholder="توضیحات حواله (اختیاری)"/></div><div class="field v13-full"><label>طریقه ثبت</label><div class="v13-mode"><label><input type="radio" name="${prefix}-mode" value="darak"/> درک</label><label><input type="radio" name="${prefix}-mode" value="unpaid" ${kind==='in'?'checked':''}/> پرداخت نشده</label><label><input type="radio" name="${prefix}-mode" value="treasury" ${kind==='out'?'checked':''}/> خزانه</label></div></div><div class="field v13-full" id="${prefix}-darak-wrap" hidden><label>حساب درک</label><input list="v13-account-options" id="${prefix}-darak" placeholder="حساب مقابل را جستجو کنید"/></div><button class="primary v13-form-submit v13-full" type="submit">ثبت ${word}</button></form><div id="${prefix}-status" role="status" class="status"></div></section>`}
function accordion(title,items,open){const detail=document.createElement('details');detail.className='v13-accordion';detail.open=open;const summary=document.createElement('summary');summary.textContent=title;const inner=document.createElement('div');inner.className='v13-inner';items.forEach(x=>inner.append(x));detail.append(summary,inner);return detail}
function setupSettings(){const root=$('page-settings').querySelector(':scope > .card');let children=[...root.children];const firstBlock=children.findIndex(n=>n.classList?.contains('settingblock')||n.classList?.contains('license-settings'));
 const general=children.slice(1,firstBlock<0?children.length:firstBlock).filter(x=>x.id!=='v13-dash-config');const header=root.querySelector(':scope > h2');if(header)header.textContent='تنظیمات برنامه';
 const dyn=document.createElement('section');dyn.id='v13-dash-config';dyn.innerHTML='<div class="v13-hint">حساب‌هایی را که باید در صفحه خانه دیده شوند انتخاب کنید.</div><div class="v13-switches" id="v13-dash-switches"></div>';
 const allGroups=[accordion('شخصی‌سازی ظاهر و عنوان برنامه',general,true),accordion('شخصی‌سازی داشبورد',[dyn],false)];
 for(const ch of [...root.children]){if(ch.classList?.contains('settingblock')||ch.classList?.contains('license-settings')){const t=ch.querySelector('h2')?.textContent||'تنظیمات';allGroups.push(accordion(t,[ch],false));}}
 root.replaceChildren(...(header?[header]:[]),...allGroups);
 }
function populateCategory(a){return a.category||({'خزانه':'خزانه','مصارف':'مصارف','مفاد':'مصارف','پرداخت نشده':'سایر'}[a.name])||'مشتری';}
function persistAccounts(){if(!window.LICENSE_CAN_WRITE){alert('ثبت حساب نیازمند اشتراک فعال است.');return false;}persistMeta();return true;}
function refreshDashboard(){let chosen=Array.isArray(settings.dashboardAccounts)?settings.dashboardAccounts:['خزانه'];const selected=chosen.filter(x=>accounts.some(a=>a.name===x));$('v13-home-list').innerHTML=selected.map(name=>`<button class="v13-account-row" data-open-account="${safe(name)}"><span class="v13-avatar">${safe(name[0]||'ح')}</span><span class="v13-account-info"><span class="v13-account-name">${safe(name)}</span><span class="v13-category">${safe(populateCategory(accounts.find(a=>a.name===name)))}</span><span class="v13-balances">${balanceMarkup(name,false)}</span>${name==='خزانه'?`<span class="v13-balances">${allCurrencies().map(cur=>{const rr=accountSource(name).filter(r=>(r.currency||'AFN')===cur),got=rr.filter(r=>r.type==='debt').reduce((n,r)=>n+r.amount,0),talab=rr.filter(r=>r.type==='payment').reduce((n,r)=>n+r.amount,0);return rr.length?`<span class="v13-mini">${safe(cur)} | گرفت: <b class="v13-credit">${fmt(got)}</b> • طلب: <b class="v13-debit">${fmt(talab)}</b></span>`:''}).join('')}</span>`:''}</span></button>`).join('')||'<div class="small">از تنظیمات، حساب‌های دلخواه را به داشبورد اضافه کنید.</div>';
 $('v13-dash-switches').innerHTML=accounts.map(a=>`<label><input type="checkbox" data-dash-account="${safe(a.name)}" ${selected.includes(a.name)?'checked':''}/> ${safe(a.name)}</label>`).join('');}
const listState={page:1,size:30};
function paginate(rows,pager,st,onClick){
 const size=30,limit=Math.max(1,Number(st.page)||1)*size;
 pager.innerHTML=rows.length>limit?`<div class="v17-load-marker">${fmt(Math.min(limit,rows.length))} از ${fmt(rows.length)} · برای اسناد بیشتر پایین بروید</div>`:'';
 if(rows.length>limit&&'IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){observer.disconnect();st.page++;onClick()}},{rootMargin:'240px'});
  observer.observe(pager.firstElementChild);
 }
 return rows.slice(0,limit);
}
function accountsListing(){const q=norm($('v13-account-search').value),cat=$('v13-account-category').value;const arr=accounts.filter(a=>(!q||[a.name,a.phone,a.email,a.address,a.id].some(x=>norm(x).includes(q)))&&(!cat||populateCategory(a)===cat)).sort((a,b)=>a.name.localeCompare(b.name,'fa'));const page=paginate(arr,$('v13-account-pager'),listState,accountsListing);
 $('v13-account-list').innerHTML=page.map((a,i)=>`<button class="v13-account-row" data-open-account="${safe(a.name)}"><span class="v13-avatar" style="background:${alphabet[categories.indexOf(populateCategory(a))%alphabet.length]||'#439b7a'}">${safe(a.name.slice(0,1))}</span><span class="v13-account-info"><span class="v13-account-name">${safe(a.name)}</span><span class="v13-category">${safe(populateCategory(a))}${a.phone?' • '+safe(a.phone):''}${a.email?' • '+safe(a.email):''}</span><span class="v13-balances">${balanceMarkup(a.name,false)}</span></span></button>`).join('')||'<div class="small">حسابی پیدا نشد.</div>';}
function ledgerRow(r,withActions=false){const cur=r.currency||'AFN';return `<tr><td><strong>${safe(dateText(r.date))}</strong><div class="v13-mini">${safe(numericVoucherId(r))}</div></td><td>${safe(r.note||(r.hawalaKind?methods[r.hawalaKind]:(r.mode==='exchange'?'تبادله':r.mode==='darak'?'درک':'روزنامچه')))}${r.hawalaRole==='fee'?'<div class="v13-mini">مفاد</div>':''}</td><td class="v16-outflow">${r.type==='debt'?fmt(r.amount)+' '+safe(cur):'—'}</td><td class="v16-inflow">${r.type==='payment'?fmt(r.amount)+' '+safe(cur):'—'}</td><td>${fmt(r.closingBalance)} ${safe(cur)}</td>${withActions?`<td><div class="rowbuttons"><button class="v13-button" type="button" data-v13-edit="${safe(r.id)}" aria-label="بازکردن سند">مشاهده سند</button><button class="v13-button danger" type="button" data-v13-delete="${safe(r.id)}">حذف</button></div></td>`:''}</tr>`}
function allAccountDocs(name,cur){return ledger(accountSource(name).filter(r=>(!cur||(r.currency||'AFN')===cur)));}
function detail(){if(!state.account)return;const a=currentAccount();if(!a)return;const vals=allAccountDocs(state.account);$('v13-detail-title').textContent=a.name;$('v13-detail-meta').textContent=populateCategory(a)+(a.phone?' • '+a.phone:'')+(a.email?' • '+a.email:'')+(a.address?' • '+a.address:'');$('v13-detail-balances').innerHTML=balanceMarkup(a.name);
 const isSarraf=populateCategory(a)==='صراف';$('v13-account-action-menu').innerHTML=`<button class="v13-button" data-v13-navigate="journal">روزنامچه</button><button class="v13-button" data-v13-navigate="exchange">تبادله</button>${isSarraf?'<button class="v13-button" data-v13-navigate="hawalaIn">حواله وارده</button><button class="v13-button" data-v13-navigate="hawalaOut">حواله صادره</button>':''}`;
 const q=norm(state.search);let rows=vals.filter(r=>(!state.currency||r.currency===state.currency)&&(!state.from||r.date>=state.from)&&(!state.to||r.date<=state.to)&&(!q||norm([r.note,r.documentNo,r.id,methods[r.hawalaKind]].join(' ')).includes(q)));
 if(state.sort==='incoming')rows=rows.filter(r=>r.hawalaKind==='in');else if(state.sort==='outgoing')rows=rows.filter(r=>r.hawalaKind==='out');
 if(state.sort==='id')rows.sort((a,b)=>Number(numericVoucherId(b))-Number(numericVoucherId(a)));else rows.reverse();visibleAccountRecords=rows;
 const page=paginate(rows,$('v13-detail-pager'),{get page(){return state.page},set page(v){state.page=v},get size(){return state.pageSize},set size(v){state.pageSize=v}},detail);$('v13-detail-body').innerHTML=page.map(r=>ledgerRow(r,true)).join('')||'<tr><td colspan="6">معامله‌ای وجود ندارد.</td></tr>';
}
function openAccount(name){state.account=name;state.currency='';state.search='';state.from=state.to='';state.sort='date';state.page=1;$('v13-detail-search').value='';$('v13-detail-from').value='';$('v13-detail-to').value='';$('v13-detail-sort').value='date';$('v13-detail').hidden=false;$('v13-detail').scrollIntoView({behavior:'smooth',block:'start'});detail();}
function reportData(){return ledger(accountSource(state.reportAccount)).filter(r=>(!state.reportCurrency||(r.currency||'AFN')===state.reportCurrency)&&(!state.reportFrom||r.date>=state.reportFrom)&&(!state.reportTo||r.date<=state.reportTo));}
function report(){const rows=reportData();visibleReportRecords=rows;const groups=new Map();for(const r of rows){const cur=r.currency||'AFN',v=groups.get(cur)||{got:0,talab:0};v[r.type==='debt'?'got':'talab']+=r.amount;groups.set(cur,v)}
 $('v13-report-summary').innerHTML=[...groups.entries()].map(([cur,v])=>`<div class="v13-summary-chip">${currencyTag(cur)}<div>گرفت: <strong>${fmt(v.got)}</strong></div><div>طلب: <strong>${fmt(v.talab)}</strong></div><div>مانده: <strong>${fmt(v.talab-v.got)}</strong></div></div>`).join('')||'<div class="small">سندی در این راپور وجود ندارد.</div>';
 const back=[...rows].reverse();const page=paginate(back,$('v13-report-pager'),{get page(){return state.reportPage},set page(v){state.reportPage=v},get size(){return state.reportSize},set size(v){state.reportSize=v}},report);$('v13-report-body').innerHTML=page.map(ledgerRow).join('')||'<tr><td colspan="5">سندی وجود ندارد.</td></tr>';
}
function selectReport(name,cur=''){state.reportAccount=name;state.reportCurrency=cur;state.reportPage=1;$('v13-report-account').value=name;$('v13-report-currency').value=cur;showPage('reports');report();}
function updateAccountOptions(){const list=$('v13-account-options');list.innerHTML=accounts.map(a=>`<option value="${safe(a.name)}"></option>`).join('');const val=$('v13-report-account').value;$('v13-report-account').innerHTML='<option value="">انتخاب حساب...</option>'+accounts.map(a=>`<option value="${safe(a.name)}">${safe(a.name)}</option>`).join('');$('v13-report-account').value=state.reportAccount;
 const oldCur=$('v13-report-currency').value;$('v13-report-currency').innerHTML='<option value="">تمام ارزها</option>'+allCurrencies().map(c=>`<option value="${safe(c)}">${safe(c)}</option>`).join('');$('v13-report-currency').value=state.reportCurrency;
 for(const kind of ['in','out'])for(const field of ['currency','converted-currency','fee-currency']){const el=$(`v13-${kind}-${field}`),old=el.value;el.innerHTML=allCurrencies().map(c=>`<option value="${safe(c)}">${safe(c)}</option>`).join('');el.value=allCurrencies().includes(old)?old:'AFN';}}
function formatMoneyInput(input,formatter=formatAmountTyping){const original=input.value,ix=input.selectionStart??original.length;input.value=formatter(original);try{input.setSelectionRange(formatter(original.slice(0,ix)).length,formatter(original.slice(0,ix)).length)}catch(e){}}
// v24: both remittance money inputs can be authoritative. The rate is never
// silently rewritten when a cashier enters the converted amount.
const hawalaLastSource={in:'amount',out:'amount'};
function hawalaCalculate(kind,source){
 const prefix=`v13-${kind}`,from=$(`${prefix}-amount`),to=$(`${prefix}-converted`),rateInput=$(`${prefix}-rate`),opInput=$(`${prefix}-operation`);
 const same=$(`${prefix}-currency`).value===$(`${prefix}-converted-currency`).value;
 if(source==='amount')hawalaLastSource[kind]='amount';
 if(source==='converted')hawalaLastSource[kind]='converted';
 const sourceField=hawalaLastSource[kind];
 const amount=parsedAmount(from.value),converted=parsedAmount(to.value),rate=parsedAmount(rateInput.value);
 const set=(element,value)=>{if(Number.isFinite(value)&&value>0)element.value=formatAmountTyping(String(Number(value.toFixed(2))))};
 if(same){
  rateInput.value='1';opInput.value='multiply';
  if(sourceField==='converted'&&source!=='amount')set(from,converted);
  else set(to,amount);
  return;
 }
 if(!(rate>0))return;
 const op=opInput.value;
 if(source==='converted'||(source==='rate'&&sourceField==='converted')||((source==='operation'||source==='currency')&&sourceField==='converted')){
  if(converted>0)set(from,op==='multiply'?converted/rate:converted*rate);else if(source==='converted'&&!to.value.trim())from.value='';
 }else if(source==='amount'||source==='rate'||source==='operation'||source==='currency'){
  if(amount>0)set(to,op==='multiply'?amount*rate:amount/rate);else if(source==='amount'&&!from.value.trim())to.value='';
 }
}
function resetHawala(kind){const p=`v13-${kind}`;$(p+'-form').reset();$(p+'-rate').value='1';$(p+'-date').value=today();$(p+'-account').value=state.account||'';$(p+'-converted').value='';if($(p+'-sarraf-fee'))$(p+'-sarraf-fee').value='0';if($(p+'-sarraf-fee-currency'))$(p+'-sarraf-fee-currency').value=$(p+'-fee-currency').value;$(p+'-status').textContent='';$(p+'-darak-wrap').hidden=true;state.hwEdit='';document.querySelector('#'+p+'-form button[type="submit"]').textContent='ثبت '+methods[kind];}
function openHawala(kind){state.hwKind=kind;resetHawala(kind);showPage('hawala'+(kind==='in'?'In':'Out'));}
function hawalaRecord(kind,account,amount,cur,type,part,doc,id,date,note,createdAt,extra={}){return {id:makeId(),name:account,type,amount,currency:cur,date,note,mode:'hawala',hawalaKind:kind,hawalaRole:part,documentNo:doc,transferId:id,createdAt,...extra}}
async function addHawala(kind){const p=`v13-${kind}`,account=$(p+'-account').value.trim(),amount=parsedAmount($(p+'-amount').value),converted=parsedAmount($(p+'-converted').value),rate=parsedAmount($(p+'-rate').value),fee=parsedAmount($(p+'-fee').value||'0'),cur=$(p+'-currency').value,targetCur=$(p+'-converted-currency').value,feeCur=$(p+'-fee-currency').value,operation=$(p+'-operation').value,date=$(p+'-date').value||today(),note=$(p+'-note').value.trim(),mode=document.querySelector(`[name="${p}-mode"]:checked`)?.value||'treasury',peer=$(p+'-darak').value.trim(),sarrafFee=(kind==='out'||(kind==='in'&&mode==='darak'))?parsedAmount($(p+'-sarraf-fee')?.value||'0'):0,sarrafFeeCur=$(p+'-sarraf-fee-currency')?.value||feeCur;
 if(!window.LICENSE_CAN_WRITE){$(p+'-status').textContent='لایسنس فعال لازم است.';return}
 if(!accounts.some(a=>a.name===account)||!Number.isFinite(amount)||amount<=0||!Number.isFinite(converted)||converted<=0||!Number.isFinite(rate)||rate<=0||!Number.isFinite(fee)||fee<0||!Number.isFinite(sarrafFee)||sarrafFee<0||!date||!currencies.includes(cur)||!currencies.includes(targetCur)||!currencies.includes(feeCur)||!currencies.includes(sarrafFeeCur)){ $(p+'-status').textContent='حساب، ارزها، مبلغ، نرخ و تاریخ را بررسی کنید.';return }
 if(cur===targetCur && (Math.abs(converted-amount)>0.000001||Math.abs(rate-1)>0.000001||operation!=='multiply')){ $(p+'-status').textContent='برای دو طرف با ارز یکسان، مبلغ مبادله باید عین مبلغ اصلی و نرخ ۱ باشد.';return }
 if(mode==='darak'&&(!accounts.some(a=>a.name===peer)||peer===account)){ $(p+'-status').textContent='حساب مقابل درک معتبر نیست.';return }
 // A remittance is atomic: two principal postings plus its fee postings.
 const editing=state.hwEdit,oldGroup=editing?records.filter(r=>r.transferId===editing):[],id=editing||makeId(),doc=editing?(oldGroup[0]?.documentNo):String($(p+'-number')?.value||window.MC14?.getNextDoc?.(kind,account)||'1').trim(),stamp=oldGroup[0]?.createdAt||new Date().toISOString(),mainType=kind==='in'?'payment':'debt',otherType=kind==='in'?'debt':'payment',otherAccount=mode==='treasury'?'خزانه':mode==='unpaid'?'پرداخت نشده':mode==='none'?'بدون مدرک':peer;
 if(!editing&&!/^[0-9]+$/.test(String(doc))){$(p+'-status').textContent='نمبر حواله فقط باید عدد باشد.';return}
 if(otherAccount===account){$(p+'-status').textContent='حساب اصلی و حساب مقابل نباید یکسان باشند.';return}
 if(records.some(r=>r.hawalaRole==='principal'&&r.name===account&&r.hawalaKind===kind&&String(r.documentNo||'').match(/^[0-9]+$/)&&Number(r.documentNo)===Number(doc)&&r.transferId!==id)){ $(p+'-status').textContent='شمارهٔ حواله در این حساب قبلاً ثبت شده است.';return }
 if(window.MC14?.beforeHawalaSave && window.MC14.beforeHawalaSave({kind,account,amount,cur,converted,targetCur,mode,fee,feeCur,peerFee:0})===false){$(p+'-status').textContent='معامله مطابق تنظیمات حد بدهکاری یا کنترل حساب پذیرفته نشد.';return}
 const base={displayId:editing?Number(oldGroup[0]?.displayId||numericVoucherId(oldGroup[0])):undefined,hawalaSarrafFee:sarrafFee,hawalaSarrafFeeCurrency:sarrafFeeCur,hawalaRate:rate,hawalaOperation:operation,hawalaMethod:mode,hawalaSourceCurrency:cur,hawalaSettlementCurrency:targetCur,hawalaFee:fee,hawalaFeeCurrency:feeCur,...(window.MC14?.hawalaMetadata?.(kind)||{})};
 const amountToPost=cur===targetCur?amount:converted;
 const batch=[hawalaRecord(kind,account,amount,cur,mainType,'principal',doc,id,date,note,stamp,{...base,documentId:id,ledgerDelta:kind==='out'?amount:-amount}),hawalaRecord(kind,otherAccount,amountToPost,targetCur,otherType,'settlement',doc,id,date,note,stamp,{...base,documentId:id,ledgerDelta:(mode==='unpaid'||mode==='none')?0:(kind==='out'?(mode==='treasury'?amountToPost:-amountToPost):(mode==='treasury'?-amountToPost:amountToPost))})];
 // Two clearly distinct fee types; each belongs to this ONE linked voucher.
 // Incoming: the sarraf pays the commission to profit, without moving treasury.
 // Outgoing: the remittance commission increases profit AND physical treasury,
 // with NO deduction from the sarraf's account.
 if(fee>0){
   if(kind==='in')batch.push(hawalaRecord(kind,account,fee,feeCur,'debt','fee-deduction',doc,id,date,`مفاد حواله ${doc}`,stamp,{...base,documentId:id,ledgerDelta:-fee}));
   batch.push(hawalaRecord(kind,'مفاد',fee,feeCur,'payment','fee-profit',doc,id,date,`مفاد حواله ${doc}`,stamp,{...base,documentId:id,ledgerDelta:fee}));
   if(kind==='out')batch.push(hawalaRecord(kind,'خزانه',fee,feeCur,'payment','fee-treasury',doc,id,date,`دریافت مفاد حواله ${doc}`,stamp,{...base,documentId:id,ledgerDelta:fee}));
 }
 // Outgoing sarraf fee: credited to the selected sarraf and collected into treasury.
 if(kind==='out'&&sarrafFee>0){
   batch.push(hawalaRecord(kind,account,sarrafFee,sarrafFeeCur,'payment','fee-sarraf-credit',doc,id,date,`مفاد صراف ${doc}`,stamp,{...base,documentId:id,ledgerDelta:sarrafFee}));
   batch.push(hawalaRecord(kind,'خزانه',sarrafFee,sarrafFeeCur,'payment','fee-sarraf-cash',doc,id,date,`دریافت مفاد صراف ${doc}`,stamp,{...base,documentId:id,ledgerDelta:sarrafFee}));
 }
 // Incoming darak: both fee types are debited from the selected main
 // account, with remittance commission credited to "مفاد" and peer commission
 // credited to the selected opposite sarraf. Neither fee moves cash.
 if(kind==='in'&&mode==='darak'&&sarrafFee>0){
   batch.push(hawalaRecord(kind,account,sarrafFee,sarrafFeeCur,'debt','fee-peer-debit',doc,id,date,`کسر مفاد صراف درک ${doc}`,stamp,{...base,documentId:id,ledgerDelta:-sarrafFee}));
   batch.push(hawalaRecord(kind,peer,sarrafFee,sarrafFeeCur,'payment','fee-peer-credit',doc,id,date,`مفاد صراف درک ${doc}`,stamp,{...base,documentId:id,ledgerDelta:sarrafFee}));
 }
 if(window.MC18&&!window.MC18.checkCashBatch(batch,oldGroup,methods[kind])){$(p+'-status').textContent='موجودی خزانه کافی نیست.';return}
 if(window.MC21&&!await window.MC21.authorizeBackdate(batch,oldGroup,methods[kind])){$(p+'-status').textContent='ثبت تغییرات خزانه در تاریخ گذشته تأیید نشد.';return}
 const prev=[...records],oldAccounts=[...accounts];if(editing){if(!oldGroup.length){$(p+'-status').textContent='سند اصلی برای ویرایش پیدا نشد.';return}records=records.filter(r=>r.transferId!==editing)}if(!accounts.some(a=>a.name==='مفاد'))accounts.push({id:makeId(),name:'مفاد',category:'مصارف',system:true});records.push(...batch);
 if(!save()){records=prev;accounts=oldAccounts;$(p+'-status').textContent='خطا در ذخیره سند حواله';return}persistMeta();reconcileAccounts();render();window.MC14?.afterHawalaSave?.({kind,account,doc,editing:!!editing});$(p+'-form').reset();resetHawala(kind);window.MC20?.syncNumbers?.(kind);$(p+'-status').textContent=`${methods[kind]} با شماره ${doc} ${editing?'ویرایش':'ثبت'} شد.`;
}
function editLedgerRecord(id){const r=records.find(x=>String(x.id)===String(id));if(!r)return;if(r.mode==='hawala'){if(r.hawalaRole==='fee-profit')return alert('برای ویرایش، سند اصلی حواله را انتخاب کنید.');const p='v13-'+r.hawalaKind;openHawala(r.hawalaKind);state.hwEdit=r.transferId;const primary=records.find(x=>x.transferId===r.transferId&&x.hawalaRole==='principal');const cash=records.find(x=>x.transferId===r.transferId&&x.hawalaRole==='settlement');if(!primary||!cash)return alert('حواله دارای سند ناقص است؛ ویرایش متوقف شد.');
 $(p+'-account').value=primary.name;if($(p+'-number'))$(p+'-number').value=primary.documentNo||'';$(p+'-amount').value=formatAmountTyping(String(primary.amount));$(p+'-currency').value=primary.currency;$(p+'-converted').value=formatAmountTyping(String(cash.amount));$(p+'-converted-currency').value=cash.currency;$(p+'-rate').value=String(primary.hawalaRate||1);$(p+'-operation').value=primary.hawalaOperation||'multiply';$(p+'-fee').value=formatAmountTyping(String(primary.hawalaFee||0));$(p+'-fee-currency').value=primary.hawalaFeeCurrency||primary.currency;$(p+'-date').value=primary.date;$(p+'-note').value=primary.note||'';for(const [field,value] of [['sender',primary.senderName],['receiver',primary.receiverName],['tracking',primary.trackingRef],['source',primary.hawalaSource]])if($(p+'-'+field))$(p+'-'+field).value=value||'';let mode=primary.hawalaMethod||'treasury';document.querySelector(`[name="${p}-mode"][value="${mode}"]`).checked=true;$(p+'-darak-wrap').hidden=mode!=='darak';if(mode==='darak')$(p+'-darak').value=cash.name;if($(p+'-sarraf-fee'))$(p+'-sarraf-fee').value=String(primary.hawalaSarrafFee||0);if($(p+'-sarraf-fee-currency'))$(p+'-sarraf-fee-currency').value=primary.hawalaSarrafFeeCurrency||primary.hawalaFeeCurrency||primary.currency;if($(p+'-peer-out-number'))$(p+'-peer-out-number').value=primary.hawalaPeerOutgoingNo||'';if($(p+'-sarraf-fee'))$(p+'-sarraf-fee').dataset.v23Manual='1';document.querySelector('#'+p+'-form button[type="submit"]').textContent='ذخیره تغییرات حواله';return;
 }if(r.mode==='exchange'){openExchangeForEdit(r);return}
 showPage('journal');$('editId').value=r.id;$('name').value=r.name;populateDarakAccounts();resetAmountFields();$(r.type==='payment'?'talabAmount':'gotAmount').value=formatAmountTyping(String(r.amount));syncAmountFields();$('date').value=r.date;setMode(r.mode||'none');if(r.mode==='darak')$('darakAccount').value=r.counterAccount||'';setCurrency(r.currency||'AFN');$('note').value=r.note||'';updateJalaliPreview();syncAccountCombos();$('editingNote').style.display='block';$('submitEntry').textContent='ذخیره تغییرات';$('cancelEdit').style.display='block';}
function deleteLedgerRecord(id){const r=records.find(x=>String(x.id)===String(id));if(!r)return;if(!window.LICENSE_CAN_WRITE)return alert('برای حذف، اشتراک باید فعال باشد.');const groupId=r.transferId;if(r.mode==='hawala'&&records.some(x=>x.mode==='hawala-settlement'&&x.originalHawalaId===groupId)){alert('این حواله قبلاً پرداخت قسمی/کامل دارد. حذف اصل حواله تا برگشت سندهای پرداخت مجاز نیست.');return}const msg=groupId?'همه اسناد مرتبط این حواله/انتقال حذف شوند؟':'این سند حذف شود؟';if(!confirm(msg))return;const old=records;records=records.filter(x=>groupId?x.transferId!==groupId:x.id!==r.id);if(!save())records=old;else render();}
function shareBalance(name){
 const company=settings.companyV14?.name||settings.title||'دفتر حسابات';
 const account=accounts.find(a=>a.name===name);const hash=Array.from(String(account?.id||name)).reduce((n,c)=>((n*31)+c.charCodeAt(0))>>>0,0);const id=String(hash%1000000).padStart(6,'0');
 const currencyNames={AFN:'افغانی',USD:'دالر',EUR:'یورو',PKR:'کلدار',IRR:'تومان'};
 const map=new Map(actualBalances(name));
 const curList=[...new Set(['AFN','USD','EUR',...map.keys()])];
 const lines=[`*${company}*`,dateText(today()),`آیدی: ${id}`,`نام حساب: ${name}`];
 for(const cur of curList){const value=map.get(cur)||0,unit=currencyNames[cur]||cur;const label=value>0?'بیلانس طلبکار':value<0?'بیلانس بدهکار':'بیلانس';const amount=fmt(Math.abs(value))+(value<0?'-':'');lines.push(`${label} : *${amount} ${unit}*`)}
 const text=lines.join('\n');
 let el=$('v20-balance-modal');if(!el){el=document.createElement('div');el.id='v20-balance-modal';document.body.append(el)}
 el.hidden=false;el.innerHTML=`<section class="v20-balance-panel" role="dialog" aria-modal="true" aria-label="شریک‌سازی بیلانس"><div class="v20-share-head"><h3>بیلانس آمادهٔ شریک‌سازی</h3><button type="button" data-v20-close>×</button></div><textarea id="v20-balance-text" dir="rtl" rows="9" spellcheck="false" aria-label="متن بیلانس"></textarea><div class="v20-share-actions"><button type="button" class="primary" id="v20-copy-balance">کاپی متن</button><button type="button" class="secondary" id="v20-native-share">ارسال</button><button type="button" class="secondary" data-v20-close>بستن</button></div><p id="v20-share-status" role="status"></p></section>`;
 const field=$('v20-balance-text');field.value=text;
 el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-v20-close]'))el.hidden=true},{once:false});
 $('v20-copy-balance').onclick=async()=>{const val=field.value;try{if(!navigator.clipboard?.writeText)throw Error('fallback');await navigator.clipboard.writeText(val)}catch(_){field.focus();field.select();if(!document.execCommand('copy')){alert('متن را انتخاب و کاپی کنید.');return}}$('v20-share-status').textContent='متن بیلانس کاپی شد.'};
 $('v20-native-share').onclick=()=>{if(navigator.share)navigator.share({text:field.value}).catch(()=>{});else{$('v20-copy-balance').click()}};
}
function printV13(){const docrows=visibleReportRecords,account=state.reportAccount,all=allCurrencies().filter(c=>docrows.some(r=>r.currency===c));const totals=all.map(c=>{const r=docrows.filter(x=>x.currency===c),debt=r.filter(x=>x.type==='debt').reduce((n,x)=>n+x.amount,0),talab=r.filter(x=>x.type==='payment').reduce((n,x)=>n+x.amount,0);return `${c}: گرفت ${fmt(debt)} | طلب ${fmt(talab)} | مانده ${fmt(talab-debt)}`}).join(' • ');
 const rows=docrows.map(r=>`<tr><td>${safe(dateText(r.date))}</td><td>${safe(numericVoucherId(r))}</td><td>${safe(r.note||methods[r.hawalaKind]||'معامله')}</td><td>${r.type==='debt'?fmt(r.amount)+' '+safe(r.currency):'—'}</td><td>${r.type==='payment'?fmt(r.amount)+' '+safe(r.currency):'—'}</td><td>${fmt(r.closingBalance)} ${safe(r.currency)}</td></tr>`).join('');
 const html=`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>راپور ${safe(account)}</title><style>body{font:13px/1.7 Tahoma,Arial;color:#18352b;margin:24px}h1{border-bottom:3px solid #176b51;padding-bottom:12px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #d8e7de;padding:8px;text-align:right}th{background:#e9f3ed}.totals{background:#f0f6f1;padding:12px;border-radius:8px}@page{size:A4 landscape;margin:12mm}button{padding:10px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">چاپ / ذخیره PDF</button> <button onclick="window.close()">بستن</button><h1>${safe(settings.title)}</h1><div>حساب: ${safe(account)} | تاریخ: ${safe(dateText(today()))}</div><div class="totals">${safe(totals)}</div><table><thead><tr><th>تاریخ</th><th>آی‌دی</th><th>تشریحات</th><th>گرفت</th><th>طلب</th><th>مانده حساب</th></tr></thead><tbody>${rows}</tbody></table><p>طراحی و توسعه: یاسر عفیف — تمامی حقوق محفوظ است.</p></body></html>`;const win=window.open('','_blank');if(!win)return alert('اجازه نمایش پنجره راپور را بدهید.');win.document.open();win.document.write(html);win.document.close();}
function exportV13(){
 if(!state.reportAccount)return alert('حساب انتخاب نشده است.');
 const rows=visibleReportRecords;
 const currencies=[...new Set(rows.map(r=>r.currency||'AFN'))];
 const totals=currencies.map(cur=>{const rs=rows.filter(r=>r.currency===cur);const got=rs.reduce((t,r)=>t+(r.type==='debt'?r.amount:0),0),talab=rs.reduce((t,r)=>t+(r.type==='payment'?r.amount:0),0);return `${cur} | گرفت: ${fmt(got)} | طلب: ${fmt(talab)} | مانده: ${fmt(talab-got)}`});
 const sheetRows=[
  {type:'title',cells:[settings.title+' — راپور رسمی حساب']},
  {type:'subtitle',cells:['نام حساب: '+state.reportAccount+'    |    تاریخ تهیه: '+dateText(today())]},
  {type:'subtitle',cells:['دوره: '+(state.reportFrom||'ابتدا')+' تا '+(state.reportTo||'امروز')+'    |    واحد پولی: '+(state.reportCurrency||'تمام ارزها')]},
  ...totals.map(t=>({type:'summary',cells:[t]})),
  {type:'space',cells:[]},
  {type:'header',cells:['ردیف','شماره سند','تاریخ','تشریحات','گرفت','طلب','ارز','مانده حساب']},
  ...rows.map((r,i)=>({type:i%2?'even':'odd',cells:[i+1,r.documentNo||'',dateText(r.date),r.note||methods[r.hawalaKind]||'معامله',r.type==='debt'?r.amount:0,r.type==='payment'?r.amount:0,r.currency,r.closingBalance]})),
  {type:'subtitle',cells:['پایان راپور — طراحی و توسعه: یاسر عفیف']}
 ];
 const styleXml=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <numFmts count="1"><numFmt numFmtId="165" formatCode="#,##0.##;[Red](#,##0.##)"/></numFmts>
 <fonts count="3"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="15"/><name val="Arial"/></font><font><b/><color rgb="FF146348"/><sz val="11"/><name val="Arial"/></font></fonts>
 <fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF176B51"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF3EE"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7FBF8"/></patternFill></fill></fills>
 <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top style="hair"><color rgb="FFDAE6DE"/></top><bottom style="hair"><color rgb="FFDAE6DE"/></bottom><diagonal/></border></borders>
 <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
 <cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0"/><xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1"/></cellXfs>
 <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
 const cxml=(v,style)=>{if(typeof v==='number'&&Number.isFinite(v))return `<c s="${style===4||style===5?6:style}" t="n"><v>${v}</v></c>`;return `<c s="${style}" t="inlineStr"><is><t xml:space="preserve">${xEsc(v??'')}</t></is></c>`;};
 let headerRow=1,merges=[];
 const dataXml=sheetRows.map((row,i)=>{const r=i+1,sty={title:1,subtitle:2,summary:2,space:0,header:3,odd:4,even:5}[row.type]||0;if(row.type==='header')headerRow=r;if(['title','subtitle','summary'].includes(row.type))merges.push(`<mergeCell ref="A${r}:H${r}"/>`);const cells=row.cells.map(x=>cxml(x,sty)).join('');return `<row r="${r}" ht="${row.type==='title'?38:row.type==='header'?30:25}" customHeight="1">${cells}</row>`}).join('');
 const sheet=`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane ySplit="${headerRow}" topLeftCell="A${headerRow+1}" state="frozen" activePane="bottomLeft"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="2" width="21" customWidth="1"/><col min="3" max="3" width="22" customWidth="1"/><col min="4" max="4" width="44" customWidth="1"/><col min="5" max="6" width="17" customWidth="1"/><col min="7" max="7" width="12" customWidth="1"/><col min="8" max="8" width="21" customWidth="1"/></cols><sheetData>${dataXml}</sheetData><mergeCells count="${merges.length}">${merges.join('')}</mergeCells><autoFilter ref="A${headerRow}:H${sheetRows.length}"/></worksheet>`;
 const ct='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
 const rel='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 const work='<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="راپور حساب" sheetId="1" r:id="rId1"/></sheets></workbook>';
 const wbrel='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 download(zipStore([['[Content_Types].xml',ct],['_rels/.rels',rel],['xl/workbook.xml',work],['xl/_rels/workbook.xml.rels',wbrel],['xl/styles.xml',styleXml],['xl/worksheets/sheet1.xml',sheet]]),`statement-${state.reportAccount}-${today()}.xlsx`);
}
function refresh(){updateAccountOptions();accountsListing();refreshDashboard();if(state.account)detail();if(state.reportAccount)report();}
function setup(){document.querySelector('#page-dashboard').insertAdjacentHTML('afterbegin',dashboard());document.querySelector('#page-accounts').insertAdjacentHTML('afterbegin',accountsView());document.querySelector('#page-reports').insertAdjacentHTML('afterbegin',reportView());
 document.querySelector('main footer').insertAdjacentHTML('beforebegin',`<div class="page" id="page-hawalaIn">${hawalaForm('in')}</div><div class="page" id="page-hawalaOut">${hawalaForm('out')}</div><datalist id="v13-account-options"></datalist>`);
 document.querySelector('#mainMenu button[data-page="exchange"]').insertAdjacentHTML('afterend','<button data-page="hawalaIn" type="button">↙ حواله وارده</button><button data-page="hawalaOut" type="button">↗ حواله صادره</button>');
 document.querySelectorAll('#mainMenu button[data-page^="hawala"]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
 setupSettings();
 $('v13-open-new').addEventListener('click',()=>{$('v13-create').hidden=!$('v13-create').hidden});
 $('v13-create-form').addEventListener('submit',e=>{e.preventDefault();if(!window.LICENSE_CAN_WRITE){alert('اشتراک فعال لازم است.');return}const name=$('v13-new-name').value.trim(),category=$('v13-new-category').value,phone=$('v13-new-phone').value.trim(),email=$('v13-new-email').value.trim(),address=$('v13-new-address').value.trim();if(accounts.some(x=>norm(x.name)===norm(name)))return alert('حساب تکراری است.');if(!name)return;accounts.push({id:makeId(),name,category,phone,email,address});persistMeta();populateAccounts();render();$('v13-create-form').reset();$('v13-create').hidden=true;});
 $('v13-account-search').addEventListener('input',()=>{listState.page=1;accountsListing()});$('v13-account-category').addEventListener('change',()=>{listState.page=1;accountsListing()});
 document.querySelector('#page-accounts').addEventListener('click',e=>{const report=e.target.closest('[data-currency-report]'),open=e.target.closest('[data-open-account]');if(report){e.preventDefault();e.stopPropagation();selectReport(report.dataset.account,report.dataset.currencyReport);return}if(open)openAccount(open.dataset.openAccount)});
 $('v13-home').addEventListener('click',e=>{const btn=e.target.closest('[data-open-account]');if(btn){showPage('accounts');openAccount(btn.dataset.openAccount)}});
 $('v13-detail-body').addEventListener('click',e=>{const edit=e.target.closest('[data-v13-edit]'),del=e.target.closest('[data-v13-delete]');if(edit)editLedgerRecord(edit.dataset.v13Edit);if(del)deleteLedgerRecord(del.dataset.v13Delete)});
 $('v13-back-accounts').addEventListener('click',()=>{$('v13-detail').hidden=true;state.account=''});
 $('v13-share-balance').addEventListener('click',()=>shareBalance(state.account));
 $('v13-account-edit').addEventListener('click',()=>{const a=currentAccount();if(!a)return;const category=prompt('دسته حساب (مشتری، صراف، شرکت، خزانه، مصارف، سایر):',populateCategory(a));if(category===null)return;if(!categories.includes(category))return alert('دسته معتبر نیست');if(!persistAccounts())return;a.category=category;const phone=prompt('شماره تماس:',a.phone||'');if(phone!==null)a.phone=phone.trim();const email=prompt('ایمیل:',a.email||'');if(email!==null)a.email=email.trim();const address=prompt('آدرس:',a.address||'');if(address!==null)a.address=address.trim();persistMeta();refresh();});
 document.querySelector('#v13-detail').addEventListener('click',e=>{const b=e.target.closest('[data-v13-navigate]');if(!b)return;const page=b.dataset.v13Navigate;if(page==='hawalaIn')openHawala('in');else if(page==='hawalaOut')openHawala('out');else{showPage(page);const id=page==='journal'?'name':'exchangeFromAccount';$(id).value=state.account;syncAccountCombos()}});
 $('v13-detail-search').addEventListener('input',e=>{state.search=e.target.value;state.page=1;detail()});$('v13-detail-sort').addEventListener('change',e=>{state.sort=e.target.value;state.page=1;detail()});for(const s of ['from','to'])$('v13-detail-'+s).addEventListener('change',e=>{state[s]=e.target.value;state.page=1;detail()});
 document.querySelector('[data-v13-allreport]').addEventListener('click',()=>selectReport(state.account,''));
 $('v13-report-account').addEventListener('change',e=>{state.reportAccount=e.target.value;state.reportPage=1;report()});$('v13-report-currency').addEventListener('change',e=>{state.reportCurrency=e.target.value;state.reportPage=1;report()});for(const s of ['from','to'])$('v13-report-'+s).addEventListener('change',e=>{state['report'+s[0].toUpperCase()+s.slice(1)]=e.target.value;state.reportPage=1;report()});
 $('v13-report-back').addEventListener('click',()=>showPage(state.account?'accounts':'dashboard'));
 $('v13-report-print').addEventListener('click',printV13);$('v13-report-excel').addEventListener('click',exportV13);
 document.querySelector('#v13-home [data-v13-settings]').addEventListener('click',()=>{showPage('settings');const d=$('v13-dash-config').closest('details');d.open=true;d.scrollIntoView({behavior:'smooth'})});
 $('v13-dash-switches').addEventListener('change',e=>{if(!e.target.matches('[data-dash-account]'))return;if(!window.LICENSE_CAN_WRITE)return alert('اشتراک فعال لازم است.');settings.dashboardAccounts=[...document.querySelectorAll('[data-dash-account]:checked')].map(i=>i.dataset.dashAccount);persistMeta();refreshDashboard()});
 for(const kind of ['in','out']){const p='v13-'+kind;$(p+'-date').value=today();for(const id of ['amount','rate','converted','fee','sarraf-fee']){const i=$(p+'-'+id);if(!i)continue;i.addEventListener('input',()=>{formatMoneyInput(i,id==='rate'?formatRateTyping:formatAmountTyping);if(id==='amount')hawalaCalculate(kind,'amount');else if(id==='rate')hawalaCalculate(kind,'rate');else if(id==='converted')hawalaCalculate(kind,'converted')})}$(p+'-operation').addEventListener('change',()=>hawalaCalculate(kind,'operation'));for(const field of ['currency','converted-currency'])$(p+'-'+field).addEventListener('change',()=>{hawalaCalculate(kind,'currency');window.MC19?.syncSameCurrency?.(kind)});for(const i of document.querySelectorAll(`[name="${p}-mode"]`))i.addEventListener('change',()=>{$(p+'-darak-wrap').hidden=i.value!=='darak'||!i.checked});$(p+'-form').addEventListener('submit',e=>{e.preventDefault();addHawala(kind).catch(err=>{$(p+'-status').textContent='ثبت حواله ناموفق بود: '+err.message})});}
 document.querySelectorAll('[data-hawala-cancel]').forEach(b=>b.addEventListener('click',()=>showPage('accounts')));
 // Prevent old render logic from discarding our interface; synchronize after every old render.
 const origRender=render;render=function(){origRender();refresh();window.MC14?.onAfterRender?.()};
 const origPage=showPage;showPage=function(page){origPage(page);if(page==='reports'&&state.reportAccount)report();window.MC14?.onPage?.(page)};
 // Hawala entries already persisted by the original loader via spread; protect linked vouchers against partial deletion.
 $('transactionRows').addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;const r=records.find(x=>String(x.id)===b.dataset.delete);if(r?.mode==='hawala'){e.stopImmediatePropagation();if(records.some(x=>x.mode==='hawala-settlement'&&x.originalHawalaId===r.transferId)){alert('ابتدا اسناد پرداخت مرتبط را برگشت دهید.');return}if(confirm('تمام اجزای حواله '+(r.documentNo||'')+' حذف شوند؟')){const prev=records;records=records.filter(x=>x.transferId!==r.transferId);if(!save())records=prev;else render()}}},true);
 refresh();
}
try{setup()}catch(err){console.error('v13 initialization',err)}
window.MC14={
 get accounts(){return accounts},get records(){return records},get settings(){return settings},
 get currencies(){return currencies},get state(){return state},
 accountSource,actualBalances,ledger,ordered,render,refresh,showPage,openAccount,
 saveRecords(){return save()},persistMeta,selectReport,openHawala,editLedgerRecord,deleteLedgerRecord,
 today,fmt,safe,parsedAmount,makeId,dateText,delta:recordDelta,shortId:numericVoucherId,
 isWritable(){return window.LICENSE_CAN_WRITE===true},
 onAfterRender:null,onPage:null
};
})();



/* ===== Scripts v14 (execution order preserved) ===== */
/* دفتر حسابات نسخه ۱۴ — تجربهٔ صرافی، خزانه و حواله‌های معلق
 * ساخت و توسعه: یاسر عفیف | داده‌ها همچنان فقط در مرورگر دستگاه نگهداری می‌شوند.
 * سازگار با اسکیمای محلی v13. تمام نوشته‌ها توسط تابع safe فرار داده می‌شوند.
 */
(()=>{'use strict';
const C=window.MC14;if(!C)return;
const $=id=>document.getElementById(id), S=x=>C.safe(String(x??'')),F=x=>C.fmt(Number(x||0));
const opts=(items,selected='')=>items.map(([v,t])=>`<option value="${S(v)}" ${v===selected?'selected':''}>${S(t)}</option>`).join('');
const values=()=>C.currencies.map(x=>[x,x]);
const int=(raw)=>{const n=C.parsedAmount(raw);return Number.isFinite(n)?n:NaN};
function rule(a){C.settings.sarrafRules ||= {};const r=C.settings.sarrafRules[a] ||= {};r.fees ||= {};r.limits ||= {};r.sequence ||= {in:1,out:1};r.activeCurrencies ||= {};return r}
function canEdit(){if(C.isWritable())return true;alert('اشتراک فعال برای ثبت یا اصلاح اطلاعات لازم است.');return false}
function saveMeta(){C.persistMeta()}
function makeSheet(id,title,body){let host=$('v14-modal');if(!host){host=document.createElement('div');host.id='v14-modal';host.className='v14-overlay';document.body.append(host)}host.hidden=false;host.innerHTML=`<div class="v14-dialog" role="dialog" aria-modal="true" aria-labelledby="v14-sheet-title"><div class="v14-sheet-head"><h2 id="v14-sheet-title">${S(title)}</h2><button class="v14-close" data-v14-close type="button" aria-label="بستن">×</button></div><div class="v14-dialog-content" id="v14-modal-content">${body}</div></div>`;host.onclick=e=>{if(e.target===host||e.target.closest('[data-v14-close]'))host.hidden=true};return host}
function closeSheet(){$('v14-modal').hidden=true}
function acctOptions(selected=''){return opts(C.accounts.map(a=>[a.name,a.name]),selected)}
function labelMoney(n,c){return `<span class="v14-money">${S(c)} <strong dir="ltr">${F(n)}</strong></span>`}
function todayLabels(){return [{label:'امروز',days:0},{label:'دیروز',days:1},{label:'این هفته',days:7},{label:'این ماه',days:30},{label:'همه',days:-1}]}
function daysAgo(d){const date=new Date();date.setDate(date.getDate()-d);return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
let dashboardFilter=-1;
function header(){if($('v14-appbar'))return;document.body.classList.add('v14-ready');
 const bar=document.createElement('div');bar.id='v14-appbar';bar.innerHTML=`<div class="v14-brand"><div class="v14-brandmark">د</div><div><strong>دفتر حسابات</strong><span>سامانهٔ مالی و حواله‌داری</span></div></div><div class="v14-company-title" id="v14-company-title"></div><div class="v14-header-actions"><span class="v14-version">نسخه ۱۴</span><button type="button" data-v14-open="setup" title="تنظیم شرکت">⚙ تنظیم شرکت</button></div>`;document.body.insertBefore(bar,document.body.firstChild);
 const side=document.createElement('aside');side.id='v14-sidebar';side.innerHTML=`<div class="v14-sidebar-label">میز کار</div>${[['dashboard','⌂','خانه'],['journal','▤','روزنامچه'],['exchange','⇄','صرافی'],['hawalaIn','↘','حواله وارده'],['hawalaOut','↗','حواله صادره'],['accounts','▣','حساب‌ها'],['reports','▥','راپورها'],['settings','⚙','تنظیمات']].map(([p,i,t])=>`<button type="button" data-v14-page="${p}"><span>${i}</span>${t}</button>`).join('')}`;document.body.append(side);
 bar.addEventListener('click',e=>{if(e.target.closest('[data-v14-open="setup"]'))openSetup()});side.addEventListener('click',e=>{const b=e.target.closest('[data-v14-page]');if(b)C.showPage(b.dataset.v14Page)});
}
function companyTitle(){const co=C.settings.companyV14;$('v14-company-title').textContent=co?.name||C.settings.title||'دفتر حسابات'}
function dashboardEnhance(){if(!$('v14-dashboard')){
const host=document.createElement('div');host.id='v14-dashboard';host.innerHTML=`<div class="v14-welcome"><div><span class="v14-eyebrow">پنل مالی</span><h1>دید کلی حساب‌ها</h1><p>حساب خزانه، حواله‌های معلق و مفاد در یک نگاه</p></div><button type="button" class="v14-button" data-v14-open="setup">+ مشخصات شرکت</button></div><div class="v14-date-tabs" id="v14-date-tabs"></div><div class="v14-dash-metrics" id="v14-dash-metrics"></div><section class="v14-panel"><div class="v14-panel-title"><h3>آخرین اسناد</h3><button type="button" class="v14-link" data-v14-page="reports">راپور کامل ←</button></div><div class="v14-recent" id="v14-recent"></div></section>`;
$('page-dashboard').insertBefore(host,$('page-dashboard').firstChild);host.addEventListener('click',e=>{const b=e.target.closest('[data-v14-page]');if(b)C.showPage(b.dataset.v14Page);if(e.target.closest('[data-v14-open="setup"]'))openSetup()});}
 $('v14-date-tabs').innerHTML=todayLabels().map(x=>`<button type="button" data-day="${x.days}" class="${x.days===dashboardFilter?'current':''}">${x.label}</button>`).join('');
 $('v14-date-tabs').onclick=e=>{const btn=e.target.closest('[data-day]');if(btn){dashboardFilter=Number(btn.dataset.day);dashboardEnhance()}};
 const since=dashboardFilter>=0?daysAgo(dashboardFilter):'', rows=C.records.filter(r=>!since||r.date>=since), cash=C.actualBalances('خزانه'),due=C.actualBalances('پرداخت نشده'),profit=C.actualBalances('مفاد');
 const fmtRow=(values,positive=true)=>values.length?values.map(([cur,v])=>`<span class="${v<0?'negative':'positive'}">${labelMoney(Math.abs(v),cur)} ${v<0?'منفی':''}</span>`).join(''):'<span class="v14-empty-text">بدون معامله</span>';
 $('v14-dash-metrics').innerHTML=`<button class="v14-metric" data-metric="خزانه"><span class="v14-metric-icon blue">▣</span><span>موجودی خزانه</span><strong>${fmtRow(cash)}</strong><small>تمام ارزها • موجودی کل</small></button><button class="v14-metric" data-metric="پرداخت نشده"><span class="v14-metric-icon amber">◷</span><span>پرداخت نشده</span><strong>${fmtRow(due)}</strong><small>حواله‌های در انتظار پرداخت</small></button><button class="v14-metric" data-metric="مفاد"><span class="v14-metric-icon green">⌁</span><span>حساب مفاد</span><strong>${fmtRow(profit)}</strong><small>مفاد جدا از اصل معامله</small></button><button class="v14-metric" data-metric="__records"><span class="v14-metric-icon violet">▤</span><span>اسناد در بازه</span><strong>${F(new Set(rows.map(r=>r.transferId||r.documentId||r.id)).size)}</strong><small>اسناد یکتای ثبت‌شده</small></button>`;
 $('v14-dash-metrics').onclick=e=>{const b=e.target.closest('[data-metric]');if(!b)return;if(b.dataset.metric==='__records')C.showPage('reports');else{C.showPage('accounts');C.openAccount(b.dataset.metric)}};
 $('v14-recent').innerHTML=rows.slice(-6).reverse().map(r=>`<div><span class="v14-small-icon">${r.mode==='hawala'?'↗':r.mode==='exchange'?'⇄':'▤'}</span><div class="v14-recent-desc"><strong>${S(r.name)}</strong><small>${S(r.note||r.documentNo||r.mode||'سند')} • ${S(C.dateText(r.date))}</small></div><span class="v14-amount ${r.type==='debt'?'credit':'debit'}">${r.type==='payment'?'+':'−'}${F(r.amount)} ${S(r.currency||'AFN')}</span></div>`).join('')||'<p class="v14-empty-text">هنوز معامله‌ای برای این بازه ثبت نشده است.</p>';
}
// Wizard keeps existing data. It is optional on every device and never reinitializes an existing ledger.
let step=0;
function openSetup(){step=0;showStep()}
function showStep(){const co=C.settings.companyV14||{},rates=C.settings.ratesV14||{};let content='';
 if(step===0)content=`<div class="v14-wizard-steps">${['شرکت','اسعار','خزانه','تأیید'].map((x,i)=>`<span class="${i===step?'active':''}">${i+1} ${x}</span>`).join('')}</div><div class="v14-grid"><label class="v14-field">نام شرکت<input id="v14-co-name" value="${S(co.name||C.settings.title||'')}" maxlength="100" required/></label><label class="v14-field">آدرس<input id="v14-co-address" value="${S(co.address||'')}" maxlength="160"/></label><label class="v14-field">شماره تماس<input id="v14-co-phone" value="${S(co.phone||'')}" maxlength="60"/></label><label class="v14-field">ایمیل<input id="v14-co-email" value="${S(co.email||'')}" type="email" maxlength="100"/></label></div>`;
 if(step===1)content=`<p class="v14-help">نرخ‌ها اختیاری‌اند و در فورم صرافی فقط به‌عنوان پیشنهاد استفاده می‌شوند.</p><div class="v14-grid">${C.currencies.map(c=>`<label class="v14-field">نرخ خرید ۱ ${S(c)}<input data-buy="${S(c)}" inputmode="decimal" value="${S(rates[c]?.buy||'1')}"/></label><label class="v14-field">نرخ فروش ۱ ${S(c)}<input data-sell="${S(c)}" inputmode="decimal" value="${S(rates[c]?.sell||'1')}"/></label>`).join('')}</div>`;
 if(step===2)content=`<p class="v14-help">موجودی اولیه فقط اگر قبلاً برای آن ارز در خزانه سندی وجود نداشته باشد ثبت می‌شود.</p><div class="v14-grid">${C.currencies.map(c=>`<label class="v14-field">موجودی اولیه ${S(c)}<input data-opening="${S(c)}" inputmode="decimal" placeholder="0"/></label>`).join('')}</div>`;
 if(step===3)content=`<div class="v14-ready-box">✓ اطلاعات شرکت و نرخ‌ها در تنظیمات همین حساب ذخیره می‌شوند.<p>در صورت ثبت موجودی اولیه، سندی با شمارهٔ مستقل ساخته می‌شود و اطلاعات قبلی پاک نخواهند شد.</p><p>لایسنس و ورود کاربران از طریق Supabase مدیریت می‌شوند؛ معاملات در این نسخه هنوز فقط در حافظهٔ همین مرورگر هستند.</p></div>`;
 const host=makeSheet('setup','راه‌اندازی شرکت',content+`<div class="v14-wizard-actions"><button id="v14-next" class="primary" type="button">${step===3?'ثبت و پایان':'بعدی ←'}</button><button id="v14-prev" class="v14-button" type="button">${step===0?'بعداً':'قبلی'}</button></div>`);
 host.querySelector('#v14-prev').onclick=()=>{if(step===0)closeSheet();else{step--;showStep()}};
 host.querySelector('#v14-next').onclick=()=>{
 if(!canEdit())return;
 if(step===0){const name=$('v14-co-name').value.trim();if(!name){alert('نام شرکت الزامی است');return}C.settings.companyV14={name,address:$('v14-co-address').value.trim(),phone:$('v14-co-phone').value.trim(),email:$('v14-co-email').value.trim()};C.settings.title=name;}
 if(step===1){C.settings.ratesV14 ||= {};for(const cur of C.currencies){const buy=int(host.querySelector(`[data-buy="${cur}"]`).value),sell=int(host.querySelector(`[data-sell="${cur}"]`).value);if(!(buy>0&&sell>0))return alert('نرخ‌ها باید مثبت باشند');C.settings.ratesV14[cur]={buy,sell}}}
 if(step===2){C.settings.openingV14 ||= {};for(const input of host.querySelectorAll('[data-opening]')){const cur=input.dataset.opening,amount=int(input.value||'0');if(!Number.isFinite(amount)||amount<0)return alert('موجودی اولیه معتبر نیست');if(amount>0){if(C.accountSource('خزانه').some(r=>r.currency===cur))return alert('خزانه در ارز '+cur+' قبلاً معامله دارد؛ موجودی اولیه دوباره ثبت نمی‌شود.');C.records.push({id:C.makeId(),name:'خزانه',type:'debt',currency:cur,amount,date:C.today(),note:'موجودی اولیه شرکت',mode:'opening',createdAt:new Date().toISOString()});}}if(!C.saveRecords())return alert('ذخیره اطلاعات ممکن نشد')}
 saveMeta();companyTitle();step<3?(step++,showStep()):(closeSheet(),C.render());
 };
}
// Account settings: independent rules per exchanger (never global).
const tabs=[['account','حساب'],['currencies','ارز'],['numbers','نمبر حواله'],['fees','مفاد'],['more','بیشتر']];
let selectedAccount='',tab='account';
function openAccountSettings(name){selectedAccount=name;tab='account';drawAccountSettings()}
function drawAccountSettings(){const a=C.accounts.find(a=>a.name===selectedAccount);if(!a)return;const r=rule(a.name),cur=C.currencies;
 let main='';
 if(tab==='account')main=`<div class="v14-grid"><label class="v14-field">نام حساب<input id="v14-account-name" value="${S(a.name)}" disabled/></label><label class="v14-field">دسته‌بندی<select id="v14-cat">${opts(['مشتری','صراف','شرکت','بانک','کاربر','خزانه','مصارف','سایر'].map(x=>[x,x]),a.category||'مشتری')}</select></label><label class="v14-field">شماره تماس<input id="v14-account-phone" value="${S(a.phone||'')}"/></label><label class="v14-field">توضیحات<input id="v14-account-desc" value="${S(a.description||'')}"/></label></div>`;
 if(tab==='currencies')main=`<p class="v14-help">ارزهای فعال برای حواله‌های این صراف را مشخص کن.</p>${cur.map(c=>`<label class="v14-setting-row"><span>${labelMoney('',c)}</span><input type="checkbox" data-active-cur="${S(c)}" ${r.activeCurrencies?.[c]===false?'':'checked'}/></label>`).join('')}`;
 if(tab==='limits')main=`<p class="v14-help">حداکثر بدهکاری هر ارز. مقدار صفر یعنی بدون محدودیت؛ در صورت عبور از حد، ثبت حواله متوقف می‌شود.</p><div class="v14-grid">${cur.map(c=>`<label class="v14-field">حد بدهکاری ${S(c)}<input inputmode="decimal" data-limit="${S(c)}" value="${S(r.limits?.[c]??'0')}"/></label>`).join('')}</div>`;
 if(tab==='numbers')main=`<p class="v14-help">شمارهٔ بعدی حواله برای این صراف. سندهای قبلی تغییر نمی‌کنند و شماره‌های تکراری مجاز نیستند.</p><div class="v14-grid"><label class="v14-field">شماره بعدی وارده<input id="v14-in-next" type="number" min="1" value="${S(r.sequence?.in||1)}"/></label><label class="v14-field">شماره بعدی صادره<input id="v14-out-next" type="number" min="1" value="${S(r.sequence?.out||1)}"/></label></div><div class="v16-small-actions"><button type="button" class="v14-button" id="v16-reset-numbers">بازنشانی هر دو شماره به ۱</button><span class="v14-help">نمبرهای قبلی تغییر نمی‌کنند؛ شمارهٔ تکراری هنگام ثبت رد می‌شود.</span></div>`;
 if(tab==='fees')main=`<p class="v14-help">مفاد پلکانی: تا هر سقف تعیین‌شده یک واحد مفاد؛ مثال سقف ۵۰٬۰۰۰ و مفاد ۵۰ یعنی ۵۰٬۰۰۰ ← ۵۰ و ۵۰٬۰۰۱ ← ۱۰۰. مفاد فورم خودکار محاسبه می‌شود.</p><div class="v14-grid">${cur.map(c=>`<label class="v14-field">از مبلغ ${S(c)}<input data-fee-threshold="${S(c)}" inputmode="decimal" value="${S(r.fees?.[c]?.threshold??0)}"/></label><label class="v14-field">مفاد ${S(c)}<input data-fee-value="${S(c)}" inputmode="decimal" value="${S(r.fees?.[c]?.value??0)}"/></label>`).join('')}</div>`;
 if(tab==='more')main=`<div class="v14-ready-box"><strong>امنیت و حسابرسی</strong><p>حذف اسناد و ویرایش آن‌ها فقط با اشتراک فعال مجاز است. پیش از تنظیم مجدد شمارنده‌ها و مفاد از اطلاعات پشتیبان بگیر.</p><button type="button" class="v14-button" id="v14-open-report">راپور کامل این حساب</button><button type="button" class="v14-button" id="v14-copy-balance">کپی بیلانس</button></div>`;
 const host=makeSheet('account','تنظیمات حساب — '+a.name,`<div class="v14-account-settings"><nav class="v14-settings-tabs">${tabs.map(([id,label])=>`<button type="button" data-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('')}</nav><div class="v14-settings-content">${main}</div></div><div class="v14-wizard-actions"><button type="button" class="primary" id="v14-rule-save">ذخیره تنظیمات</button><button type="button" class="v14-button" data-v14-close>بستن</button></div>`);
 host.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;drawAccountSettings()});
 if($('v16-reset-numbers'))$('v16-reset-numbers').onclick=()=>{if(!canEdit()||!confirm('شماره‌های بعدی این صراف به ۱ بازنشانی شوند؟ اسناد قبلی بدون تغییر می‌مانند.'))return;r.sequence={in:1,out:1};saveMeta();drawAccountSettings()};
 host.querySelector('#v14-rule-save').onclick=()=>{
 if(!canEdit())return;
 if(tab==='account'){a.category=$('v14-cat').value;a.phone=$('v14-account-phone').value.trim();a.description=$('v14-account-desc').value.trim()}
 if(tab==='currencies')for(const x of host.querySelectorAll('[data-active-cur]'))r.activeCurrencies[x.dataset.activeCur]=x.checked;
 if(tab==='limits')for(const x of host.querySelectorAll('[data-limit]')){const v=int(x.value);if(!(v>=0))return alert('حد بدهکاری نامعتبر است');r.limits[x.dataset.limit]=v}
 if(tab==='numbers'){const inn=Number($('v14-in-next').value),out=Number($('v14-out-next').value);if(!Number.isSafeInteger(inn)||inn<1||!Number.isSafeInteger(out)||out<1)return alert('نمبر معتبر نیست');r.sequence={in:inn,out}}
 if(tab==='fees')for(const cur of C.currencies){const threshold=int(host.querySelector(`[data-fee-threshold="${cur}"]`).value),value=int(host.querySelector(`[data-fee-value="${cur}"]`).value);if(!(threshold>=0&&value>=0))return alert('مفاد معتبر نیست');r.fees[cur]={threshold,value}}
 saveMeta();C.render();drawAccountSettings();
 };
 if($('v14-open-report'))$('v14-open-report').onclick=()=>{closeSheet();C.selectReport(a.name,'')};
 if($('v14-copy-balance'))$('v14-copy-balance').onclick=()=>{const t=[C.settings.companyV14?.name||C.settings.title,a.name,C.today(),...C.actualBalances(a.name).map(([c,v])=>`${c}: ${F(Math.abs(v))} ${v>0?'طلبکار':v<0?'بدهکار':'تصفیه'}`)].join('\n');navigator.clipboard?.writeText(t).then(()=>alert('بیلانس کپی شد')).catch(()=>prompt('کپی بیلانس',t))};
}
function accountSettingsButton(){const detail=$('v13-detail');if(!detail)return;let b=$('v14-account-setting-btn');if(!b){b=document.createElement('button');b.id='v14-account-setting-btn';b.type='button';b.className='v14-button';b.textContent='⚙ تنظیمات حساب';$('v13-account-action-menu').append(b);b.onclick=()=>openAccountSettings(C.state.account);}else if(b.parentElement!==$('v13-account-action-menu'))$('v13-account-action-menu').append(b);b.hidden=C.accounts.find(a=>a.name===C.state.account)?.category!=='صراف'}
C.getNextDoc=function(kind,account){const r=rule(account);let next=Math.max(1,Number(r.sequence?.[kind])||1);while(C.records.some(x=>x.name===account&&x.hawalaRole==='principal'&&x.hawalaKind===kind&&/^\d+$/.test(String(x.documentNo||''))&&Number(x.documentNo)===next))next++;return String(next)};
C.afterHawalaSave=function({kind,account,doc,editing}){if(editing)return;const n=Number(String(doc).split('-').at(-1));const r=rule(account);if(Number.isSafeInteger(n))r.sequence[kind]=Math.max(r.sequence[kind]||1,n+1);saveMeta()};
C.beforeHawalaSave=function({kind,account,amount,cur,converted,targetCur,fee,feeCur,peerFee=0}){const r=rule(account);if(r.activeCurrencies?.[cur]===false){alert('این ارز در تنظیمات صراف غیرفعال است.');return false}
 const previous=C.state.hwEdit?C.records.filter(x=>x.transferId===C.state.hwEdit):[];
 const previouslyPaid=C.state.hwEdit?C.records.filter(x=>x.mode==='hawala-settlement'&&x.originalHawalaId===C.state.hwEdit&&x.name==='پرداخت نشده').reduce((n,x)=>n+x.amount,0):0;
 if(previouslyPaid>0){const original=previous.find(x=>x.hawalaRole==='settlement');if(original&&(original.name!==('پرداخت نشده')||original.currency!==targetCur||converted+0.00001<previouslyPaid)){alert('این حواله پرداخت ثبت‌شده دارد؛ نوع حساب، ارز یا مقدار مبادله را نمی‌توان به کمتر از مجموع پرداخت‌ها تغییر داد.');return false}}
 // Other accounts may have negative balances. Only physical treasury movements are checked at write time.
 return true};
C.hawalaMetadata=function(kind){const prefix='v13-'+kind;return {senderName:$(prefix+'-sender')?.value?.trim()||'',receiverName:$(prefix+'-receiver')?.value?.trim()||'',hawalaSource:$(prefix+'-source')?.value?.trim()||'',hawalaPeerOutgoingNo:kind==='in'?($(prefix+'-peer-out-number')?.value?.trim()||'').slice(0,80):''}};
function hawalaEnhance(){for(const kind of ['in','out']){const p='v13-'+kind,form=$(p+'-form');if(!form||$(p+'-sender'))continue;
const note=$(p+'-note').closest('.field');note.insertAdjacentHTML('beforebegin',`<div class="field"><label>فرستنده</label><input id="${p}-sender" placeholder="نام فرستنده" maxlength="100"/></div><div class="field"><label>گیرنده</label><input id="${p}-receiver" placeholder="نام گیرنده" maxlength="100"/></div>`);

}
}
// Transfer of previously registered unpaid incoming hawala to treasury, with partial payments.
function pendingData(){const groups=new Map();for(const r of C.records){if(r.mode!=='hawala'||r.hawalaKind!=='in'||r.hawalaRole!=='settlement'||r.name!=='پرداخت نشده')continue;groups.set(r.transferId,{r,paid:0})}
 for(const r of C.records){if(r.mode==='hawala-settlement'&&r.originalHawalaId&&groups.has(r.originalHawalaId)&&r.name==='پرداخت نشده'&&r.type==='debt')groups.get(r.originalHawalaId).paid+=r.amount}
 return [...groups.values()].map(x=>({...x,remaining:Math.max(0,Math.round((x.r.amount-x.paid)*100)/100)})).filter(x=>x.remaining>0.00001)}
function pendingView(){let section=$('v14-pending');if(!section){section=document.createElement('section');section.className='v14-panel';section.id='v14-pending';$('page-accounts').insertBefore(section,$('page-accounts').firstChild)}const due=pendingData();section.innerHTML=`<div class="v14-panel-title"><div><h3>حواله‌های پرداخت‌نشده</h3><p class="v14-help">پرداخت کامل یا قسمی با انتقال دقیق از «پرداخت نشده» به «خزانه»</p></div><span class="v14-pill">${F(due.length)} سند</span></div><div class="v14-pending-list">${due.slice(0,20).map(x=>`<div class="v14-pending-row"><div><strong>${S(x.r.documentNo||'بدون نمبر')}</strong><small>${S(x.r.date)} • ${S(x.r.hawalaSource||x.r.note||'حواله وارده')}</small></div><span>${labelMoney(x.remaining,x.r.currency||'AFN')}</span><button type="button" class="v14-button" data-settle="${S(x.r.transferId)}">پرداخت</button></div>`).join('')||'<div class="v14-empty-text">حوالهٔ معلقی وجود ندارد.</div>'}</div>`;
 section.onclick=e=>{const b=e.target.closest('[data-settle]');if(b)openSettle(b.dataset.settle)};
}
function openSettle(id){const item=pendingData().find(x=>x.r.transferId===id);if(!item)return alert('حوالهٔ معلق پیدا نشد');const r=item.r;
 const el=makeSheet('payment','پرداخت حواله '+(r.documentNo||''),`<p class="v14-help">مانده: ${F(item.remaining)} ${S(r.currency)}. با ثبت این پرداخت، تعهد کاهش و خزانه به همان میزان کم می‌شود.</p><div class="v14-grid"><label class="v14-field">مقدار پرداخت<input id="v14-settle-amount" inputmode="decimal" value="${S(item.remaining)}"/></label><label class="v14-field">تاریخ<input id="v14-settle-date" type="date" value="${S(C.today())}"/></label><label class="v14-field v14-full">تشریحات<input id="v14-settle-note" maxlength="180" placeholder="اختیاری"/></label></div><div class="v14-wizard-actions"><button type="button" class="primary" id="v14-settle-save">ثبت پرداخت</button><button type="button" class="v14-button" data-v14-close>بستن</button></div>`);
 $('v14-settle-save').onclick=async ()=>{if(!canEdit())return;const current=pendingData().find(x=>x.r.transferId===id);if(!current)return alert('حواله دیگر معلق نیست');const amount=int($('v14-settle-amount').value),date=$('v14-settle-date').value,note=$('v14-settle-note').value.trim();if(!(amount>0&&amount<=current.remaining+0.00001))return alert('مبلغ نباید از ماندهٔ حواله بیشتر باشد');if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return alert('تاریخ معتبر نیست');const paymentId=C.makeId(),stamp=new Date().toISOString(),common={date,currency:r.currency,amount,note:note||'پرداخت حواله '+r.documentNo,mode:'hawala-settlement',documentNo:'PAY-'+String(Date.now()).slice(-9),transferId:paymentId,originalHawalaId:id,createdAt:stamp};const batch=[{...common,id:C.makeId(),name:'پرداخت نشده',type:'debt',ledgerDelta:0},{...common,id:C.makeId(),name:'خزانه',type:'payment',ledgerDelta:-amount}];if(window.MC18&&!window.MC18.checkCashBatch(batch,[],'پرداخت حواله'))return;if(window.MC21&&!await window.MC21.authorizeBackdate(batch,[],'پرداخت حواله'))return;C.records.push(...batch);if(!C.saveRecords()){C.records.splice(-2);return alert('خطا در ذخیره')}closeSheet();C.render();window.MC21?.notify('پرداخت حواله ثبت شد. ماندهٔ تعهد به‌روزرسانی شد.','success')};
}
function reportEnhance(){if(!$('v14-report-search')){const target=$('v13-report-card').querySelector('.v13-filters');target.insertAdjacentHTML('afterend',`<div class="v14-report-extra"><input id="v14-report-search" placeholder="جستجو شماره حواله، نام یا تشریحات"/><select id="v14-report-type"><option value="">تمام اسناد</option><option value="journal">روزنامچه</option><option value="exchange">تبادله</option><option value="hawala">حواله</option><option value="hawala-settlement">پرداخت حواله</option></select><select id="v14-report-order"><option value="date">تاریخ</option><option value="id">شماره سند</option><option value="incoming">حواله وارده</option><option value="outgoing">حواله صادره</option></select></div><p class="v14-help">برای گزارش کامل و ماندهٔ دقیق هر ارز از جدول اصلی و خروجی PDF/Excel استفاده کن. فیلترهای پایین فقط نمایش سریع اسناد را تغییر می‌دهند.</p><div class="v14-filter-results" id="v14-filter-results"></div>`);for(const id of ['search','type','order'])$('v14-report-'+id).addEventListener('input',reportFiltered)}reportFiltered()}
function reportFiltered(){const host=$('v14-filter-results');if(!host)return;const a=C.state.reportAccount;if(!a){host.innerHTML='';return}const q=String($('v14-report-search').value||'').toLowerCase(),type=$('v14-report-type').value,order=$('v14-report-order').value;let all=C.ledger(C.accountSource(a));all=all.filter(r=>(!C.state.reportCurrency||r.currency===C.state.reportCurrency)&&(!type||(type==='journal'?!['hawala','exchange','hawala-settlement'].includes(r.mode):r.mode===type))&&(!q||[r.name,r.note,r.documentNo,r.senderName,r.receiverName].join(' ').toLowerCase().includes(q)));if(order==='incoming')all=all.filter(x=>x.hawalaKind==='in');if(order==='outgoing')all=all.filter(x=>x.hawalaKind==='out');if(order==='id')all.sort((x,y)=>String(y.documentNo||y.id).localeCompare(String(x.documentNo||x.id)));else all.reverse();host.innerHTML=`<div class="v14-panel-title"><h3>نتایج جستجو</h3><span>${F(all.length)} سند</span></div>${all.slice(0,50).map(r=>`<div class="v14-filter-line"><span>${S(r.documentNo||r.id.slice(0,8))}</span><span>${S(r.note||r.mode||'—')}</span>${labelMoney(r.amount,r.currency||'AFN')}<span>${F(r.closingBalance)} ${S(r.currency||'AFN')}</span></div>`).join('')||'<p class="v14-help">نتیجه‌ای وجود ندارد.</p>'}${all.length>50?'<p class="v14-help">۵۰ سند اول نمایش داده می‌شوند.</p>':''}`}
function bind(){header();dashboardEnhance();hawalaEnhance();pendingView();reportEnhance();companyTitle();
const nav=document.querySelector('#v14-sidebar');C.onPage=page=>{nav.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.v14Page===page));if(page==='accounts')pendingView();if(page==='reports')reportEnhance();};
C.onAfterRender=()=>{dashboardEnhance();pendingView();accountSettingsButton();if(C.state.reportAccount)reportFiltered()};
// Account detail state changes do not always cause full render. Observe explicit account opening interactions.
document.querySelector('#page-accounts').addEventListener('click',e=>{if(e.target.closest('[data-open-account]'))setTimeout(accountSettingsButton,0)});
// Complete consistent account settings action on manual settings button.
C.onPage('dashboard');
}
window.MC14.rule=rule;window.MC14.pendingData=pendingData;window.MC14.openSettle=openSettle;window.MC14.openAccountSettings=openAccountSettings;
try{bind()}catch(e){console.error('v14',e)}
})();



/* ===== Scripts v15 (execution order preserved) ===== */
/* دفتر حسابات v15 — connected financial workspace / document importer.
 * Copyright (c) 2026 Yaser Afif. Client-only financial information stays local.
 * This layer does not create fictional transactions or mutate old entries on load.
 */
(()=>{'use strict';
const C=window.MC14;if(!C)return;
const $=id=>document.getElementById(id), S=v=>C.safe(String(v??'')), fmt=n=>C.fmt(Number(n)||0);
const normalize=v=>String(v??'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\s_\-]/g,'').toLowerCase();
const numeric=v=>{const n=C.parsedAmount(String(v??'').replace(/[\u0660-\u0669]/g,x=>String(x.charCodeAt(0)-1632)).replace(/[\u06f0-\u06f9]/g,x=>String(x.charCodeAt(0)-1776)));return Number.isFinite(n)?n:NaN};
const currency=r=>String(r.currency||'AFN').toUpperCase(), money=(v,c)=>`<span class="v15-currency v15-${S(c.toLowerCase())}">${S(c)}</span><b dir="ltr">${fmt(v)}</b>`;
const H={records:[],invalid:[],dupes:[],meta:[],sourceName:'',rawRows:[],page:1,perPage:30};
let reportRows=[],reportPage=1,viewMode='all',tableType='',reportAccountChoice='',liveView='';
const cap=(v,max=500)=>String(v??'').slice(0,max);
const toast=(message,kind='ok')=>{let el=$('v15-toast');if(!el){el=document.createElement('div');el.id='v15-toast';el.setAttribute('role','status');document.body.append(el)}el.className='v15-toast '+kind;el.textContent=message;el.hidden=false;clearTimeout(toast.handle);toast.handle=setTimeout(()=>el.hidden=true,5500)};
const writable=()=>{if(window.LICENSE_CAN_WRITE===true)return true;toast('برای ثبت یا واردکردن اسناد باید اشتراک فعال باشد.','bad');return false};
function dialog(title,html){let el=$('v15-modal');if(!el){el=document.createElement('div');el.id='v15-modal';document.body.append(el)}el.hidden=false;el.innerHTML=`<section class="v15-dialog" role="dialog" aria-modal="true" aria-label="${S(title)}"><div class="v15-dialog-head"><h2>${S(title)}</h2><button type="button" data-v15-close title="بستن">×</button></div><div class="v15-dialog-content">${html}</div></section>`;el.onclick=e=>{if(e.target===el||e.target.closest('[data-v15-close]'))el.hidden=true};return el}
function close(){if($('v15-modal'))$('v15-modal').hidden=true}
function typeText(r){if(r.mode==='hawala')return r.hawalaKind==='in'?'حواله وارده':'حواله صادره';if(r.mode==='hawala-settlement')return 'پرداخت حواله';if(r.mode==='exchange')return 'تبادله';if(r.mode==='opening')return 'موجودی اولیه';if(r.mode==='imported')return 'سند واردشده';return 'روزنامچه'}
const sign=r=>C.delta(r);
function labelSide(r){return C.delta(r)<0?'گرفت':'طلب'}
function groupFor(r){return r?.transferId?C.records.filter(x=>x.transferId===r.transferId):[r]}
function accountsOptions(current=''){return `<option value="">انتخاب حساب...</option>${C.accounts.map(a=>`<option value="${S(a.name)}" ${a.name===current?'selected':''}>${S(a.name)}</option>`).join('')}`}
function makeNavigation(){document.body.classList.add('v15-ready');const brand=$('v14-appbar');if(brand)brand.querySelector('.v14-version').textContent='نسخه ۱۵';
const sidebar=$('v14-sidebar');if(sidebar){sidebar.querySelector('.v14-sidebar-label').textContent='دسترسی‌های مالی';const foot=sidebar.querySelector('.v14-sidebar-foot');}
const settings=$('page-settings');settings.insertAdjacentHTML('beforeend',`<details class="v13-accordion" open><summary>ورود و انتقال اسناد از سیستم دیگر</summary><div class="v13-inner"><p class="v15-note">اسناد واقعی را از فایل‌های Excel، CSV یا JSON وارد کنید. عکس‌ها حاوی دیتابیس واقعی نیستند. پیش از ورود، بکاپ بگیرید.</p><button type="button" class="v15-button" id="v15-import-settings">انتخاب فایل و پیش‌نمایش اسناد</button></div></details>`);$('v15-import-settings').onclick=openImporter;
const page=$('page-dashboard');page.insertAdjacentHTML('afterbegin','<div id="v15-command"></div>');
const sub=$('v13-detail');if(sub){sub.insertAdjacentHTML('beforeend','<div id="v15-detail-extras"></div>');}
}
// Transaction document details use *actual* journal entries, including linked remittances.
// One customer-facing voucher per transferId. Internal postings appear only inside an optional audit detail.
function voucherView(r){
 const group=groupFor(r),primary=group.find(x=>x.hawalaRole==='principal')||group.find(x=>x.exchangeSide==='out')||group[0],settlement=group.find(x=>x.hawalaRole==='settlement')||group.find(x=>x.exchangeSide==='in'),
       ownFee=group.filter(x=>x.hawalaRole==='fee-profit').reduce((n,x)=>n+Number(x.amount||0),0),
       peerFee=group.filter(x=>x.hawalaRole==='fee-peer-debit').reduce((n,x)=>n+Number(x.amount||0),0),
       faceCur=currency(primary),faceAmount=Number(primary.amount||0),otherCur=settlement?currency(settlement):faceCur,
       otherAmount=settlement?Number(settlement.amount||0):faceAmount,doc=C.shortId(primary),
       isHawala=primary.mode==='hawala',isExchange=primary.mode==='exchange',isCash=primary.name==='خزانه'||primary.mode==='treasury',
       single=settlement&&faceCur===otherCur,paid=isHawala?C.records.filter(x=>x.originalHawalaId===primary.transferId&&x.mode==='hawala-settlement'&&x.name==='پرداخت نشده').reduce((n,x)=>n+Number(x.amount||0),0):0;
 const field=(name,value)=>`<div class="v19-doc-field"><span>${S(name)}</span><strong>${S(value??'—')}</strong></div>`;
 const total=settlement&&otherCur!==faceCur?`<div class="v19-doc-field"><span>مبلغ مبادله</span><strong dir="ltr">${S(fmt(otherAmount))} ${S(otherCur)}</strong></div>`:'';
 const state=isHawala?settlement?.name==='پرداخت نشده'?(paid>0?(paid+0.000001>=otherAmount?'پرداخت‌شده':'پرداخت قسمی'):'در انتظار پرداخت'):'اجراشده':isExchange?'تبادلهٔ ثبت‌شده':'ثبت‌شده';
 const route=settlement?`<div class="v19-doc-route"><strong>${S(primary.name)}</strong><i aria-hidden="true">⇄</i><strong>${S(settlement.name)}</strong><span>· یک سند، یک مبلغ اصلی</span></div>`:'';
 const badSame=single&&Math.abs(otherAmount-faceAmount)>0.00001?'<p class="v19-doc-note" style="border-color:#cc4d5e">⚠️ این سند قدیمی اختلاف مبلغ در ارز یکسان دارد؛ قبل از استفادهٔ مالی باید بررسی و اصلاح شود.</p>':'';
 const rates=settlement&&faceCur!==otherCur?field('نرخ / عملیه',`${primary.hawalaOperation==='divide'?'تقسیم':'ضرب'} · ${primary.hawalaRate||primary.exchangeRate||'—'}`):'';
 const details=`<div class="v19-document"><div class="v19-doc-hero"><span class="v19-doc-tag">${S(typeText(primary))} · ${S(state)}</span><div><small>مبلغ اصلی سند</small><div class="v19-doc-main">${S(fmt(faceAmount))} ${S(faceCur)}</div></div><small>شماره سند ${S(doc)} · تاریخ ${S(C.dateText(primary.date))}</small></div>${route}<div class="v19-doc-fields">${field('نام حساب',primary.name)}${field('شماره آی‌دی',doc)}${field('تاریخ',C.dateText(primary.date))}${!isCash&&primary.documentNo?field('نمبر حواله',primary.documentNo):''}${isHawala&&primary.hawalaKind==='in'&&primary.hawalaPeerOutgoingNo?field('شماره حواله صادره صراف',primary.hawalaPeerOutgoingNo):''}${total}${rates}${!isCash&&primary.senderName?field('فرستنده',primary.senderName):''}${!isCash&&primary.receiverName?field('گیرنده',primary.receiverName):''}${!isCash&&primary.trackingRef?field('مرجع',primary.trackingRef):''}${ownFee?field('مفاد حواله',`${fmt(ownFee)} ${primary.hawalaFeeCurrency||faceCur}`):''}${primary.hawalaSarrafFee?field('مفاد صراف',`${fmt(primary.hawalaSarrafFee)} ${primary.hawalaSarrafFeeCurrency||primary.hawalaFeeCurrency||faceCur}`):''}${isHawala&&settlement?.name==='پرداخت نشده'?field('پرداخت‌شده / مانده',`${fmt(paid)} / ${fmt(Math.max(0,otherAmount-paid))} ${otherCur}`):''}</div>${primary.note?`<div class="v19-doc-note"><b>تشریحات:</b> ${S(primary.note)}</div>`:''}${badSame}</div>`;
 const auditRows=group.map(x=>`<tr><td>${S(x.name)}</td><td>${money(x.amount,currency(x))}</td><td>${S(labelSide(x))}</td><td>${S(x.hawalaRole||x.mode||'—')}</td></tr>`).join('');
 const audit=`<details class="v19-doc-audit"><summary>جزئیات داخلی حسابداری (برای بررسی؛ در چاپ مشتری نمایش داده نمی‌شود)</summary><div class="v15-scroll"><table class="v15-table"><thead><tr><th>حساب</th><th>مقدار</th><th>اثر</th><th>بخش داخلی</th></tr></thead><tbody>${auditRows}</tbody></table></div></details>`;
 return {doc,title:typeText(primary),html:details+audit,print:details};
}
function openVoucher(id){
 const r=C.records.find(x=>String(x.id)===String(id));if(!r){toast('سند پیدا نشد.','bad');return}
 const voucher=voucherView(r),g=groupFor(r),head=g.find(x=>x.hawalaRole==='principal')||r;
 const detail=dialog(`${voucher.title} · سند ${voucher.doc}`,voucher.html+`<div class="v15-actions"><button type="button" class="v15-button" id="v15-voucher-print">چاپ شکیل / ذخیره PDF</button><button type="button" class="v15-button ghost" id="v17-voucher-edit">✎ ویرایش سند</button><button type="button" class="v15-button ghost" id="v15-voucher-copy">کپی مشخصات</button><button type="button" class="v15-button ghost" id="v23-voucher-share">شریک‌سازی متن سند</button></div>`);
 $('v17-voucher-edit').onclick=()=>{close();C.editLedgerRecord(head.id||r.id)};
 $('v15-voucher-copy').onclick=()=>{const text=`${C.settings.companyV14?.name||C.settings.title||'دفتر حسابات'}\n${voucher.title}\nآی‌دی ${voucher.doc}\nتاریخ ${C.dateText(head.date)}\nمبلغ ${fmt(head.amount)} ${currency(head)}\n${head.note||''}`;navigator.clipboard?.writeText(text).then(()=>toast('مشخصات سند کپی شد.')).catch(()=>prompt('کپی مشخصات سند',text))};
 $('v23-voucher-share').onclick=()=>{
  const primary=g.find(x=>x.hawalaRole==='principal')||g.find(x=>x.exchangeSide==='out')||head;
  const paired=g.find(x=>x.hawalaRole==='settlement')||g.find(x=>x.exchangeSide==='in');
  const fee=g.filter(x=>x.hawalaRole==='fee-profit').reduce((s,x)=>s+Number(x.amount||0),0);
  const shareText=[`*${C.settings.companyV14?.name||C.settings.title||'دفتر حسابات'}*`,`*${voucher.title}*`,
   `آی‌دی سند: ${voucher.doc}`,`تاریخ: ${C.dateText(primary.date)}`,
   primary.documentNo?`نمبر حواله: ${primary.documentNo}`:'',`حساب: ${primary.name}`,
   `مبلغ: *${fmt(primary.amount)} ${currency(primary)}*`,
   paired&&paired.currency!==primary.currency?`مقدار مبادله: ${fmt(paired.amount)} ${currency(paired)}`:'',
   paired?`حساب مقابل: ${paired.name}`:'',
   fee?`مفاد حواله: ${fmt(fee)} ${primary.hawalaFeeCurrency||currency(primary)}`:'',
   primary.hawalaSarrafFee?`مفاد صراف: ${fmt(primary.hawalaSarrafFee)} ${primary.hawalaSarrafFeeCurrency||currency(primary)}`:'',
   primary.note?`تشریحات: ${primary.note}`:''].filter(Boolean).join('\n');
  let area=$('v23-share-area');if(!area){area=document.createElement('div');area.id='v23-share-area';
   area.innerHTML='<label for="v23-share-text">متن قابل ویرایش سند</label><textarea id="v23-share-text" dir="rtl" rows="10" spellcheck="false"></textarea><div class="v23-share-actions"><button id="v23-copy-share" type="button" class="v15-button">کاپی متن</button><button id="v23-native-share" type="button" class="v15-button ghost">ارسال</button></div><p role="status" id="v23-share-status"></p>';
   $('v15-modal').querySelector('.v15-dialog-content').append(area)}
  area.hidden=false;$('v23-share-text').value=shareText;$('v23-share-text').focus();
  $('v23-copy-share').onclick=async()=>{const text=$('v23-share-text').value;
   try{await navigator.clipboard.writeText(text);$('v23-share-status').textContent='متن سند کاپی شد.'}
   catch(e){$('v23-share-text').select();$('v23-share-status').textContent='متن انتخاب شد؛ Ctrl+C را بزنید.'}};
  $('v23-native-share').onclick=async()=>{const text=$('v23-share-text').value;
   if(navigator.share){try{await navigator.share({title:voucher.title,text})}catch(e){if(e.name!=='AbortError')$('v23-share-status').textContent='ارسال انجام نشد.'}}
   else $('v23-copy-share').click()};
 };
 $('v15-voucher-print').onclick=()=>printHtml(`${voucher.title} ${voucher.doc}`,voucher.print,true);
}
function printHtml(title,body,isReceipt=false){
 const co=C.settings.companyV14||{},company=S(co.name||C.settings.title||'دفتر حسابات'),date=S(C.dateText(C.today()));
 const accent=title.includes('صادره')?'#158263':title.includes('وارده')?'#bb4359':'#087e9c';
 const subtitle=[co.address,co.phone,co.email].filter(Boolean).map(S).join(' · ');
 const doc=`<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${S(title)}</title><style>
 @page{size:A4 ${isReceipt?'portrait':'landscape'};margin:${isReceipt?'7mm':'13mm'} ${isReceipt?'9mm':'13mm'} ${isReceipt?'7mm':'16mm'}}
 *{box-sizing:border-box}body{margin:0;background:#ebf2f6;color:#203746;font:12px/1.9 Tahoma,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .paper{--theme:${accent};max-width:${isReceipt?'770':'1120'}px;background:#fff;margin:25px auto;padding:32px 37px;border-radius:17px;box-shadow:0 12px 55px #173e5724;position:relative;border-top:9px solid var(--theme);overflow:hidden}
 .paper:before{content:"";position:absolute;inset:0 0 auto 0;height:75px;background:linear-gradient(90deg,#e7f5f7,transparent);pointer-events:none}
 .mast{display:flex;position:relative;justify-content:space-between;align-items:center;gap:20px;border-bottom:2px solid #dceaf0;padding:0 0 20px}
 .brand{display:flex;align-items:center;gap:15px}.logo{display:grid;place-items:center;flex:none;width:66px;height:66px;color:#fff;background:linear-gradient(145deg,#0e8cad,#134a63);border-radius:17px;font-size:31px;font-weight:900;box-shadow:0 5px 16px #0b66813b}
 h1{margin:0;color:#0d5067;font-size:24px}.eyebrow{color:#4c879c;font-size:10px;letter-spacing:1.6px;direction:ltr;text-align:right}.brand small{display:block;color:#648395;font-size:10px;line-height:1.6;max-width:420px}
 .meta{text-align:left;color:#6c8796;font-size:11px;direction:rtl}.meta strong{display:block;color:#1e5469;font-weight:900}
 h2{color:#1a526a;font-size:19px;font-weight:900;margin:22px 0 7px}.tag{border:1px solid #cce4ec;background:#eff8fa;color:#23677f;border-radius:99px;padding:4px 12px;display:inline-block;margin:9px 0}
 table{border-collapse:collapse;width:100%;font-size:11px;margin:16px 0 22px}th,td{text-align:right;border-bottom:1px solid #e3edf1;padding:10px;overflow-wrap:anywhere}th{background:var(--theme);color:#fff;font-weight:800}tbody tr:nth-child(even){background:#f3f8fa}thead{display:table-header-group}tr{break-inside:avoid}
 p{margin:10px 0;line-height:1.9}
 .v19-document{color:#234354}.v19-doc-hero{border:1px solid #dae9ee;background:linear-gradient(135deg,#edf8fa,#fff);padding:17px 20px;border-radius:13px;margin:15px 0;page-break-inside:avoid}
 .v19-doc-tag{display:inline-block;background:#eff8f5;color:var(--theme);border-radius:99px;font-weight:850;padding:4px 13px;font-size:10px}
 .v19-doc-hero small{color:#678896;font-size:11px}.v19-doc-main{font:bold 32px/1.3 Tahoma,Arial;color:var(--theme);direction:ltr;text-align:right;letter-spacing:-1px;margin:6px 0}
 .v19-doc-route{display:flex;gap:13px;align-items:center;flex-wrap:wrap;background:#f7fbfc;border:1px dashed #c6dce4;border-radius:10px;padding:14px;margin:15px 0;font-size:12px;page-break-inside:avoid}.v19-doc-route strong{color:#1f586c}.v19-doc-route i{font-style:normal;color:#0c7996;font-size:20px}
 .v19-doc-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v19-doc-field{border:1px solid #e2ecf0;border-radius:9px;padding:10px 12px;min-width:0;break-inside:avoid}.v19-doc-field span{display:block;color:#7894a2;font-size:10px;margin-bottom:5px}.v19-doc-field strong{display:block;color:#1c4b60;font-size:13px;overflow-wrap:anywhere}
 .v19-doc-note{background:#f4f9fb;border-right:4px solid #0e8cad;padding:11px 14px;margin-top:14px;color:#356076;border-radius:7px}
 .v19-doc-audit{display:none!important}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:57px 0 17px;break-inside:avoid}.signatures div{border-top:1px solid #bcd2dc;padding-top:11px;text-align:center;color:#66899a;font-size:11px}
 footer{border-top:1px solid #dae8ee;padding-top:13px;display:flex;justify-content:space-between;gap:10px;color:#7793a0;font-size:10px;break-inside:avoid}
 .controls{display:flex;gap:10px;justify-content:center;margin:18px}.controls button{border:0;border-radius:9px;padding:10px 20px;background:#087e9c;color:#fff;cursor:pointer;font:inherit}.controls .back{background:#d7e8ee;color:#16556c}
 @media print{
  ${isReceipt?`.paper.v20-compact-receipt{padding:2mm 3mm!important;margin:0!important;max-width:190mm!important;border-top:3mm solid var(--theme)!important;box-shadow:none!important;border-radius:0!important}
  .v20-compact-receipt .mast{padding-bottom:4mm!important;gap:5mm!important}.v20-compact-receipt .logo{width:10mm;height:10mm;font-size:16px;border-radius:3mm}
  .v20-compact-receipt h1{font-size:16px!important}.v20-compact-receipt h2{font-size:14px!important;margin:3mm 0 1mm!important}
  .v20-compact-receipt .tag,.v20-compact-receipt .eyebrow,.v20-compact-receipt .brand small{display:none!important}
  .v20-compact-receipt .v19-doc-hero{padding:2mm 4mm!important;margin:2mm 0!important}.v20-compact-receipt .v19-doc-main{font-size:20px!important;margin:1mm 0!important}
  .v20-compact-receipt .v19-doc-route{padding:2mm 3mm!important;margin:2mm 0!important}.v20-compact-receipt .v19-doc-fields{grid-template-columns:repeat(3,1fr)!important;gap:1.5mm!important}
  .v20-compact-receipt .v19-doc-field{padding:1.5mm 2mm!important}.v20-compact-receipt .v19-doc-field span{font-size:8px!important;margin:0!important}.v20-compact-receipt .v19-doc-field strong{font-size:10px!important}
  .v20-compact-receipt .v19-doc-note{padding:2mm!important;margin:1mm 0!important;font-size:9px!important}
  .v20-compact-receipt .signatures{margin:5mm 0 2mm!important;gap:7mm!important}.v20-compact-receipt .signatures div{padding-top:2mm!important;font-size:9px!important}
  .v20-compact-receipt footer{padding-top:2mm!important;font-size:8px!important}
  .v20-compact-receipt{max-height:none!important;overflow:visible!important;break-after:avoid!important;page-break-after:avoid!important}`:''}
 body{background:#fff}.paper{box-shadow:none;border:0;border-top:7px solid var(--theme);margin:0;padding:8px 0 0;max-width:none;overflow:visible}.controls{display:none}.paper:before{height:45px}}
 </style></head><body><div class="controls"><button onclick="window.print()">چاپ / ذخیره PDF</button><button class="back" onclick="window.close()">بستن</button></div><article class="paper ${isReceipt?'v20-compact-receipt':''}"><header class="mast"><div class="brand"><div class="logo">${S((co.name||C.settings.title||'د').trim().slice(0,1))}</div><div><div class="eyebrow">OFFICIAL FINANCIAL DOCUMENT</div><h1>${company}</h1><small>${subtitle||'سند مالی شرکت · قابل چاپ و ارائه به مشتری'}</small></div></div><div class="meta"><strong>دفتر حسابات</strong><span>صدور: ${date}</span></div></header><h2>${S(title)}</h2><span class="tag">اصل سند ${isReceipt?'حواله / معامله':'راپور مالی'}</span>${body}<section class="signatures"><div>تنظیم‌کننده</div><div>دریافت‌کننده / مشتری</div><div>مهر و امضای شرکت</div></section><footer><span>${company}</span><span>طراحی و توسعه: یاسر عفیف · afifweb.vercel.app</span><span>${date}</span></footer></article></body></html>`;
 const w=window.open('','_blank');if(!w){toast('پنجرهٔ چاپ در مرورگر مسدود شده است.','bad');return}w.document.open();w.document.write(doc);w.document.close();
}
function tableExtras(){const detail=$('v13-detail-body');if(!detail)return;detail.querySelectorAll('tr').forEach(row=>{if(row.querySelector('[data-v15-view]'))return;const id=row.dataset.v17Id||row.querySelector('[data-v13-edit]')?.dataset.v13Edit||row.querySelector('[data-v13-delete]')?.dataset.v13Delete;if(!id)return;const cell=row.lastElementChild;if(cell)cell.insertAdjacentHTML('afterbegin',`<button type="button" class="v15-view-link" data-v15-view="${S(id)}">جزئیات سند</button>`)});const info=$('v15-detail-extras');if(info&&!info.dataset.init){info.dataset.init='1';info.innerHTML='<p class="v15-note">روی «جزئیات سند» بزن تا تمام ثبت‌های مرتبط با حواله، مفاد یا تبادله دیده شوند.</p>'}}
// Report source is always the same canonical ledger; sorting/filtering DOES NOT recalculate historical closing balances.
function readReport(){const account=C.state.reportAccount,cur=C.state.reportCurrency,from=C.state.reportFrom,to=C.state.reportTo,query=normalize($('v14-report-search')?.value),type=$('v14-report-type')?.value||'',order=$('v14-report-order')?.value||'date';if(!account)return[];let all=C.ledger(C.accountSource(account)).filter(r=>(!cur||currency(r)===cur)&&(!from||r.date>=from)&&(!to||r.date<=to));all=all.filter(r=>(!query||normalize([r.note,r.documentNo,r.senderName,r.receiverName,r.name,r.trackingRef,r.hawalaSource,r.hawalaPeerOutgoingNo,r.externalId,r.importFile].join(' ')).includes(query))&&(!type||(type==='journal'?(!['hawala','exchange','hawala-settlement'].includes(r.mode)):r.mode===type)));if(order==='incoming')all=all.filter(r=>r.hawalaKind==='in');if(order==='outgoing')all=all.filter(r=>r.hawalaKind==='out');if(order==='id')all.sort((a,b)=>String(b.documentNo||b.id).localeCompare(String(a.documentNo||a.id),undefined,{numeric:true}));else all.reverse();return all;}
function totals(rows){const map=new Map();for(const r of rows){const c=currency(r);const o=map.get(c)||{got:0,talab:0,delta:0};if(r.type==='debt')o.got+=Number(r.amount);else o.talab+=Number(r.amount);o.delta+=sign(r);map.set(c,o)}return map}
function makeReports(){const host=$('v13-report-card');if(!host||$('v15-report'))return;host.insertAdjacentHTML('beforeend',`<section id="v15-report"><div class="v15-report-head"><div><h3>دفتر معاملات و راپور پیشرفته</h3><p class="v15-note">گرفت، طلب و ماندهٔ واقعی هر ارز پس از هر سند؛ فیلترها روی چاپ و Excel نیز اعمال می‌شوند.</p></div><div class="v15-actions"><button type="button" class="v15-button" id="v15-report-pdf">چاپ / PDF</button><button type="button" class="v15-button ghost" id="v15-report-xlsx">Excel</button></div></div><div id="v15-report-totals" class="v15-report-totals"></div><div class="v15-scroll"><table class="v15-table" id="v15-report-table"><thead><tr><th>تاریخ</th><th>آی‌دی</th><th>تشریحات</th><th>گرفت</th><th>طلب</th><th>مانده حساب</th><th>نوع</th><th>عمل</th></tr></thead><tbody id="v15-report-body"></tbody></table></div><div class="v15-pager"><button type="button" data-v15-prev>قبلی</button><span id="v15-report-count"></span><button type="button" data-v15-next>بعدی</button><select id="v15-report-size" aria-label="تعداد سطر"><option value="20">۲۰ سطر</option><option value="50" selected>۵۰ سطر</option></select></div></section>`);
const render=()=>renderReport();for(const id of ['v13-report-account','v13-report-currency','v13-report-from','v13-report-to','v14-report-search','v14-report-type','v14-report-order'])$(id)?.addEventListener('input',()=>{reportPage=1;render()});$('v15-report-size').addEventListener('change',()=>{reportPage=1;render()});
$('v15-report').addEventListener('click',e=>{const b=e.target.closest('[data-v15-prev],[data-v15-next],[data-v15-view]');if(!b)return;if(b.hasAttribute('data-v15-prev'))reportPage--;if(b.hasAttribute('data-v15-next'))reportPage++;if(b.hasAttribute('data-v15-view'))openVoucher(b.dataset.v15View);render()});$('v15-report-pdf').onclick=printReport;$('v15-report-xlsx').onclick=exportXlsx;
}
function renderReport(){if(!$('v15-report'))return;reportRows=readReport();const account=C.state.reportAccount;if(!account){$('v15-report-body').innerHTML='<tr><td colspan="8" class="v15-empty">ابتدا یک حساب انتخاب کنید.</td></tr>';$('v15-report-totals').innerHTML='';$('v15-report-count').textContent='';return}const size=30;reportPage=Math.max(1,reportPage);const rows=reportRows.slice(0,reportPage*size);
$('v15-report-totals').innerHTML=[...totals(reportRows)].map(([cur,x])=>`<div class="v15-total-card"><span class="v15-currency v15-${S(cur.toLowerCase())}">${S(cur)}</span><div><small>گرفت</small><b>${fmt(x.got)}</b></div><div><small>طلب</small><b>${fmt(x.talab)}</b></div><div><small>تغییر در بازه</small><b class="${x.delta>=0?'v15-positive':'v15-negative'}">${fmt(x.delta)}</b></div></div>`).join('');
$('v15-report-body').innerHTML=rows.map(r=>`<tr><td>${S(C.dateText(r.date))}</td><td><b>${S(C.shortId(r))}</b></td><td title="${S(r.note||'')}">${S(r.note||typeText(r))}${r.senderName?`<small> ${S(r.senderName)} ← ${S(r.receiverName||'')}</small>`:''}</td><td>${C.delta(r)<0?money(r.amount,currency(r)):'—'}</td><td>${C.delta(r)>=0?money(r.amount,currency(r)):'—'}</td><td><span class="${r.closingBalance<0?'v15-negative':'v15-positive'}">${money(r.closingBalance,currency(r))}</span></td><td><span class="v15-type">${S(typeText(r))}</span></td><td><button type="button" class="v15-view-link" data-v15-view="${S(r.id)}">جزئیات</button></td></tr>`).join('')||'<tr><td colspan="8" class="v15-empty">سندی مطابق فیلترها وجود ندارد.</td></tr>';
$('v15-report-count').textContent=`${fmt(Math.min(reportPage*size,reportRows.length))} از ${fmt(reportRows.length)} سند`;const marker=$('v15-report-count');if(marker&&reportPage*size<reportRows.length&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();reportPage++;renderReport()}},{rootMargin:'220px'});io.observe(marker)}
}
function printReport(){if(!C.state.reportAccount)return toast('حساب را انتخاب کن.','bad');const cols='<tr><th>تاریخ</th><th>آی‌دی</th><th>تشریحات</th><th>گرفت</th><th>طلب</th><th>ارز</th><th>مانده</th></tr>';const rows=reportRows.map(r=>`<tr><td>${S(C.dateText(r.date))}</td><td>${S(C.shortId(r))}</td><td>${S(r.note||typeText(r))}</td><td>${r.type==='debt'?fmt(r.amount):'—'}</td><td>${r.type==='payment'?fmt(r.amount):'—'}</td><td>${S(currency(r))}</td><td>${fmt(r.closingBalance)}</td></tr>`).join('');const sums=[...totals(reportRows)].map(([c,t])=>`${c}: گرفت ${fmt(t.got)} | طلب ${fmt(t.talab)} | تغییر ${fmt(t.delta)}`).join('<hr>');printHtml(`راپور ${C.state.reportAccount}`,`<p>دوره: ${S(C.state.reportFrom||'ابتدا')} تا ${S(C.state.reportTo||'امروز')} | ارز: ${S(C.state.reportCurrency||'تمام ارزها')}</p><p>${sums}</p><table><thead>${cols}</thead><tbody>${rows}</tbody></table>`)}
// Minimal OOXML workbook writer; actual .xlsx with numeric amounts and one stable sheet.
function exportXlsx(){if(!C.state.reportAccount)return toast('حساب را انتخاب کن.','bad');const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');const rows=[['تاریخ','شماره سند','تشریحات','گرفت','طلب','ارز','مانده','نوع سند'],...reportRows.map(r=>[C.dateText(r.date),C.shortId(r),r.note||typeText(r),r.type==='debt'?Number(r.amount):0,r.type==='payment'?Number(r.amount):0,currency(r),Number(r.closingBalance),typeText(r)])];const xmlRows=rows.map((a,i)=>`<row r="${i+1}">${a.map((v,j)=>{const col=String.fromCharCode(65+j);return typeof v==='number'&&Number.isFinite(v)?`<c r="${col}${i+1}" t="n"><v>${v}</v></c>`:`<c r="${col}${i+1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`}).join('')}</row>`).join('');const sheet=`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews><sheetData>${xmlRows}</sheetData><autoFilter ref="A1:H${rows.length}"/></worksheet>`;const files=[['[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],['_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],['xl/workbook.xml','<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="راپور" sheetId="1" r:id="rId1"/></sheets></workbook>'],['xl/_rels/workbook.xml.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],['xl/worksheets/sheet1.xml',sheet]];const blob=zipBinary(files);download(blob,`report-${C.state.reportAccount}-${C.today()}.xlsx`);}
function download(blob,filename){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)}
function zipBinary(files){const enc=new TextEncoder(),buffers=[],dir=[];let offset=0;const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255];function crc(bytes){let c=-1;for(const x of bytes){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^-1)>>>0}for(const [name,data]of files){const f=enc.encode(name),v=typeof data==='string'?enc.encode(data):data,sum=crc(v);const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(v.length),...u32(v.length),...u16(f.length),...u16(0),...f,...v]);buffers.push(local);dir.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(v.length),...u32(v.length),...u16(f.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...f]));offset+=local.length}const dsize=dir.reduce((s,b)=>s+b.length,0);return new Blob([...buffers,...dir,new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(dir.length),...u16(dir.length),...u32(dsize),...u32(offset),...u16(0)])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
// Xlsx reader (ZIP/OOXML with browser DecompressionStream); no untrusted JS is evaluated.
async function unzipXlsx(buffer){const v=new DataView(buffer),bytes=new Uint8Array(buffer);let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break}if(end<0)throw Error('ساختار فایل Excel معتبر نیست.');const entries=v.getUint16(end+10,true);if(entries>150)throw Error('تعداد فایل‌های داخل Excel بیش از حد مجاز است.');let at=v.getUint32(end+16,true),result=new Map(),total=0;for(let i=0;i<entries;i++){if(v.getUint32(at,true)!==0x02014b50)throw Error('فهرست Excel ناقص است.');const comp=v.getUint16(at+10,true),compressed=v.getUint32(at+20,true),original=v.getUint32(at+24,true),nl=v.getUint16(at+28,true),el=v.getUint16(at+30,true),cl=v.getUint16(at+32,true),offset=v.getUint32(at+42,true);const name=new TextDecoder().decode(bytes.slice(at+46,at+46+nl));at+=46+nl+el+cl;if(!name.startsWith('xl/')||!name.endsWith('.xml'))continue;if(original>20e6||total+original>35e6)throw Error('حجم دادهٔ داخل Excel بسیار بزرگ است.');total+=original;if(v.getUint32(offset,true)!==0x04034b50)throw Error('بخش فایل Excel خراب است.');const begin=offset+30+v.getUint16(offset+26,true)+v.getUint16(offset+28,true);let payload=bytes.slice(begin,begin+compressed);if(comp===8){if(!('DecompressionStream'in window))throw Error('مرورگر شما از خواندن Excel پشتیبانی نمی‌کند. فایل را CSV کنید.');try{const stream=new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw'));payload=new Uint8Array(await new Response(stream).arrayBuffer())}catch{throw Error('بازکردن Excel ممکن نشد؛ لطفاً فایل را CSV ذخیره کنید.')}}else if(comp!==0)throw Error('فشرده‌سازی فایل Excel پشتیبانی نمی‌شود.');if(payload.length!==original)throw Error('اندازه فایل Excel مطابق انتظار نیست.');result.set(name,new TextDecoder().decode(payload))}return result}
async function parseXlsx(file){const files=await unzipXlsx(await file.arrayBuffer());const sheet=[...files.keys()].filter(x=>/^xl\/worksheets\/sheet\d+\.xml$/.test(x)).sort()[0];if(!sheet)throw Error('هیچ صفحهٔ داده در Excel پیدا نشد.');const doc=s=>{const x=new DOMParser().parseFromString(s,'application/xml');if(x.querySelector('parsererror'))throw Error('ساختار XML فایل صحیح نیست.');return x};let shared=[];if(files.has('xl/sharedStrings.xml')){const xml=doc(files.get('xl/sharedStrings.xml'));shared=[...xml.getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent).join(''))}const xml=doc(files.get(sheet)),result=[];for(const r of [...xml.getElementsByTagName('row')].slice(0,20001)){let row=[];for(const c of [...r.getElementsByTagName('c')]){const label=c.getAttribute('r')||'A',letters=(label.match(/^[A-Z]+/)||['A'])[0];let col=0;for(const x of letters)col=col*26+x.charCodeAt(0)-64;col--;if(col>80)continue;const val=c.getElementsByTagName('v')[0]?.textContent||'',type=c.getAttribute('t')||'';row[col]=type==='s'?(shared[Number(val)]||''):type==='inlineStr'?([...(c.getElementsByTagName('is')[0]?.getElementsByTagName('t')||[])].map(x=>x.textContent).join('')):val}if(row.some(x=>String(x??'').trim()))result.push(row)}return result}
function parseCsv(s){const rows=[],head=s.split(/\r?\n/,1)[0],sep=['\t',',',';'].sort((a,b)=>head.split(b).length-head.split(a).length)[0];let row=[],field='',quote=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quote&&s[i+1]==='"'){field+='"';i++}else quote=!quote;continue}if(!quote&&c===sep){row.push(field);field='';continue}if(!quote&&(c==='\n'||c==='\r')){if(c==='\r'&&s[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';continue}field+=c}row.push(field);if(row.some(x=>x.trim()))rows.push(row);return rows}
function normalizeDates(value){if(typeof value==='number'||/^\d{5}(?:\.\d+)?$/.test(String(value||''))){const d=new Date(Date.UTC(1899,11,30)+Number(value)*86400000);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)}let x=String(value||'').trim().replace(/[\u0660-\u0669]/g,z=>String(z.charCodeAt(0)-1632)).replace(/[\u06f0-\u06f9]/g,z=>String(z.charCodeAt(0)-1776));const match=x.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);if(!match)return '';const y=Number(match[1]),m=Number(match[2]),d=Number(match[3]);if(m<1||m>12||d<1||d>31)return '';if(y>=1700&&y<2500){const dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d?dt.toISOString().slice(0,10):''}if(y<1300||y>1600)return '';const f=new Intl.DateTimeFormat('en-u-ca-persian',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'}),target=y*10000+m*100+d;let lo=Date.UTC(y+620,0,1)/86400000|0,hi=Date.UTC(y+623,0,1)/86400000|0;while(lo<=hi){const mid=Math.floor((lo+hi)/2),date=new Date(mid*86400000),parts=Object.fromEntries(f.formatToParts(date).map(p=>[p.type,Number(p.value)])),check=parts.year*10000+parts.month*100+parts.day;if(check===target)return date.toISOString().slice(0,10);if(check<target)lo=mid+1;else hi=mid-1}return ''}
const fields={name:['حساب','نامحساب','اسمحساب','account','accountname','طرفحساب'],date:['تاریخ','date','transactiondate','تاریخمعامله'],currency:['ارز','واحدپولی','واحدارز','currency','cur'],got:['گرفت','دریافت','debit','received','got'],talab:['طلب','پرداخت','credit','paid','talab'],amount:['مبلغ','amount','value'],type:['نوع','type','transactiontype'],note:['تشریحات','توضیحات','شرح','details','description','note','remarks'],documentNo:['شمارهسند','نمبرسند','شمارهحواله','نمبرحواله','شمارهصادره','شمارهوارده','نمبرصادره','نمبروارده','documentno','docno','voucher','id'],mode:['طریقثبت','طریقهثبت','mode','روش'],category:['دسته','دستهبندی','category','نوعحساب'],sender:['فرستنده','sender'],receiver:['گیرنده','receiver']};
function mapping(headers){const out={};for(const [name,aliases]of Object.entries(fields)){let index=headers.findIndex(h=>aliases.includes(normalize(h)));if(index>=0)out[name]=index}return out}
function fingerprint(r){const doc=String(r.documentNo||'').trim();return normalize([doc?'document':r.importFile,doc||r.importRow,r.name,r.date,r.currency,r.type,r.amount,r.note].join('|'))}
function importConversion(raw,fileName,fallbackName='',fallbackCurrency=''){const rows=Array.isArray(raw)?raw:[];let headerIndex=-1,map={};for(let i=0;i<Math.min(rows.length,20);i++){const current=mapping(rows[i]||[]);if(current.date!==undefined&&(current.got!==undefined||current.talab!==undefined||current.amount!==undefined)){headerIndex=i;map=current;break}}if(headerIndex<0)throw Error('سرستون‌ها شناخته نشدند؛ فایل باید تاریخ و گرفت/طلب یا مبلغ داشته باشد.');if(map.name===undefined&&!fallbackName.trim())throw Error('در این فایل ستون حساب وجود ندارد. نام حساب را در خانهٔ مخصوص وارد کن.');if(map.currency===undefined&&!fallbackCurrency.trim())throw Error('در این فایل ستون ارز وجود ندارد. ارز پیش‌فرض این فایل را انتخاب کن.');H.records=[];H.invalid=[];H.dupes=[];H.meta=[];H.sourceName=fileName;const signatures=new Set(C.records.filter(r=>r.importFile).map(fingerprint));const created=new Set();for(let i=headerIndex+1;i<rows.length;i++){const row=rows[i];const get=k=>map[k]===undefined?'':row[map[k]]??'';const name=cap(get('name')||fallbackName,120).trim(),cur=cap(get('currency')||fallbackCurrency,12).trim().toUpperCase(),date=normalizeDates(get('date')),note=cap(get('note'),400),doc=cap(get('documentNo'),85),got=numeric(get('got')),talab=numeric(get('talab')),amount=numeric(get('amount')),typ=normalize(get('type'));const types=[];if(Number.isFinite(got)&&got>0)types.push(['debt',got]);if(Number.isFinite(talab)&&talab>0)types.push(['payment',talab]);if(types.length===0&&amount>0)types.push([/(طلب|paid|credit)/.test(typ)?'payment':'debt',amount]);if(!name||!date||!/^[A-Z]{3,5}$/.test(cur)||!types.length){H.invalid.push({row:i+1,name,reason:!name?'حساب نامشخص':!date?'تاریخ نامعتبر':!types.length?'مبلغ نامعتبر':'ارز نامعتبر'});continue}const category=cap(get('category')||'مشتری',50);H.meta.push({name,category});for(const [type,value]of types){const record={id:C.makeId(),name,amount:value,currency:cur,date,type,note,mode:'imported',documentNo:doc,externalId:doc,importFile:fileName,importRow:i+1,createdAt:new Date().toISOString(),senderName:cap(get('sender'),100),receiverName:cap(get('receiver'),100),importMode:cap(get('mode'),40)};const key=fingerprint(record);if(signatures.has(key)||created.has(key)){H.dupes.push(record);continue}created.add(key);H.records.push(record)}}}
async function fromFile(file){if(file.size>12e6)throw Error('حجم فایل بیشتر از ۱۲ مگابایت است.');const ext=file.name.split('.').pop().toLowerCase();let rows;if(ext==='xlsx')rows=await parseXlsx(file);else if(ext==='csv'||ext==='tsv'||ext==='txt')rows=parseCsv((await file.text()).replace(/^\ufeff/,''));else if(ext==='json'){const j=JSON.parse(await file.text()),payload=Array.isArray(j)?j:j.transactions||j.records||j.rows; if(!Array.isArray(payload))throw Error('در JSON فهرست اسناد پیدا نشد.');const keys=[...new Set(payload.flatMap(x=>Object.keys(x)).slice(0,50))];rows=[keys,...payload.map(x=>keys.map(k=>x[k]??''))]}else throw Error('فرمت پشتیبانی‌شده: CSV، XLSX یا JSON.');if(rows.length>20001)throw Error('در هر مرحله حداکثر ۲۰ هزار ردیف وارد می‌شود.');if(!rows.length)throw Error('فایل خالی است.');H.rawRows=rows;H.sourceName=file.name;importConversion(rows,file.name,$('v15-fallback-account')?.value||'',$('v15-fallback-currency')?.value||'');return rows}
function openImporter(){H.rawRows=[];H.records=[];const d=dialog('انتقال اسناد به دفتر حسابات',`<div class="v15-import-layout"><div class="v15-import-hero"><strong>ورود اسناد از فایل Excel</strong><p>داده‌ها ابتدا بررسی می‌شوند؛ بدون تأیید تو چیزی در حساب‌ها ثبت نخواهد شد.</p></div><div class="v15-import-help"><b>ستون‌های موردنیاز</b> حساب، تاریخ، ارز، گرفت، طلب، تشریحات و شماره سند. تاریخ میلادی یا هجری شمسی و اعداد فارسی/انگلیسی پشتیبانی می‌شوند. برای اطلاعات اولیهٔ اکسل بهتر است فایل Excel/CSV از خود سیستم بگیری.</div><div class="v14-grid"><label class="v14-field">نام حساب برای فایل‌های تک‌حساب<input id="v15-fallback-account" list="v13-account-options" placeholder="اگر ستون حساب وجود ندارد"/></label><label class="v14-field">ارز پیش‌فرض برای فایل‌های بدون ستون ارز<select id="v15-fallback-currency"><option value="">انتخاب ارز...</option>${C.currencies.map(c=>`<option value="${S(c)}">${S(c)}</option>`).join('')}</select></label></div><label class="v15-file-label">فایل CSV / Excel / JSON<input type="file" id="v15-import-file" accept=".xlsx,.csv,.tsv,.txt,.json"/></label><div class="v15-actions"><button id="v15-import-backup" class="v15-button ghost">اول پشتیبان کامل بگیر</button><a id="v15-import-template" href="#">دانلود نمونه قالب CSV</a></div><div id="v15-import-results" aria-live="polite"></div></div>`);for(const fid of ['v15-fallback-account','v15-fallback-currency'])$(fid).addEventListener('change',()=>{if(!H.rawRows.length)return;try{importConversion(H.rawRows,H.sourceName,$('v15-fallback-account').value,$('v15-fallback-currency').value);showPreview()}catch(e){$('v15-import-results').innerHTML=`<p class=\"v15-error\">${S(e.message)}</p>`}});$('v15-import-file').onchange=async()=>{const f=$('v15-import-file').files[0];if(!f)return;const box=$('v15-import-results');box.textContent='در حال خواندن فایل و بررسی اسناد...';try{await fromFile(f);showPreview()}catch(e){box.innerHTML=`<p class="v15-error">${S(e.message)}</p>`}};$('v15-import-backup').onclick=backup;$('v15-import-template').onclick=e=>{e.preventDefault();const csv='\ufeffحساب,تاریخ,ارز,گرفت,طلب,تشریحات,شماره سند,دسته\nنمونه آموزشی,2026-11-03,AFN,1000,0,مثال - فقط قالب,TEST-1,مشتری\n';download(new Blob([csv],{type:'text/csv;charset=utf-8'}),'excel-import-template.csv')};}
function backup(){const payload={app:'دفتر حسابات',version:'v16',exportedAt:new Date().toISOString(),accounts:C.accounts,records:C.records,settings:C.settings,currencies:C.currencies};download(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),'mycalculator-backup-'+C.today()+'.json')}
function showPreview(){const box=$('v15-import-results');box.innerHTML=`<div class="v15-import-summary"><span>فایل: <b>${S(H.sourceName)}</b></span><span>اسناد معتبر: <b class="v15-positive">${fmt(H.records.length)}</b></span><span>تکراری: <b>${fmt(H.dupes.length)}</b></span><span>رد شده: <b class="v15-negative">${fmt(H.invalid.length)}</b></span></div>${H.invalid.length?`<details><summary>علت رد برخی سطرها</summary><div class="v15-import-errors">${H.invalid.slice(0,12).map(x=>`سطر ${x.row}: ${S(x.reason)}<br>`).join('')}</div></details>`:''}<div class="v15-scroll"><table class="v15-table"><thead><tr><th>حساب</th><th>تاریخ</th><th>آی‌دی</th><th>گرفت</th><th>طلب</th><th>ارز</th></tr></thead><tbody>${H.records.slice(0,15).map(r=>`<tr><td>${S(r.name)}</td><td>${S(r.date)}</td><td>${S(r.documentNo||'—')}</td><td>${r.type==='debt'?fmt(r.amount):'—'}</td><td>${r.type==='payment'?fmt(r.amount):'—'}</td><td>${S(r.currency)}</td></tr>`).join('')}</tbody></table></div>${H.records.length>15?'<p class="v15-note">۱۵ سند اول برای پیش‌نمایش نشان داده می‌شود؛ همهٔ اسناد معتبر وارد می‌شوند.</p>':''}<div class="v15-actions"><button type="button" id="v15-import-confirm" class="v15-button" ${H.records.length?'':'disabled'}>ثبت ${H.records.length} سند معتبر</button><button type="button" data-v15-close class="v15-button ghost">انصراف</button></div>`;$('v15-import-confirm').onclick=commitImport;}
function commitImport(){if(!writable())return;if(!H.records.length)return;const extraAccounts=[...new Map(H.meta.map(a=>[normalize(a.name),a])).values()].filter(a=>!C.accounts.some(x=>normalize(x.name)===normalize(a.name))).map(a=>({id:C.makeId(),name:a.name,category:['مشتری','صراف','شرکت','بانک','مصارف','کاربر'].includes(a.category)?a.category:'مشتری',imported:true}));const extraCurr=[...new Set(H.records.map(r=>r.currency))].filter(c=>!C.currencies.includes(c));if(!confirm(`ثبت ${H.records.length} سند، ${extraAccounts.length} حساب جدید و ${extraCurr.length} ارز جدید؟\nپیش از تأیید باید پشتیبان گرفته باشی.`))return;const oldLength=C.records.length,oldAccounts=C.accounts.length,oldCurrencies=C.currencies.length;C.records.push(...H.records);C.accounts.push(...extraAccounts);C.currencies.push(...extraCurr);if(!C.saveRecords()){C.records.splice(oldLength);C.accounts.splice(oldAccounts);C.currencies.splice(oldCurrencies);toast('حافظه پر است یا ذخیرهٔ اطلاعات ممکن نشد؛ داده‌ها وارد نشدند.','bad');return}C.persistMeta();close();C.render();toast(`${H.records.length} سند و ${extraAccounts.length} حساب وارد شد. اکنون راپور را بررسی کن.`);H.records=[]}
function dash(){const home=$('page-dashboard');if(!home)return;let node=$('v15-quickbar');if(!node){node=document.createElement('div');node.id='v15-quickbar';home.insertBefore(node,home.firstChild)}const records=C.records.filter(r=>!r.importRow||r.mode==='imported'),latest=C.records.slice(-200),cash=C.actualBalances('خزانه'),due=C.actualBalances('پرداخت نشده');const currencyTotal=arr=>arr.map(([c,n])=>`<span class="v15-mini-balance ${n<0?'v15-negative':'v15-positive'}">${money(n,c)}</span>`).join('')||'<span class="v15-note">بدون موجودی</span>';
const inCount=new Set(latest.filter(r=>r.mode==='hawala'&&r.hawalaKind==='in').map(x=>x.transferId)).size,outCount=new Set(latest.filter(r=>r.mode==='hawala'&&r.hawalaKind==='out').map(x=>x.transferId)).size;
node.innerHTML=`<div class="v15-dash-heading"><div><small>مدیریت حرفه‌ای صرافی</small><h1>${S(C.settings.companyV14?.name||C.settings.title||'دفتر حسابات')}</h1><p>آخرین اسناد حقیقی، وضعیت خزانه و حواله‌های ثبت‌شده</p></div><div class="v15-actions"><button type="button" class="v15-button" data-v15-dash-page="journal">+ روزنامچه</button><button type="button" class="v15-button ghost" data-v15-dash-page="hawalaIn">+ حواله وارده</button></div></div><div class="v15-stat-row"><button data-v15-dash-account="خزانه"><span>▣ خزانه · تمام ارزها</span><strong>${currencyTotal(cash)}</strong></button><button data-v15-dash-account="پرداخت نشده"><span>◷ پرداخت نشده</span><strong>${currencyTotal(due)}</strong></button><button data-v15-dash-page="hawalaIn"><span>↙ حواله‌های واردهٔ اخیر</span><strong>${fmt(inCount)}</strong></button><button data-v15-dash-page="hawalaOut"><span>↗ حواله‌های صادرهٔ اخیر</span><strong>${fmt(outCount)}</strong></button></div>`;
node.onclick=e=>{const b=e.target.closest('[data-v15-dash-page]');if(b)C.showPage(b.dataset.v15DashPage);const a=e.target.closest('[data-v15-dash-account]');if(a){C.showPage('accounts');C.openAccount(a.dataset.v15DashAccount)}}}
function addHawalaActions(){for(const type of ['in','out']){const form=$('v13-'+type+'-form');if(!form||form.dataset.v15)return;form.dataset.v15='1';const pref='v13-'+type;const box=document.createElement('div');box.className='v15-hawala-extra v13-full';box.innerHTML=`<div class="v15-hawala-tips"><strong>◈ جزئیات حواله</strong><span>نمبر مستقل · نرخ و عملیه · مفاد و حساب مربوط · وضعیت پرداخت</span></div><div class="v15-hawala-footer"><span>⇧ اسناد مرتبط پس از ثبت در راپور حساب‌ها قابل مشاهده هستند.</span><button type="button" class="v15-button ghost" data-v15-show-fee>راهنمای مفاد</button></div>`;form.insertBefore(box,form.querySelector('[type=submit]'));box.querySelector('[data-v15-show-fee]').onclick=()=>toast(type==='in'?'مفاد وارده از حساب صراف کم و در مفاد ثبت می‌شود.':'مفاد صادره در خزانه و حساب مفاد ثبت می‌شود.');}}

// Compact daily vouchers, inspired by the supplied Excel screenshots.
const DAILY_PAGES={journal:{element:'page-journal',title:'معاملات روزنامچه',filter:r=>!['hawala','exchange','hawala-settlement'].includes(r.mode)},exchange:{element:'page-exchange',title:'تبادلات ثبت‌شده',filter:r=>r.mode==='exchange'},hawalaIn:{element:'page-hawalaIn',title:'حواله‌های وارده',filter:r=>r.mode==='hawala'&&r.hawalaKind==='in'&&r.hawalaRole==='principal'},hawalaOut:{element:'page-hawalaOut',title:'حواله‌های صادره',filter:r=>r.mode==='hawala'&&r.hawalaKind==='out'&&r.hawalaRole==='principal'}};
const dailyState=Object.fromEntries(Object.keys(DAILY_PAGES).map(k=>[k,{search:'',range:'today',page:1,size:30}]));
function isDay(r,range){if(range==='all')return true;const today=C.today();if(range==='today')return r.date===today;if(range==='week')return r.date>=new Date(Date.now()-6*864e5).toISOString().slice(0,10);return true}
function dailyRows(type){const cfg=DAILY_PAGES[type],s=dailyState[type],seen=new Set();let rows=C.records.filter(cfg.filter).filter(r=>{if(type==='journal')return true;if(r.transferId){const key=r.transferId;if(seen.has(key))return false;seen.add(key)}return true});const q=normalize(s.search);return rows.filter(r=>isDay(r,s.range)&&(!q||normalize([r.name,r.note,r.documentNo,r.senderName,r.receiverName,r.trackingRef,r.hawalaSource,r.hawalaPeerOutgoingNo].join(' ')).includes(q))).reverse()}
function dailyTables(){for(const [type,config]of Object.entries(DAILY_PAGES)){const page=$(config.element);if(!page)continue;let node=$('v15-daily-'+type);if(!node){node=document.createElement('section');node.id='v15-daily-'+type;node.className='v15-daily v14-panel';page.append(node);node.addEventListener('input',e=>{const b=e.target;if(b.matches('[data-v15-daily-query]')){dailyState[type].search=b.value;dailyState[type].page=1;renderDaily(type,true)}if(b.matches('[data-v15-daily-range]')){dailyState[type].range=b.value;dailyState[type].page=1;renderDaily(type,true)}if(b.matches('[data-v15-daily-size]')){dailyState[type].size=Number(b.value);dailyState[type].page=1;renderDaily(type,true)}});node.addEventListener('click',e=>{const b=e.target.closest('[data-v15-voucher],[data-v15-daily-prev],[data-v15-daily-next]');if(!b)return;if(b.hasAttribute('data-v15-voucher'))openVoucher(b.dataset.v15Voucher);else {dailyState[type].page+=b.hasAttribute('data-v15-daily-prev')?-1:1;renderDaily(type,true)}})}renderDaily(type,false)}}
function dailyBadge(r){const kind=r.hawalaKind||'';if(r.mode!=='hawala')return '<span class="v15-doc-tag">'+S(typeText(r))+'</span>';if(kind==='out')return '<span class="v15-doc-tag v15-out">حواله صادره</span>';const settlement=C.records.find(x=>x.transferId===r.transferId&&x.hawalaRole==='settlement');const paid=C.records.filter(x=>x.originalHawalaId===r.transferId&&x.mode==='hawala-settlement'&&x.name==='پرداخت نشده').reduce((a,x)=>a+Number(x.amount||0),0);const full=settlement?.name!=='پرداخت نشده'?'اجرا شده':!paid?'پرداخت نشده':paid+1e-6>=Number(settlement.amount||0)?'پرداخت شده':'پرداخت قسمی';return '<span class="v15-doc-tag '+(full==='اجرا شده'||full==='پرداخت شده'?'v15-out':'v15-unpaid')+'">'+S(full)+'</span>'}
function renderDaily(type,keepQuery){const node=$('v15-daily-'+type);if(!node)return;const state=dailyState[type],cfg=DAILY_PAGES[type],all=dailyRows(type),size=state.size;state.page=Math.max(1,state.page);const pageRows=all.slice(0,state.page*30),focus=keepQuery&&document.activeElement?.hasAttribute('data-v15-daily-query')?document.activeElement.selectionStart:null;
const toolbar=`<div class="v15-daily-header"><div><h3>${S(cfg.title)}</h3><small>${fmt(all.length)} سند در فیلتر</small></div><div class="v15-daily-tools"><label><span>جستجو</span><input type="search" data-v15-daily-query placeholder="نام، شماره حواله، تشریحات..." value="${S(state.search)}"/></label><select data-v15-daily-range><option value="today" ${state.range==='today'?'selected':''}>امروز</option><option value="week" ${state.range==='week'?'selected':''}>هفت روز اخیر</option><option value="all" ${state.range==='all'?'selected':''}>تمام اسناد</option></select></div></div>`;
const rows=pageRows.map(r=>`<tr><td>${S(C.dateText(r.date))}<small>${S(C.shortId(r))}</small></td><td>${S(r.name)}</td><td>${dailyBadge(r)} ${S(r.note||r.senderName||'—')}</td><td>${C.delta(r)<0?money(r.amount,currency(r)):'—'}</td><td>${C.delta(r)>=0?money(r.amount,currency(r)):'—'}</td><td>${S(typeText(r))}</td><td><button type="button" class="v15-view-link" data-v15-voucher="${S(r.id)}">مشاهده</button></td></tr>`).join('')||'<tr><td colspan="7" class="v15-empty">برای این بازه سندی ثبت نشده است.</td></tr>';
node.innerHTML=toolbar+`<div class="v15-scroll"><table class="v15-table v15-daily-table"><thead><tr><th>تاریخ / شماره</th><th>حساب</th><th>تشریحات / وضعیت</th><th>گرفت</th><th>طلب</th><th>نوع</th><th>جزئیات</th></tr></thead><tbody>${rows}</tbody></table></div><div class="v17-load-marker" data-v17-daily-more>${Math.min(state.page*30,all.length)} از ${all.length} سند ${state.page*30<all.length?'· برای ادامه پایین بروید':''}</div>`;
if(state.page*30<all.length&&'IntersectionObserver'in window){const marker=node.querySelector('[data-v17-daily-more]');const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();state.page++;renderDaily(type,true)}},{rootMargin:'220px'});if(marker)io.observe(marker)}
if(focus!==null){const el=node.querySelector('[data-v15-daily-query]');el.focus();try{el.setSelectionRange(focus,focus)}catch{}}}
function refresh(){dash();tableExtras();renderReport();dailyTables()}
function bind(){makeNavigation();addHawalaActions();makeReports();dash();tableExtras();dailyTables();const prevAfter=C.onAfterRender,prevPage=C.onPage;C.onAfterRender=()=>{prevAfter?.();refresh()};C.onPage=p=>{prevPage?.(p);if(p==='reports')renderReport();if(p==='dashboard')dash();if(p==='accounts')tableExtras();if(DAILY_PAGES[p])renderDaily(p,false)};document.body.addEventListener('click',e=>{const b=e.target.closest('[data-v15-view]');if(b&&!e.target.closest('#v15-report'))openVoucher(b.dataset.v15View)});const menu=$('v15-report');if(menu)menu.dataset.ready='1';
// Upgrade main settings and account-specific navigation without touching prior records.
const accountPane=$('page-accounts');accountPane.addEventListener('click',e=>{const a=e.target.closest('[data-open-account]');if(a)setTimeout(tableExtras,25)});document.title='دفتر حسابات — نسخه ۱۵';window.MC15={openImporter,readReport,normalizeDates,importConversion,parseCsv,parseXlsx,openVoucher,backup};}
try{bind()}catch(e){console.error('دفتر حسابات نسخه ۱۵:',e)}
})();



/* ===== Scripts v16 (execution order preserved) ===== */
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
 const config=()=>{const c=C.settings.hawalaFieldsV16||{sender:true,receiver:true};return {sender:c.sender!==false&&c.receiver!==false,receiver:c.sender!==false&&c.receiver!==false}};
 const setVersion=()=>{document.title='دفتر حسابات — نسخه ۱۶';if($('appVersion'))$('appVersion').textContent='16.0.0';document.querySelectorAll('.v14-version').forEach(x=>x.textContent='نسخه ۱۶');const license=$('licenseOverlay')?.querySelector('h2 span');if(license)license.textContent='نسخهٔ ۱۶';};
 function bootSettings(){const root=$('page-settings');if(!root||$('v16-field-settings'))return;const details=document.createElement('details');details.id='v16-field-settings';details.className='v13-accordion';details.innerHTML=`<summary>فورم‌ها و نمایش جزئیات حواله</summary><div class="v13-inner"><p class="v16-muted">فرستنده و گیرنده با یک گزینه روشن یا خاموش می‌شوند؛ اطلاعات اسناد قبلی همچنان حفظ می‌شود.</p><div class="v16-setting-grid"><label class="v16-toggle-row"><span>نمایش فرستنده و گیرنده در حواله‌ها</span><input id="v16-use-sender" type="checkbox"/></label></div><p class="v16-muted">منطق پول نقد: طلب = ورود به خزانه (سبز)، گرفت = خروج از خزانه (سرخ). درک و بدون مدرک خزانه را تغییر نمی‌دهند.</p></div>`;root.append(details);
  const flags=config();$('v16-use-sender').checked=flags.sender!==false;
  $('v16-use-sender').onchange=e=>{if(!canEdit()){e.target.checked=!e.target.checked;return}C.settings.hawalaFieldsV16={sender:e.target.checked,receiver:e.target.checked};C.persistMeta();syncHawalaFields()};
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
  block.innerHTML=`<div class="v16-ledger-heading"><div><h3>${isDue?'اسناد پرداخت نشده':'دفتر اسناد یکپارچه'}</h3><p>${isDue?'نمای پیش‌فرض حساب پرداخت‌نشده: تعهدات معلق و پرداخت‌های مرتبط':'هر شماره سند یک بار نمایش داده می‌شود؛ مفاد و حرکات مرتبط داخل همان سند هستند.'}</p></div><span>${fmt(groups.size)} سند</span></div>${isDue?pendingReport():''}<div class="v16-table-scroll"><table class="v16-ledger-table"><thead><tr><th>تاریخ / آی‌دی</th><th>نوع / تشریحات</th><th class="v16-red">گرفت −</th><th class="v16-green">طلب +</th><th>ماندهٔ ارز</th><th>سند</th></tr></thead><tbody>${content||'<tr><td colspan="6">سندی برای این فیلتر پیدا نشد.</td></tr>'}</tbody></table></div><div class="v17-load-marker" data-v17-account-more>${fmt(docs.length)} از ${fmt(totalDocs)} سند ${docs.length<totalDocs?'· برای ادامه پایین بروید':''}</div>`;
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



/* ===== Scripts v17 (execution order preserved) ===== */
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



/* ===== Scripts v18 (execution order preserved) ===== */
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



/* ===== Scripts v19 (execution order preserved) ===== */
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
  if(same){rate.value='1';operation.value='multiply';converted.readOnly=false;}
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



/* ===== Scripts v20 (execution order preserved) ===== */
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



/* ===== Scripts v21 (execution order preserved) ===== */
/* دفتر حسابات 21 — fee ledger rules, signed daily carry-forward, authorization of
   historical cash movements, unified remittance toggles and financial UX.
   Does not rewrite historical records. All amounts remain stored per currency. */
(()=>{'use strict';
const C=window.MC14,$=id=>document.getElementById(id);
if(!C)return;
const VERSION='23.0.0', EPS=1e-7;
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



/* ===== Scripts v22 (execution order preserved) ===== */
/* دفتر حسابات 22 — final business-form arrangement.
 * Existing inputs, IDs, event handlers, voucher groups and storage remain intact.
 * Only DOM presentation and missing 'بدون مدرک' registration are completed.
 * Exchange profit/loss is a preview, NOT an unapproved ledger posting.
 */
(()=>{'use strict';
 const C=window.MC14, $=id=>document.getElementById(id);if(!C)return;
 const VERSION='23.0.0';
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



/* ===== Scripts v23 (execution order preserved) ===== */
/* دفتر حسابات 23 — structured journal, non-destructive conversion input, linked
 * remittance fees and customer-facing copyable voucher text.
 * No migration and no rewrite of existing journal data.
 */
(()=>{'use strict';
 const C=window.MC14,$=id=>document.getElementById(id);if(!C)return;
 const VERSION='23.0.0';
 const raw=v=>{const value=C.parsedAmount(v??'');return Number.isFinite(value)?value:0};
 const format=v=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
 const field=id=>$(id)?.closest('.field');
 const allCurrencies=()=>[...new Set(C.currencies)];
 function updateVersion(){if($('appVersion'))$('appVersion').textContent=VERSION;document.title='دفتر حسابات';}
 function journalLayout(){
  const form=$('entryForm'),row=form?.querySelector('.v22-journal-primary'),amount=row?.querySelector('.amount-row');
  if(!row||!amount||row.dataset.v23Journal)return;
  row.dataset.v23Journal='1';row.classList.add('v23-journal-row');
  const date=field('date'),account=field('name');
  // Date and account are a fixed pair at all widths; money and note follow.
  const first=document.createElement('div');first.className='v23-journal-head';
  first.append(date,account);row.prepend(first);
  const currencyPicker=amount.querySelector('.currency-picker');
  if(currencyPicker)currencyPicker.classList.add('v23-legacy-currency');
  for(const [id,role] of [['gotAmount','got'],['talabAmount','talab']]){
   const inputField=field(id);if(!inputField)continue;
   const holder=document.createElement('div');holder.className='v23-money-pair v23-money-'+role;
   const select=document.createElement('select');select.id='v23-'+role+'-currency';
   select.className='v23-money-currency';select.setAttribute('aria-label','واحد ارز '+(role==='got'?'گرفت':'طلب'));
   select.title='انتخاب ارز';
   holder.append(inputField,select);amount.append(holder);
   select.addEventListener('change',()=>{
    // Independent currencies: changing one side must NOT rewrite the other.
    activateJournalCurrency(role);
   });
   $(id)?.addEventListener('input',()=>activateJournalCurrency(role));
   $(id)?.addEventListener('focus',()=>activateJournalCurrency(role));
  }
  syncJournalCurrency();
 }
 function activateJournalCurrency(role){
  const select=$('v23-'+role+'-currency');if(!select)return;
  const main=$('currency'),code=select.value;
  if(main)main.value=code;
  if($('currencyTrigger'))$('currencyTrigger').textContent=code+' ▾';
 }
 function syncJournalCurrency(){
  const codes=allCurrencies(),fallback=$('currency')?.value||'AFN';
  for(const id of ['v23-got-currency','v23-talab-currency']){
   const select=$(id);if(!select)continue;
   const previous=select.value||fallback;
   if(select.options.length!==codes.length||codes.some((code,i)=>select.options[i]?.value!==code)){
    select.replaceChildren(...codes.map(c=>{const opt=document.createElement('option');opt.value=opt.textContent=c;return opt}));
   }
   select.value=codes.includes(previous)?previous:(codes.includes('AFN')?'AFN':codes[0]);
  }
 }
 function commissionRule(account,cur,principal){
  const config=C.settings.sarrafRules?.[account]?.fees?.[cur]||{};
  const threshold=Number(config.threshold),unit=Number(config.value);
  if(!(threshold>0&&unit>0&&principal>0))return 0;
  return Math.round(Math.ceil(principal/threshold)*unit*100)/100;
 }
 function sarrafFeeField(kind){
  const p='v13-'+kind;
  let input=$(p+'-sarraf-fee');
  if(!input&&kind==='in'){
   const parent=document.createElement('div');parent.className='field v21-sarraf-fee v23-peer-fee';
   parent.innerHTML=`<label for="${p}-sarraf-fee">مفاد صراف (حساب درک)</label><input type="text" inputmode="decimal" id="${p}-sarraf-fee" value="0" aria-describedby="v23-in-peer-info"/><small id="v23-in-peer-info">فقط برای طریقهٔ درک فعال می‌شود.</small>`;
   $('v13-in-form')?.querySelector('.v22-secondary')?.insertBefore(parent,$(p+'-number')?.closest('.field'));
   input=$(p+'-sarraf-fee');
  }
  if(!input)return;
  let select=$(p+'-sarraf-fee-currency');
  if(!select){
   const pair=document.createElement('div');pair.className='v23-sarraf-pair';
   const container=input.closest('.field');container.classList.add('v23-sarraf-wrap');
   input.parentNode.insertBefore(pair,input);pair.append(input);
   select=document.createElement('select');select.id=p+'-sarraf-fee-currency';
   select.setAttribute('aria-label','ارز مفاد صراف');select.className='v23-sarraf-currency';
   pair.append(select);
  }
  const all=allCurrencies(),chosen=select.value||$(p+'-converted-currency')?.value||'AFN';
  select.replaceChildren(...all.map(c=>{const opt=document.createElement('option');opt.value=opt.textContent=c;return opt}));
  select.value=all.includes(chosen)?chosen:(all.includes('AFN')?'AFN':all[0]);
  if(kind==='in'){
   input.readOnly=false;
   input.setAttribute('aria-label','مفاد صراف؛ قابل ویرایش یا محاسبهٔ خودکار');
   if(!input.dataset.v23Track){input.dataset.v23Track='1';input.addEventListener('input',()=>{input.dataset.v23Manual='1'});}
  }else if(!input.dataset.v23Track){
   input.dataset.v23Track='1';input.addEventListener('input',()=>{input.dataset.v23Manual='1'});
  }
 }
 function inFee(recalculate=false){
  const input=$('v13-in-sarraf-fee'),select=$('v13-in-sarraf-fee-currency');if(!input||!select)return;
  const mode=document.querySelector('input[name="v13-in-mode"]:checked')?.value;
  const peer=$('v13-in-darak')?.value.trim()||'',from=$('v13-in-account')?.value.trim();
  const active=mode==='darak'&&peer&&peer!==from&&C.accounts.some(a=>a.name===peer);
  const container=input.closest('.field');container.classList.toggle('v23-fee-disabled',!active);
  input.disabled=!active;select.disabled=!active;
  if(!active){input.value='0';return}
  if(input.dataset.v23Manual==='1')return
  // Preserve the stored commission during edit. Recalculate only after an actual
  // change by the cashier; previous documents must not be silently modified.
  if(C.state.hwEdit&&!recalculate)return;
  const targetCurrency=$('v13-in-converted-currency')?.value||'AFN';
  if(!select.value)select.value=targetCurrency;
  const base=raw($('v13-in-converted')?.value);
  input.value=format(commissionRule(peer,select.value,base));
 }
 function outFee(recalculate=false){
  const input=$('v13-out-sarraf-fee'),select=$('v13-out-sarraf-fee-currency');if(!input||!select)return;
  if(!recalculate||input.dataset.v23Manual==='1')return;
  const account=$('v13-out-account')?.value.trim(),base=raw($('v13-out-converted')?.value);
  if(!account)return;
  input.value=format(commissionRule(account,select.value,base));
 }
 function initFees(){
  for(const kind of ['in','out'])sarrafFeeField(kind);
  const secondary=$('v13-out-form')?.querySelector('.v22-secondary');
  const fee=secondary?.querySelector('.v22-fee-pair'),sarraf=field('v13-out-sarraf-fee');
  if(secondary&&fee&&sarraf)secondary.insertBefore(sarraf,fee);
  inFee(false);
  // Fees are recalculated from the rule on peer, currency or amount changes.
  for(const id of ['v13-in-darak','v13-in-converted','v13-in-converted-currency','v13-in-amount','v13-in-rate','v13-in-operation','v13-in-currency','v13-in-sarraf-fee-currency']){
   const el=$(id);if(!el||el.dataset.v23FeeBound)continue;el.dataset.v23FeeBound='1';
   for(const type of ['input','change'])el.addEventListener(type,()=>inFee(true));
  }
  for(const id of ['v13-out-account','v13-out-converted','v13-out-converted-currency']){
   const el=$(id);if(!el||el.dataset.v23FeeBound)continue;el.dataset.v23FeeBound='1';
   for(const type of ['input','change'])el.addEventListener(type,()=>outFee(true));
  }
  for(const kind of ['in','out']){
   const el=$('v13-'+kind+'-sarraf-fee-currency');if(!el||el.dataset.v23FeeBound)continue;
   el.dataset.v23FeeBound='1';el.addEventListener('change',()=>kind==='in'?inFee(true):outFee(true));
   $('v13-'+kind+'-form')?.addEventListener('reset',()=>{
    setTimeout(()=>{{const input=$('v13-'+kind+'-sarraf-fee');if(input)input.dataset.v23Manual='0';if(kind==='in')inFee(true);}},50);
   });
  }
  document.addEventListener('change',event=>{
   if(event.target?.name==='v13-in-mode')inFee(true);
  });
 }
 function sync(){updateVersion();syncJournalCurrency();inFee(false)}
 function init(){journalLayout();initFees();sync();
  // A voucher edit can set the saved method programmatically, without firing a change event.
  const oldEdit=C.editLedgerRecord;C.editLedgerRecord=id=>{const result=oldEdit(id);setTimeout(()=>{inFee(false);if($('editId')?.value){const role=$('gotAmount')?.value?'got':'talab';const picker=$('v23-'+role+'-currency');if(picker)picker.value=$('currency').value;}},0);return result};
  document.addEventListener('click',e=>{if(e.target.closest('[data-v13-edit],[data-v16-voucher],[data-v16-report-open],[data-v17-voucher-edit]'))setTimeout(()=>inFee(false),45)});
  const prevAfter=C.onAfterRender,prevPage=C.onPage;
  C.onAfterRender=()=>{prevAfter?.();sync()};
  C.onPage=page=>{prevPage?.(page);sync()};
  document.addEventListener('click',e=>{if(e.target.closest('#currencyList [data-cur]'))syncJournalCurrency()});
  window.MC23={VERSION,commissionRule,syncJournalCurrency,inFee};
 }
 try{init()}catch(e){console.error('دفتر حسابات ۲۳:',e)}
})();



/* ===== Scripts v24 (execution order preserved) ===== */
/* دفتر حسابات 24 — desktop icon sidebar, independent currency state, stable version. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),C=window.MC14;
 const VERSION='24.2.0';if(!C)return;
 function version(){if($('appVersion'))$('appVersion').textContent=VERSION;
  const header=$('v14-appbar')?.querySelector('.v14-version');if(header)header.textContent='نسخه ۲۴';
  document.querySelectorAll('#licenseOverlay h2 span').forEach(x=>{if(x.textContent.includes('نسخه'))x.textContent='نسخهٔ ۲۴'});
 }
 function sidebar(){const side=$('v14-sidebar');if(!side)return;
  for(const button of side.querySelectorAll('[data-v14-page]')){
   if(button.dataset.v24Nav)continue;button.dataset.v24Nav='1';
   const icon=button.querySelector('span');if(icon)icon.classList.add('v24-nav-icon');
   const text=[...button.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
   for(const node of [...button.childNodes])if(node.nodeType===3)node.remove();
   const name=document.createElement('span');name.className='v24-nav-text';name.textContent=text;button.append(name);
   button.setAttribute('aria-label',text);button.title=text;
  }
  let toggle=$('v24-sidebar-toggle');if(!toggle){
   toggle=document.createElement('button');toggle.type='button';toggle.id='v24-sidebar-toggle';
   toggle.className='v24-sidebar-toggle';toggle.setAttribute('aria-controls','v14-sidebar');
   toggle.innerHTML='<span class="v24-sidebar-toggle-icon" aria-hidden="true">☰</span>'; 
   side.prepend(toggle);
  }
  let stored=false;try{stored=localStorage.getItem('daftar.v24.sidebar-collapsed')==='1'}catch(e){}
  function draw(closed){document.body.classList.toggle('v24-sidebar-collapsed',closed);
   toggle.setAttribute('aria-expanded',String(!closed));toggle.setAttribute('aria-label',closed?'باز کردن فهرست':'بستن فهرست');
   toggle.title=closed?'باز کردن فهرست':'بستن فهرست';
   toggle.querySelector('.v24-sidebar-toggle-icon').textContent=closed?'☰':'❯';
  }
  draw(stored);
  toggle.addEventListener('click',()=>{const closed=!document.body.classList.contains('v24-sidebar-collapsed');draw(closed);
   try{localStorage.setItem('daftar.v24.sidebar-collapsed',closed?'1':'0')}catch(e){}
  });
 }
 function journal(){const got=$('v23-got-currency'),talab=$('v23-talab-currency');if(!got||!talab)return;
  const update=()=>{const role=$('gotAmount').value?'got':$('talabAmount').value?'talab':null;
   if(role){const select=$('v23-'+role+'-currency');if(select)$('currency').value=select.value;}
  };
  // On initial selection and before saving, the currency of the filled field is used.
  $('entryForm')?.addEventListener('submit',update,true);
  for(const id of ['gotAmount','talabAmount'])$(id)?.addEventListener('input',update);
  // Normalizing saved journal edit can change the single hidden currency synchronously.
  document.addEventListener('click',e=>{if(e.target.closest('[data-edit],[data-v13-edit]'))setTimeout(()=>{
   if(!$('editId')?.value)return;const role=$('gotAmount').value?'got':'talab';
   const sel=$('v23-'+role+'-currency');if(sel)sel.value=$('currency').value;
  },0)});
 }
 function init(){sidebar();journal();version();const before=C.onAfterRender,oldPage=C.onPage;
  C.onAfterRender=()=>{before?.();version()};C.onPage=p=>{oldPage?.(p);version()};
  window.MC24={VERSION};
 }
 try{init()}catch(e){console.error('دفتر حسابات ۲۴:',e)}
})();



/* ===== دفتر حسابات v24.1 — readable navigation, peer document, manual/auto sarraf fee ===== */
(()=>{'use strict';
 const C=window.MC14,$=id=>document.getElementById(id);if(!C)return;
 const VERSION='24.2.0';
 function isSarraf(){const name=$('v13-in-account')?.value.trim();const account=C.accounts.find(a=>a.name===name);return Boolean(account&&(account.category==='صراف'||C.settings.sarrafRules?.[name]));}
 function referenceField(){
  const p='v13-in',form=$(p+'-form');if(!form)return;
  let container=$('v24-peer-out-field');
  if(!container){
   container=document.createElement('div');container.id='v24-peer-out-field';container.className='field v24-peer-out-field';
   container.innerHTML='<label for="v13-in-peer-out-number">شماره حواله صادره صراف</label><input id="v13-in-peer-out-number" type="text" maxlength="80" inputmode="text" dir="ltr" placeholder="شماره درج‌شده در سند صراف" autocomplete="off"/><small>شمارهٔ حوالهٔ صادرهٔ صراف مقابل؛ مستقل از شمارهٔ واردهٔ شما</small>';
   const secondary=form.querySelector('.v22-secondary'),number=$('v13-in-number')?.closest('.field');
   if(secondary)secondary.insertBefore(container,number||null);else form.append(container);
  }
  const active=isSarraf();container.hidden=!active;
  const input=$('v13-in-peer-out-number');
  // When editing an older voucher with this reference, keep the field available
  // even if the account was later reclassified.
  if(!active&&C.state.hwEdit){const primary=C.records.find(r=>r.transferId===C.state.hwEdit&&r.hawalaRole==='principal');if(primary?.hawalaPeerOutgoingNo){container.hidden=false;if(!input.value)input.value=primary.hawalaPeerOutgoingNo;}}
 }
 function feeControls(kind){const p='v13-'+kind,input=$(p+'-sarraf-fee');if(!input)return;
  const host=input.closest('.field');if(!host)return;
  input.readOnly=false;input.setAttribute('inputmode','decimal');
  if(!host.querySelector('.v24-fee-tools')){
   const bar=document.createElement('div');bar.className='v24-fee-tools';
   bar.innerHTML='<span class="v24-fee-state" aria-live="polite">محاسبهٔ خودکار</span><button type="button" class="v24-fee-recalc" aria-label="محاسبهٔ دوبارهٔ مفاد صراف">↻ خودکار</button>';
   host.append(bar);
   bar.querySelector('button').addEventListener('click',()=>{
    input.dataset.v23Manual='0';
    if(kind==='in')window.MC23?.inFee(true);
    else {
     // Old outgoing auto calculation is available only within its layer;
     // dispatch its ordinary currency change to recompute using the rule.
     $('v13-out-sarraf-fee-currency')?.dispatchEvent(new Event('change',{bubbles:true}));
    }
    syncFeeState(kind);
   });
  }
  input.addEventListener('input',()=>{input.dataset.v23Manual='1';syncFeeState(kind)});
  input.addEventListener('change',()=>syncFeeState(kind));
  syncFeeState(kind);
 }
 function syncFeeState(kind){const input=$('v13-'+kind+'-sarraf-fee'),field=input?.closest('.field');if(!field)return;
  const manual=input.dataset.v23Manual==='1';field.classList.toggle('v24-fee-manual',manual);
  const status=field.querySelector('.v24-fee-state');if(status)status.textContent=manual?'مبلغ دلخواه (قابل ویرایش)':'محاسبهٔ خودکار';
 }
 function version(){document.title='دفتر حسابات — نسخه ۲۴.۲';if($('appVersion'))$('appVersion').textContent=VERSION;
  const head=$('v14-appbar')?.querySelector('.v14-version');if(head)head.textContent='نسخه ۲۴.۲';
 }
 function install(){referenceField();for(const kind of ['in','out'])feeControls(kind);version();
  const account=$('v13-in-account'),form=$('v13-in-form');
  for(const event of ['input','change'])account?.addEventListener(event,referenceField);
  form?.addEventListener('reset',()=>setTimeout(()=>{const input=$('v13-in-peer-out-number');if(input&&!C.state.hwEdit)input.value='';referenceField();syncFeeState('in')},30));
  $('v13-out-form')?.addEventListener('reset',()=>setTimeout(()=>syncFeeState('out'),30));
  document.addEventListener('click',e=>{
   if(e.target.closest('[data-v13-edit],[data-v16-voucher],[data-v17-voucher-edit]'))setTimeout(()=>{
    referenceField();for(const kind of ['in','out'])syncFeeState(kind);
   },80);
  });
  const before=C.onAfterRender,page=C.onPage;
  C.onAfterRender=()=>{before?.();referenceField();version()};
  C.onPage=p=>{page?.(p);referenceField();version()};
  window.MC241={VERSION,referenceField,syncFeeState};
 }
 try{install()}catch(e){console.error('دفتر حسابات ۲۴.۱:',e)}
})();

/* ===== دفتر حسابات 24.2 — per-account cloud sync, optimistic concurrency ===== */
(()=>{'use strict';
 const $=id=>document.getElementById(id), C=window.MC14;
 if(!C)return;
 const TABLE='user_data_snapshots';
 const defaults={calendar:'jalali',theme:'light',title:'دفتر حسابات',accent:'green'};
 let client=null,uid=null,base=null,remote=null,started=false,loading=false,sending=false,conflict=false;
 let timer=null,poller=null,pending=false,activeWrite=false,sessionToken=0;
 const stateKey=()=>`daftar.sync.base.v24.uid.${uid}`;
 function readBase(){try{const b=JSON.parse(localStorage.getItem(stateKey())||'null');return b&&Number.isInteger(b.revision)&&typeof b.sig==='string'?b:null}catch{return null}}
 function storeBase(revision,sig){base={revision,sig};try{localStorage.setItem(stateKey(),JSON.stringify(base))}catch(e){}}
 function payload(){return {schema:1,records,accounts,currencies,settings}}
 function signature(p){const s=JSON.stringify(p);let h=2166136261;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619)}return s.length.toString(16)+':'+(h>>>0).toString(16)}
 function meaningful(p){return !!(p.records?.length||p.accounts?.some(a=>!['خزانه','مصارف','پرداخت نشده'].includes(a.name))||p.currencies?.some(x=>!['AFN','USD','PKR'].includes(x))||Object.keys(defaults).some(k=>JSON.stringify(p.settings?.[k])!==JSON.stringify(defaults[k])))}
 function status(t,d='',isConflict=false){if($('cloudSyncStatus'))$('cloudSyncStatus').textContent=t;if($('cloudSyncDetail'))$('cloudSyncDetail').textContent=d;if($('cloudSyncConflict'))$('cloudSyncConflict').hidden=!isConflict;}
 function stop(){sessionToken++;if(timer)clearTimeout(timer);if(poller)clearInterval(poller);timer=null;poller=null;client=null;uid=null;base=null;remote=null;pending=false;started=false;loading=false;sending=false;conflict=false;activeWrite=false;status('در انتظار ورود به حساب...')}
 function offlineMode(newUid){stop();uid=newUid;status('حالت آفلاین — اطلاعات فقط روی این دستگاه است','پس از اتصال اینترنت وارد حساب شوید تا همگام‌سازی انجام شود.');}
 function localChanged(){if(!uid||!started||loading)return;pending=true;if(conflict){status('تداخل نسخه‌های ابری و محلی','برای حل تداخل ابتدا از هر دو نسخه پشتیبان بگیرید.',true);return}
  status('تغییرات در دستگاه ذخیره شد؛ در صف همگام‌سازی است');
  if(timer)clearTimeout(timer);timer=setTimeout(()=>tick().catch(()=>{}),750);
 }
 function useData(p){
  if(!p||!Array.isArray(p.records)||!Array.isArray(p.accounts)||!Array.isArray(p.currencies)||!p.settings||typeof p.settings!=='object')throw Error('ساختار دادهٔ ابری معتبر نیست.');
  loading=true;
  try{
   // Only the current authenticated user's scoped localStorage keys are changed.
   localStorage.setItem(STORAGE_KEY,JSON.stringify(p.records));
   localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(p.accounts));
   localStorage.setItem(SETTINGS_KEY,JSON.stringify(p.settings));
   localStorage.setItem(CURRENCIES_KEY,JSON.stringify(p.currencies));
   records=[];accounts=[];currencies=['AFN','USD','PKR'];settings={...defaults};
   load();loadMeta();
   currencies=[...new Set(['AFN',...p.currencies.filter(x=>typeof x==='string'&&/^[A-Z]{2,8}$/.test(x)),...records.map(r=>r.currency||'AFN')])];
   renderCurrencies();reconcileAccounts();resetExchange();applySettings();render();
  }finally{loading=false}
 }
 async function fetchRemote(){const {data,error}=await client.from(TABLE).select('payload,revision,updated_at').maybeSingle();if(error)throw Error('خواندن از سرور: '+error.message);return data||null}
 function download(p,name){const b=new Blob([JSON.stringify({app:'DaftarHesabat',exportedAt:new Date().toISOString(),transactions:p.records,accounts:p.accounts,currencies:p.currencies,settings:p.settings},null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${name}-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
 function backupLocal(){download(payload(),'daftar-local-backup')}
 function backupCloud(){if(remote?.payload)download(remote.payload,'daftar-cloud-backup');else alert('نسخهٔ ابری موجود نیست.')}
 async function commit(p,expected){const {data,error}=await client.rpc('save_user_data_snapshot',{expected_user_id:uid,expected_revision:expected,next_payload:p});if(error)throw Error(error.message||'ذخیرهٔ ابری ناموفق بود');const r=Number(data);if(!Number.isInteger(r)||r<=0)throw Error('پاسخ ذخیرهٔ ابری معتبر نیست');return r}
 function isRevisionConflict(e){return /revision_conflict|40001|conflict/i.test(String(e?.message||e))}
 function markConflict(r){remote=r;conflict=true;pending=true;status('دو نسخهٔ متفاوت شناسایی شد؛ ذخیرهٔ ابری متوقف است.','برای جلوگیری از حذف معاملات، تصمیم نهایی با شماست.',true)}
 function checkEditInProgress(){const e=document.activeElement;return !!(e&&e.matches?.('input,textarea,select,[contenteditable="true"]')&&!e.closest('.cloud-sync-panel'))}
 async function tick(force=false){
  if(!started||!uid||!client||sending||loading||conflict)return;
  if(!navigator.onLine){pending=true;status('آفلاین — ذخیره روی همین دستگاه','پس از اتصال اینترنت همگام‌سازی ادامه می‌یابد.');return}
  sending=true;const token=sessionToken;
  try{
   const r=await fetchRemote();if(token!==sessionToken)return;
   remote=r;
   const here=payload(),s=signature(here),serverSig=r?.payload?signature(r.payload):null;
   if(!r){
    if(!base){if(!meaningful(here)){pending=false;status('حساب ابری آماده است؛ هنوز سندی ثبت نشده');return}
     if(!window.LICENSE_CAN_WRITE){pending=true;status('اطلاعات محلی در انتظار فعال‌شدن اشتراک است');return}
     const rev=await commit(here,0);if(token!==sessionToken)return;storeBase(rev,s);pending=false;status('همگام شد ✓','اطلاعات به حساب اختصاصی شما در سرور ارسال شد.');return;}
    markConflict(r);return;
   }
   if(serverSig===s){storeBase(r.revision,s);pending=false;status('همگام شد ✓','آخرین نسخه در همهٔ دستگاه‌ها یکسان است.');return}
   const localChangedSinceBase=(!base&&meaningful(here))||(base&&s!==base.sig);
   if(!base){if(!meaningful(here)){useData(r.payload);storeBase(r.revision,signature(payload()));pending=false;status('داده‌ها از ابر دریافت شد ✓');return}markConflict(r);return}
   if(r.revision===base.revision){
    if(localChangedSinceBase){
     if(!window.LICENSE_CAN_WRITE){pending=true;status('تغییرات محلی در انتظار اشتراک فعال');return}
     try{const rev=await commit(here,base.revision);if(token!==sessionToken)return;storeBase(rev,s);pending=signature(payload())!==s;status(pending?'یک تغییر جدید در صف است':'همگام شد ✓');}
     catch(e){if(isRevisionConflict(e)){markConflict(await fetchRemote());return}throw e}
    }else{pending=false;status('همگام شد ✓','همهٔ تغییرات ذخیره شده‌اند.')}
    return;
   }
   if(localChangedSinceBase){markConflict(r);return}
   if(checkEditInProgress()&&!force){pending=false;status('تغییرات جدید از دستگاه دیگر رسید','پس از پایان ویرایش، همگام‌سازی را بزنید.');return}
   useData(r.payload);storeBase(r.revision,signature(payload()));pending=false;status('اطلاعات دستگاه دیگر دریافت شد ✓');
  }catch(e){if(token!==sessionToken)return;pending=true;status('همگام‌سازی موقتاً ناموفق بود',e.message+' — داده‌ها در دستگاه باقی مانده‌اند.')}
  finally{if(token===sessionToken){sending=false;if(pending&&!conflict&&navigator.onLine&&activeWrite){if(timer)clearTimeout(timer);timer=setTimeout(()=>tick().catch(()=>{}),12000)}}}
 }
 async function start(newUid,newClient){
  stop();uid=newUid;client=newClient;sessionToken++;const token=sessionToken;
  base=readBase();started=true;loading=false;activeWrite=false;status('در حال دریافت اطلاعات حساب از ابر...');
  try{await tick(true)}catch(e){status('اتصال به اطلاعات ابری ناموفق بود',e.message)}
  if(token!==sessionToken)return;
  poller=setInterval(()=>{if(!document.hidden)tick().catch(()=>{})},20000);
 }
 function authorized(){if(!uid||!started)return;activeWrite=window.LICENSE_CAN_WRITE===true;if(pending&&activeWrite&&!conflict)tick().catch(()=>{})}
 async function receiveCloud(){if(!conflict||!remote?.payload)return;if(!confirm('اطلاعات ابری جایگزین داده‌های فعلی این دستگاه شوند؟ ابتدا از داده‌های همین دستگاه نسخهٔ پشتیبان گرفته می‌شود.'))return;
  backupLocal();const r=await fetchRemote();if(!r||r.revision!==remote.revision){markConflict(r);alert('نسخهٔ ابری دوباره تغییر کرده؛ لطفاً مجدداً بررسی کنید.');return}
  useData(r.payload);storeBase(r.revision,signature(payload()));remote=r;pending=false;conflict=false;status('نسخهٔ ابری دریافت شد ✓');
 }
 async function sendLocal(){if(!conflict||!window.LICENSE_CAN_WRITE)throw Error('برای ارسال اطلاعات، اشتراک فعال لازم است.');
  if(!confirm('اطلاعات این دستگاه به‌جای آخرین نسخهٔ سرور نوشته شود؟ قبل از تغییر، نسخهٔ ابری دانلود خواهد شد. این کار می‌تواند تغییرات دستگاه دیگر را برگرداند.'))return;
  backupCloud();const snap=payload(),s=signature(snap);
  let rev;try{rev=await commit(snap,remote?.revision||0)}catch(e){if(isRevisionConflict(e)){markConflict(await fetchRemote());throw Error('نسخهٔ سرور دوباره تغییر کرده است؛ دوباره بررسی کنید.')}throw e}
  storeBase(rev,s);pending=false;conflict=false;remote={revision:rev,payload:snap};status('اطلاعات این دستگاه در سرور ذخیره شد ✓');
 }
 async function clearAll(){if(!uid||!client||!started||conflict||!navigator.onLine)throw Error('حذف سراسری فقط پس از همگام‌سازی و اتصال اینترنت ممکن است.');
  await tick(true);if(conflict||pending)throw Error('ابتدا تداخل یا تغییرات همگام‌نشده را برطرف کنید.');
  const empty={schema:1,records:[],accounts:[],currencies:['AFN','USD','PKR'],settings:{...defaults}};
  const r=await commit(empty,base?.revision||0);storeBase(r,signature(empty));remote={revision:r,payload:empty};pending=false;status('حذف ابری انجام شد.');
 }
 $('cloudSyncNow')?.addEventListener('click',()=>tick(true).catch(e=>status('خطای همگام‌سازی',e.message)));
 $('cloudSyncBackupLocal')?.addEventListener('click',backupLocal);
 $('cloudSyncBackupCloud')?.addEventListener('click',backupCloud);
 $('cloudSyncUseCloud')?.addEventListener('click',()=>receiveCloud().catch(e=>alert(e.message)));
 $('cloudSyncUseLocal')?.addEventListener('click',()=>sendLocal().catch(e=>alert(e.message)));
 window.addEventListener('online',()=>tick(true).catch(()=>{}));
 window.addEventListener('focus',()=>tick().catch(()=>{}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick().catch(()=>{})});
 window.DH_SYNC={start,stop,offlineMode,localChanged,authorized,tick,clearAll,backupLocal,debug:()=>({uid,base,started,loading,pending,conflict,remoteRev:remote?.revision})};
})();


/* ===== Supabase license client (previously deferred) ===== */

/* Client experience only. Server is authoritative for expiration and key redemption.
 * WARNING: local-only records are not server-enforced and client checks can be bypassed.
 * For commercial anti-piracy, move financial writes to an authenticated server API. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const config=window.APP_LICENSE_CONFIG||{};
 const configured=Boolean(/^https:\/\/[^\s]+\.supabase\.co\/?$/.test(config.supabaseUrl||'') && String(config.publicAnonKey||'').length>15);
 const node=$('licenseOverlay'),message=$('licenseMessage'),email=$('licenseEmail'),password=$('licensePassword');
 const statusBox=$('licenseStatusBox'),settingsInfo=$('licenseSettingsInfo'),adminPanel=$('licenseAdminPanel');
 const authArea=$('licenseAuthArea');
 let client=null,userId=null,latest=null,admin=false,refreshing=false,lastCheck=0;
  // Bounded device-local offline grace. The backend remains authoritative online.
  const OFFLINE_KEY='hesabket.offline-license.v16',GRACE_MS=7*24*60*60*1000;
  const cached=()=>{try{const x=JSON.parse(localStorage.getItem(OFFLINE_KEY)||'null');return x&&/^[a-f0-9-]{36}$/i.test(x.userId)?x:null}catch{return null}};
  const rememberOnline=(status)=>{if(!userId||!status)return;const expires=status.kind==='paid'?status.paidUntil:status.trialEndsAt;try{localStorage.setItem(OFFLINE_KEY,JSON.stringify({userId,verifiedAt:Date.now(),canWrite:status.canWrite===true,kind:status.kind,expiresAt:expires||null}))}catch{}};
  function tryOffline(){const c=cached();if(!c)return false;const now=Date.now();
   // Clock rollback, expired license or stale server validation never grants offline edits.
   if(!Number.isFinite(c.verifiedAt)||now<c.verifiedAt||now-c.verifiedAt>GRACE_MS)return false;
   if(!userId)userId=c.userId;
   if(userId!==c.userId)return false;
   if(typeof window.licenseSwitchUser==='function')window.licenseSwitchUser(c.userId);
   const expireAt=Date.parse(c.expiresAt||'');
   const active=c.canWrite===true&&Number.isFinite(expireAt)&&now<expireAt;
   latest={kind:c.kind,canWrite:active,daysLeft:Math.max(0,Math.floor((expireAt-now)/86400000))};
   settingsInfo.textContent=active?'آفلاین · دسترسی موقت تا اتصال بعدی':'آفلاین · فقط مشاهده و پشتیبان‌گیری';
   if($('licenseStatusText'))$('licenseStatusText').textContent=settingsInfo.textContent;
   statusBox.hidden=false;authArea.hidden=true;adminPanel.hidden=true;
   allowApp(active);window.DH_SYNC?.offlineMode(c.userId);return true;
  }
 const tell=(t,bad=false)=>{message.textContent=t;message.classList.toggle('lic-error',bad)};
 function showOverlay(){node.hidden=false;document.body.classList.remove('license-authorized')}
 function allowApp(writable){window.LICENSE_CAN_WRITE=Boolean(writable);document.body.classList.add('license-authorized');node.hidden=true;document.body.classList.toggle('license-readonly',!writable);$('licenseReadOnlyRibbon').hidden=Boolean(writable);}
 function resetApp(){window.LICENSE_CAN_WRITE=false;userId=null;latest=null;admin=false;showOverlay();authArea.hidden=false;statusBox.hidden=true;adminPanel.hidden=true;settingsInfo.textContent='برای دریافت وضعیت اشتراک وارد حساب شوید.';}
 async function request(action,data={}){
  if(!client)throw Error('اتصال سرور آماده نیست.');
  const {data:session}=await client.auth.getSession();if(!session.session?.access_token)throw Error('نشست شما پایان یافته؛ دوباره وارد شوید.');
  const r=await fetch(`${config.supabaseUrl.replace(/\/$/,'')}/functions/v1/${config.functionName||'license'}`,{
   method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.session.access_token,'apikey':config.publicAnonKey},body:JSON.stringify({action,...data}),cache:'no-store'
  });
  let result={};try{result=await r.json()}catch{};
  if(!r.ok||result.error)throw Error(result.error||'خطای ارتباط با سرور: '+r.status);
  return result;
 }
 async function refreshStatus(force=false){
  if(refreshing || !userId)return;
  if(!force&&Date.now()-lastCheck<10000)return;
  refreshing=true;
  try{
   const data=await request('status');lastCheck=Date.now();latest=data.status;admin=Boolean(data.isAdmin);rememberOnline(latest);
   window.LICENSE_CAN_WRITE=Boolean(latest.canWrite);
   const exp=latest.kind==='paid'?'اشتراک فعال':latest.kind==='trial'?'نسخهٔ آزمایشی':latest.kind==='suspended'?'حساب مسدود است':'مدت استفاده پایان یافته';
   const end=latest.kind==='paid'?latest.paidUntil:latest.trialEndsAt;
   const summary=`${exp} • ${latest.daysLeft} روز باقی‌مانده${end?' • تا '+new Date(end).toLocaleDateString('fa-AF'):''}`;
   settingsInfo.textContent=summary;
   $('licenseUsername').textContent=data.userEmail||'';
   $('licenseStatusText').textContent=summary;
   statusBox.hidden=false;authArea.hidden=true;
   $('licenseReadonlyBtn').hidden=latest.canWrite;
   adminPanel.hidden=!admin;
   if(latest.canWrite){allowApp(true)}else {window.LICENSE_CAN_WRITE=false;showOverlay();tell('مدت اشتراک پایان یافته است. کلید فعال‌سازی وارد کنید یا اطلاعات قبلی را فقط مشاهده و خروجی بگیرید.');}
  }catch(e){if((!navigator.onLine||/failed to fetch|networkerror|network request failed|internet|network is unreachable/i.test(String(e.message||'')))&&tryOffline()){tell('حالت آفلاین: اطلاعات ورود قبلی حفظ شد.');return}window.LICENSE_CAN_WRITE=false;showOverlay();tell('وضعیت لایسنس از سرور تأیید نشد: '+e.message,true)}
  finally{refreshing=false}
 }
 async function login(mode){
  const e=email.value.trim(),p=password.value;if(!e||p.length<6){tell('ایمیل و رمز حداقل شش‌حرفی وارد کنید.',true);return}
  tell('در حال بررسی اطلاعات...');
  const result=mode==='signup'?await client.auth.signUp({email:e,password:p}):await client.auth.signInWithPassword({email:e,password:p});
  if(result.error)throw result.error;
  if(mode==='signup'&&!result.data.session){tell('حساب ساخته شد. ایمیل تأیید را بررسی و سپس وارد شوید.');return}
  await onSession(result.data.session);
 }
 let setupSessionPromise=null,setupSessionUser=null;
 async function onSession(session){
  if(!session?.user){
   if(!navigator.onLine&&tryOffline())return;
   window.DH_SYNC?.stop();setupSessionUser=null;setupSessionPromise=null;resetApp();return;
  }
  const uid=session.user.id;
  if(setupSessionUser!==uid){
   setupSessionUser=uid;
   setupSessionPromise=(async()=>{
    window.LICENSE_CAN_WRITE=false;
    userId=uid;
    // Never load another user's records or sync under the previous session.
    window.DH_SYNC?.stop();
    if(typeof window.licenseSwitchUser==='function')window.licenseSwitchUser(uid);
    await window.DH_SYNC?.start(uid,client);
   })();
  }
  await setupSessionPromise;
  await refreshStatus(true);
  window.DH_SYNC?.authorized();
 }
 async function redeem(field){const code=field.value.trim();if(!code){tell('کلید را وارد کنید.',true);return}
  tell('در حال فعال‌سازی...');try{await request('activate',{code});field.value='';tell('فعال‌سازی انجام شد.');await refreshStatus(true)}catch(e){tell(e.message,true)}
 }
 function escapeText(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 async function adminList(){
  const data=await request('admin_list');
  $('adminCodes').innerHTML=(data.codes||[]).map(c=>`<div class="lic-row"><span>${escapeText(c.state)} • ${c.days} روز • ${escapeText(c.id.slice(0,8))}</span><button type="button" class="secondary" data-revoke="${escapeText(c.id)}" ${c.state==='revoked'?'disabled':''}>لغو کلید</button></div>`).join('')||'هنوز لایسنسی صادر نشده است.';
  $('adminUsers').innerHTML=(data.profiles||[]).map(p=>`<div class="lic-row"><span dir="ltr">${escapeText(p.userId.slice(0,8))}…</span><span>${escapeText(p.status.kind)} (${p.status.daysLeft} روز)</span><button type="button" class="secondary" data-suspend="${escapeText(p.userId)}" data-suspended="${p.status.kind==='suspended'}">${p.status.kind==='suspended'?'فعال‌سازی':'مسدودکردن'}</button></div>`).join('');
 }
 async function installAuth(){
  if(!configured){tell('برای راه‌اندازی سیستم لایسنس ابتدا Supabase را متصل کنید. دستورالعمل در فایل README-V12.md قرار دارد.',true);$('licenseSignIn').disabled=true;$('licenseSignUp').disabled=true;return}
  if(!window.supabase?.createClient){if(tryOffline()){tell('آفلاین: برنامه با تأیید قبلی در همین دستگاه باز شد.');return}tell('کتابخانهٔ اتصال بارگذاری نشد. اینترنت یا مسدودبودن CDN را بررسی کنید.',true);return}
  client=window.supabase.createClient(config.supabaseUrl,config.publicAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>onSession(session).catch(e=>tell(e.message,true)),0)});
  const {data,error}=await client.auth.getSession();if(error){if(!navigator.onLine&&tryOffline())return;tell(error.message,true);return}await onSession(data.session);
 }
 $('licenseSignIn').addEventListener('click',()=>login('signin').catch(e=>tell(e.message,true)));
 $('licenseSignUp').addEventListener('click',()=>login('signup').catch(e=>tell(e.message,true)));
 $('licenseLogout').addEventListener('click',async()=>{try{if(client)await client.auth.signOut()}catch(e){}localStorage.removeItem(OFFLINE_KEY);window.DH_SYNC?.stop();setupSessionUser=null;setupSessionPromise=null;resetApp()});
 $('licenseActivate').addEventListener('click',()=>redeem($('licenseKey')));
 $('licenseSettingsActivate').addEventListener('click',()=>redeem($('licenseSettingsKey')));
 $('licenseReadonlyBtn').addEventListener('click',()=>{allowApp(false);document.body.classList.add('license-readonly');});
 $('licenseShowActivate').addEventListener('click',()=>{showOverlay();statusBox.hidden=false;authArea.hidden=true;});
 $('licenseExportBackup').addEventListener('click',()=>{const out={app:'My Calculator',exportedAt:new Date().toISOString(),transactions:JSON.parse(localStorage.getItem('hesabket.records.v1')||'[]'),accounts:JSON.parse(localStorage.getItem('hesabket.accounts.v3')||'[]'),settings:JSON.parse(localStorage.getItem('hesabket.settings.v3')||'{}'),currencies:JSON.parse(localStorage.getItem('hesabket.currencies.v8')||'["AFN"]')};const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='legacy-records-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
 $('adminIssue').addEventListener('click',async()=>{
  const days=Number($('adminDuration').value);
  try{const data=await request('admin_issue',{days,count:1});$('adminNewKey').textContent=data.codes.map(c=>c.key).join('\n');await adminList()}catch(e){alert(e.message)}
 });
 $('adminReload').addEventListener('click',()=>adminList().catch(e=>alert(e.message)));
 $('adminCodes').addEventListener('click',async e=>{const b=e.target.closest('[data-revoke]');if(!b||!confirm('این کلید لغو شود؟'))return;try{await request('admin_revoke',{id:b.dataset.revoke});await adminList()}catch(err){alert(err.message)}});
 $('adminUsers').addEventListener('click',async e=>{const b=e.target.closest('[data-suspend]');if(!b||!confirm('وضعیت این کاربر تغییر کند؟'))return;try{await request('admin_suspend',{userId:b.dataset.suspend,suspended:b.dataset.suspended!=='true'});await adminList()}catch(err){alert(err.message)}});
 $('adminCopyKey').addEventListener('click',async()=>{const key=$('adminNewKey').textContent;if(key&&navigator.clipboard)await navigator.clipboard.writeText(key)});
 // Check every 10 min and on return to tab; expired users can only read/export locally.
 setInterval(()=>refreshStatus(true),10*60*1000);
 window.addEventListener('focus',()=>refreshStatus());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshStatus()});
 // Capture mutation attempts even when form handlers are attached earlier.
 document.addEventListener('submit',e=>{
  if(!window.LICENSE_CAN_WRITE && ['entryForm','exchangeForm','accountForm'].includes(e.target.id)){e.preventDefault();e.stopImmediatePropagation();alert('ثبت و ویرایش پس از پایان لایسنس امکان‌پذیر نیست.')}
 },true);
 document.addEventListener('click',e=>{
  if(window.LICENSE_CAN_WRITE)return;
  const b=e.target.closest('button');if(!b)return;
  if(b.matches('[data-delete],[data-edit],[data-acc-del],[data-remove-cur],#addCurrency,#restoreBtn,#saveSettings,#startClearData,#confirmClearData')){
   e.preventDefault();e.stopImmediatePropagation();alert('برای ایجاد تغییر، اشتراک را فعال کنید. مشاهده و خروجی اطلاعات همچنان ممکن است.')
  }
 },true);
 installAuth().catch(e=>tell(e.message,true));
})();


}
