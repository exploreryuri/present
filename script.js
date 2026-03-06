// ====== Даты ======
const d = new Date();
const pretty = d.toLocaleDateString('ru-RU', { year:'numeric', month:'long', day:'numeric' });
document.getElementById('today').textContent = pretty;
document.getElementById('date2').textContent = pretty;

// ====== Toast ======
const toastEl = document.getElementById('toast');
let toastT;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ====== Модалки (универсально) ======
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

document.getElementById('btnSurprise').addEventListener('click', () => {
  openModal('modalNote');
  burst(14);
});

document.getElementById('btnQuest').addEventListener('click', () => {
  openModal('modalQuest');
  renderQuest();
});

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

// закрытие по клику на фон
['modalNote','modalQuest'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('click', (e) => { if(e.target === el) closeModal(id); });
});

// копирование ссылки
document.getElementById('btnCopy').addEventListener('click', async () => {
  try{
    await navigator.clipboard.writeText(location.href);
    toast('Ссылка скопирована!');
  } catch {
    toast('Не получилось скопировать — выдели адрес в строке браузера 🙂');
  }
});

// ====== КВЕСТ ======
// Настраивается тут:
const QUEST = [
  {
    hint: "Шаг 1: Загляни туда, где стоит наш сахар. Подсказка: рядом с чайными пакетиками 😉",
    code: "ЛЮБОВЬ"
  },
  {
    hint: "Шаг 2: Следующий подарок там, где тепло и уютно. Проверь место, где любят прятаться пледы.",
    code: "ВЕСНА"
  },
  {
    hint: "Шаг 3: Финал близко! Посмотри там, где обычно лежит что-то важное перед выходом из дома.",
    code: "КАТЯ"
  },
  {
    hint: "Шаг 4: Финал рядом! Посмотри там, где обычно лежат документы.",
    code: "МАРТ"
  },
  {
    hint: "Шаг 3: Финал! Я очень тебя люблю и тебе всего лишь нужно 30 поцелуев для твоего парня.",
    code: "СЕМЬЯ"
  }
];

// ключ в localStorage
const STORE_KEY = 'katya_quest_step_v1';

// элементы
const questHintEl = document.getElementById('questHint');
const questInputEl = document.getElementById('questInput');
const questMsgEl = document.getElementById('questMsg');
const questStepLabelEl = document.getElementById('questStepLabel');
const questDotsEl = document.getElementById('questDots');
const questSubmitEl = document.getElementById('questSubmit');
const questResetEl = document.getElementById('questReset');

function getStep(){
  const raw = localStorage.getItem(STORE_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? Math.max(0, Math.min(n, QUEST.length)) : 0;
}
function setStep(n){
  localStorage.setItem(STORE_KEY, String(n));
}

function normalize(s){
  return (s || "")
    .trim()
    .toLowerCase()
    .replaceAll("ё","е");
}

function renderDots(step){
  questDotsEl.innerHTML = "";
  for(let i=0;i<QUEST.length;i++){
    const dot = document.createElement('i');
    if(i < step) dot.classList.add('on');
    questDotsEl.appendChild(dot);
  }
}

function renderQuest(){
  const step = getStep();

  renderDots(step);

  // если прошла все шаги
  if(step >= QUEST.length){
    questStepLabelEl.textContent = `Готово ✨`;
    questHintEl.innerHTML =
      "Ты прошла квест 💖<br><br>" +
      "И да… ты умница. Всегда.";
    questInputEl.value = "";
    questInputEl.disabled = true;
    questSubmitEl.disabled = true;
    questMsgEl.className = "quest-msg good";
    questMsgEl.textContent = "С праздником, Катя 🌸";
    return;
  }

  questStepLabelEl.textContent = `Шаг ${step + 1} из ${QUEST.length}`;
  questHintEl.textContent = QUEST[step].hint;
  questInputEl.disabled = false;
  questSubmitEl.disabled = false;
  questInputEl.value = "";
  questInputEl.focus();

  questMsgEl.className = "quest-msg";
  questMsgEl.textContent = "Впиши код-слово с найденного подарка, чтобы открыть следующую подсказку.";
}

function submitQuest(){
  const step = getStep();
  if(step >= QUEST.length) return;

  const user = normalize(questInputEl.value);
  const answer = normalize(QUEST[step].code);

  if(!user){
    questMsgEl.className = "quest-msg bad";
    questMsgEl.textContent = "Пусто 🙂 Впиши код-слово.";
    return;
  }

  if(user === answer){
    setStep(step + 1);
    questMsgEl.className = "quest-msg good";
    questMsgEl.textContent = "Верно ✨ Открываю следующую подсказку…";
    burst(16);
    setTimeout(renderQuest, 450);
  } else {
    questMsgEl.className = "quest-msg bad";
    questMsgEl.textContent = "Пока не совпало. Попробуй ещё раз — ты близко 🤍";
    burst(5);
  }
}

questSubmitEl.addEventListener('click', submitQuest);
questInputEl.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') submitQuest();
});

