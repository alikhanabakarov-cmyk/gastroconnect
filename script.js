
  const SUPABASE_URL = 'https://fqxbtojjhpkibixvnbnn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0F-CDySnOiJYUdAr8khcJA_QiZc6J2y';
(function(){
  const KEY='gc_submissions';
  const get=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
  const set=(v)=>localStorage.setItem(KEY,JSON.stringify(v));
  document.querySelectorAll('form[data-form-type]').forEach(form=>{
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const data=Object.fromEntries(new FormData(form).entries());
      const entry={id:Date.now(),created_at:new Date().toLocaleString('ru-RU'),type:form.dataset.formType,data};
      fetch(`${SUPABASE_URL}/rest/v1/suppliers`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  },
  body: JSON.stringify({
    company_name: data.company_name || '',
    contact_name: data.contact_name || '',
    phone: data.phone || '',
    telegram: data.telegram || '',
    city: data.city || '',
    category: data.category || '',
    website: data.website || '',
    description: data.description || ''
  })
});
      const all=get(); all.unshift(entry); set(all);
      const box=form.querySelector('.success');
      if(box){box.textContent='Заявка сохранена в локальную панель управления. Следующий этап — подключение базы данных.';box.style.display='block';}
      form.reset();
    });
  });
  function toCsv(rows){
    const esc=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
    return rows.map(r=>[r.created_at,r.type,r.data.name||r.data.business_name||r.data.company_name||'',r.data.phone||'',r.data.telegram||'',JSON.stringify(r.data)].map(esc).join(',')).join('\n');
  }
  function download(name, text, type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
  function renderAdmin(){
    const tbody=document.querySelector('#adminTable tbody'); if(!tbody) return;
  const rows = [];

fetch(`${SUPABASE_URL}/rest/v1/suppliers?select=*`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(res => res.json())
.then(data => {
  rows.push(...data);

  const counts={all:rows.length,worker:0,restaurant:0,supplier:0};
  rows.forEach(r=>counts[r.type]=(counts[r.type]||0)+1);

  document.getElementById('adminStats').innerHTML=
  `<div class="stat">Всего: ${counts.all}</div>
   <div class="stat">Работники: ${counts.worker}</div>
   <div class="stat">Заведения: ${counts.restaurant}</div>
   <div class="stat">Поставщики: ${counts.supplier}</div>`;

  tbody.innerHTML=rows.map(r=>
    `<tr>
      <td>${r.created_at||''}</td>
      <td>supplier</td>
      <td>${r.company_name||''}</td>
      <td>${r.phone||''}</td>
      <td>${r.telegram||''}</td>
<td>
  <strong>Город:</strong> ${r.city || '-'}<br>
  <strong>Категория:</strong> ${r.category || '-'}<br>
  <strong>Сайт:</strong> ${r.website || '-'}<br>
  <strong>Описание:</strong> ${r.description || '-'}
</td>
    </tr>`
  ).join('');
});
  }
  renderAdmin();
})();