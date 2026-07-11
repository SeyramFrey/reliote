# Reliote sur VPS — Guide d'exploitation

Ce guide explique tout ce qu'il faut faire **côté VPS** pour faire tourner Reliote
en production : Postgres + Auth + REST + Storage + Studio derrière un reverse
proxy avec HTTPS, et toute la mécanique pour **gérer les données** depuis le
serveur (consulter, modifier, sauvegarder, restaurer).

> **NerveOps (server-pilot)** — votre outil couvre une grosse partie de ce
> guide : provisioning Docker, Caddy/HTTPS automatique, monitoring, backups,
> firewall, déploiement preview-then-confirm. Les sections marquées
> **(⚡ NerveOps)** peuvent passer par votre outil au lieu des commandes manuelles.
> Voir la section [Où NerveOps remplace ce guide](#où-nerveops-remplace-ce-guide).

---

## 0. Vue d'ensemble

Le stack Reliote tient dans un seul `docker-compose.yml` sous `supabase/` :

| Service       | Image                            | Port interne | Rôle |
|---------------|----------------------------------|--------------|------|
| `db`          | supabase/postgres:15.8.1.060     | 5432         | Postgres + Realtime |
| `auth`        | supabase/gotrue:v2.177.0         | 9999         | Email/password, JWT |
| `rest`        | postgrest:v12.2.0                | 3000         | API REST auto-générée |
| `storage`     | supabase/storage-api:v1.11.13    | 5000         | Fichiers (`architect-photos`) |
| `imgproxy`    | darthsim/imgproxy:v3.21.0        | 5001         | Resize/crop à la volée |
| `kong`        | kong:2.8.1                       | 8000         | API gateway public |
| `studio`      | supabase/studio:2026.06.01-…     | 3000         | Interface admin |
| `meta`        | supabase/postgres-meta:v0.84.2   | 8080         | API pour Studio |

L'app Next.js, elle, tourne **séparément** : soit Vercel (recommandé pour le
front), soit Node sur ce même VPS, soit Docker à côté. Elle parle au VPS via
les URLs publiques de Kong et Storage.

**Recommandation :** sur le VPS, on ne fait tourner que la **plateforme de
données** (Supabase). Le front Next.js va sur Vercel ou un autre process.
Cela isole les redéploiements front des opérations DB.

---

## 1. Prérequis VPS

**Minimums :** Ubuntu 22.04 LTS (ou Debian 12), 4 GB RAM, 2 vCPU, 40 GB disque
SSD. Ports 22, 80, 443 ouverts. Un nom de domaine pointé (ex.
`api.reliote.com`, `studio.reliote.com`).

**Hébergeurs adaptés :** Hetzner CX22 (~€5/mois, suffisant pour démarrer),
OVH VPS SSD 2, Scaleway DEV1-M, DigitalOcean Droplet Premium AMD.

### 1.1 Première connexion + hardening (⚡ NerveOps)

```bash
# Depuis votre poste local
ssh root@<vps-ip>
```

À faire en premier (NerveOps peut tout faire en un clic via son module
"Security hardening" + "SSH hardening") :

1. **Créer un utilisateur non-root**
   ```bash
   adduser reliote
   usermod -aG sudo reliote
   rsync --archive --chown=reliote:reliote ~/.ssh /home/reliote
   ```
2. **Désactiver le login root + password SSH**
   Éditer `/etc/ssh/sshd_config` :
   ```
   PermitRootLogin no
   PasswordAuthentication no
   ```
   Puis `systemctl restart sshd`.
3. **Firewall UFW**
   ```bash
   ufw allow OpenSSH
   ufw allow 80
   ufw allow 443
   ufw enable
   ```
4. **Fail2ban** pour blocker les brute-force SSH :
   ```bash
   apt install -y fail2ban
   systemctl enable --now fail2ban
   ```
5. **Mises à jour auto** :
   ```bash
   apt install -y unattended-upgrades
   dpkg-reconfigure -plow unattended-upgrades
   ```

### 1.2 Installer Docker

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker reliote
# Re-loggez pour que le groupe prenne effet
```

NerveOps installe et version-gère Docker tout seul lors de la création du serveur.

---

## 2. Déployer Reliote (Supabase stack)

### 2.1 Cloner le repo et générer les secrets

```bash
sudo -u reliote -i
cd /opt
sudo mkdir reliote && sudo chown reliote:reliote reliote
cd reliote
git clone <votre-fork-ou-origine>.git .
cd supabase
cp .env.example .env
```

Maintenant **générer des secrets vrais** (jamais les valeurs du `.env.example`,
qui sont pour le dev) :

```bash
# Mot de passe Postgres (32 chars random)
openssl rand -hex 32

