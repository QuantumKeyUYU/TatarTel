// app.js
import { DATA } from './data.js?v=8';

const APP_VERSION = '8';

// элементы
const els = {
  tabButtons: Array.from(document.querySelectorAll('[data-tab]')),
  tt: document.getElementById('tt'),
  tr: document.getElementById('tr'),
  ru: document.getElementById('ru'),
  bar: document.getElementById('bar'),
  next: document.getElementById('nextBtn'),
  copy: document.getElementById('copyBtn'),
  share: document.getElementById('shareBtn'),
};

let state = {
  tab: localStorage.getItem('tab') || 'phrases',
  seen: { phrases: new Set(), proverbs: new Set(), facts: new Set() }
};

function pickRandom(list, bucket){
  if (!Array.isArray(list) || list.length === 0) return {tt:'',tr:'',ru:''};
  if (bucket.size >= list.length) bucket.clear(); // прошли круг — начинаем заново
  let i;
  do { i = Math.floor(Math.random()*list.length); } while (bucket.has(i));
  bucket.add(i);
  return list[i];
}

function render(entry){
  els.tt.textContent = entry.tt || '';
  els.tr.textContent = entry.tr ? `[${entry.tr}]` : '';
  els.ru.textContent = entry.ru || '';
  // псевдо-прогресс
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

els.tabButtons.forEach(btn=>{
  btn.addEventListener('click', ()=> setTab(btn.dataset.tab));
});

els.next?.addEventListener('click', next);

els.copy?.addEventListener('click', async ()=>{
  const text = `${els.tt.textContent}\n${els.tr.textContent}\n${els.ru.textContent}`.trim();
  try{
    await navigator.clipboard.writeText(text);
    toast('Скопировано');
  }catch{ toast('Не удалось скопировать'); }
});

els.share?.addEventListener('click', async ()=>{
  const payload = {
    title: 'TATARÇA',
    text: `${els.tt.textContent} • ${els.ru.textContent}`,
    url: location.href
  };
  if (navigator.share) {
    try{ await navigator.share(payload); }catch{}
  } else {
    await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
    toast('Ссылка скопирована');
  }
});

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position:'fixed', left:'50%', bottom:'24px', transform:'translateX(-50%)',
    background:'#2b2747', color:'#fff', padding:'10px 14px', borderRadius:'12px',
    boxShadow:'0 8px 24px rgba(0,0,0,.18)', zIndex:9999, fontWeight:700
  });
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 1400);
}

// старт: восстановить вкладку и показать запись
setTab(state.tab);

// PWA: регистрация service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`service-worker.js?v=${APP_VERSION}`).catch(()=>{});
  });
}