questResetEl.addEventListener('click', () => {
  setStep(0);
  renderQuest();
  toast("Квест сброшен");
});

// ====== Лепестки (canvas) ======
const canvas = document.getElementById('petals');
const ctx = canvas.getContext('2d');
let W,H, petals=[];

function resize(){
  W = canvas.width = window.innerWidth * devicePixelRatio;
  H = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}
window.addEventListener('resize', resize);
resize();

function rnd(a,b){ return a + Math.random()*(b-a); }

function spawn(n=30){
  for(let i=0;i<n;i++){
    petals.push({
      x: rnd(0,W),
      y: rnd(-H*0.2, H),
      r: rnd(6, 16) * devicePixelRatio,
      vx: rnd(-0.32, 0.32) * devicePixelRatio,
      vy: rnd(0.6, 1.6) * devicePixelRatio,
      rot: rnd(0, Math.PI*2),
      vr: rnd(-0.03, 0.03),
      hue: Math.random() < 0.75 ? 342 : 260,
      a: rnd(0.32, 0.72)
    });
  }
}
spawn(34);

function drawPetal(p){
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  const grad = ctx.createRadialGradient(0,0, p.r*0.2, 0,0, p.r);
  grad.addColorStop(0, `hsla(${p.hue}, 90%, 84%, ${p.a})`);
  grad.addColorStop(1, `hsla(${p.hue+10}, 90%, 62%, ${p.a*0.72})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0,0, p.r*0.75, p.r, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function stepAnim(){
  ctx.clearRect(0,0,W,H);
  for(const p of petals){
    p.x += p.vx + Math.sin((p.y/W)*6)*0.14*devicePixelRatio;
    p.y += p.vy;
    p.rot += p.vr;
    if(p.y - p.r > H){
      p.y = -p.r;
      p.x = rnd(0,W);
    }
    drawPetal(p);
  }
  requestAnimationFrame(stepAnim);
}
stepAnim();

function burst(n=12){
  for(let i=0;i<n;i++){
    petals.push({
      x: (window.innerWidth*0.5 + rnd(-120,120)) * devicePixelRatio,
      y: (window.innerHeight*0.45 + rnd(-120,120)) * devicePixelRatio,
      r: rnd(7, 18) * devicePixelRatio,
      vx: rnd(-1.15, 1.15) * devicePixelRatio,
      vy: rnd(0.5, 2.1) * devicePixelRatio,
      rot: rnd(0, Math.PI*2),
      vr: rnd(-0.05, 0.05),
      hue: Math.random() < 0.75 ? 342 : 260,
      a: rnd(0.32, 0.8)
    });
  }
  if (petals.length > 120) petals.splice(0, petals.length - 120);
}

// на старте — подготовим квест (не открывая)
renderQuest();