document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('[data-form-type]');
  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const type = form.getAttribute('data-form-type');
      const formData = new FormData(form);
      const payload = {
        type,
        createdAt: new Date().toISOString(),
        data: Object.fromEntries(formData.entries())
      };
      const key = `gastroconnect_${type}_requests`;
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.push(payload);
      localStorage.setItem(key, JSON.stringify(current));
      const success = form.querySelector('.success');
      if (success) success.style.display = 'block';
      form.reset();
      console.log('GastroConnect request:', payload);
    });
  });
});
