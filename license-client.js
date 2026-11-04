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
   allowApp(active);return true;
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
 async function onSession(session){
  if(!session?.user){if(!navigator.onLine&&tryOffline())return;resetApp();return}
  if(userId!==session.user.id){userId=session.user.id;
   // Per-user namespaced local data. Legacy migration is opt-in and owner-bound.
   if(typeof window.licenseSwitchUser==='function')window.licenseSwitchUser(userId);
  }
  await refreshStatus(true);
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
 $('licenseLogout').addEventListener('click',async()=>{try{if(client)await client.auth.signOut()}catch(e){}localStorage.removeItem(OFFLINE_KEY);resetApp()});
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
