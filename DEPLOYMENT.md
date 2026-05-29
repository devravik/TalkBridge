# TalkBridge — Deployment Guide

## Overview

```
Internet
   │
   ▼  HTTPS on custom port (e.g. 7443)
 Nginx  ──────────────────────────────────────────────────
   │                                                      │
   ├── /ws/*   ──► backend:8080  (WebSocket)              │
   ├── /api/*  ──► backend:8080  (REST)                   │
   └── /*      ──► frontend:3000 (Next.js)                │
                                                          │
 coturn (TURN relay on ports 49160/49161)  ◄─────── WebRTC ICE
```

All services run as Docker containers. Nginx terminates TLS and routes traffic. coturn relays WebRTC when peer-to-peer fails (required for users behind strict NAT or mobile networks).

---

## Server Requirements

| | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB | 40 GB |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |
| Open ports | see below | |

### Firewall ports to open

| Port | Protocol | Purpose |
|---|---|---|
| 22 | TCP | SSH |
| 7080 | TCP | HTTP (redirects to HTTPS) |
| 7443 | TCP | HTTPS (app) |
| 49160 | TCP + UDP | TURN (WebRTC relay) |
| 49161 | TCP | TURN over TLS |
| 49152–65535 | UDP | TURN relay media ports |

> You can change 7080/7443/49160/49161 to any ports you prefer. Just keep them consistent across `.env.production` and firewall rules.

---

## Step 1 — Server setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Certbot (for SSL)
sudo apt install -y certbot

# Create app directory
sudo mkdir -p /opt/talkbridge
sudo chown $USER:$USER /opt/talkbridge
```

---

## Step 2 — Upload the project

From your local machine:

```bash
scp -r /var/www/TalkBridge/ user@YOUR_SERVER_IP:/opt/talkbridge
```

Or clone from a git remote if you have one set up.

---

## Step 3 — Get an SSL certificate

Run this **before** starting Docker (certbot needs port 80 free temporarily):

```bash
sudo certbot certonly --standalone \
  --preferred-challenges http \
  -d yourdomain.com
```

Cert files will be at `/etc/letsencrypt/live/yourdomain.com/`.

> If port 80 is already in use, use the DNS challenge instead:
> `sudo certbot certonly --manual --preferred-challenges dns -d yourdomain.com`

---

## Step 4 — Configure Nginx

Edit `nginx/talkbridge.conf` and replace every `YOUR_DOMAIN` with your actual domain:

```bash
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' /opt/talkbridge/nginx/talkbridge.conf
```

---

## Step 5 — Configure coturn

Edit `coturn/turnserver.conf` and replace the placeholders:

```bash
cd /opt/talkbridge

# Set your server's public IP
sed -i 's/SERVER_PUBLIC_IP/1.2.3.4/g' coturn/turnserver.conf

# Set your domain
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' coturn/turnserver.conf

# Set a strong TURN password (save this — you'll need it in .env.production)
sed -i 's/TURN_PASSWORD/your_strong_turn_password/g' coturn/turnserver.conf
```

---

## Step 6 — Create `.env.production`

```bash
cd /opt/talkbridge
cp .env.example .env.production
```

Edit `.env.production`:

```env
# Ports (change to anything unused on your server)
HTTP_PORT=7080
HTTPS_PORT=7443

# Domain
DOMAIN=yourdomain.com

# Secrets — use strong random values
DB_PASSWORD=change_me_strong_db_password
REDIS_PASSWORD=change_me_strong_redis_password

# AI services
DEEPGRAM_API_KEY=your_deepgram_key
OPENROUTER_API_KEY=your_openrouter_key
TRANSLATION_MODEL=openai/gpt-4o-mini

# TURN server (matches coturn/turnserver.conf)
TURN_URL=turns:yourdomain.com:49161
TURN_USERNAME=talkbridge
TURN_CREDENTIAL=your_strong_turn_password
```

Generate strong passwords:
```bash
openssl rand -base64 32   # run twice — once for DB, once for Redis
```

---

## Step 7 — Deploy

```bash
cd /opt/talkbridge

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Check all containers are healthy:
```bash
docker compose -f docker-compose.prod.yml ps
```

Test the app:
```bash
curl -s https://yourdomain.com:7443/health
# → {"status":"ok"}
```

---

## Step 8 — Auto-renew SSL

Certbot installs a renewal timer automatically. Verify it:

```bash
sudo systemctl status certbot.timer
```

After renewal, reload Nginx to pick up the new cert:

```bash
# Add to /etc/cron.d/certbot-reload
0 5 * * * root certbot renew --quiet && docker exec talkbridge-nginx-1 nginx -s reload
```

---

## Management

### View logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Single service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Restart a service

```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Stop everything

```bash
docker compose -f docker-compose.prod.yml down
```

### Update to a new version

```bash
git pull   # or re-upload files

docker compose -f docker-compose.prod.yml --env-file .env.production \
  up -d --build --no-deps backend frontend
```

The `--no-deps` flag rebuilds only the changed services; postgres/redis keep running and data is preserved.

### Database backup

```bash
docker exec talkbridge-postgres-1 \
  pg_dump -U talkbridge talkbridge | gzip > backup-$(date +%F).sql.gz
```

---

## Port reference

| Variable | Default | Controls |
|---|---|---|
| `HTTP_PORT` | `7080` | Nginx HTTP (redirect only) |
| `HTTPS_PORT` | `7443` | Nginx HTTPS (main app) |
| coturn `listening-port` | `49160` | TURN/STUN plain |
| coturn `tls-listening-port` | `49161` | TURN over TLS |

Change any of these to avoid conflicts with other services. For the coturn ports, also update the `TURN_URL` in `.env.production` to match.

---

## Troubleshooting

**`docker compose up` fails — port already in use**
→ Change `HTTP_PORT`/`HTTPS_PORT` in `.env.production` and retry.

**Nginx 502 Bad Gateway**
→ Backend or frontend container isn't ready yet. Check:
```bash
docker compose -f docker-compose.prod.yml logs backend
```

**Camera/mic blocked on HTTPS**
→ Verify the SSL cert path in `nginx/talkbridge.conf` matches where certbot placed it.

**WebRTC connects locally but fails over internet**
→ TURN server is likely not reachable. Confirm ports 49160/49161 and UDP 49152–65535 are open in your firewall/security group, and that `TURN_URL` in `.env.production` is correct.

**No captions**
→ Verify `DEEPGRAM_API_KEY` is valid. Check backend logs for Deepgram connection errors.
