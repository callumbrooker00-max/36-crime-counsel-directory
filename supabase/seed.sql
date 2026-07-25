-- Seed data. Taxonomy values are PLACEHOLDERS pending confirmation against
-- current CPS panel guidance (data-model.md D-DM4 / PRD R8). All counsel below
-- are FICTIONAL, for building against — real data is migrated in slice 8.
-- Panels & grades are global (chambers_id NULL); practice areas & most roles
-- are tenant-scoped (data-model.md §8, D-DM2 recommended default).

-- ---- Tenant ----
insert into public.chambers (name, slug) values ('The 36 Group', '36-crime');

-- ---- CPS panels (global) ----
insert into public.panels (chambers_id, name, slug, type, display_order) values
  (null, 'General Crime',     'general-crime',     'general',    1),
  (null, 'RASSO',             'rasso',             'specialist', 2),
  (null, 'Serious Crime',     'serious-crime',     'specialist', 3),
  (null, 'Fraud',             'fraud',             'specialist', 4),
  (null, 'Proceeds of Crime', 'proceeds-of-crime', 'specialist', 5),
  (null, 'Counter-Terrorism', 'counter-terrorism', 'specialist', 6),
  (null, 'Extradition',       'extradition',       'specialist', 7);

-- ---- Advocacy grades (global) ----
insert into public.grades (chambers_id, name, slug, rank) values
  (null, 'Level 1', 'level-1', 1),
  (null, 'Level 2', 'level-2', 2),
  (null, 'Level 3', 'level-3', 3),
  (null, 'Level 4', 'level-4', 4);

-- ---- Appointments (KC/Junior/Recorder/DHCJ global; Head of Chambers tenant) ----
insert into public.roles (chambers_id, name, slug, abbreviation, display_order) values
  (null, 'King''s Counsel',           'kc',                       'KC',   1),
  (null, 'Junior',                    'junior',                   null,   2),
  (null, 'Recorder',                  'recorder',                 null,   3),
  (null, 'Deputy High Court Judge',   'deputy-high-court-judge',  'DHCJ', 4);
insert into public.roles (chambers_id, name, slug, display_order)
  select id, 'Head of Chambers', 'head-of-chambers', 5 from public.chambers where slug = '36-crime';

-- ---- Practice areas (tenant) ----
insert into public.practice_areas (chambers_id, name, slug, display_order)
  select c.id, v.name, v.slug, v.ord
  from public.chambers c
  cross join (values
    ('Homicide',                 'homicide',                1),
    ('Serious sexual offences',  'serious-sexual-offences', 2),
    ('Fraud & financial crime',  'fraud-financial-crime',   3),
    ('Drugs',                    'drugs',                   4),
    ('Regulatory',               'regulatory',              5),
    ('Proceeds of crime (POCA)', 'poca',                    6),
    ('Terrorism',                'terrorism',               7)
  ) as v(name, slug, ord)
  where c.slug = '36-crime';

-- ---- Counsel (fictional, published) ----
insert into public.counsel (chambers_id, full_name, slug, year_of_call, practice_capacity, short_bio, status)
  select c.id, v.full_name, v.slug, v.yoc, v.cap::public.practice_capacity, v.bio, 'published'
  from public.chambers c
  cross join (values
    ('Eleanor Whitfield KC', 'eleanor-whitfield', 1994::smallint, 'both',
     'Leading silk in homicide and serious sexual offences, instructed for prosecution and defence in cases of the utmost gravity.'),
    ('Marcus Adeyemi', 'marcus-adeyemi', 2005::smallint, 'prosecution',
     'Specialist fraud and financial-crime junior, regularly instructed by the CPS in complex multi-handed prosecutions.'),
    ('Priya Nair', 'priya-nair', 2011::smallint, 'both',
     'RASSO-panel junior with a substantial practice in serious sexual offences and homicide.'),
    ('Thomas Beckwith KC', 'thomas-beckwith', 1999::smallint, 'defence',
     'Silk specialising in terrorism and serious organised crime, with extensive experience of high-security trials.'),
    ('Sofia Marchetti', 'sofia-marchetti', 2014::smallint, 'both',
     'Junior building a broad practice across general crime, fraud and drugs.'),
    ('James Okonkwo KC', 'james-okonkwo', 1988::smallint, 'both',
     'Head of Chambers and senior silk with a leading proceeds-of-crime and regulatory practice.')
  ) as v(full_name, slug, yoc, cap, bio)
  where c.slug = '36-crime';

