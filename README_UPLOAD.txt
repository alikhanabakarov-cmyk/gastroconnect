GastroConnect MVP v1003

Готовая папка для загрузки:

publish-v900

Как загрузить на GitHub Pages:

1. Открой репозиторий alikhanabakarov-cmyk/gastroconnect.
2. Нажми Add file -> Upload files.
3. Открой локальную папку:
   C:\Users\alikh\Documents\Code\gastroconnect\publish-v900
4. Перетащи ВСЁ содержимое publish-v900 в GitHub:
   - html/css/js файлы
   - папку assets
   - CNAME
   - robots.txt, sitemap.xml, site.webmanifest, favicon.ico
   Важно: не загружай саму папку publish-v900 как вложенную папку.
5. Commit message:
   Publish GastroConnect MVP v1003
6. Нажми Commit changes.

Проверка после публикации:

1. Открой https://gastroconnect.ru/index.html?v=1003
2. На странице должны быть слова:
   - Российская платформа гибкой занятости для HoReCa
   - как Coople, Instawork и VentraGo
3. Открой https://gastroconnect.ru/supabase.js?v=1003
4. Там должно быть:
   const SUPABASE_ANON_KEY = 'sb_publishable_0F-CDySnOiJYUdAr8khcJA_QiZc6J2y';

Если supabase.js показывает старый JWT через .join('.'), значит файл не обновился.

Supabase:

Основные таблицы уже отвечают через publishable key:
profiles, worker_profiles, restaurant_profiles, supplier_profiles, shift_posts, shift_applications, shift_invites, supplier_offers, supplier_inquiries.

Для таблиц supply_requests и supplier_responses нужно выполнить SQL из supabase-marketplace.sql в Supabase SQL Editor.

Если проект Supabase пустой или таблицы/политики не совпадают с сайтом, используй полный файл:

supabase-full-schema.sql

Он создаёт основу MVP: профили, анкеты работников, смены, отклики, приглашения, предложения поставщиков, входящие заявки, supply_requests и supplier_responses.


