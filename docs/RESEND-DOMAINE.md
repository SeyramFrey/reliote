# Relier Resend au domaine reliote.com

État constaté le 2026-10-27 :

- **Domaine.** reliote.com est géré chez Hostinger (serveurs DNS `*.dns-parking.com`).
- **E-mails existants.** Le domaine reçoit déjà des e-mails via Hostinger : MX `mx1/mx2.hostinger.com`, SPF `include:_spf.mail.hostinger.com`, DMARC `p=none`.

Resend se branche **à côté** de ces enregistrements, sans les modifier :

- son SPF et son MX vivent sur le sous-domaine `send.reliote.com` ;
- sa signature DKIM vit sur `resend._domainkey.reliote.com`.

Les boîtes Hostinger continuent donc de fonctionner. Le passage du site sur le VPS ne touchera que les enregistrements `A`/`CNAME` du site : rien à refaire côté e-mail.

## 1. Créer le domaine chez Resend (Sey)

1. Crée un compte sur resend.com, ou connecte-toi.
2. Va dans **Domains → Add domain** et saisis `reliote.com`.
3. Choisis la région **eu-west-1 (Irlande)** : les données restent dans l'UE, ce qui facilite le RGPD.
4. Resend affiche 3 ou 4 enregistrements DNS. Garde la page ouverte.

## 2. Ajouter les enregistrements chez Hostinger (Sey)

hPanel → **Domaines → reliote.com → DNS / Serveurs de noms → Gérer les enregistrements DNS**.

Recopie **exactement** les valeurs données par Resend :

| Type | Nom (hPanel) | Valeur | Priorité |
|------|--------------|--------|----------|
| TXT | `resend._domainkey` | la clé DKIM fournie par Resend (`p=MIGf…`) | — |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (celle que Resend affiche) | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |

Ce qu'il ne faut **pas** faire :

- toucher aux MX de `@` (racine) ;
- toucher au TXT SPF existant de `@` ;
- créer un deuxième enregistrement SPF sur `@`.

Ce sont les boîtes Hostinger.

DMARC existe déjà (`_dmarc` → `v=DMARC1; p=none`), c'est suffisant pour démarrer. Après quelques semaines d'envois sans erreur, passe-le à `p=quarantine`.

Retourne ensuite sur Resend et clique **Verify DNS records**. La propagation prend de quelques minutes à quelques heures. Attends le statut **Verified** pour les trois lignes.

Vérification depuis un terminal :

```bash
nslookup -type=TXT resend._domainkey.reliote.com 8.8.8.8
```

## 3. Créer la clé API (Sey)

Resend → **API Keys → Create API key** :

- **Nom :** `reliote-prod`
- **Permission :** *Sending access*
- **Domaine :** `reliote.com`

La clé ne s'affiche qu'une fois. Ne la colle ni dans le chat ni dans un fichier commité. Elle va seulement aux deux endroits ci-dessous.

## 4. Brancher les deux circuits d'envoi

### a) E-mails de l'app

Il s'agit des accusés de projet, des alertes admin, des RDV, des messages et de la newsletter.

Aujourd'hui sur Vercel : **Settings → Environment Variables (Production)**.

```
RESEND_API_KEY=<la clé>            (cocher « Sensitive »)
RESEND_FROM=Reliote <notifications@reliote.com>
RELIOTE_ADMIN_EMAIL=<adresse qui reçoit les alertes admin>
SITE_URL=https://reliote.vercel.app   (puis https://reliote.com au passage sur le VPS)
```

Redéploie ensuite. Sur le VPS, les mêmes variables vont dans l'environnement de l'app Next.js (docs/VPS-DEPLOYMENT.md §3.5).

### b) E-mails de compte

Il s'agit de la confirmation d'inscription et du mot de passe oublié.

**Aujourd'hui sur Supabase Cloud**, au choix :

- **Le plus simple :** Resend → **Integrations → Supabase**. Resend remplit tout seul le SMTP du projet `kjaadikzxlunhdbgsbte`.
- **À la main :** Supabase → **Authentication → Emails → SMTP Settings → Enable custom SMTP**, avec les valeurs suivantes :

  | Champ | Valeur |
  |-------|--------|
  | Host | `smtp.resend.com` |
  | Port | `465` |
  | Username | `resend` |
  | Password | la clé API |
  | Sender email | `notifications@reliote.com` |
  | Sender name | `Reliote` |

Profites-en pour régler, dans **Authentication** du même tableau de bord :

- **URL Configuration :** Site URL = `https://reliote.vercel.app`, plus les Redirect URLs `https://reliote.vercel.app/**`. Ajoute `https://reliote.com/**` dès que le domaine pointe sur le site.
- **Rate Limits → emails sent :** relève la limite à 30/h environ. La limite par défaut ne vaut que pour l'expéditeur intégré de Supabase.

**Sur le VPS**, c'est le service `auth` de `supabase/docker-compose.yml` (`GOTRUE_SMTP_*`, voir `supabase/.env.example`), avec `GOTRUE_MAILER_AUTOCONFIRM=false`.

## 5. Tester

1. Crée un compte porteur avec une vraie adresse : l'e-mail de confirmation doit arriver.
2. Fais un « Mot de passe oublié » : le lien doit arriver.
3. Dépose un projet : l'accusé de réception doit arriver au porteur, et l'alerte à `RELIOTE_ADMIN_EMAIL`.
4. Contrôle chaque envoi dans **Resend → Logs** (statut *Delivered*).

Pour vérifier qu'un message n'arrive pas en spam, ouvre-le dans Gmail, puis « Afficher l'original » : SPF, DKIM et DMARC doivent être à **PASS**.

## Volume

L'offre gratuite de Resend autorise 3 000 e-mails par mois et 100 par jour. C'est suffisant pour le lancement. La newsletter compte dans ce quota : au-delà de quelques centaines d'abonnés, passe à l'offre payante.
