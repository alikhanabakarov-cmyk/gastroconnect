const loadWorkersBtn = document.getElementById('loadWorkersBtn');
const workersList = document.getElementById('workersList');
const workersMessage = document.getElementById('workersMessage');

function showValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—';
  }

  if (value === true) {
    return 'да';
  }

  if (value === false) {
    return 'нет';
  }

  return value || '—';
}

async function loadWorkers() {
  if (!workersList || !workersMessage) {
    return;
  }

  workersMessage.textContent = 'Загружаем работников...';
  workersList.innerHTML = '';

  const { data, error } = await window.supabaseClient
    .from('worker_profiles')
    .select(`
      user_id,
      professions,
      experience,
      available_days,
      available_time,
      min_rate,
      payment_type,
      can_travel,
      travel_cities,
      travel_radius_km,
      about,
      updated_at
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    workersMessage.textContent = 'Ошибка загрузки работников: ' + error.message;
    return;
  }

  if (!data || data.length === 0) {
    workersMessage.textContent = 'Анкет работников пока нет.';
    return;
  }

  workersMessage.textContent = 'Найдено работников: ' + data.length;

  data.forEach(function (worker) {
    const card = document.createElement('div');

    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '12px';
    card.style.padding = '14px';
    card.style.background = '#fffaf0';

    card.innerHTML = `
      <h3>${showValue(worker.professions)}</h3>

      <p><b>Опыт:</b> ${showValue(worker.experience)}</p>
      <p><b>Дни:</b> ${showValue(worker.available_days)}</p>
      <p><b>Время:</b> ${showValue(worker.available_time)}</p>
      <p><b>Минимальная ставка:</b> ${showValue(worker.min_rate)}</p>
      <p><b>Тип оплаты:</b> ${showValue(worker.payment_type)}</p>
      <p><b>Готов ехать:</b> ${showValue(worker.can_travel)}</p>
      <p><b>Города:</b> ${showValue(worker.travel_cities)}</p>
      <p><b>Радиус:</b> ${showValue(worker.travel_radius_km)} км</p>
      <p><b>О себе:</b> ${showValue(worker.about)}</p>
    `;

    workersList.appendChild(card);
  });
}

if (loadWorkersBtn) {
  loadWorkersBtn.addEventListener('click', loadWorkers);
}
