-- supabase/seed.sql
-- Idempotent: re-runnable. Runs AFTER all migrations 0001..0006.

-- pgcrypto lives in the `extensions` schema in supabase/postgres; make functions discoverable.
set search_path = public, extensions, auth;

-- Admin: insert into auth.users directly.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-00000000a001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@reliote.test',
  crypt('ReliotePass2026!', gen_salt('bf')),
  now(),
  jsonb_build_object('role','admin','first_name','Reliote','last_name','Admin','locale','fr'),
  now(), now()
) on conflict (id) do nothing;

-- GoTrue v2.177 cannot scan NULL into the *_token varchar columns. Initialise them
-- to '' for any seeded auth.users row (re-runnable; only affects rows where the field is NULL).
update auth.users
  set confirmation_token         = coalesce(confirmation_token, ''),
      recovery_token             = coalesce(recovery_token, ''),
      email_change_token_new     = coalesce(email_change_token_new, ''),
      email_change_token_current = coalesce(email_change_token_current, ''),
      email_change               = coalesce(email_change, ''),
      phone_change               = coalesce(phone_change, ''),
      phone_change_token         = coalesce(phone_change_token, ''),
      reauthentication_token     = coalesce(reauthentication_token, '')
  where email = 'admin@reliote.test';

update public.profiles set role = 'admin', first_name = 'Reliote', last_name = 'Admin'
  where id = '00000000-0000-0000-0000-00000000a001';

-- 8 architects (from the locked design's data.jsx) — names split first/last; fees in EUR.
-- ordre_number included up-front so the CHECK constraint holds on a fresh DB.
insert into architect_profiles (id, first_name, last_name, structure, ordre_number, email, city, specialties, years_experience, project_types, description, portfolio_url, photo_url, languages, rating, availability, fee_currency, fee_amount, status) values
('00000000-0000-0000-0000-0000000a0001','Aïssata','N''Guessan','Atelier Faïdhèrbe','2014/418/1','aissata@atelier-faidherbe.test','Cocody, Abidjan','{Résidentiel,Hospitalité}',12,'{residential,hospitality}','Travail sensible sur la lumière naturelle tropicale et la maîtrise des volumes en béton brut.','https://atelier-faidherbe.test','https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.9,'available','EUR',48000,'verified'),
('00000000-0000-0000-0000-0000000a0002','Bakary','Traoré','Forme & Latitude','2008/318/2','bakary@forme-latitude.test','Plateau, Abidjan','{Commercial,Urbain}',18,'{commercial,urban}','Spécialiste tertiaire et tours mixtes. Études de structure intégrées, certifications HQE Tropical.','https://forme-latitude.test','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN,DE}',4.8,'busy','EUR',90000,'verified'),
('00000000-0000-0000-0000-0000000a0003','Clémentine','Yao','Studio Asa','2017/441/3','clementine@studio-asa.test','Bingerville','{Résidentiel,Culturel}',9,'{residential,cultural}','Maisons-jardin, espaces culturels. Approche éditoriale, attention aux finitions.','https://studio-asa.test','https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN,IT}',5.0,'available','EUR',36000,'verified'),
('00000000-0000-0000-0000-0000000a0004','Daniel K.','Diallo','Parallèle Architectes','2011/364/4','daniel@parallele-archi.test','Marcory, Abidjan','{Hospitalité,Culturel}',15,'{hospitality,cultural}','Hôtellerie balnéaire et programmes culturels.','https://parallele-archi.test','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.9,'available','EUR',72000,'verified'),
('00000000-0000-0000-0000-0000000a0005','Émilie','Brou','Bureau Lagune','2019/468/5','emilie@bureau-lagune.test','Riviera, Abidjan','{Résidentiel}',7,'{residential}','Villas contemporaines bord de lagune. Rénovation lourde, extensions.','https://bureau-lagune.test','https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.7,'available','EUR',28000,'verified'),
('00000000-0000-0000-0000-0000000a0006','Florent','Achi','Atelier 21','2010/352/6','florent@atelier21.test','Yopougon','{Urbain,Commercial}',16,'{urban,commercial}','Urbanisme opérationnel, masterplans. Pilotage de chantiers complexes.','https://atelier21.test','https://images.unsplash.com/photo-1463453091185-61582044d556?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.8,'busy','EUR',60000,'verified'),
('00000000-0000-0000-0000-0000000a0007','Grace','Kouamé','Studio Rive Est','2016/430/7','grace@rive-est.test','Cocody','{Résidentiel,Hospitalité}',10,'{residential,hospitality}','Architecture résidentielle premium et maisons d''hôtes.','https://rive-est.test','https://images.unsplash.com/photo-1592621385612-4d7129426394?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN,PT}',4.9,'available','EUR',40000,'verified'),
('00000000-0000-0000-0000-0000000a0008','Hervé','N''Doli','Plan B Architectes','2013/395/8','herve@planb-archi.test','Plateau','{Commercial,Culturel}',13,'{commercial,cultural}','Programmes culturels, sièges sociaux et galeries.','https://planb-archi.test','https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.8,'available','EUR',55000,'verified')
on conflict (id) do nothing;

-- 3 demo projects
insert into client_projects (id, client_name, email, project_location, project_type, project_description, required_specialties, budget_range, timeline, status) values
('00000000-0000-0000-0000-0000000c0001','Marie L.','marie.l@example.test','Bingerville · Côte d''Ivoire','residential','Villa contemporaine bord de lagune, 350 m², jardin tropical et bassin.','{Résidentiel}','€500k–€800k','12–18 mois','new'),
('00000000-0000-0000-0000-0000000c0002','Pierre G.','pierre.g@example.test','Plateau · Abidjan','commercial','Siège régional 1200 m² avec espaces collaboratifs et patio intérieur.','{Commercial,Urbain}','€1M–€2M','24 mois','new'),
('00000000-0000-0000-0000-0000000c0003','Sophie M.','sophie.m@example.test','Cocody · Abidjan','hospitality','Maison d''hôtes 8 chambres, restaurant signature, piscine de 25m.','{Hospitalité,Résidentiel}','€350k–€500k','15 mois','new')
on conflict (id) do nothing;
