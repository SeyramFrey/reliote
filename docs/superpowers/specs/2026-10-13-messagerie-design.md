# Reliote — Messagerie admin ↔ porteurs / admin ↔ architectes — Design

**Date :** 2026-10-13
**Owner :** Sey (Fabrice Geoffrey)
**Statut :** décisions validées par Sey en séance (questionnaire), sections 1 et 2 validées ;
section 3 tranchée sur recommandation, Sey a demandé de passer au plan et à l'implémentation.

---

## 1. But

Remplacer les échanges par e-mail — et surtout l'envoi de documents — par une messagerie
interne. **L'admin (« Reliote ») reste l'unique intermédiaire** : le porteur parle à Reliote,
l'architecte parle à Reliote, jamais l'un à l'autre. La messagerie ne doit pas devenir un
contournement des règles d'anonymat (identité de l'architecte révélée au porteur au RDV
confirmé ; coordonnées du porteur masquées à l'architecte jusque-là).

Hors périmètre v1 : indicateur « en train d'écrire » (prévu ensuite, même canal temps réel),
messagerie directe porteur ↔ architecte, recherche dans les messages, purge automatique des
fichiers envoyés mais jamais rattachés à un message.

## 2. Décisions (Sey, 2026-10-12/13)

| Sujet | Décision |
|---|---|
| Rattachement | Un fil **par projet** |
| Fil architecte sur un projet | Ouvert **par l'admin**, uniquement avec l'**architecte retenu** (après le choix du porteur ; avec une seule proposition, l'architecte proposé est retenu d'office) |
| Fil d'admission | Un fil par architecte, dès sa candidature, hors projet |
| Architecte plus retenu | Fil **fermé en lecture seule**, bandeau « Ce projet ne vous est plus attribué » |
| Instantanéité | **Temps réel** (Supabase Realtime) + e-mail « nouveau message » limité |
| Documents | PDF, JPG/PNG/WebP/HEIC, DOCX/XLSX, DWG/DXF ; **25 Mo** max, **5 fichiers** par message ; pas de ZIP ni d'exécutable ; liens d'accès temporaires |
| Passage d'un document d'un côté à l'autre | Bouton **« Transmettre »** (admin), avertissement d'anonymat avant le RDV confirmé |
| Côté admin | Onglet **Messages** (tous les fils, non-lus en tête) + accès depuis les fiches projet / architecte |
| Modifier / supprimer | **Oui, pendant 5 minutes** après l'envoi, par l'auteur |
| Accusés de lecture | **« Vu »** affiché à l'expéditeur |
| Architecture | **A** : écritures par actions serveur, lectures + temps réel par Supabase filtrés par RLS |
| « En train d'écrire » | Plus tard |

## 3. Données (migration 0017)

### Tables

