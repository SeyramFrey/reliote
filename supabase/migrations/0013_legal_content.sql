-- 0013_legal_content.sql
-- Brouillon initial des quatre pages légales créées par 0012.
--
-- ⚠ Ces textes sont un POINT DE DÉPART rédigé à partir de ce que l'application
--   collecte et traite réellement (schéma 0001–0012, sous-traitants Supabase et
--   Resend). Ils n'ont PAS de valeur juridique en l'état et doivent être relus
--   par un professionnel avant publication. Les pages restent `published = false`.
--
--   Les passages entre crochets [ ] désignent des informations que seule
--   l'entreprise détient (raison sociale, immatriculation, adresse, DPO).
--
-- Le `where body_fr = ''` garantit qu'une réapplication ne peut jamais écraser
-- un texte déjà révisé.

-- ── Mentions légales ──────────────────────────────────────────────────────
update public.legal_pages set
  seo_description_fr = 'Éditeur, directeur de publication et hébergeur de la plateforme Reliote.',
  seo_description_en = 'Publisher, publication director and host of the Reliote platform.',
  body_fr = $html$
<h2>Éditeur du site</h2>
<p>Le site Reliote est édité par [RAISON SOCIALE], [FORME JURIDIQUE] au capital de [MONTANT], immatriculée sous le numéro [SIREN / RCCM] et dont le siège social est situé [ADRESSE COMPLÈTE].</p>
<p>Adresse de contact : <a href="mailto:contact@reliote.com">contact@reliote.com</a>.</p>
<h2>Directeur de la publication</h2>
<p>[NOM ET QUALITÉ DU DIRECTEUR DE LA PUBLICATION].</p>
<h2>Hébergement</h2>
<p>L'application est hébergée par [HÉBERGEUR APPLICATIF, ADRESSE].</p>
<p>Les données de la plateforme — base de données, comptes utilisateurs et fichiers déposés — sont hébergées par Supabase, dans la région Europe (Irlande).</p>
<p>Les courriers électroniques transactionnels sont acheminés par Resend.</p>
<h2>Propriété intellectuelle</h2>
<p>L'ensemble des éléments composant le site — structure, textes, identité visuelle, typographies, photographies et code — est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.</p>
<p>Les visuels et descriptifs publiés par les architectes inscrits restent la propriété de leurs auteurs et sont diffusés sur la plateforme avec leur accord.</p>
<h2>Signalement d'un contenu</h2>
<p>Tout contenu que vous estimeriez illicite peut être signalé à <a href="mailto:contact@reliote.com">contact@reliote.com</a> en précisant l'adresse de la page concernée et le motif du signalement.</p>
$html$,
  body_en = $html$
<h2>Publisher</h2>
<p>Reliote is published by [LEGAL NAME], a [LEGAL FORM] with share capital of [AMOUNT], registered under number [REGISTRATION NUMBER], with its registered office at [FULL ADDRESS].</p>
<p>Contact: <a href="mailto:contact@reliote.com">contact@reliote.com</a>.</p>
<h2>Publication director</h2>
<p>[NAME AND ROLE OF THE PUBLICATION DIRECTOR].</p>
<h2>Hosting</h2>
<p>The application is hosted by [APPLICATION HOST, ADDRESS].</p>
<p>Platform data — database, user accounts and uploaded files — is hosted by Supabase in the Europe (Ireland) region.</p>
<p>Transactional email is delivered by Resend.</p>
<h2>Intellectual property</h2>
<p>Every element of this site — structure, text, visual identity, typefaces, photographs and code — is protected by intellectual property law. Reproduction or representation, in whole or in part, without prior written consent is prohibited.</p>
<p>Images and descriptions published by registered architects remain the property of their authors and appear on the platform with their consent.</p>
<h2>Reporting content</h2>
<p>Any content you believe to be unlawful can be reported to <a href="mailto:contact@reliote.com">contact@reliote.com</a>, stating the address of the page concerned and the grounds for the report.</p>
$html$
where slug = 'mentions' and body_fr = '';

