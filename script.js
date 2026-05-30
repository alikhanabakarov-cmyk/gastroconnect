(function () {
  const KEY = 'gc_public_submissions';

  function readRows() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }

  function writeRows(rows) {
    localStorage.setItem(KEY, JSON.stringify(rows));
  }

  function getFormTitle(type, data) {
    if (type === 'worker') return data.name || 'Работник';
    if (type === 'restaurant') return data.business_name || 'Заведение';
    return data.company_name || 'Поставщик';
  }

  function saveSubmission(type, data) {
    const rows = readRows();
    rows.unshift({
      id: crypto.randomUUID(),
      type,
      title: getFormTitle(type, data),
      phone: data.phone || '',
      telegram: data.telegram || '',
      city: data.city || '',
      data,
      created_at: new Date().toISOString()
    });
    writeRows(rows);
  }

  document.querySelectorAll('form[data-form-type]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const type = form.dataset.formType;
      const data = Object.fromEntries(new FormData(form).entries());
      saveSubmission(type, data);

      const box = form.querySelector('.success');
      if (box) {
        box.textContent = 'Заявка сохранена. Для работы с приглашениями войдите в личный кабинет.';
        box.style.display = 'block';
      }
      form.reset();
    });
  });

  function typeText(type) {
    const map = {
      worker: 'Работник',
      restaurant: 'Заведение',
      supplier: 'Поставщик'
    };
    return map[type] || type || '-';
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('ru-RU');
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function download(name, text, type) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type }));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function renderAdmin() {
    const tbody = document.querySelector('#adminTable tbody');
    if (!tbody) return;

    const searchInput = document.getElementById('adminSearch');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const rows = readRows();
    const visibleRows = query
      ? rows.filter(row => JSON.stringify(row).toLowerCase().includes(query))
      : rows;

    const stats = document.getElementById('adminStats');
    if (stats) {
      const counts = visibleRows.reduce((acc, row) => {
        acc.all += 1;
        acc[row.type] = (acc[row.type] || 0) + 1;
        return acc;
      }, { all: 0, worker: 0, restaurant: 0, supplier: 0 });

      stats.innerHTML = `
        <div class="stat">Всего: ${counts.all}</div>
        <div class="stat">Работники: ${counts.worker}</div>
        <div class="stat">Заведения: ${counts.restaurant}</div>
        <div class="stat">Поставщики: ${counts.supplier}</div>
      `;
    }

    tbody.innerHTML = visibleRows.map(row => `
      <tr>
        <td>${escapeHtml(formatDate(row.created_at))}</td>
        <td>${escapeHtml(typeText(row.type))}</td>
        <td>${escapeHtml(row.title)}</td>
        <td>${row.phone ? `<a href="tel:${escapeHtml(row.phone)}">${escapeHtml(row.phone)}</a>` : '-'}</td>
        <td>${row.telegram ? escapeHtml(row.telegram) : '-'}</td>
        <td>${escapeHtml(JSON.stringify(row.data))}</td>
      </tr>
    `).join('');

    const exportJson = document.getElementById('exportJson');
    const exportCsv = document.getElementById('exportCsv');
    const clearData = document.getElementById('clearData');

    if (exportJson && !exportJson.dataset.ready) {
      exportJson.dataset.ready = '1';
      exportJson.addEventListener('click', () => {
        download('gastroconnect-submissions.json', JSON.stringify(readRows(), null, 2), 'application/json');
      });
    }

    if (exportCsv && !exportCsv.dataset.ready) {
      exportCsv.dataset.ready = '1';
      exportCsv.addEventListener('click', () => {
        const csv = [
          'Дата,Тип,Название,Телефон,Telegram,Город',
          ...readRows().map(row => [
            formatDate(row.created_at),
            typeText(row.type),
            row.title || '',
            row.phone || '',
            row.telegram || '',
            row.city || ''
          ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
        ].join('\n');
        download('gastroconnect-submissions.csv', csv, 'text/csv;charset=utf-8');
      });
    }

    if (clearData && !clearData.dataset.ready) {
      clearData.dataset.ready = '1';
      clearData.addEventListener('click', () => {
        if (confirm('Очистить локальные заявки?')) {
          writeRows([]);
          renderAdmin();
        }
      });
    }

    if (searchInput && !searchInput.dataset.ready) {
      searchInput.dataset.ready = '1';
      searchInput.addEventListener('input', renderAdmin);
    }
  }

  renderAdmin();
})();
