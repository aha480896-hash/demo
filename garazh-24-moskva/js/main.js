// Меню, табло свободных окон и окно записи (сообщение уходит в WhatsApp).
// Данные барбершопа (телефон, WhatsApp, часы, мастера) — в js/data.js.

// Меню на телефоне
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
if (header && toggle) {
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  header.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => header.classList.remove('open')));
}

// Свободные окна. На настоящем сайте сюда подключается расписание из YCLIENTS или DIKIDI;
// в демо занятость придумывается заново каждый день, но одинаково для всех посетителей.
function busy(masterIndex, dayNumber, hour) {
  const x = Math.sin(masterIndex * 97.3 + dayNumber * 13.7 + hour * 7.1) * 10000;
  return x - Math.floor(x) < 0.55;
}
function freeSlots(masterIndex, date, fromHour, limit) {
  const day = Math.floor(date.getTime() / 86400000);
  const out = [];
  for (let h = Math.max(SHOP.open, fromHour); h < SHOP.close && out.length < limit; h++) {
    if (!busy(masterIndex, day, h)) out.push(h);
  }
  return out;
}

const now = new Date();
const tomorrow = new Date(now.getTime() + 86400000);
const startHour = now.getMinutes() > 20 ? now.getHours() + 2 : now.getHours() + 1;
const dayName = (d) => d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

const board = document.getElementById('board-rows');
if (board) {
  document.getElementById('board-date').textContent = dayName(now);
  board.innerHTML = '';
  MASTERS.forEach((m, i) => {
    let hours = freeSlots(i, now, startHour, 3);
    let when = 'сегодня';
    if (hours.length === 0) { hours = freeSlots(i, tomorrow, SHOP.open, 3); when = 'завтра'; }
    const row = document.createElement('div');
    row.className = 'board-row';
    row.innerHTML = `<div class="who"><b></b><span></span></div><div class="slots"></div>`;
    row.querySelector('b').textContent = m.name;
    row.querySelector('.who span').textContent = m.level;
    const slots = row.querySelector('.slots');
    hours.forEach((h) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot' + (when === 'завтра' ? ' tomorrow' : '');
      b.textContent = (when === 'завтра' ? 'завтра ' : '') + h + ':00';
      b.dataset.master = m.name;
      b.dataset.when = `${when} в ${h}:00`;
      b.setAttribute('aria-label', `Записаться к мастеру ${m.name}, ${when} в ${h}:00`);
      slots.append(b);
    });
    board.append(row);

    const free = document.querySelector(`[data-free="${m.id}"]`);
    if (free) free.textContent = hours.length ? `Ближайшее окно: ${when} в ${hours[0]}:00` : 'Записи на ближайшие дни нет';
  });
}

// Окно записи
const dialog = document.getElementById('booking');
if (dialog) {
  const form = dialog.querySelector('form');
  const master = form.querySelector('#b-master');
  const service = form.querySelector('#b-service');
  const when = form.querySelector('#b-when');

  // Нет WhatsApp — звоним по телефону
  function contact(text) {
    if (SHOP.whatsapp) window.open('https://wa.me/' + SHOP.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''), '_blank', 'noopener');
    else location.href = 'tel:+' + SHOP.phone;
  }

  function open(preset) {
    if (preset.master && [...master.options].some((o) => o.value === preset.master)) master.value = preset.master;
    if (preset.service && [...service.options].some((o) => o.value === preset.service)) service.value = preset.service;
    when.value = preset.when || '';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else contact('');
  }

  document.addEventListener('click', (e) => {
    const slot = e.target.closest('.slot');
    if (slot) { open({ master: slot.dataset.master, when: slot.dataset.when }); return; }
    const trigger = e.target.closest('[data-book]');
    if (!trigger) return;
    e.preventDefault();
    open({ master: trigger.dataset.master, service: trigger.dataset.book });
  });

  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const lines = ['Здравствуйте! Хочу записаться: ' + data.get('service') + '.'];
    if (data.get('master')) lines.push('Мастер: ' + data.get('master') + '.');
    const car = String(data.get('car') || '').trim();   // поле есть только у автосервиса и мойки
    if (car) lines.push('Автомобиль: ' + car + '.');
    const w = String(data.get('when') || '').trim();
    if (w) lines.push('Когда: ' + w + '.');
    const name = String(data.get('name') || '').trim();
    if (name) lines.push('Меня зовут ' + name + '.');
    contact(lines.join('\n'));
    dialog.close();
  });
}