-- ── Politique de confidentialité ──────────────────────────────────────────
update public.legal_pages set
  seo_description_fr = 'Données personnelles traitées par Reliote : finalités, bases légales, destinataires, durées de conservation et exercice de vos droits.',
  seo_description_en = 'Personal data processed by Reliote: purposes, legal bases, recipients, retention periods and how to exercise your rights.',
  body_fr = $html$
<p>Reliote met en relation des porteurs de projet avec des architectes exerçant en Afrique. Cette activité suppose de traiter des données personnelles. Ce document décrit lesquelles, pourquoi, pour combien de temps, et quels droits vous pouvez exercer.</p>
<h2>1. Responsable du traitement</h2>
<p>[RAISON SOCIALE], [ADRESSE]. Pour toute question relative à vos données : <a href="mailto:privacy@reliote.com">privacy@reliote.com</a>. [LE CAS ÉCHÉANT : COORDONNÉES DU DÉLÉGUÉ À LA PROTECTION DES DONNÉES].</p>
<h2>2. Données que nous traitons</h2>
<h3>2.1 Compte utilisateur</h3>
<p>Adresse électronique, mot de passe chiffré, rôle (porteur de projet, architecte ou administrateur), date de création. Ces données proviennent de vous, lors de l'inscription.</p>
<h3>2.2 Profil d'architecte</h3>
<p>Nom et prénom, structure ou atelier, ville et pays d'exercice, spécialités, années d'expérience, présentation, fourchette d'honoraires, lien de portfolio, photographie, ainsi que les éléments de vérification professionnelle (diplôme, numéro d'inscription à l'ordre). Ces éléments sont fournis par l'architecte et destinés à être publiés, à l'exception des pièces de vérification, qui restent internes.</p>
<h3>2.3 Demande de projet</h3>
<p>Nature et description du projet, localisation, budget envisagé, calendrier, coordonnées de contact. Une demande peut être déposée sans compte.</p>
<h3>2.4 Mise en relation et rendez-vous</h3>
<p>Résultats de correspondance entre une demande et des profils d'architectes, état d'avancement de la mise en relation, propositions et confirmations de rendez-vous.</p>
<h3>2.5 Données techniques</h3>
<p>Cookies strictement nécessaires au fonctionnement du site, décrits dans la <a href="/fr/legal/cookies">politique de gestion des cookies</a>. Le site ne recourt à aucun outil de mesure d'audience ni de publicité.</p>
<h2>3. Finalités et bases légales</h2>
<ul>
  <li><strong>Fournir le service</strong> — création de compte, dépôt de demande, mise en relation, organisation des rendez-vous. Base légale : exécution du contrat.</li>
  <li><strong>Vérifier les architectes</strong> — contrôle des diplômes et inscriptions professionnelles avant publication d'un profil. Base légale : intérêt légitime à garantir la fiabilité de la plateforme.</li>
  <li><strong>Communiquer</strong> — accusés de réception, propositions et confirmations de rendez-vous. Base légale : exécution du contrat.</li>
  <li><strong>Sécuriser la plateforme</strong> — prévention des abus et des usages frauduleux. Base légale : intérêt légitime.</li>
</ul>
<h2>4. Qui accède à vos données</h2>
<p>L'identité complète d'un architecte et celle d'un porteur de projet ne sont mutuellement révélées qu'à partir du moment où la mise en relation est engagée. Avant cette étape, les profils sont présentés sous forme non nominative.</p>
<p>Nous faisons appel aux sous-traitants suivants :</p>
<ul>
  <li><strong>Supabase</strong> — hébergement de la base de données, de l'authentification et des fichiers déposés, région Europe (Irlande).</li>
  <li><strong>Resend</strong> — acheminement des courriers électroniques transactionnels.</li>
  <li><strong>[HÉBERGEUR APPLICATIF]</strong> — exécution de l'application.</li>
</ul>
<p>Aucune donnée n'est vendue, louée ni cédée à des tiers à des fins publicitaires.</p>
<h2>5. Transferts hors Union européenne</h2>
<p>Les données sont hébergées dans l'Union européenne. Certains sous-traitants peuvent néanmoins accéder à des données depuis un pays tiers dans le cadre de leurs opérations de support ; ces accès sont alors encadrés par les clauses contractuelles types de la Commission européenne.</p>
<h2>6. Durées de conservation</h2>
<ul>
  <li>Compte utilisateur : jusqu'à sa suppression, puis trois mois d'archivage technique.</li>
  <li>Profil d'architecte non validé : douze mois à compter du dépôt.</li>
  <li>Demande de projet sans suite : vingt-quatre mois à compter du dépôt.</li>
  <li>Pièces de vérification professionnelle : durée de publication du profil, puis suppression.</li>
  <li>Journaux techniques : douze mois.</li>
