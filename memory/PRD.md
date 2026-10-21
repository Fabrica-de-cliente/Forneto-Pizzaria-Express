# PRD — Forneto Pizzaria Express — Cardápio Digital

## Problem statement (original)
Create a digital menu for a pizzeria, with drinks organized by category, including photos and prices.
The checkout process should take place via WhatsApp, and the digital menu accessible to the customer should feature the company's branding/dashboard.

## Discovery answers (user)
- Goal: menu browsing + order building + WhatsApp checkout
- Business: Forneto Pizzaria Express, Goiânia-GO (real data pulled from their live menu on saipos.com)
- Menu: real categories/items/prices from their store
- Dashboard: staff login to add/edit menu items and prices
- Language: pt-BR
- Design: user picked "Night Oven Setpiece" (dark nocturne, charcoal + flame orange) from generated directions

## Architecture
- FastAPI + MongoDB (motor), React + Tailwind + shadcn/ui
- Public: GET /api/menu, GET /api/settings
- Auth: JWT Bearer (12h), bcrypt, admin seeded idempotently from env (ADMIN_EMAIL/ADMIN_PASSWORD)
- Admin: CRUD /api/admin/categories, /api/admin/items, PUT /api/admin/settings
- Checkout: wa.me deep link with formatted order message (no API needed)
- WhatsApp number: 556296132571 (from public registry — PENDING owner confirmation; editable in admin settings)

## User personas
- Customer: mobile user in Goiânia ordering pizza for delivery/pickup in the evening
- Staff/admin: manages menu items, prices, categories, store settings

## Implemented (2026-10-21)
- Digital menu page (dark nocturne design, hero, marquee, category sections, drink sections, location CTA, footer)
- Cart drawer with quantities, name, entrega/retirada, notes, total; WhatsApp checkout message
- Admin login (admin@forneto.com / forneto123 — test credentials) + dashboard: items CRUD, categories CRUD, settings (WhatsApp number, address, slogan)
- Seed: 8 categories, 16 real items with real prices and photos (saipos CDN + Pexels)

## Backlog
- P0: confirm real WhatsApp number with owner
- P1: opening-hours toggle ("aberto/fechado") on menu
- P1: real customer testimonials replacing placeholder
- P2: image upload (object storage) instead of URL paste
- P2: pizza flavor picker (sabores list) for salgadas/doces items
- P2: order history/stats in dashboard