# JWT secret (32 chars min, utilisé par GoTrue et signe les anon/service tokens)
openssl rand -hex 32
```

Pour `ANON_KEY` et `SERVICE_ROLE_KEY`, ce sont des JWT signés avec votre
`JWT_SECRET`. Le repo contient des JWTs de dev signés avec le secret de dev.
Pour la prod, générer les vôtres avec ce petit script Node :

```js
// generate-keys.mjs
import { createHmac } from "crypto";
const SECRET = process.argv[2]; // votre JWT_SECRET
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (header, payload) => {
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
};
const header = { alg: "HS256", typ: "JWT" };
const now = Math.floor(Date.now() / 1000);
const exp = now + 10 * 365 * 24 * 3600; // 10 ans
console.log("ANON_KEY     =", sign(header, { role: "anon",         iss: "reliote", iat: now, exp }));
console.log("SERVICE_KEY  =", sign(header, { role: "service_role", iss: "reliote", iat: now, exp }));
```

```bash
node generate-keys.mjs <VOTRE_JWT_SECRET>
```

Copier les valeurs dans `supabase/.env`. **Ne committez jamais ce fichier**
(il est déjà dans le .gitignore).

### 2.2 Démarrer le stack

```bash
cd /opt/reliote/supabase
docker compose up -d
# Attendre que la DB soit healthy
docker compose ps
```

Puis **appliquer les migrations Reliote** :

```bash
./apply-migrations.sh
```

Ce script applique `0001`→`0006` + le seed, et notifie PostgREST pour recharger
le schéma. Idempotent : on peut le relancer.

**Vérifier que tout tourne :**
```bash
docker compose ps                  # tous "Up (healthy)"
curl http://localhost:54321/rest/v1/architect_profiles?select=first_name,last_name -H "apikey: <ANON_KEY>"
# → doit retourner les 8 architectes seed
```

(⚡ NerveOps) — Le module "Application Deployment" gère le `git pull` →
`docker compose up -d` → migrations → health-check avec rollback si une étape
échoue. Le multi-step preview-then-confirm évite les ratés sur la prod.

---

## 3. Reverse proxy + HTTPS

Kong écoute sur `54321`, Studio sur `54323`. Il faut un reverse proxy avec
TLS pour exposer ces ports en HTTPS sur des sous-domaines.

### 3.1 Option A — Caddy (recommandé, ⚡ NerveOps natif)

NerveOps utilise Caddy par défaut. Manuellement :

```bash
apt install -y caddy
```

`/etc/caddy/Caddyfile` :

```Caddyfile
api.reliote.com {
    reverse_proxy localhost:54321
    # Limiter la taille des uploads à Storage (5 MB pour les photos + marge)
    request_body {
        max_size 10MB
    }
}

studio.reliote.com {
    # Studio n'a pas d'auth — on met une basic auth Caddy par-dessus.
    # Générer un hash : caddy hash-password
    basicauth {
        admin $2a$14$...hashedpassword...
    }
    reverse_proxy localhost:54323
}
```

```bash
systemctl reload caddy
```

Caddy obtient automatiquement les certificats Let's Encrypt si le DNS pointe
correctement.

### 3.2 Option B — Nginx + Certbot

Si vous préférez Nginx, l'équivalent avec `certbot --nginx` fonctionne. Caddy
reste plus simple pour ce cas d'usage.

### 3.3 DNS

Sur votre registrar (OVH, Gandi, Cloudflare…) :

| Type | Nom            | Valeur     |
|------|----------------|------------|
| A    | api            | `<vps-ip>` |
| A    | studio         | `<vps-ip>` |

(⚡ NerveOps) — Le module "Domain mapping" propose les enregistrements DNS
à créer, et son module SSL configure Caddy + Let's Encrypt automatiquement.

### 3.4 Mettre à jour les URLs de l'app Next.js

Dans le `.env.local` de votre déploiement Next.js (Vercel ou autre), pointer
sur l'API publique :

```
NEXT_PUBLIC_SUPABASE_URL=https://api.reliote.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY_de_prod>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_KEY_de_prod>
SITE_URL=https://reliote.com
```

Et dans `supabase/.env` sur le VPS :

```
SITE_URL=https://reliote.com
```

(c'est l'URL vers laquelle GoTrue redirige les emails de confirmation et
les reset password).

---

## 4. Sécurité production

### 4.1 Kong — CORS

`supabase/kong.yml` autorise déjà CORS par défaut sur tous les domaines.
Pour la prod, restreindre via le plugin Kong CORS :

```yaml
plugins:
  - name: cors
    config:
      origins:
        - https://reliote.com
        - https://www.reliote.com
      credentials: true