</ul>
<h2>7. Vos droits</h2>
<p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, ainsi que du droit de définir des directives relatives au sort de vos données après votre décès.</p>
<p>Pour les exercer, écrivez à <a href="mailto:privacy@reliote.com">privacy@reliote.com</a>. Une réponse vous sera apportée dans un délai d'un mois. Si la réponse ne vous satisfait pas, vous pouvez saisir la Commission nationale de l'informatique et des libertés (CNIL) ou l'autorité de contrôle de votre pays de résidence.</p>
<h2>8. Sécurité</h2>
<p>Les accès à la base de données sont cloisonnés par des règles de sécurité au niveau des lignes : un compte ne peut lire que les données qui le concernent. Les mots de passe ne sont jamais stockés en clair. Les échanges avec le site sont chiffrés.</p>
<h2>9. Évolution de ce document</h2>
<p>Toute modification substantielle sera portée à la connaissance des utilisateurs. La date de dernière révision figure en tête de cette page.</p>
$html$,
  body_en = $html$
<p>Reliote connects project owners with architects practising in Africa. Doing so requires processing personal data. This document sets out what we process, why, for how long, and what rights you can exercise.</p>
<h2>1. Data controller</h2>
<p>[LEGAL NAME], [ADDRESS]. For any question about your data: <a href="mailto:privacy@reliote.com">privacy@reliote.com</a>. [IF APPLICABLE: DATA PROTECTION OFFICER CONTACT].</p>
<h2>2. Data we process</h2>
<h3>2.1 User account</h3>
<p>Email address, hashed password, role (project owner, architect or administrator), creation date. You provide this when registering.</p>
<h3>2.2 Architect profile</h3>
<p>Name, practice or studio, city and country of practice, specialities, years of experience, biography, fee range, portfolio link, photograph, together with professional verification records (degree, professional register number). Architects provide these; all are intended for publication except the verification records, which stay internal.</p>
<h3>2.3 Project request</h3>
<p>Nature and description of the project, location, intended budget, timeline, contact details. A request can be submitted without an account.</p>
<h3>2.4 Matching and meetings</h3>
<p>Match results between a request and architect profiles, the state of the engagement, and meeting proposals and confirmations.</p>
<h3>2.5 Technical data</h3>
<p>Strictly necessary cookies, described in our <a href="/en/legal/cookies">cookie policy</a>. The site uses no analytics or advertising tools.</p>
<h2>3. Purposes and legal bases</h2>
<ul>
  <li><strong>Providing the service</strong> — account creation, request submission, matching, meeting scheduling. Legal basis: performance of the contract.</li>
  <li><strong>Verifying architects</strong> — checking degrees and professional registrations before a profile is published. Legal basis: legitimate interest in the reliability of the platform.</li>
  <li><strong>Communicating</strong> — acknowledgements, meeting proposals and confirmations. Legal basis: performance of the contract.</li>
  <li><strong>Securing the platform</strong> — preventing abuse and fraudulent use. Legal basis: legitimate interest.</li>
</ul>
<h2>4. Who accesses your data</h2>
<p>The full identity of an architect and that of a project owner are revealed to each other only once the engagement has started. Before that point, profiles are presented without identifying details.</p>
<p>We use the following processors:</p>
<ul>
  <li><strong>Supabase</strong> — database, authentication and file storage hosting, Europe (Ireland) region.</li>
  <li><strong>Resend</strong> — transactional email delivery.</li>
  <li><strong>[APPLICATION HOST]</strong> — running the application.</li>
