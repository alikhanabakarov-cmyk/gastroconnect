(function () {
  const STORAGE_KEY = 'gc_public_submissions';

  const roleLabels = {
    worker: 'Работник',
    restaurant: 'Заведение',
    supplier: 'Поставщик'
  };

  function readRows() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  }

  function writeRows(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }

  function makeId() {
    if (crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `gc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getFormTitle(type, data) {
    if (type === 'worker') return data.name || 'Работник';
    if (type === 'restaurant') return data.business_name || 'Заведение';
    return data.company_name || 'Поставщик';
  }

  function saveSubmission(type, data) {
    const rows = readRows();
    rows.unshift({
      id: makeId(),
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

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('ru-RU');
  }

  function roleText(type) {
    return roleLabels[type] || type || '-';
  }

  function download(name, text, type) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type }));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function initPublicForms() {
    document.querySelectorAll('form[data-form-type]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        const type = form.dataset.formType;
        const data = Object.fromEntries(new FormData(form).entries());
        saveSubmission(type, data);

        const box = form.querySelector('.success');
        if (box) {
          box.textContent = 'Заявка сохранена. Для работы с профилем, приглашениями и откликами войдите в личный кабинет.';
          box.style.display = 'block';
        }

        form.reset();
      });
    });
  }

  function initAuthPage() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleInput = document.getElementById('role');
    const message = document.getElementById('authMessage');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const authTitle = document.getElementById('authTitle');
    const authLead = document.getElementById('authLead');

    if (!emailInput || !passwordInput || !roleInput || !message) return;

    const roleCopy = {
      worker: {
        title: 'Регистрация работника',
        lead: 'Создайте аккаунт работника, заполните профиль и откликайтесь на смены в кабинете.'
      },
      restaurant: {
        title: 'Регистрация заведения',
        lead: 'Создайте аккаунт заведения, публикуйте смены, смотрите работников и заявки поставщикам.'
      },
      supplier: {
        title: 'Регистрация поставщика',
        lead: 'Создайте аккаунт поставщика, публикуйте предложения и принимайте заявки от заведений.'
      }
    };

    const requestedRole = new URLSearchParams(window.location.search).get('role');
    if (roleCopy[requestedRole]) {
      roleInput.value = requestedRole;
    }

    function updateRoleText() {
      const copy = roleCopy[roleInput.value] || roleCopy.worker;
      if (authTitle) authTitle.textContent = copy.title;
      if (authLead) authLead.textContent = copy.lead;
    }

    async function register() {
      const client = window.supabaseClient;
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const role = roleInput.value;

      if (!client) {
        message.textContent = 'Supabase не загрузился. Обновите страницу.';
        return;
      }

      if (!email || !password) {
        message.textContent = 'Введите email и пароль.';
        return;
      }

      message.textContent = 'Регистрируем...';

      const { error } = await client.auth.signUp({
        email,
        password,
        options: { data: { role } }
      });

      message.textContent = error
        ? `Ошибка регистрации: ${error.message}`
        : 'Регистрация успешна. Теперь попробуйте войти.';
    }

    async function login() {
      const client = window.supabaseClient;
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!client) {
        message.textContent = 'Supabase не загрузился. Обновите страницу.';
        return;
      }

      if (!email || !password) {
        message.textContent = 'Введите email и пароль.';
        return;
      }

      message.textContent = 'Входим...';

      const { error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        message.textContent = `Ошибка входа: ${error.message}`;
        return;
      }

      window.location.href = 'cabinet.html';
    }

    roleInput.addEventListener('change', updateRoleText);
    registerBtn?.addEventListener('click', register);
    loginBtn?.addEventListener('click', login);
    updateRoleText();
  }

  function renderStats(rows) {
    const stats = document.getElementById('adminStats');
    if (!stats) return;

    const counts = rows.reduce((acc, row) => {
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

  function renderAdmin() {
    const tbody = document.querySelector('#adminTable tbody');
    if (!tbody) return;

    const searchInput = document.getElementById('adminSearch');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const rows = readRows();
    const visibleRows = query
      ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query))
      : rows;

    renderStats(visibleRows);

    tbody.innerHTML = visibleRows.map((row) => `
      <tr>
        <td>${escapeHtml(formatDate(row.created_at))}</td>
        <td>${escapeHtml(roleText(row.type))}</td>
        <td>${escapeHtml(row.title)}</td>
        <td>${row.phone ? `<a href="tel:${escapeHtml(row.phone)}">${escapeHtml(row.phone)}</a>` : '-'}</td>
        <td>${row.telegram ? escapeHtml(row.telegram) : '-'}</td>
        <td>${escapeHtml(JSON.stringify(row.data))}</td>
      </tr>
    `).join('');

    if (!visibleRows.length) {
      tbody.innerHTML = '<tr><td colspan="6">Заявок пока нет.</td></tr>';
    }
  }

  function initAdminActions() {
    const tbody = document.querySelector('#adminTable tbody');
    if (!tbody) return;

    const exportJson = document.getElementById('exportJson');
    const exportCsv = document.getElementById('exportCsv');
    const clearData = document.getElementById('clearData');
    const searchInput = document.getElementById('adminSearch');

    exportJson?.addEventListener('click', () => {
      download('gastroconnect-submissions.json', JSON.stringify(readRows(), null, 2), 'application/json;charset=utf-8');
    });

    exportCsv?.addEventListener('click', () => {
      const csv = [
        'Дата,Тип,Название,Телефон,Telegram,Город',
        ...readRows().map((row) => [
          formatDate(row.created_at),
          roleText(row.type),
          row.title || '',
          row.phone || '',
          row.telegram || '',
          row.city || ''
        ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      ].join('\n');

      download('gastroconnect-submissions.csv', `\ufeff${csv}`, 'text/csv;charset=utf-8');
    });

    clearData?.addEventListener('click', () => {
      if (confirm('Очистить локальные заявки?')) {
        writeRows([]);
        renderAdmin();
      }
    });

    searchInput?.addEventListener('input', renderAdmin);
  }

  initPublicForms();
  initAuthPage();
  initAdminActions();
  renderAdmin();
})();
