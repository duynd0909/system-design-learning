# Stackdify — Deployment Plan

> **Source of truth** for infrastructure, CI/CD, server setup, and operational runbook.
> Last updated: 2026-05-08.
> Target: Ubuntu 22.04 LTS dedicated server, domain `stackdify.space`.
> Architecture: Docker Compose + Nginx reverse-proxy + Cloudflare Tunnel.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 0 — Network & DNS](#2-phase-0--network--dns)
3. [Phase 1 — Server Hardening](#3-phase-1--server-hardening)
4. [Phase 2 — Docker & Docker Compose](#4-phase-2--docker--docker-compose)
5. [Phase 3 — Nginx](#5-phase-3--nginx)
6. [Phase 4 — First Deployment](#6-phase-4--first-deployment)
7. [Phase 5 — CI/CD via GitHub Actions](#7-phase-5--cicd-via-github-actions)
8. [Phase 6 — Monitoring & Backups](#8-phase-6--monitoring--backups)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Cheat Sheet — Day-to-Day Commands](#10-cheat-sheet--day-to-day-commands)
11. [Estimated Monthly Cost](#11-estimated-monthly-cost)

---

## 1. Architecture Overview

```
Internet
  │
  ▼
Cloudflare (DNS, DDoS protection, TLS edge)
  │  stackdify.space     → tunneled (Cloudflare Tunnel)
  │  api.stackdify.space → tunneled (Cloudflare Tunnel)
  │  status.stackdify.space → tunneled (Uptime Kuma)
  │
  ▼  (outbound encrypted tunnel — no port forwarding needed)
cloudflared daemon (on Ubuntu server)
  │
  ▼ port 80 (HTTP only — Cloudflare handles TLS)
Nginx reverse proxy
  ├── stackdify.space     → web container :3000
  └── api.stackdify.space → api container :3001

Docker Compose (internal network)
  ├── web   (Next.js)    127.0.0.1:3000
  ├── api   (NestJS)     127.0.0.1:3001
  ├── db    (Postgres)   internal only
  └── redis              internal only
```

### Key Security Decisions

| Decision | Reason |
|----------|--------|
| Cloudflare Tunnel (outbound only) | No port forwarding required; hides server IP; absorbs DDoS; free |
| PostgreSQL / Redis NOT bound to host | Docker internal network; no external access |
| SSH key-only, password disabled | Brute-force protection |
| fail2ban | Blocks repeated SSH failures |
| UFW default-deny inbound | Minimal attack surface |
| Nginx HTTP-only internally | Cloudflare Tunnel terminates TLS at edge; adding SSL to Nginx would break the tunnel |
| `X-Forwarded-Proto: https` header | Tells NestJS/Next.js the original request was HTTPS for correct redirect generation |

---

## 2. Phase 0 — Network & DNS

### 2.1 Cloudflare Tunnel Setup (current — preferred)

Cloudflare Tunnel punches outbound from the server — no router port forwarding required.

```bash
# On the Ubuntu server
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

cloudflared tunnel login          # opens browser, authorise stackdify.space
cloudflared tunnel create stackdify

# Map hostnames → local services
cloudflared tunnel route dns stackdify  stackdify.space
cloudflared tunnel route dns stackdify  api.stackdify.space
cloudflared tunnel route dns stackdify  status.stackdify.space

# Create config (service install will copy to /etc/cloudflared/)
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <tunnel-id>
credentials-file: /home/<user>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: status.stackdify.space
    service: http://localhost:3003
  - hostname: stackdify.space
    service: http://localhost:80
  - hostname: api.stackdify.space
    service: http://localhost:80
  - service: http_status:404
EOF

# Install as system service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

> **Config file note:** After `sudo cloudflared service install`, always edit `/etc/cloudflared/config.yml` (not `~/.cloudflared/config.yml`) — the systemd service reads from `/etc/cloudflared/`.
> After any config change: `sudo systemctl restart cloudflared`

### 2.2 Alternative: Port Forwarding + Certbot

If Cloudflare Tunnel is unavailable (CGNAT resolved, static IP):

1. Router: forward 80/443/2222 → server LAN IP
2. Set static DHCP lease by MAC address
3. Dynamic DNS: `ddclient` with Cloudflare API token (if dynamic IP)
4. Use Certbot/Let's Encrypt for SSL (see §5.4 in `04_deployment_plan_ubuntu.md`)

---

## 3. Phase 1 — Server Hardening

```bash
# Initial setup (as root)
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban unattended-upgrades apt-listchanges
timedatectl set-timezone Asia/Ho_Chi_Minh
dpkg-reconfigure --priority=low unattended-upgrades

# Create deploy user
adduser deploy
usermod -aG sudo deploy
# (add to docker group after Docker install)
```

### SSH Hardening

Generate key pair on local machine:
```bash
ssh-keygen -t ed25519 -C "stackdify-deploy" -f ~/.ssh/stackdify_deploy
ssh-copy-id -i ~/.ssh/stackdify_deploy.pub -p 22 deploy@<server-lan-ip>
```

Edit `/etc/ssh/sshd_config` on server:
```conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
```
```bash
systemctl restart sshd
```

### UFW Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
# 80/443 not required with Cloudflare Tunnel
ufw enable
ufw status verbose
```

### fail2ban

```bash
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true
port    = 22
EOF

systemctl enable fail2ban
systemctl restart fail2ban
```

---

## 4. Phase 2 — Docker & Docker Compose

### Install Docker Engine

```bash
apt remove -y docker docker-engine docker.io containerd runc || true
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
systemctl enable docker
systemctl start docker
```

Verify: `docker run --rm hello-world`

### Production `docker-compose.prod.yml`

Place at `/srv/stackdify/docker-compose.prod.yml`:

```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: stackdify
      POSTGRES_USER: stackdify
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --save 60 1 --loglevel warning
    volumes:
      - redis_data:/data
    networks:
      - internal

  api:
    image: ghcr.io/${GITHUB_REPO}/stackdify-api:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: /srv/stackdify/.env.api
    depends_on:
      - db
      - redis
    networks:
      - internal
    ports:
      - "127.0.0.1:3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  web:
    image: ghcr.io/${GITHUB_REPO}/stackdify-web:${IMAGE_TAG:-latest}
    restart: unless-stopped
    env_file: /srv/stackdify/.env.web
    depends_on:
      - api
    networks:
      - internal
    ports:
      - "127.0.0.1:3000:3000"

volumes:
  postgres_data:
  redis_data:

networks:
  internal:
    driver: bridge
```

### Environment Files

Create in `/srv/stackdify/`:

**.env.api:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://stackdify:${POSTGRES_PASSWORD}@db:5432/stackdify
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
DATABASE_POOL_MAX=10
JWT_SECRET=<openssl rand -base64 48>
JWT_EXPIRES_IN=7d
GITHUB_CLIENT_ID=<prod-value>
GITHUB_CLIENT_SECRET=<prod-value>
GOOGLE_CLIENT_ID=<prod-value>
GOOGLE_CLIENT_SECRET=<prod-value>
API_PUBLIC_URL=https://api.stackdify.space
CORS_ORIGIN=https://stackdify.space
ADMIN_EMAILS=duynd0909@gmail.com
SENTRY_DSN=<optional>
SENTRY_TRACES_SAMPLE_RATE=0.05
```

**.env.web:**
```bash
NODE_ENV=production
NEXTAUTH_URL=https://stackdify.space
NEXTAUTH_SECRET=<openssl rand -base64 48>
NEXT_PUBLIC_API_URL=https://api.stackdify.space/api/v1
GITHUB_CLIENT_ID=<prod-value>
GITHUB_CLIENT_SECRET=<prod-value>
GOOGLE_CLIENT_ID=<prod-value>
GOOGLE_CLIENT_SECRET=<prod-value>
```

**.env** (docker-compose substitution variables):
```bash
POSTGRES_PASSWORD=<strong-random-password>
REDIS_PASSWORD=<strong-random-password>
GITHUB_REPO=<your-github-org-or-username>/stackdify
IMAGE_TAG=latest
```

```bash
chmod 600 /srv/stackdify/.env*
```

---

## 5. Phase 3 — Nginx

### Install

```bash
apt install -y nginx
```

### Config (Cloudflare Tunnel — HTTP only)

`/etc/nginx/sites-available/stackdify`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=web_limit:10m rate=60r/s;

server {
    listen 80;
    server_name stackdify.space www.stackdify.space;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    limit_req zone=web_limit burst=80 nodelay;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade          $http_upgrade;
        proxy_set_header   Connection       "upgrade";
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

server {
    listen 80;
    server_name api.stackdify.space;

    limit_req zone=api_limit burst=50 nodelay;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
        client_max_body_size 5m;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/stackdify /etc/nginx/sites-enabled/stackdify
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## 6. Phase 4 — First Deployment

### Dockerfiles

**`apps/api/Dockerfile`** (multi-stage):
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY packages/shared-types/package*.json packages/shared-types/
COPY packages/game-engine/package*.json packages/game-engine/
RUN npm ci --workspace=@stackdify/api \
           --workspace=@stackdify/shared-types \
           --workspace=@stackdify/game-engine

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=@stackdify/shared-types
RUN npm run build --workspace=@stackdify/game-engine
RUN npm run build --workspace=@stackdify/api

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/apps/api/dist ./dist
COPY --from=build --chown=app:app /app/apps/api/package*.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/apps/api/prisma ./prisma
USER app
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**`apps/web/Dockerfile`** (multi-stage, Next.js standalone):
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/web/package*.json apps/web/
COPY packages/shared-types/package*.json packages/shared-types/
RUN npm ci --workspace=@stackdify/web --workspace=@stackdify/shared-types

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace=@stackdify/shared-types
RUN npm run build --workspace=@stackdify/web

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /app/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "apps/web/server.js"]
```

> Requires `output: 'standalone'` in `apps/web/next.config.js`.

### First Deploy on Server

```bash
ssh -i ~/.ssh/stackdify_deploy -p 22 deploy@stackdify.space

mkdir -p /srv/stackdify
cd /srv/stackdify

# Pull images (built by CI) and start DB/Redis first
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d db redis
sleep 5

# Run migrations + seed
docker compose -f docker-compose.prod.yml run --rm api \
  sh -c "npx prisma migrate deploy && npx prisma db seed"

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Verify
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3001/api/v1/health
```

---

## 7. Phase 5 — CI/CD via GitHub Actions

### Deploy Trigger

The workflow triggers on **version tag push** (`v*`), not on `main` branch push.

```bash
git tag v1.2.3
git push origin v1.2.3
```

### GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | `stackdify.space` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/stackdify_deploy` (private key) |
| `DEPLOY_PATH` | `/srv/stackdify` |
| `GHCR_TOKEN` | GitHub PAT with `write:packages` scope |
| `NEXT_PUBLIC_API_URL` | `https://api.stackdify.space/api/v1` |

### Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Build & Deploy

on:
  push:
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma generate --schema=apps/api/prisma/schema.prisma
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ${{ env.IMAGE_PREFIX }}/stackdify-api
            ${{ env.IMAGE_PREFIX }}/stackdify-web
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build & push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: |
            ${{ env.IMAGE_PREFIX }}/stackdify-api:latest
            ${{ env.IMAGE_PREFIX }}/stackdify-api:sha-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & push Web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/web/Dockerfile
          push: true
          tags: |
            ${{ env.IMAGE_PREFIX }}/stackdify-web:latest
            ${{ env.IMAGE_PREFIX }}/stackdify-web:sha-${{ github.sha }}
          build-args: NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          port: ${{ secrets.DEPLOY_PORT }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml run --rm api \
              sh -c "npx prisma migrate deploy"
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            sleep 10
            curl -f http://localhost:3001/api/v1/health || exit 1
            docker image prune -f
```

### CI Workflow (`.github/workflows/ci.yml`)

Triggers on all PRs and pushes to `main`. Runs typecheck + lint only (no deploy).

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
```

---

## 8. Phase 6 — Monitoring & Backups

### Uptime Kuma (endpoint monitoring)

Run as separate compose project in `/home/deploy/monitoring/`:

```yaml
# docker-compose.monitoring.yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    volumes:
      - uptime_kuma_data:/app/data
    ports:
      - '127.0.0.1:3003:3001'

volumes:
  uptime_kuma_data:
```

Exposed via Cloudflare Tunnel at `status.stackdify.space` (add ingress rule in `/etc/cloudflared/config.yml`).

**Monitors to configure in Uptime Kuma UI:**

| Name | Type | Target | Interval |
|------|------|--------|----------|
| API Health | HTTP(s) | `http://localhost:3001/api/v1/health` | 60s |
| Web App | HTTP(s) | `https://stackdify.space` | 60s |
| API Public | HTTP(s) | `https://api.stackdify.space/api/v1/health` | 60s |
| Postgres | TCP Port | `localhost:5432` | 120s |
| Redis | TCP Port | `localhost:6379` | 120s |

### Netdata (system metrics)

```bash
curl https://get.netdata.cloud/kickstart.sh > /tmp/netdata-kickstart.sh
sh /tmp/netdata-kickstart.sh --stable-channel --dont-wait
```

Access via SSH tunnel (not exposed publicly):
```bash
ssh -L 19999:localhost:19999 -p 22 deploy@stackdify.space
# Open http://localhost:19999
```

### PostgreSQL Backups

```bash
cat > /usr/local/bin/stackdify-backup.sh <<'EOF'
#!/bin/bash
set -euo pipefail
BACKUP_DIR=/srv/stackdify/backups
DATE=$(date +%Y-%m-%d_%H-%M)
KEEP_DAYS=14
mkdir -p "$BACKUP_DIR"
docker exec stackdify-db-1 pg_dump -U stackdify stackdify \
  | gzip > "$BACKUP_DIR/stackdify_$DATE.sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "Backup completed: stackdify_$DATE.sql.gz"
EOF
chmod +x /usr/local/bin/stackdify-backup.sh

# Daily at 03:00
echo "0 3 * * * deploy /usr/local/bin/stackdify-backup.sh >> /var/log/stackdify-backup.log 2>&1" | crontab -
```

### Cron Health Check (fallback)

```bash
cat > /usr/local/bin/stackdify-healthcheck.sh <<'EOF'
#!/bin/bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/health)
if [ "$STATUS" != "200" ]; then
  echo "Stackdify API DOWN (HTTP $STATUS) at $(date)" | \
    mail -s "ALERT: Stackdify API Down" duynd0909@gmail.com
fi
EOF
chmod +x /usr/local/bin/stackdify-healthcheck.sh
echo "*/5 * * * * deploy /usr/local/bin/stackdify-healthcheck.sh" | crontab -
```

### Docker Log Rotation

`/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
```
```bash
systemctl reload docker
```

---

## 9. Environment Variables Reference

### Local Development

**`apps/api/.env.local`:**
```bash
DATABASE_URL="postgresql://stackdify:stackdify@localhost:5432/stackdify_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-min-32-chars-change-in-prod"
JWT_EXPIRES_IN="7d"
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
CORS_ORIGIN="http://localhost:3000"
ADMIN_EMAILS="duynd0909@gmail.com"
NODE_ENV="development"
PORT=3001
```

**`apps/web/.env.local`:**
```bash
NEXTAUTH_SECRET="dev-nextauth-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

### Production (`/srv/stackdify/.env.api`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql://stackdify:<pw>@db:5432/stackdify` |
| `REDIS_URL` | `redis://:<pw>@redis:6379` |
| `DATABASE_POOL_MAX` | `10` |
| `JWT_SECRET` | Min 48 chars; `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | `7d` |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth App credentials |
| `GOOGLE_CLIENT_ID/SECRET` | Google Cloud Console credentials |
| `API_PUBLIC_URL` | `https://api.stackdify.space` |
| `CORS_ORIGIN` | `https://stackdify.space` |
| `ADMIN_EMAILS` | Comma-separated emails auto-assigned ADMIN role |
| `SENTRY_DSN` | Optional; Sentry project DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.05` (5%) |

### OAuth Callback URLs to Register

| Provider | URL |
|----------|-----|
| GitHub — callback | `https://api.stackdify.space/api/v1/auth/github/callback` |
| Google — redirect URI | `https://api.stackdify.space/api/v1/auth/google/callback` |

---

## 10. Cheat Sheet — Day-to-Day Commands

```bash
# SSH into server
ssh -i ~/.ssh/stackdify_deploy -p 22 deploy@stackdify.space

# View live logs (all services)
cd /srv/stackdify
docker compose -f docker-compose.prod.yml logs -f

# View API logs only
docker compose -f docker-compose.prod.yml logs -f api

# Restart a single service without downtime
docker compose -f docker-compose.prod.yml up -d --no-deps api

# Force redeploy (pull latest + restart)
docker compose -f docker-compose.prod.yml pull api
docker compose -f docker-compose.prod.yml up -d --no-deps api

# Trigger a deploy manually (tag and push)
git tag v1.2.3 && git push origin v1.2.3

# Run a one-off migration
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Open Prisma Studio via SSH tunnel
# On server:
docker compose -f docker-compose.prod.yml run --rm -p 5555:5555 api \
  npx prisma studio --hostname 0.0.0.0
# On local: ssh -L 5555:localhost:5555 -p 22 deploy@stackdify.space
# Then open http://localhost:5555

# Manual backup
/usr/local/bin/stackdify-backup.sh

# Restore from backup
gunzip -c /srv/stackdify/backups/stackdify_2026-05-07_03-00.sql.gz | \
  docker exec -i stackdify-db-1 psql -U stackdify stackdify

# Check firewall
sudo ufw status verbose

# Check fail2ban
sudo fail2ban-client status sshd

# Monitor disk / memory
df -h && free -h

# Update OS packages
sudo apt update && sudo apt upgrade -y

# Restart Cloudflare Tunnel after config change
sudo systemctl restart cloudflared
sudo systemctl status cloudflared

# Netdata dashboard (SSH tunnel)
ssh -L 19999:localhost:19999 -p 22 deploy@stackdify.space
# Open http://localhost:19999
```

---

## 11. Estimated Monthly Cost

| Item | Cost |
|------|------|
| Electricity (PC ~60W × 24/7) | ~$5–8 USD |
| Cloudflare Free tier | $0 |
| Domain `stackdify.space` | ~$1–2 USD/month amortized |
| **Total** | **~$7–10 USD/month** |

Compared to: Railway $20–30/month, AWS ECS $50–72/month.

### Scale Trigger to AWS

If any of the following occur, migrate to AWS ECS (Singapore `ap-southeast-1`):
- 5,000+ MAU
- Server CPU/RAM consistently >70% under load
- Need multi-region or VPC isolation
- Infrastructure cost of dedicated PC approaches cloud parity