</ul>
<p>No data is sold, rented or transferred to third parties for advertising purposes.</p>
<h2>5. Transfers outside the European Union</h2>
<p>Data is hosted in the European Union. Some processors may nonetheless access data from a third country as part of support operations; such access is governed by the European Commission's standard contractual clauses.</p>
<h2>6. Retention periods</h2>
<ul>
  <li>User account: until deletion, then three months of technical archiving.</li>
  <li>Unverified architect profile: twelve months from submission.</li>
  <li>Project request with no follow-up: twenty-four months from submission.</li>
  <li>Professional verification records: for as long as the profile is published, then deleted.</li>
  <li>Technical logs: twelve months.</li>
</ul>
<h2>7. Your rights</h2>
<p>You have the right to access, rectify, erase, restrict, object to and port your data, as well as the right to give instructions on what happens to it after your death.</p>
<p>To exercise them, write to <a href="mailto:privacy@reliote.com">privacy@reliote.com</a>. You will receive a reply within one month. If it does not satisfy you, you may lodge a complaint with the French data protection authority (CNIL) or the supervisory authority of your country of residence.</p>
<h2>8. Security</h2>
<p>Database access is partitioned by row-level security rules: an account can only read the data that concerns it. Passwords are never stored in clear text. Traffic to the site is encrypted.</p>
<h2>9. Changes to this document</h2>
<p>Any substantial change will be brought to users' attention. The date of the latest revision appears at the top of this page.</p>
$html$
where slug = 'confidentialite' and body_fr = '';

-- ── Cookies ───────────────────────────────────────────────────────────────
update public.legal_pages set
  seo_description_fr = 'Les cookies déposés par Reliote, leur finalité et leur durée. Aucun traceur publicitaire ni outil de mesure d''audience.',
  seo_description_en = 'Cookies set by Reliote, their purpose and lifetime. No advertising trackers and no analytics.',
  body_fr = $html$
<p>Un cookie est un petit fichier déposé sur votre appareil lors de la consultation d'un site. Reliote n'en dépose que ce qui est nécessaire à son fonctionnement.</p>
<h2>1. Ce que nous déposons</h2>
<table>
  <thead>
    <tr><th>Cookie</th><th>Finalité</th><th>Durée</th></tr>
  </thead>
  <tbody>
    <tr><td>sb-…-auth-token</td><td>Maintient votre session ouverte entre deux pages et après fermeture du navigateur.</td><td>Jusqu'à déconnexion</td></tr>
    <tr><td>NEXT_LOCALE</td><td>Mémorise la langue choisie, française ou anglaise.</td><td>12 mois</td></tr>
  </tbody>
</table>
<h2>2. Ce que nous ne déposons pas</h2>
<p>Aucun cookie publicitaire, aucun traceur tiers, aucun outil de mesure d'audience. Nous ne construisons pas de profil de navigation et ne partageons aucune donnée de navigation avec des régies.</p>
<h2>3. Pourquoi aucun bandeau de consentement</h2>
<p>Les cookies ci-dessus sont strictement nécessaires à la fourniture du service que vous demandez : sans eux, vous ne pourriez ni rester connecté, ni conserver votre langue. À ce titre, ils sont dispensés de recueil du consentement. Si un outil de mesure d'audience devait être ajouté, un bandeau de consentement serait mis en place et ce document mis à jour.</p>
<h2>4. Gérer les cookies</h2>
<p>Vous pouvez à tout moment supprimer les cookies déposés ou les bloquer depuis les réglages de votre navigateur. Le blocage des cookies de session vous empêchera de vous connecter à votre espace.</p>
$html$,
  body_en = $html$
<p>A cookie is a small file placed on your device when you visit a site. Reliote sets only what the service needs to work.</p>
<h2>1. What we set</h2>
<table>
  <thead>
    <tr><th>Cookie</th><th>Purpose</th><th>Lifetime</th></tr>
  </thead>
  <tbody>
    <tr><td>sb-…-auth-token</td><td>Keeps you signed in between pages and after closing the browser.</td><td>Until sign-out</td></tr>
    <tr><td>NEXT_LOCALE</td><td>Remembers the language you chose, French or English.</td><td>12 months</td></tr>
  </tbody>
