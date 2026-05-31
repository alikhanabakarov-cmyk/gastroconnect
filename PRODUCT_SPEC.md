# GastroConnect product spec v1003

GastroConnect is a Russian HoReCa marketplace inspired by Coople, VentraGo and Instawork, scoped to three roles only: establishments, workers and suppliers.

## Roles

- Establishment: keeps a venue profile, publishes shifts, views worker profiles, accepts or declines applications, requests supplier offers.
- Worker: keeps a worker profile, views open shifts, applies to shifts, accepts or declines shift invites.
- Supplier: keeps a supplier profile, publishes offers, views establishment requests, accepts or declines incoming inquiries.

## Required working flows

1. Worker registration opens with `auth.html?role=worker`, creates a worker account and shows the worker cabinet.
2. Establishment registration opens with `auth.html?role=restaurant`, creates an establishment account and shows the establishment cabinet.
3. Supplier registration opens with `auth.html?role=supplier`, creates a supplier account and shows the supplier cabinet.
4. Establishment creates a shift in `shift_posts`; workers can see it and apply through `shift_applications`.
5. Establishment loads workers from `worker_profiles` and sends an invite into `shift_invites`.
6. Worker sees shift invites and can set status to `accepted` or `declined`.
7. Supplier creates offers in `supplier_offers`; establishments can send direct inquiries into `supplier_inquiries`.
8. Supplier sees incoming inquiries and can set status to `accepted` or `declined`.
9. Establishment can publish general supply requests into `supply_requests` after the SQL migration is applied.
10. Supplier can respond to a general supply request through `supplier_responses`; establishment can accept or decline that supplier response.

## Release checks

- `index.html` contains `live-board`, `hero-dashboard`, `style.css?v=1003`.
- `supabase.js` contains `sb_publishable_` and does not contain `.join('.')`.
- `cabinet.html` contains `restaurantBusinessName` and `supplierCompanyName`.
- `cabinet.html` contains `loadSupplyResponsesBtn`.
- `cabinet.js` passes syntax check and all `getElementById(...)` ids exist in `cabinet.html`.
- Live `https://gastroconnect.ru/index.html?v=1003` must contain `live-board`.
- Live `https://gastroconnect.ru/supabase.js?v=1003` must contain `sb_publishable_`.