-- ---- Appointments per counsel ---- (values-first so the alias is in scope)
insert into public.counsel_roles (counsel_id, role_id, since_year)
  select co.id, r.id, v.since
  from (values
    ('eleanor-whitfield', 'kc',                       2018::smallint),
    ('eleanor-whitfield', 'recorder',                 2016::smallint),
    ('marcus-adeyemi',    'junior',                    null::smallint),
    ('priya-nair',        'junior',                    null::smallint),
    ('thomas-beckwith',   'kc',                        2015::smallint),
    ('sofia-marchetti',   'junior',                    null::smallint),
    ('james-okonkwo',     'kc',                        2007::smallint),
    ('james-okonkwo',     'deputy-high-court-judge',   2019::smallint),
    ('james-okonkwo',     'head-of-chambers',          2021::smallint)
  ) as v(counsel_slug, role_slug, since)
  join public.counsel co on co.slug = v.counsel_slug
  join public.roles r on r.slug = v.role_slug;

-- ---- Practice areas per counsel (one primary each) ----
insert into public.counsel_practice_areas (counsel_id, practice_area_id, is_primary)
  select co.id, pa.id, v.is_primary
  from (values
    ('eleanor-whitfield', 'homicide',                true),
    ('eleanor-whitfield', 'serious-sexual-offences', false),
    ('marcus-adeyemi',    'fraud-financial-crime',   true),
    ('marcus-adeyemi',    'poca',                    false),
    ('priya-nair',        'serious-sexual-offences', true),
    ('priya-nair',        'homicide',                false),
    ('thomas-beckwith',   'terrorism',               true),
    ('thomas-beckwith',   'homicide',                false),
    ('sofia-marchetti',   'fraud-financial-crime',   true),
    ('sofia-marchetti',   'drugs',                   false),
    ('james-okonkwo',     'poca',                    true),
    ('james-okonkwo',     'regulatory',              false)
  ) as v(counsel_slug, area_slug, is_primary)
  join public.counsel co on co.slug = v.counsel_slug
  join public.practice_areas pa on pa.slug = v.area_slug;

-- ---- Panel memberships (the flagship data: panel + grade) ----
insert into public.panel_memberships (counsel_id, panel_id, grade_id, status, date_admitted)
  select co.id, p.id, g.id, 'active', v.admitted
  from (values
    ('eleanor-whitfield', 'rasso',             'level-4', date '2016-04-01'),
    ('eleanor-whitfield', 'serious-crime',     'level-4', date '2015-01-01'),
    ('marcus-adeyemi',    'general-crime',     'level-4', date '2019-09-01'),
    ('marcus-adeyemi',    'fraud',             'level-3', date '2020-01-01'),
    ('priya-nair',        'rasso',             'level-3', date '2021-06-01'),
    ('priya-nair',        'general-crime',     'level-2', date '2019-01-01'),
    ('thomas-beckwith',   'serious-crime',     'level-4', date '2017-03-01'),
    ('thomas-beckwith',   'counter-terrorism', null,      date '2018-05-01'),
    ('sofia-marchetti',   'general-crime',     'level-2', date '2021-01-01'),
    ('sofia-marchetti',   'fraud',             'level-2', date '2022-02-01'),
    ('james-okonkwo',     'proceeds-of-crime', 'level-4', date '2012-01-01'),
    ('james-okonkwo',     'rasso',             'level-4', date '2013-01-01')
  ) as v(counsel_slug, panel_slug, grade_slug, admitted)
  join public.counsel co on co.slug = v.counsel_slug
  join public.panels p on p.slug = v.panel_slug
  left join public.grades g on g.slug = v.grade_slug;

-- ---- A couple of notable cases ----
insert into public.notable_cases (counsel_id, title, citation, year, court, role_in_case, summary)
  select co.id, v.title, v.citation, v.yr, v.court, v.role_in_case, v.summary
  from (values
    ('eleanor-whitfield', 'R v A', '[2023] EWCA Crim 101', 2023::smallint, 'Court of Appeal',
     'Leading counsel, prosecution', 'Appeal concerning fresh evidence in a historic homicide.'),
    ('james-okonkwo',     'R v B', '[2022] EWCA Crim 233', 2022::smallint, 'Court of Appeal',
     'Leading counsel, defence', 'Confiscation proceedings raising the reach of the criminal-lifestyle assumptions.')
  ) as v(counsel_slug, title, citation, yr, court, role_in_case, summary)
  join public.counsel co on co.slug = v.counsel_slug;
