(function(){
  const tabBtns = document.querySelectorAll('#tabs button');
  const tt = document.getElementById('tt');
  const tr = document.getElementById('tr');
  const ru = document.getElementById('ru');
  const bar = document.getElementById('bar');
  const next = document.getElementById('next');
  const btnCopy = document.getElementById('copy');
  const btnShare = document.getElementById('share');

  let tab = 'phrase';
  let i = 0;

  function setActive(name){
    tab = name; i = 0;
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    render();
  }

  function progress(){
    const total = (window.DATA[tab]||[]).length || 1;
    bar.style.width = Math.max(10, Math.round((i+1)/total*100)) + '%';
  }

  function render(){
    const arr = window.DATA[tab] || [];
    if(!arr.length){ tt.textContent='Пусто'; tr.textContent=''; ru.textContent=''; progress(); return; }
    const item = arr[i % arr.length];
    tt.textContent = item.tt || '';
    tr.textContent = item.tr || '';
    ru.textContent = item.ru || '';
    progress();
  }

  tabBtns.forEach(b => b.addEventListener('click', () => setActive(b.dataset.tab)));
  next.addEventListener('click', () => { i = (i + 1) % ((window.DATA[tab]||[]).length || 1); render(); });

  btnCopy.addEventListener('click', async () => {
    const text = `${tt.textContent}\n${tr.textContent}\n${ru.textContent}`.trim();
    try { await navigator.clipboard.writeText(text); next.textContent='Скопировано!'; setTimeout(()=>next.textContent='Ещё вариант', 900); }
    catch(e){ alert('Не удалось скопировать'); }
  });

  btnShare.addEventListener('click', async () => {
    const text = `${tt.textContent}\n${tr.textContent}\n${ru.textContent}`.trim();
    if(navigator.share){ try{ await navigator.share({text}); } catch(e){} } else { alert(text); }
  });

  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js'); }

  render();
})();