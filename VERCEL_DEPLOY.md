# Hướng dẫn Deploy lên Vercel

## Bước 1: Push code lên GitHub

```bash
# Tạo repo trên GitHub, rồi:
git remote add origin https://github.com/YOUR_USERNAME/investment-app.git
git push -u origin main
```

## Bước 2: Tạo Vercel Project

1. Vào https://vercel.com và đăng nhập
2. Bấm "Add New" → "Project"
3. Chọn repo GitHub vừa push
4. Framework Preset: **Next.js**

## Bước 3: Tạo Vercel Postgres Database

1. Trong Vercel Dashboard, vào tab **Storage**
2. Bấm "Create Database" → Chọn **Postgres (Neon)**
3. Chọn region gần nhất (Singapore)
4. Bấm "Create"
5. Vercel sẽ tự động thêm `DATABASE_URL` vào Environment Variables

## Bước 4: Cấu hình Environment Variables

Trong Vercel Dashboard → Settings → Environment Variables, đảm bảo có:

- `DATABASE_URL` = (tự động thêm từ Vercel Postgres)

## Bước 5: Chạy Migration

Sau khi deploy xong, chạy migration trên Vercel:

```bash
# Cách 1: Qua Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Cách 2: Qua Vercel Dashboard
# Vào Storage → Postgres → Query tab
# Copy nội dung từ prisma/migrations/0001_init/migration.sql và chạy
```

## Bước 6: Seed Data

```bash
npx prisma db seed
```

## Lưu ý quan trọng

- **SQLite KHÔNG hoạt động trên Vercel** - đã migrate sang PostgreSQL
- Schema đã chuyển từ `provider = "sqlite"` sang `provider = "postgresql"`
- Build script đã bao gồm `prisma generate`
- `postinstall` hook tự động chạy `prisma generate` trên Vercel