</table>
<h2>2. What we do not set</h2>
<p>No advertising cookies, no third-party trackers, no analytics. We do not build browsing profiles and we share no browsing data with ad networks.</p>
<h2>3. Why there is no consent banner</h2>
<p>The cookies above are strictly necessary to deliver the service you asked for: without them you could neither stay signed in nor keep your language. On that basis they are exempt from consent. Should an analytics tool ever be added, a consent banner would be introduced and this document updated.</p>
<h2>4. Managing cookies</h2>
<p>You can delete or block cookies at any time from your browser settings. Blocking session cookies will prevent you from signing in.</p>
$html$
where slug = 'cookies' and body_fr = '';

-- ── Conditions générales d'utilisation ────────────────────────────────────
update public.legal_pages set
  seo_description_fr = 'Conditions d''utilisation de la plateforme Reliote : inscription, vérification des architectes, mise en relation, responsabilités.',
  seo_description_en = 'Terms governing use of the Reliote platform: registration, architect verification, introductions, liability.',
  body_fr = $html$
<h2>1. Objet</h2>
<p>Les présentes conditions régissent l'accès et l'utilisation de la plateforme Reliote, qui met en relation des porteurs de projet avec des architectes exerçant en Afrique. Utiliser la plateforme vaut acceptation de ces conditions.</p>
<h2>2. Définitions</h2>
<ul>
  <li><strong>Porteur de projet</strong> — personne physique ou morale déposant une demande sur la plateforme.</li>
  <li><strong>Architecte</strong> — professionnel dont le profil a été soumis puis vérifié par Reliote.</li>
  <li><strong>Mise en relation</strong> — présentation réciproque d'un porteur de projet et d'un architecte à l'issue du processus de correspondance.</li>
</ul>
<h2>3. Accès et inscription</h2>
<p>Déposer une demande de projet ne requiert pas de compte. La consultation de son espace personnel, la candidature en tant qu'architecte et le suivi d'une mise en relation nécessitent un compte.</p>
<p>Vous vous engagez à fournir des informations exactes et à les tenir à jour. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité menée depuis votre compte.</p>
<h2>4. Vérification des architectes</h2>
<p>Un profil d'architecte n'est publié qu'après contrôle des éléments professionnels transmis, notamment le diplôme et, le cas échéant, l'inscription à un ordre. Reliote se réserve le droit de refuser, suspendre ou retirer un profil dont les éléments s'avéreraient inexacts, incomplets ou obsolètes.</p>
<p>Cette vérification porte sur les qualifications déclarées. Elle ne constitue ni une garantie de la qualité des prestations, ni un agrément, ni une recommandation.</p>
<h2>5. Rôle de Reliote</h2>
<p>Reliote est un intermédiaire. La plateforme organise la présentation de profils et l'organisation de premiers rendez-vous. Elle n'est ni partie au contrat de maîtrise d'œuvre éventuellement conclu entre un porteur de projet et un architecte, ni maître d'œuvre, ni garante de la bonne exécution de la mission.</p>
<p>Les honoraires, le périmètre de la mission, les délais et les modalités d'exécution relèvent exclusivement de la relation entre le porteur de projet et l'architecte.</p>
<h2>6. Engagements des utilisateurs</h2>
<p>Vous vous interdisez notamment de déposer des contenus faux, trompeurs, diffamatoires ou portant atteinte aux droits de tiers ; d'usurper une identité ou une qualité professionnelle ; d'extraire massivement les données de la plateforme par quelque moyen automatisé que ce soit ; de contourner les mesures techniques de protection.</p>
<h2>7. Contenus publiés</h2>
<p>Vous conservez la propriété des contenus que vous déposez. Vous concédez à Reliote une licence non exclusive et gratuite d'affichage de ces contenus sur la plateforme et dans ses communications, pour la durée de leur publication.</p>
<p>Vous garantissez détenir les droits nécessaires sur les visuels transmis, notamment sur les photographies de réalisations.</p>
<h2>8. Responsabilité</h2>
<p>Reliote met en œuvre les moyens raisonnables pour assurer la disponibilité et l'exactitude de la plateforme, sans garantie d'absence d'interruption ou d'erreur. Sa responsabilité ne saurait être engagée à raison des relations contractuelles nouées entre utilisateurs, ni des dommages indirects.</p>
<h2>9. Suspension et résiliation</h2>
<p>Vous pouvez fermer votre compte à tout moment. Reliote peut suspendre ou fermer un compte en cas de manquement aux présentes conditions, après information de l'utilisateur sauf urgence ou obligation légale.</p>
<h2>10. Données personnelles</h2>
<p>Le traitement des données personnelles est décrit dans la <a href="/fr/legal/confidentialite">politique de confidentialité</a>.</p>
<h2>11. Modification des conditions</h2>
<p>Ces conditions peuvent évoluer. Les utilisateurs disposant d'un compte sont informés de toute modification substantielle. La date de dernière révision figure en tête de cette page.</p>
<h2>12. Droit applicable et différends</h2>
<p>Les présentes conditions sont soumises au droit [DROIT APPLICABLE]. En cas de différend, les parties rechercheront une solution amiable avant toute action contentieuse. À défaut, compétence est attribuée aux tribunaux de [JURIDICTION COMPÉTENTE], sous réserve des règles impératives protectrices des consommateurs.</p>
$html$,
  body_en = $html$
