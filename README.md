# Градусы24 TapLink CMS

Production-ready monorepo для TapLink CMS сети маркет-баров `Градусы24`: публичная TapLink-страница, админка, отслеживаемые ссылки, QR-коды, статистика и оформление.

## Структура

- `apps/frontend` — React, Vite, TypeScript, TailwindCSS, shadcn-style UI, Framer Motion, React Router, TanStack Query, React Hook Form, Zod.
- `apps/backend` — Node.js, Fastify, Prisma, PostgreSQL, JWT в httpOnly cookies, bcrypt, refresh-сессии.
- `packages/shared` — общие Zod-схемы и TypeScript-типы.
- `assets` — исходные логотипы. Копии для Vite лежат в `apps/frontend/public/assets`.

## Быстрый старт

```bash
npm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend: `http://localhost:5173`
Backend healthcheck: `http://localhost:4000/health`

Seed создает администратора:

- email: `admin@gradusy24.kz`
- password: `ChangeMe24!`

Перед production-запуском поменяйте `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `ADMIN_PASSWORD` и `DATABASE_URL`.

## API

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/public/settings`
- `GET /api/public/links`
- `GET /api/clicks/:slug`
- `GET /api/dashboard`
- `GET /api/links`
- `POST /api/links`
- `PATCH /api/links/:id`
- `DELETE /api/links/:id`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/users`

Все публичные карточки ведут через `GET /api/clicks/:slug`, где backend записывает событие и делает redirect на целевой URL.
