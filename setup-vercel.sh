#!/bin/bash
# Script chạy sau khi deploy Vercel thành công
# Cách dùng:
#   1. Vào Vercel Dashboard → Storage → Create Database → Postgres (Neon)
#   2. Chạy: vercel env pull .env.local
#   3. Chạy script này: bash setup-vercel.sh

set -e

echo "🔍 Kiểm tra DATABASE_URL..."
if [ ! -f .env.local ]; then
  echo "❌ Chưa có file .env.local!"
  echo "   Chạy: vercel env pull .env.local"
  exit 1
fi

source .env.local 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL không tìm thấy!"
  echo "   Vào Vercel Dashboard → Storage → Tạo Postgres Database trước"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""
echo "📦 Chạy Prisma migration..."
npx prisma migrate deploy

echo ""
echo "🌱 Seed dữ liệu mẫu..."
npx prisma db seed

echo ""
echo "✅ Hoàn thành! App đã sẵn sàng sử dụng"
