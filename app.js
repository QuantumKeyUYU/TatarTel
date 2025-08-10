// app.js (v9)
import { DATA } from './data.js?v=9';

const APP_VERSION = '9';

const els = {
  tabButtons: Array.from(document.querySelectorAll('[data-tab]')),
  tt: document.getElementById('tt'),
  tr: document.getElementById('tr'),
  ru: document.getElementById('ru'),
  bar: document.getElementById('bar'),
  next: document.getElementById('nextBtn'),
  copy: document.getElementById('copyBtn'),
  share: document.getElementById('shareBtn'),
  speakBtn: document.getElementById('speakBtn'),
  handBtn: document.getElementById('handBtn'),
  padBox: document.getElementById('padBox'),
  pad: document.getElementById('pad'),
  padClear: document.getElementById('padClear'),
  padHide: document.getElementById('padHide'),
  padSave: document.getElementById('padSave'),
  card: document.querySelector('.card') || document.body
};

let state = {
  tab: localStorage.getItem('tab') || 'phrases',
  seen: { phrases: new Set(), proverbs: new Set(), facts: new Set() }
};

// ---------- data/render ----------
function pickRandom(list, bucket){
  if (!Array.isArray(list) || list.length === 0) return {tt:'',tr:'',ru:''};
  if (bucket.size >= list.length) bucket.clear();
  let i;
  do { i = Math.floor(Math.random()*list.length); } while (bucket.has(i));
  bucket.add(i);
  return list[i];
}
function render(entry){
  els.tt.textContent = entry.tt || '';
  els.tr.textContent = entry.tr ? `[${entry.tr}]` : '';
  els.ru.textContent = entry.ru || '';
  els.bar.style.width = `${20 + Math.random()*75}%`;
}
function next(){
  const list = DATA[state.tab];
  const bucket = state.seen[state.tab];
  render(pickRandom(list, bucket));
}
function setTab(tab){
  state.tab = tab;
  localStorage.setItem('tab', tab);
  els.tabButtons.forEach(b=>{
    const active = b.dataset.tab === tab;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', String(active));
  });
  next();
}

// ---------- actions ----------
els.tabButtons.forEach(btn=> btn.addEventListener('click', ()=> setTab(btn.dataset.tab)));
els.next.addEventListener('click', next);

els.copy.addEventListener('click', async ()=>{
  const t = `${els.tt.textContent}\n${els.tr.textContent}\n${els.ru.textContent}`.trim();
  try { await navigator.clipboard.writeText(t); toast('Скопировано'); }
  catch { toast('Не удалось скопировать'); }
});

els.share.addEventListener('click', async ()=>{
  const text = `${els.tt.textContent} • ${els.ru.textContent}`;
  if (navigator.share) {
    try { await navigator.share({ title:'TATARÇA', text, url: location.href }); } catch {}
  } else {
    await navigator.clipboard.writeText(`${text}\n${location.href}`);
    toast('Ссылка скопирована');
  }
});

// TTS
els.speakBtn.addEventListener('click', ()=>{
  const u = new SpeechSynthesisUtterance(
    `${els.tt.textContent}. ${els.tr.textContent.replace(/[\[\]]/g,'')}`
  );
  u.lang = 'tt-RU'; // подберётся близкий голос, если татарского нет
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
});

// ---------- handwriting pad ----------
let ctx, drawing = false, last = null;

function padResizeToCSS(){
  if (!els.pad) return;
  const r = els.pad.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  els.pad.width = Math.round(r.width * dpr);
  els.pad.height = Math.round((r.width * 0.5) * dpr); // пропорции
  ctx = els.pad.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.lineWidth=6; ctx.strokeStyle='#5245c2';
}
function startDraw(x,y){ drawing = true; last = {x,y}; }
function lineTo(x,y){
  if (!drawing || !last) return;
  ctx.beginPath();
  ctx.moveTo(last.x,last.y);
  ctx.lineTo(x,y);
  ctx.stroke();
  last = {x,y};
}
function endDraw(){ drawing=false; last=null; }
function getPos(e){
  const r = els.pad.getBoundingClientRect();
  if (e.touches?.[0]) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function bindPad(){
  padResizeToCSS(); addEventListener('resize', padResizeToCSS);
  // mouse
  els.pad.addEventListener('mousedown', e=>{ const p=getPos(e); startDraw(p.x,p.y); });
  els.pad.addEventListener('mousemove', e=>{ const p=getPos(e); lineTo(p.x,p.y); });
  addEventListener('mouseup', endDraw);
  // touch
  els.pad.addEventListener('touchstart', e=>{ const p=getPos(e); startDraw(p.x,p.y); }, {passive:false});
  els.pad.addEventListener('touchmove', e=>{ e.preventDefault(); const p=getPos(e); lineTo(p.x,p.y); }, {passive:false});
  els.pad.addEventListener('touchend', endDraw);

  els.padClear.addEventListener('click', ()=> ctx.clearRect(0,0,els.pad.width,els.pad.height));
  els.padHide.addEventListener('click', ()=> els.padBox.hidden = true);
  els.padSave.addEventListener('click', ()=>{
    const a=document.createElement('a');
    a.download='tatar_handwriting.png';
    a.href=els.pad.toDataURL('image/png');
    a.click();
  });
}
els.handBtn.addEventListener('click', ()=>{
  els.padBox.hidden = !els.padBox.hidden;
  if (!els.padBox.hidden) requestAnimationFrame(bindPad);
});

// ---------- swipe: right -> next, left -> share ----------
let sx=0, sy=0, swiping=false;
const SWIPE_MIN=36;
els.card.addEventListener('touchstart', e=>{ swiping=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; }, {passive:true});
els.card.addEventListener('touchend', e=>{
  if (!swiping) return; swiping=false;
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx)>SWIPE_MIN) {
    if (dx>0) next(); else els.share.click();
    navigator.vibrate?.(12);
  }
}, {passive:true});

// ---------- utils ----------
function toast(msg){
  const t=document.createElement('div');
  t.className='toast'; t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1500);
}

// init
setTab(state.tab);

// PWA
if ('serviceWorker' in navigator) {
  addEventListener('load', ()=> {
    navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`).catch(()=>{});
  });
}
