import { DATA } from './data.js?v=7';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

let currentTab = 'phrases';
let index = 0;
let pool = shuffle([...DATA[currentTab]]);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateCard(item) {
  $('#tt').textContent = item.tt || '';
  $('#tr').textContent = item.tr ? `[${item.tr}]` : '';
  $('#ru').textContent = item.ru || '';
  const p = ((index + 1) / pool.length) * 100;
  $('#bar').style.width = `${p}%`;
}

function next() {
  index = (index + 1) % pool.length;
  updateCard(pool[index]);
}

function setTab(tab) {
  currentTab = tab;
  pool = shuffle([...DATA[currentTab]]);
  index = 0;
  $$('.tab').forEach(b => b.classList.toggle('is-active', b.dataset.tab === tab));
  updateCard(pool[index]);
}

$('#nextBtn').addEventListener('click', next);

$('#copyBtn').addEventListener('click', async () => {
  const t = `${$('#tt').textContent}\n${$('#tr').textContent}\n${$('#ru').textContent}`.trim();
  try {
    await navigator.clipboard.writeText(t);
    toast('Скопировано!');
  } catch { toast('Не удалось скопировать'); }
});

$('#shareBtn').addEventListener('click', async () => {
  const text = `${$('#tt').textContent} — ${$('#ru').textContent}`;
  if (navigator.share) {
    try { await navigator.share({ text }); } catch {}
  } else {
    await navigator.clipboard.writeText(text);
    toast('Ссылка/текст в буфере');
  }
});

$$('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// старт
setTab('phrases');