- **`message_threads`**
  `id`, `kind` (`project_client` | `project_architect` | `architect_admission`),
  `project_id` (null pour l'admission), `architect_id` (null pour `project_client`),
  `created_by`, `created_at`, `last_message_at`,
  `owner_notified_at`, `admin_notified_at` (limitation des e-mails).
  Unicité : un seul fil par (`kind`, `project_id`, `architect_id`) — index uniques partiels par sorte.
  Contrainte de forme : `project_client` ⇒ projet et pas d'architecte ; `project_architect` ⇒ les
  deux ; `architect_admission` ⇒ architecte et pas de projet.
- **`messages`**
  `id`, `thread_id`, `author_id` (auth.users), `author_side` (`admin` | `owner`), `body` (≤ 5 000
  caractères), `created_at`, `edited_at`, `deleted_at`. Un message peut n'avoir que des pièces
  jointes (corps vide) mais jamais rien.
- **`message_revisions`** — ancienne version à chaque modification ou suppression :
  `message_id`, `body`, `revised_at`, `revised_by`, `action` (`edit` | `delete`). **Admin seul.**
- **`message_attachments`**
  `id`, `message_id`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `created_at`,
  `removed_at` (retrait par l'admin, la mention reste), `forwarded_from` (pièce d'origine).
- **`message_thread_reads`** — `thread_id`, `user_id`, `last_read_at` (PK thread+user).
  Sert aux non-lus et au « Vu ».

« Propriétaire » d'un fil (côté non-admin) : `client_projects.user_id` pour `project_client`,
`architect_profiles.user_id` pour les deux autres sortes.

### RLS (lecture seule ; toutes les écritures passent par le client service côté serveur)

- Helper `private.can_read_thread(thread_id)` : admin, ou propriétaire du fil (porteur du projet /
  utilisateur de l'architecte).
- `message_threads`, `messages`, `message_attachments`, `message_thread_reads` : `select` si
  `can_read_thread`. `message_revisions` : `select` admin seul.
- Aucune policy `insert/update/delete` pour `authenticated` : un utilisateur ne peut rien écrire
  directement, ni fabriquer un message dans le fil d'un autre.
- Publication `supabase_realtime` : `messages`, `message_attachments`, `message_thread_reads`.
  Realtime applique la RLS de l'abonné : un architecte ne reçoit jamais l'événement d'un fil
  qui n'est pas le sien.

### Stockage

Bucket **privé** `message-files`, limite 25 Mo. **Aucune** policy storage pour `authenticated` :
- envoi : URL d'envoi signée à usage unique, délivrée par une action serveur après contrôle des
  droits, du nombre, de l'extension et de la taille ; chemin `{thread_id}/{uuid}.{ext}` ;
- lecture : route serveur qui vérifie les droits puis redirige vers une URL signée valable
  **5 minutes**, en **téléchargement forcé** (jamais d'affichage inline d'un fichier envoyé).

## 4. Règles métier (`src/lib/messaging/rules.ts`, pures et testées)

- **Architecte retenu** sur un projet : son engagement est actif (`proposed` ou `engaged`) **et**
  c'est le seul engagement actif du projet.
- **Ouvrir un fil `project_architect`** : admin seulement, architecte retenu, fil inexistant.
- **Écrire** : admin partout ; porteur dans les fils de ses projets ; architecte dans son fil
  d'admission et dans un fil projet **tant qu'il est retenu** (sinon lecture seule).
- **Modifier / supprimer** : l'auteur, dans les **5 minutes** suivant `created_at`, si le message
  n'est pas déjà supprimé. La suppression efface le texte affiché et retire les pièces jointes
  (mention « message supprimé ») ; l'ancienne version va dans `message_revisions`.
- **Pièces jointes** : extensions `pdf jpg jpeg png webp heic heif docx xlsx dwg dxf`, ≤ 25 Mo,
  ≤ 5 par message, nom de fichier nettoyé (pas de chemin, longueur bornée).
- **« Vu »** : un message est vu quand l'autre côté a un `last_read_at` postérieur à sa date
  (côté admin : n'importe quel admin).
- **Non-lus** : messages de l'autre côté postérieurs à mon `last_read_at`.
- **E-mail** : au destinataire de l'autre côté (propriétaire, ou adresse admin
  `RELIOTE_ADMIN_EMAIL`), si aucun e-mail depuis 1 h **ou** s'il a lu depuis le dernier e-mail.
- **Transmettre** (admin) : d'un fil `project_architect` vers le `project_client` du même projet,
  ou l'inverse. Avant le RDV confirmé (engagement non `engaged`), la case « J'ai vérifié que ce
  document ne révèle ni identité ni coordonnées » est obligatoire. Le fichier est **copié** ; le
  nouveau message est signé « Reliote ».
- **Affichage de l'auteur** : côté porteur et architecte, tout message admin est signé
  « Reliote » ; jamais le nom de l'admin.

## 5. Écrans

- Composant de conversation partagé (client) : 50 derniers messages + « Voir les plus anciens »,
  zone de saisie, « Joindre » (≤ 5 fichiers, progression), Modifier / Supprimer pendant 5 min,
  « Vu », bandeau lecture seule, plein écran sur mobile. Envoi optimiste ; échec → « Non envoyé
  — Réessayer ».
- **Porteur** : `/dashboard/client/messages` (ses projets + non-lus) et
  `/dashboard/client/messages/[projectId]`. Compteur sur le tableau de bord et le menu du compte.
- **Architecte** : `/dashboard/architecte/messages` (admission en tête, fils projet, fermés en bas)
  et `/dashboard/architecte/messages/[threadId]`.
- **Admin** : onglet **Messages** (`/admin/messages`, filtre porteurs / architectes / admissions,
  non-lus en tête, compteur dans la navigation) et `/admin/messages/[threadId]` ; fiche projet :
  section « Messages » (lien fil porteur, bouton « Ouvrir un fil avec l'architecte retenu ») ;
  fiche architecte : lien vers le fil d'admission. Rappel d'anonymat au-dessus de la saisie du fil
  porteur avant le RDV confirmé. Boutons « Transmettre » sur les pièces jointes.

## 6. Temps réel, erreurs

- Le navigateur s'abonne aux changements (`postgres_changes`) des tables ci-dessus filtrés sur le
  fil ouvert ; un événement déclenche un rechargement de la vue du fil par action serveur (le
  rendu — signature « Reliote », « Vu », droits — reste calculé côté serveur).
- À la reconnexion ou au retour sur l'onglet : rechargement complet du fil.
- Pile locale : ajout du service `realtime` (Supabase Realtime) dans `supabase/docker-compose.yml`
  et de sa route Kong `/realtime/v1/`.

## 7. Tests

- Vitest : règles pures (`rules.ts`), validation des fichiers, décision d'e-mail, « Vu » /
  non-lus, gabarits d'e-mail, parité i18n.
- SQL : `supabase/tests/messaging_rls.sql`, exécuté sur la pile locale — un porteur, un architecte
  et un tiers ne voient que ce qu'ils doivent voir.
- Parcours Playwright sur build de production + pile locale : porteur ↔ admin avec pièce jointe,
  ouverture du fil architecte retenu, transmission avec avertissement, modification sous 5 min,
  « Vu », réception en temps réel dans un second onglet, fil fermé en lecture seule ; FR/EN,
  1440 et 375 px.

## 8. Mise en production

Migration 0017 à appliquer sur le Cloud (avec 0015 et 0016) ; vérifier que Realtime est actif sur
le projet Cloud et que les tables sont dans la publication.
