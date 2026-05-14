document.querySelectorAll('form[data-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const formType = form.dataset.form;
    const storageKey = `gastroconnect_${formType}_requests`;
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');

    current.push({ ...data, createdAt: new Date().toISOString() });
    localStorage.setItem(storageKey, JSON.stringify(current));

    form.reset();
    alert('Заявка принята. Следующий этап — подключим базу данных, чтобы заявки приходили в админку.');
  });
});