```

### 4.2 Studio

L'image `supabase/studio` n'a pas d'authentification intégrée. **Toujours**
la mettre derrière basicauth Caddy (cf. §3.1) ou un VPN.

### 4.3 Storage public

Le bucket `architect-photos` est `public: true` — c'est volontaire pour que
les photos s'affichent sur la landing. Si vous voulez des photos signées,
basculer `public: false` dans la migration et utiliser
`supabase.storage.from('architect-photos').createSignedUrl(path, 3600)`
côté serveur.

### 4.4 Firewall — ne PAS exposer les ports Docker

UFW bloque déjà tout sauf 22/80/443. Mais Docker peut contourner UFW en
ouvrant ses propres règles iptables. Vérifier :

```bash
# Le port Postgres 54322 ne doit PAS être joignable de l'extérieur
nc -zv <vps-ip> 54322   # → connection refused
```

Si exposé, dans `docker-compose.yml` retirer les `ports:` qui mappent à
`0.0.0.0` et lier en localhost : `"127.0.0.1:54322:5432"`.

(⚡ NerveOps) — Le module "Security audit" (score /100) flag automatiquement
les ports exposés à tort.

---

## 5. Gérer les données

Trois façons d'accéder à la DB selon le besoin.

### 5.1 Supabase Studio — interface graphique

```
https://studio.reliote.com
```

- **Table editor** : voir / éditer / supprimer des lignes
- **SQL editor** : requêtes ad-hoc, sauvegardées
- **Auth → Users** : voir les comptes, reset password, supprimer
- **Storage** : naviguer dans `architect-photos`, supprimer des fichiers
- **Database → Roles** : gérer les RLS policies

C'est l'outil principal pour les opérations métier ponctuelles
(valider un architecte, ajouter un bucket, regarder un projet).

### 5.2 `psql` — shell SQL direct

Depuis le VPS :

```bash
docker compose -f /opt/reliote/supabase/docker-compose.yml exec -e PGPASSWORD=<POSTGRES_PASSWORD> db \
  psql -U supabase_admin -d postgres
```

Pour de plus grosses opérations (changement de schéma, batch updates), passer
par une nouvelle migration `supabase/migrations/0007_*.sql` + commit + rerun
`apply-migrations.sh`.

### 5.3 Connexion distante avec un outil graphique

Pour DBeaver / TablePlus / pgAdmin, ouvrir un tunnel SSH (sans exposer 54322
en public) :

```bash
ssh -L 54322:localhost:54322 reliote@<vps-ip>
```

Puis connecter : `host=localhost, port=54322, user=supabase_admin, db=postgres`.

---

## 6. Backups & restauration

**Données critiques :**
- Tables Postgres : `profiles`, `architect_profiles`, `client_projects`, `match_results`, `auth.users`
- Storage : volume `reliote-storage-data` (les photos uploadées)

### 6.1 Backup quotidien automatique (script + cron)

`/opt/reliote/backup.sh` :

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date -u +%Y%m%d-%H%M%S)
DIR=/opt/reliote/backups
mkdir -p "$DIR"

cd /opt/reliote/supabase

# 1. Postgres dump (toutes les schemas incluant auth + storage)
docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" db \
  pg_dump -U supabase_admin -d postgres --clean --if-exists \
  | gzip > "$DIR/db-$STAMP.sql.gz"

# 2. Storage volume (tar du volume Docker)
docker run --rm \
  -v reliote_reliote-storage-data:/data:ro \
  -v "$DIR":/backup \
  alpine tar czf "/backup/storage-$STAMP.tar.gz" -C /data .

# 3. Nettoyer les backups > 30 jours
find "$DIR" -name '*.gz' -mtime +30 -delete

# 4. Push vers stockage externe (S3/Backblaze/rclone)
rclone copy "$DIR" remote:reliote-backups --max-age 24h
```

```bash
chmod +x /opt/reliote/backup.sh
# Cron tous les jours à 03:00 UTC
(crontab -l 2>/dev/null; echo '0 3 * * * /opt/reliote/backup.sh') | crontab -
```

**Important :** stocker les backups **hors du VPS** (object storage, autre serveur).
Un backup sur le serveur qui héberge la DB est presque inutile.

(⚡ NerveOps) — Le module "Backup creation and restoration" gère les backups
Docker volumes + DB avec rotation et destination distante. Bien plus simple
que le script ci-dessus.

