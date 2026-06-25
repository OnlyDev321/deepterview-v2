#!/bin/bash

# =====================================================
# Script khởi tạo SSL Certificate (chạy 1 lần đầu)
# Sử dụng: chmod +x init-letsencrypt.sh && ./init-letsencrypt.sh
# =====================================================

DOMAIN="deepterview.duckdns.org"
EMAIL="onlydev.321@gmail.com"   # ← ĐỔI THÀNH EMAIL CỦA BẠN

set -e

echo "╔══════════════════════════════════════════════╗"
echo "║   Khởi tạo SSL cho $DOMAIN   ║"
echo "╚══════════════════════════════════════════════╝"

# ─────────────────────────────────────────────
# 1. Tạo thư mục cần thiết
# ─────────────────────────────────────────────
echo ""
echo "📁 Tạo thư mục certbot..."
mkdir -p /etc/letsencrypt
mkdir -p /var/www/certbot

# ─────────────────────────────────────────────
# 2. Tải SSL parameters (nếu chưa có)
# ─────────────────────────────────────────────
echo ""
echo "⬇️  Tải SSL parameters..."

if [ ! -f "/etc/letsencrypt/options-ssl-nginx.conf" ]; then
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
        -o /etc/letsencrypt/options-ssl-nginx.conf
    echo "   ✅ options-ssl-nginx.conf"
else
    echo "   ⏭️  options-ssl-nginx.conf đã tồn tại"
fi

if [ ! -f "/etc/letsencrypt/ssl-dhparams.pem" ]; then
    echo "   🔐 Tạo DH parameters (mất ~30 giây)..."
    openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048 2>/dev/null
    echo "   ✅ ssl-dhparams.pem"
else
    echo "   ⏭️  ssl-dhparams.pem đã tồn tại"
fi

# ─────────────────────────────────────────────
# 3. Lấy certificate bằng certbot standalone
#    (dừng nginx trước nếu đang chạy)
# ─────────────────────────────────────────────
echo ""
echo "🔒 Lấy SSL Certificate từ Let's Encrypt..."

# Đảm bảo port 80 trống
docker compose down 2>/dev/null || true

# Kiểm tra cert đã tồn tại chưa
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "   ⏭️  Certificate đã tồn tại cho $DOMAIN"
    echo "   💡 Nếu muốn renew, chạy: docker compose run --rm certbot renew"
else
    docker run --rm \
        --user root \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/www/certbot:/var/www/certbot \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email

    echo "   ✅ Certificate đã được tạo thành công!"
fi

# ─────────────────────────────────────────────
# 4. Khởi động toàn bộ services
# ─────────────────────────────────────────────
echo ""
echo "🚀 Khởi động Docker Compose..."
docker compose up -d --build

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Hoàn thành!                             ║"
echo "║   🌐 https://$DOMAIN        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "📋 Kiểm tra logs: docker compose logs -f nginx"