<h2>1. Purpose</h2>
<p>These terms govern access to and use of the Reliote platform, which connects project owners with architects practising in Africa. Using the platform means accepting these terms.</p>
<h2>2. Definitions</h2>
<ul>
  <li><strong>Project owner</strong> — an individual or organisation submitting a request on the platform.</li>
  <li><strong>Architect</strong> — a professional whose profile has been submitted and then verified by Reliote.</li>
  <li><strong>Introduction</strong> — the mutual disclosure of a project owner and an architect at the end of the matching process.</li>
</ul>
<h2>3. Access and registration</h2>
<p>Submitting a project request requires no account. Viewing your personal space, applying as an architect and following an introduction all require one.</p>
<p>You undertake to provide accurate information and keep it up to date. You are responsible for keeping your credentials confidential and for any activity carried out from your account.</p>
<h2>4. Architect verification</h2>
<p>An architect profile is published only after the professional records provided have been checked, in particular the degree and, where applicable, registration with a professional body. Reliote may refuse, suspend or withdraw a profile whose records prove inaccurate, incomplete or out of date.</p>
<p>This verification covers declared qualifications. It is neither a guarantee of the quality of the work, nor an approval, nor a recommendation.</p>
<h2>5. Reliote's role</h2>
<p>Reliote is an intermediary. The platform arranges the presentation of profiles and the scheduling of first meetings. It is not a party to any project contract concluded between a project owner and an architect, does not act as project manager, and does not guarantee the proper performance of the work.</p>
<p>Fees, scope, timelines and delivery terms fall exclusively within the relationship between the project owner and the architect.</p>
<h2>6. User undertakings</h2>
<p>You must not, in particular: post false, misleading or defamatory content, or content infringing the rights of others; impersonate a person or a professional capacity; extract platform data in bulk by any automated means; or circumvent technical protection measures.</p>
<h2>7. Published content</h2>
<p>You retain ownership of the content you submit. You grant Reliote a non-exclusive, royalty-free licence to display that content on the platform and in its communications, for as long as it remains published.</p>
<p>You warrant that you hold the necessary rights to the images you provide, in particular photographs of completed work.</p>
<h2>8. Liability</h2>
<p>Reliote takes reasonable steps to keep the platform available and accurate, without guaranteeing uninterrupted or error-free operation. It cannot be held liable for contractual relationships formed between users, nor for indirect damages.</p>
<h2>9. Suspension and termination</h2>
<p>You may close your account at any time. Reliote may suspend or close an account in the event of a breach of these terms, having informed the user except in cases of urgency or legal obligation.</p>
<h2>10. Personal data</h2>
<p>The processing of personal data is described in the <a href="/en/legal/confidentialite">privacy policy</a>.</p>
<h2>11. Changes to these terms</h2>
<p>These terms may change. Account holders are informed of any substantial modification. The date of the latest revision appears at the top of this page.</p>
<h2>12. Governing law and disputes</h2>
<p>These terms are governed by [GOVERNING LAW]. In the event of a dispute, the parties will seek an amicable solution before any legal action. Failing that, jurisdiction lies with the courts of [COMPETENT JURISDICTION], subject to mandatory consumer protection rules.</p>
$html$
where slug = 'cgu' and body_fr = '';