### 6.2 Restaurer

```bash
# DB
gunzip -c db-20260101-030000.sql.gz | docker compose exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" db psql -U supabase_admin -d postgres

# Storage
docker compose down storage imgproxy
docker run --rm -v reliote_reliote-storage-data:/data -v /opt/reliote/backups:/backup alpine \
  tar xzf /backup/storage-20260101-030000.tar.gz -C /data
docker compose up -d storage imgproxy
```

---

## 7. Monitoring

### 7.1 Logs

```bash
# Tous les services
docker compose logs -f --tail 100

# Un service précis
docker compose logs -f auth
docker compose logs -f storage
```

### 7.2 Health checks

```bash
docker compose ps
# Tous doivent être "Up (healthy)"
```

Un check externe minimal — un petit `curl` toutes les 5 min :

```bash
curl -sf https://api.reliote.com/rest/v1/architect_profiles?select=id\&limit=1 \
  -H "apikey: <ANON_KEY>" -o /dev/null || systemctl restart reliote
```

(⚡ NerveOps) — Le module "Server health monitoring" avec alerting intégré
évite d'écrire ça à la main.

### 7.3 Métriques système

`btop` ou `htop` pour la RAM/CPU. Postgres lui-même est gourmand : prévoir
2 GB RAM dédiés au container `db` minimum.

---

## 8. Mettre à jour Reliote

Quand vous tirez du code nouveau :

```bash
cd /opt/reliote
git pull
cd supabase
# Si nouvelles migrations
./apply-migrations.sh
# Si docker-compose.yml ou .env ont changé
docker compose up -d
# Redéployer le front Next.js sur Vercel/où qu'il soit
```

(⚡ NerveOps) — Le module "Multi-step deployment workflow" enchaîne pull +
migrations + restart + health-check avec rollback automatique si une étape
échoue. **Le cas d'usage parfait.**

---

## 9. Où NerveOps remplace ce guide

Sur la base de ce que fait votre outil, voici **ce qu'il prend en charge
directement** :

| Section de ce guide | Couvert par NerveOps ? |
|---------------------|------------------------|
| §1.1 SSH hardening + firewall + fail2ban | ✅ "SSH hardening" + "Firewall configuration" |
| §1.2 Install Docker | ✅ Provisioning automatique |
| §2.2 `docker compose up` + restart | ✅ "Docker / Docker Compose orchestration" |
| §3.1 Caddy + HTTPS | ✅ "SSL/HTTPS automation through Caddy" |
| §3.3 DNS records | ✅ "Domain mapping and DNS configuration" |
| §4.4 Audit ports exposés | ✅ "Security auditing with scoring system" |
| §6 Backups + restore | ✅ "Backup creation and restoration" |
| §7.2 Health checks + alerting | ✅ "Server health monitoring with alert system" |
| §8 Deploy + rollback | ✅ "Multi-step deployment workflow + rollback" |

**Ce que ce guide garde en propre** (parce que c'est spécifique à Reliote) :

- §2.1 Générer ANON_KEY / SERVICE_KEY via le script Node (NerveOps n'a pas
  de plugin Supabase, à juste titre)
- §2.2 `./apply-migrations.sh` (script Reliote, pas un truc Docker générique)
- §4.1 Plugin Kong CORS (config app-level)
- §4.3 Le choix `public:true` du bucket (décision produit)
- §5 Studio + psql + tunnel SSH pour gérer les données (interface humaine)

**Recommandation pratique :** utiliser NerveOps pour 1, 2.2 (lifecycle Docker),
3, 6, 7, 8. Garder ce guide pour les opérations Reliote-spécifiques (§2.1,
§4, §5).

---

## 10. Checklist de mise en prod

- [ ] VPS provisionné, hardening fait (§1.1)
- [ ] Docker installé (§1.2)
- [ ] Repo cloné dans `/opt/reliote/`
- [ ] `supabase/.env` rempli avec **nouveaux** secrets (§2.1)
- [ ] Stack démarré, migrations appliquées, seed vérifié (§2.2)
- [ ] Caddy/HTTPS opérationnel pour `api.` et `studio.` (§3)
- [ ] Studio derrière basic auth (§4.2)
- [ ] Ports Docker non exposés en public (§4.4)
- [ ] App Next.js déployée avec URLs prod (§3.4)
- [ ] Backup cron actif, premier backup vérifié restauré (§6)
- [ ] Health check externe configuré (§7.2)
- [ ] NerveOps connecté au VPS (recommandé)
