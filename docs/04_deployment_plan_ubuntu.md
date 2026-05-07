# Stackdify — Ubuntu Dedicated Server Deployment Plan

> Replaces the Railway deployment plan.  
> Target: Ubuntu 22.04 LTS (dedicated PC/server), domain `stackdify.space`.  
> Architecture: Docker Compose + Nginx reverse-proxy + Let's Encrypt SSL + Cloudflare proxy.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 0 — Network & DNS (expose home PC to internet)](#2-phase-0--network--dns)
3. [Phase 1 — Server Hardening](#3-phase-1--server-hardening)
4. [Phase 2 — Docker & Docker Compose](#4-phase-2--docker--docker-compose)
5. [Phase 3 — Nginx + SSL](#5-phase-3--nginx--ssl)
6. [Phase 4 — First Deployment](#6-phase-4--first-deployment)
7. [Phase 5 — CI/CD via GitHub Actions](#7-phase-5--cicd-via-github-actions)
8. [Phase 6 — Monitoring & Backups](#8-phase-6--monitoring--backups)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Cheat Sheet — Day-to-Day Commands](#10-cheat-sheet--day-to-day-commands)

---

## 1. Architecture Overview

```
Internet
  │
  ▼
Cloudflare (DNS, DDoS protection, TLS edge)
  │  stackdify.space  →  your public IP  (A record, proxied)
  │  api.stackdify.space  →  your public IP  (A record, proxied)
  │
  ▼ ports 80 / 443
Router (home/ISP)
  │  Port-forward 80 → server-LAN-IP:80
  │  Port-forward 443 → server-LAN-IP:443
  │  Port-forward 22 → server-LAN-IP:22   (or non-standard SSH port)
  │
  ▼
Ubuntu Server (PC)
  ├── UFW firewall  (allow only 22, 80, 443)
  ├── Nginx  (reverse proxy + SSL termination)
  │     ├── stackdify.space  →  web container :3000
  │     └── api.stackdify.space  →  api container :3001
  └── Docker Compose (internal network, not exposed to host)
        ├── web   (Next.js)   :3000
        ├── api   (NestJS)    :3001
        ├── db    (Postgres)  :5432  ← internal only
        └── redis             :6379  ← internal only
```

### Key security decisions

| Decision | Reason |
|---|---|
| Cloudflare proxy enabled (orange cloud) | Hides server IP, absorbs DDoS, free CDN |
| PostgreSQL / Redis NOT bound to host | Docker internal network; no external access |
| SSH key-only, password disabled | Brute-force protection |
| fail2ban | Blocks repeated SSH failures |
| Nginx terminates SSL | Certbot auto-renews; NestJS/Next stay on plain HTTP internally |
| UFW default-deny inbound | Minimal attack surface |

---

## 2. Phase 0 — Network & DNS

### 2.1 Check your public IP type

```bash
# Run on the Ubuntu server
curl -s ifconfig.me
```

Log into your router admin page and check whether the WAN IP matches.  
If it changes on each reboot → you have a **dynamic public IP** → follow §2.3 (ddclient).  
If it never changes → you have a **static public IP** → skip §2.3.

> **Behind CGNAT?** Some ISPs give you a private WAN IP (100.64.x.x or 10.x.x.x).  
> If so, port forwarding won't work. Use **Cloudflare Tunnel** instead — see §2.4.

### 2.2 Router port forwarding

Log into your router admin UI (usually `192.168.1.1` or `192.168.0.1`) and add three rules:

| External port | Internal IP | Internal port | Protocol |
|---|---|---|---|
| 80 | `<server-LAN-ip>` | 80 | TCP |
| 443 | `<server-LAN-ip>` | 443 | TCP |
| 2222 | `<server-LAN-ip>` | 22 | TCP |

> Use port 2222 externally for SSH (non-standard reduces noise in logs).  
> Find server LAN IP: `ip addr show` → look for `192.168.x.x`.

Set a **static LAN IP** for the server in your router's DHCP settings (lease by MAC address), so the LAN IP never changes.

### 2.3 Dynamic DNS with ddclient (skip if static IP)

```bash
sudo apt install ddclient -y
```

Edit `/etc/ddclient.conf` for Cloudflare:

```conf
daemon=300
syslog=yes
mail=root
mail-failure=root
pid=/var/run/ddclient.pid
ssl=yes

use=web, web=checkip.dyndns.com/, web-skip='IP Address'

##
## Cloudflare (stackdify.space)
##
protocol=cloudflare
zone=stackdify.space
ttl=1
login=token
password=<your-cloudflare-api-token>   # Zone:DNS Edit permission
server=api.cloudflare.com/client/v4
stackdify.space,api.stackdify.space
```

```bash
sudo systemctl enable ddclient
sudo systemctl start ddclient
```

### 2.4 Cloudflare Tunnel (alternative — use if behind CGNAT or for extra security)

Cloudflare Tunnel punches outbound from the server — no port forwarding needed at all.

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

# Create config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <tunnel-id>
credentials-file: /home/<user>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: stackdify.space
    service: http://localhost:80
  - hostname: api.stackdify.space
    service: http://localhost:3001
  - service: http_status:404
EOF

# Run as system service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

If using Cloudflare Tunnel you can skip Certbot (Cloudflare handles TLS at the edge) and skip opening ports 80/443 in the router.

### 2.5 Cloudflare DNS records (manual, if NOT using Tunnel)

In Cloudflare dashboard → stackdify.space → DNS:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` (stackdify.space) | `<your-public-ip>` | ✅ Proxied |
| A | `api` | `<your-public-ip>` | ✅ Proxied |
| AAAA | (optional IPv6) | `<your-ipv6>` | ✅ Proxied |

In Cloudflare → SSL/TLS → set mode to **Full (strict)**.

---

## 3. Phase 1 — Server Hardening

Run all commands as root or with `sudo`.

### 3.1 Initial Ubuntu setup

```bash
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban unattended-upgrades apt-listchanges

# Set timezone
timedatectl set-timezone Asia/Ho_Chi_Minh

# Enable automatic security updates
dpkg-reconfigure --priority=low unattended-upgrades
```

### 3.2 Create deploy user (never run app as root)

```bash
adduser deploy                          # set a strong password
usermod -aG sudo deploy
usermod -aG docker deploy               # added after Docker install
```

### 3.3 SSH hardening

On your **local machine** generate a key pair if you don't have one:

```bash
ssh-keygen -t ed25519 -C "stackdify-deploy" -f ~/.ssh/stackdify_deploy
```

Copy public key to server:

```bash
ssh-copy-id -i ~/.ssh/stackdify_deploy.pub -p 22 deploy@<server-lan-ip>
```

On the **server** edit `/etc/ssh/sshd_config`:

```conf
Port 22                        # keep default internally; router maps 2222 → 22 externally
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30
```

```bash
systemctl restart sshd
```

Test from local: `ssh -i ~/.ssh/stackdify_deploy -p 2222 deploy@<public-ip>` before closing existing session.

### 3.4 UFW firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp        # SSH (internal, router maps 2222 → 22)
ufw allow 80/tcp        # HTTP  (Nginx + Certbot challenge)
ufw allow 443/tcp       # HTTPS
ufw enable
ufw status verbose
```

> If using Cloudflare Tunnel only, skip opening 80/443 — not needed.

### 3.5 fail2ban

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
fail2ban-client status sshd
```

---

## 4. Phase 2 — Docker & Docker Compose

### 4.1 Install Docker Engine

```bash
# Remove old packages
apt remove -y docker docker-engine docker.io containerd runc || true

# Install via official script
curl -fsSL https://get.docker.com | sh

# Add deploy user to docker group
usermod -aG docker deploy

# Enable Docker daemon on boot
systemctl enable docker
systemctl start docker
```

Verify: `docker run --rm hello-world`

### 4.2 Production docker-compose.yml

Place this at `/srv/stackdify/docker-compose.prod.yml`:

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
    # NOT exposed to host — only accessible inside Docker network

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
      - "127.0.0.1:3001:3001"    # bind to loopback only — Nginx proxies it
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
      - "127.0.0.1:3000:3000"    # bind to loopback only — Nginx proxies it

volumes:
  postgres_data:
  redis_data:

networks:
  internal:
    driver: bridge
```

### 4.3 Create environment files on the server

```bash
mkdir -p /srv/stackdify
chmod 750 /srv/stackdify
chown deploy:deploy /srv/stackdify
```

`/srv/stackdify/.env.api`:
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

`/srv/stackdify/.env.web`:
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

`/srv/stackdify/.env` (used by docker-compose for volume vars):
```bash
POSTGRES_PASSWORD=<strong-random-password>
REDIS_PASSWORD=<strong-random-password>
GITHUB_REPO=<your-github-org-or-username>/stackdify
IMAGE_TAG=latest
```

```bash
chmod 600 /srv/stackdify/.env*   # readable only by owner
```

---

## 5. Phase 3 — Nginx + SSL

### 5.1 Install Nginx and Certbot

```bash
apt install -y nginx
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot
```

### 5.2 Initial Nginx config (HTTP only, for Certbot challenge)

`/etc/nginx/sites-available/stackdify`:

```nginx
server {
    listen 80;
    server_name stackdify.space www.stackdify.space api.stackdify.space;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/stackdify /etc/nginx/sites-enabled/stackdify
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 5.3 Obtain SSL certificates

```bash
certbot certonly --webroot \
  -w /var/www/certbot \
  -d stackdify.space \
  -d www.stackdify.space \
  -d api.stackdify.space \
  --email duynd0909@gmail.com \
  --agree-tos \
  --non-interactive
```

> If using Cloudflare Tunnel, skip Certbot entirely — Cloudflare provides the TLS cert.

### 5.4 Full Nginx config with HTTPS

Replace `/etc/nginx/sites-available/stackdify`:

```nginx
# ─── Security headers snippet ────────────────────────────────────────────────
map $sent_http_content_type $csp_header {
    default "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stackdify.space; frame-ancestors 'none';";
}

# ─── Rate limiting zones ──────────────────────────────────────────────────────
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=web_limit:10m rate=60r/s;

# ─── Redirect HTTP → HTTPS ────────────────────────────────────────────────────
server {
    listen 80;
    server_name stackdify.space www.stackdify.space api.stackdify.space;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# ─── Frontend — stackdify.space ───────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name stackdify.space www.stackdify.space;

    ssl_certificate     /etc/letsencrypt/live/stackdify.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stackdify.space/privkey.pem;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options           "DENY"              always;
    add_header X-Content-Type-Options    "nosniff"           always;
    add_header Referrer-Policy           "strict-origin"     always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Content-Security-Policy   $csp_header         always;
    add_header Permissions-Policy        "camera=(), microphone=(), geolocation=()" always;

    # Gzip
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

    # Cache Next.js static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# ─── Backend API — api.stackdify.space ────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name api.stackdify.space;

    ssl_certificate     /etc/letsencrypt/live/stackdify.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stackdify.space/privkey.pem;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    add_header X-Frame-Options           "DENY"          always;
    add_header X-Content-Type-Options    "nosniff"       always;
    add_header Referrer-Policy           "strict-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    # Stricter rate limit for API
    limit_req zone=api_limit burst=50 nodelay;

    # Block direct access to sensitive paths
    location ~ ^/api/v1/admin {
        # Optional: restrict to specific IPs
        # allow 1.2.3.4;
        # deny all;
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host             $host;
        proxy_set_header X-Real-IP        $remote_addr;
        proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;

        # Limit upload body size (prevent large payload attacks)
        client_max_body_size 5m;
    }
}
```

```bash
nginx -t && systemctl reload nginx
```

### 5.5 Auto-renew SSL

Certbot installs a systemd timer automatically. Verify:

```bash
systemctl status certbot.timer
certbot renew --dry-run    # test renewal
```

Add reload hook so Nginx picks up renewed certs:

```bash
echo 'post_hook = systemctl reload nginx' >> /etc/letsencrypt/renewal/stackdify.space.conf
```

---

## 6. Phase 4 — First Deployment

### 6.1 Dockerfiles

#### `apps/api/Dockerfile`

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json apps/api/
COPY packages/shared-types/package*.json packages/shared-types/
COPY packages/game-engine/package*.json packages/game-engine/
RUN npm ci --workspace=@stackdify/api --workspace=@stackdify/shared-types --workspace=@stackdify/game-engine

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

#### `apps/web/Dockerfile`

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
# Build-time env vars (public, non-secret)
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

> Add `output: 'standalone'` to `apps/web/next.config.js` for the standalone build.

### 6.2 First deploy on server

```bash
# Log into server as deploy user
ssh -i ~/.ssh/stackdify_deploy -p 2222 deploy@stackdify.space

# Create app directory
mkdir -p /srv/stackdify
cd /srv/stackdify

# Clone repo (or copy docker-compose file)
git clone git@github.com:<your-org>/stackdify.git repo

# Copy the docker-compose file
cp repo/docker-compose.prod.yml .

# Pull images (built by CI — see Phase 5, or build locally first time)
docker compose -f docker-compose.prod.yml pull

# Start DB and Redis first, then run migrations
docker compose -f docker-compose.prod.yml up -d db redis
sleep 5

# Run migrations + seed
docker compose -f docker-compose.prod.yml run --rm api \
  sh -c "npx prisma migrate deploy && npx prisma db seed"

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check health
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3001/api/v1/health
```

### 6.3 Verify end-to-end

```bash
curl https://stackdify.space               # should return HTML
curl https://api.stackdify.space/api/v1/health  # should return {"status":"ok"}
```

---

## 7. Phase 5 — CI/CD via GitHub Actions

### 7.1 Add secrets to GitHub

In your repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | `stackdify.space` |
| `DEPLOY_PORT` | `2222` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/stackdify_deploy` (private key) |
| `DEPLOY_PATH` | `/srv/stackdify` |
| `GHCR_TOKEN` | GitHub PAT with `write:packages` scope |
| `NEXT_PUBLIC_API_URL` | `https://api.stackdify.space/api/v1` |

### 7.2 GitHub Actions workflow

Create `.github/workflows/deploy.yml` in the repo:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

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
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v4

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
          images: ${{ env.IMAGE_PREFIX }}/stackdify-api,${{ env.IMAGE_PREFIX }}/stackdify-web
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build & push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: ${{ env.IMAGE_PREFIX }}/stackdify-api:latest,${{ env.IMAGE_PREFIX }}/stackdify-api:sha-${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & push Web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/web/Dockerfile
          push: true
          tags: ${{ env.IMAGE_PREFIX }}/stackdify-web:latest,${{ env.IMAGE_PREFIX }}/stackdify-web:sha-${{ github.sha }}
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

            # Pull latest images
            docker compose -f docker-compose.prod.yml pull

            # Run DB migrations (zero-downtime: run before swap)
            docker compose -f docker-compose.prod.yml run --rm api \
              sh -c "npx prisma migrate deploy"

            # Rolling restart (no downtime for stateless services)
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            # Health check
            sleep 10
            curl -f http://localhost:3001/api/v1/health || exit 1

            # Clean up old images
            docker image prune -f
```

---

## 8. Phase 6 — Monitoring & Backups

### 8.1 Basic health monitoring

```bash
# Install simple uptime monitoring
apt install -y monitoring-plugins-basic

# Cron job to alert on service down (sends email via sendmail or a webhook)
cat > /usr/local/bin/stackdify-healthcheck.sh <<'EOF'
#!/bin/bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/health)
if [ "$STATUS" != "200" ]; then
  echo "Stackdify API DOWN (HTTP $STATUS) at $(date)" | \
    mail -s "ALERT: Stackdify API Down" duynd0909@gmail.com
fi
EOF
chmod +x /usr/local/bin/stackdify-healthcheck.sh

# Run every 5 minutes
echo "*/5 * * * * deploy /usr/local/bin/stackdify-healthcheck.sh" | crontab -
```

### 8.2 PostgreSQL backups

```bash
cat > /usr/local/bin/stackdify-backup.sh <<'EOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR=/srv/stackdify/backups
DATE=$(date +%Y-%m-%d_%H-%M)
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

# Dump from running Postgres container
docker exec stackdify-db-1 pg_dump -U stackdify stackdify \
  | gzip > "$BACKUP_DIR/stackdify_$DATE.sql.gz"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "Backup completed: stackdify_$DATE.sql.gz"
EOF
chmod +x /usr/local/bin/stackdify-backup.sh

# Daily at 03:00
echo "0 3 * * * deploy /usr/local/bin/stackdify-backup.sh >> /var/log/stackdify-backup.log 2>&1" | crontab -
```

### 8.3 Log rotation

Docker already rotates logs via the json-file driver. Configure max size in `/etc/docker/daemon.json`:

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

### 8.4 Disk usage alert

```bash
cat > /usr/local/bin/stackdify-disk-alert.sh <<'EOF'
#!/bin/bash
USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$USAGE" -gt 85 ]; then
  echo "Disk usage at ${USAGE}% on $(hostname) — $(date)" | \
    mail -s "ALERT: Stackdify Disk ${USAGE}%" duynd0909@gmail.com
fi
EOF
chmod +x /usr/local/bin/stackdify-disk-alert.sh
echo "0 8 * * * deploy /usr/local/bin/stackdify-disk-alert.sh" | crontab -
```

---

## 9. Environment Variables Reference

### `/srv/stackdify/.env.api` (production)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime env | `production` |
| `PORT` | API listen port | `3001` |
| `DATABASE_URL` | Postgres DSN (uses Docker service name `db`) | `postgresql://stackdify:<pw>@db:5432/stackdify` |
| `REDIS_URL` | Redis DSN (with password) | `redis://:<pw>@redis:6379` |
| `DATABASE_POOL_MAX` | Prisma connection pool | `10` |
| `JWT_SECRET` | Min 48 chars, random | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App | — |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App | — |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | — |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | — |
| `API_PUBLIC_URL` | Canonical API origin | `https://api.stackdify.space` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://stackdify.space` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `duynd0909@gmail.com` |
| `SENTRY_DSN` | Error tracking | optional |

### `/srv/stackdify/.env.web` (production)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime env | `production` |
| `NEXTAUTH_URL` | Canonical frontend origin | `https://stackdify.space` |
| `NEXTAUTH_SECRET` | Min 48 chars, random | `openssl rand -base64 48` |
| `NEXT_PUBLIC_API_URL` | Public API base URL | `https://api.stackdify.space/api/v1` |
| `GITHUB_CLIENT_ID` | GitHub OAuth | — |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | — |
| `GOOGLE_CLIENT_ID` | Google OAuth | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | — |

### OAuth callback URLs to register in providers

| Provider | URL |
|---|---|
| GitHub — callback | `https://api.stackdify.space/api/v1/auth/github/callback` |
| Google — redirect URI | `https://api.stackdify.space/api/v1/auth/google/callback` |

---

## 10. Cheat Sheet — Day-to-Day Commands

```bash
# SSH into server
ssh -i ~/.ssh/stackdify_deploy -p 2222 deploy@stackdify.space

# View all service logs (live)
cd /srv/stackdify
docker compose -f docker-compose.prod.yml logs -f

# View only API logs
docker compose -f docker-compose.prod.yml logs -f api

# Restart a single service without downtime
docker compose -f docker-compose.prod.yml up -d --no-deps api

# Force redeploy (pull latest image + restart)
docker compose -f docker-compose.prod.yml pull api
docker compose -f docker-compose.prod.yml up -d --no-deps api

# Run a one-off migration
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Open Prisma Studio (tunnel to local)
# On server:
docker compose -f docker-compose.prod.yml run --rm -p 5555:5555 api npx prisma studio --hostname 0.0.0.0
# On local: ssh -L 5555:localhost:5555 -p 2222 deploy@stackdify.space
# Then open http://localhost:5555

# Manual backup
/usr/local/bin/stackdify-backup.sh

# Restore from backup
gunzip -c /srv/stackdify/backups/stackdify_2026-05-07_03-00.sql.gz | \
  docker exec -i stackdify-db-1 psql -U stackdify stackdify

# Renew SSL cert manually
sudo certbot renew --force-renewal
sudo systemctl reload nginx

# Check firewall status
sudo ufw status verbose

# Check fail2ban
sudo fail2ban-client status sshd

# Monitor disk / memory
df -h && free -h

# Update server OS packages
sudo apt update && sudo apt upgrade -y
```

---

## Estimated Monthly Cost

| Item | Cost |
|---|---|
| Electricity (PC 24/7 at ~60W) | ~$5–8 USD |
| Cloudflare Free tier | $0 |
| Let's Encrypt | $0 |
| Domain (stackdify.space) | ~$1–2 USD/month amortized |
| **Total** | **~$7–10 USD/month** |

vs Railway ($20–30/month) or AWS ECS ($50–72/month).
