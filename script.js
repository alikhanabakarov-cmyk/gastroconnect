
  const SUPABASE_URL = 'https://fqxbtojjhpkibixvnbnn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0F-CDySnOiJYUdAr8khcJA_QiZc6J2y';
(function(){
  const KEY='gc_submissions';
  const get=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
  const set=(v)=>localStorage.setItem(KEY,JSON.stringify(v));

  document.querySelectorAll('form[data-form-type]').forEach(form=>{
    form.addEventListener('submit', e=>{
      e.preventDefault();

      const data=Object.fromEntries(new FormData(form).entries());
      const formType = form.dataset.formType;

      const entry={
        id:Date.now(),
        created_at:new Date().toLocaleString('ru-RU'),
        type:formType,
        data
      };

const tableName =
  formType === 'restaurant' ? 'restaurants' :
  formType === 'worker' ? 'workers' :
  'suppliers';
const payload = formType === 'restaurant'
  ? {
      business_name: data.business_name || data.company_name || '',
      contact_name: data.contact_name || '',
      phone: data.phone || '',
      telegram: data.telegram || '',
      city: data.city || '',
      format: data.format || '',
      description: data.description || ''
    }
  : formType === 'worker'
  ? {
      name: data.name || '',
      phone: data.phone || '',
      telegram: data.telegram || '',
      city: data.city || '',
      position: data.position || '',
      experience: data.experience || '',
      description: data.description || ''
    }
  : {
      company_name: data.company_name || '',
      contact_name: data.contact_name || '',
      phone: data.phone || '',
      telegram: data.telegram || '',
      city: data.city || '',
      category: data.category || '',
      website: data.website || '',
      description: data.description || ''
    };

      fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const all=get();
      all.unshift(entry);
      set(all);

      const box=form.querySelector('.success');
      if(box){
        box.textContent='Заявка сохранена и отправлена в базу данных.';
        box.style.display='block';
      }

      form.reset();
    });
  });
  function toCsv(rows){
    const esc=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
    return rows.map(r=>[r.created_at,r.type,r.data.name||r.data.business_name||r.data.company_name||'',r.data.phone||'',r.data.telegram||'',JSON.stringify(r.data)].map(esc).join(',')).join('\n');
  }
  function download(name, text, type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
 function renderAdmin(){
  const tbody=document.querySelector('#adminTable tbody');
  if(!tbody) return;

  const rows=[];
const typeLabel = {
  supplier: 'Поставщик',
  restaurant: 'Заведение',
  worker: 'Работник'
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date)) return value;
  return date.toLocaleString('ru-RU');
};
const detailsText = (r) => {
  if (r.type === 'worker') {
    return `
      <strong>Город:</strong> ${r.city || '-'}<br>
      <strong>Должность:</strong> ${r.position || '-'}<br>
      <strong>Опыт:</strong> ${r.experience || '-'}<br>
      <strong>Описание:</strong> ${r.description || '-'}
    `;
  }

  if (r.type === 'restaurant') {
    return `
      <strong>Город:</strong> ${r.city || '-'}<br>
      <strong>Формат:</strong> ${r.format || '-'}<br>
      <strong>Описание:</strong> ${r.description || '-'}
    `;
  }

  return `
    <strong>Город:</strong> ${r.city || '-'}<br>
    <strong>Категория:</strong> ${r.category || '-'}<br>
    <strong>Сайт:</strong> ${r.website || '-'}<br>
    <strong>Описание:</strong> ${r.description || '-'}
  `;
};
  const headers={
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  const loadTable=(table,type)=>{
    return fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {headers})
      .then(res=>res.json())
      .then(data=>Array.isArray(data) ? data.map(r=>({...r,type})) : [])
      .catch(()=>[]);
  };

 Promise.all([
  loadTable('suppliers','supplier'),
  loadTable('restaurants','restaurant'),
  loadTable('workers','worker')
])
.then(([suppliers,restaurants,workers])=>{
  rows.push(...suppliers,...restaurants,...workers);
    const counts={all:rows.length,worker:0,restaurant:0,supplier:0};
    rows.forEach(r=>counts[r.type]=(counts[r.type]||0)+1);

    document.getElementById('adminStats').innerHTML=
      `<div class="stat">Всего: ${counts.all}</div>
       <div class="stat">Работники: ${counts.worker}</div>
       <div class="stat">Заведения: ${counts.restaurant}</div>
       <div class="stat">Поставщики: ${counts.supplier}</div>`;

    tbody.innerHTML=rows.map(r=>`
      <tr>
<td>${formatDate(r.created_at)}</td>
<td>${typeLabel[r.type] || r.type || '-'}</td>
        <td>${r.company_name || r.business_name || r.name || ''}</td>
        <td>${r.phone || ''}</td>
        <td>${r.telegram || ''}</td>
<td>${detailsText(r)}</td>
      </tr>
    `).join('');

    document.getElementById('exportJson').onclick=()=>download(
      'gastroconnect-submissions.json',
      JSON.stringify(rows,null,2),
      'application/json'
    );

    document.getElementById('exportCsv').onclick=()=>download(
      'gastroconnect-submissions.csv',
      'Дата,Тип,Название,Телефон,Telegram,Город,Категория/Формат,Сайт,Описание\n' +
      rows.map(r=>[
        r.created_at || '',
        r.type || '',
r.company_name || r.business_name || r.name || '',
        r.phone || '',
        r.telegram || '',
        r.city || '',
        r.category || r.format || '',
        r.website || '',
        r.description || ''
      ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'),
      'text/csv;charset=utf-8'
    );

    document.getElementById('clearData').onclick=()=>{
      if(confirm('Очистить локальные заявки?')){
        set([]);
        renderAdmin();
      }
    };
  })
  }
  renderAdmin();
})();