-- Filtrage des identifiants et des noms affichés : insultes, injures racistes,
-- antisémites, homophobes, apologie nazie.
--
-- Appliquée le 3 août 2026 par le serveur MCP Supabase. Idempotent.
--
-- ---------------------------------------------------------------------------
-- Pourquoi en base et pas dans le front
-- ---------------------------------------------------------------------------
--
-- Un compte connecté peut écrire directement sur PostgREST, la RLS l'autorise
-- sur sa propre ligne. Tout contrôle posé dans l'écran de saisie serait donc
-- décoratif : il faut que le refus vienne du déclencheur, comme la liste des
-- identifiants réservés.
--
-- ---------------------------------------------------------------------------
-- Une table, pas un tableau en dur
-- ---------------------------------------------------------------------------
--
-- `identifiant_reserve` porte sa liste dans son corps parce qu'elle ne bougera
-- plus : ce sont les noms du site. Celle-ci bougera à chaque contournement
-- trouvé, et une liste qui s'étend par migration ne s'étend pas. D'où une
-- table, modifiable par un `insert` d'une ligne depuis l'éditeur SQL.
--
-- Elle n'est lisible par personne : ni `anon` ni `authenticated` n'ont de
-- privilège dessus. Les deux fonctions qui l'interrogent sont `security
-- definer` et ne rendent qu'un booléen. Publier la liste, ce serait publier le
-- mode d'emploi du contournement.
--
-- ---------------------------------------------------------------------------
-- Ce que ça ne fait pas
-- ---------------------------------------------------------------------------
--
-- **Une liste de mots est toujours en retard.** Elle attrape le cas courant,
-- pas quelqu'un qui cherche. Ce qui manque et qui compte davantage, c'est un
-- signalement depuis la page de profil : c'est le seul mécanisme qui apprenne
-- des mots qu'on n'a pas prévus. À écrire.

-- ---------------------------------------------------------------------------
-- Repli d'écriture
-- ---------------------------------------------------------------------------

-- Minuscules, accents retirés, tout ce qui n'est pas alphanumérique effacé.
--
-- Le souligné disparaît ici, et c'est le point : `s_a_l_o_p_e` et `salope` se
-- replient sur la même chaîne. Même chose pour les espaces d'un nom affiché.
--
-- `stable` et non `immutable` : `unaccent` dépend d'un dictionnaire, donc
-- Postgres la déclare `stable`, et une fonction ne peut pas être plus stricte
-- que ce qu'elle appelle. Sans conséquence, elle ne sert dans aucun index.
create or replace function public.repli_brut(p_texte text)
  returns text
  language sql
  stable
  set search_path = ''
as $$
  select regexp_replace(
    lower(extensions.unaccent(coalesce(p_texte, ''))),
    '[^a-z0-9]', '', 'g');
$$;

-- Le même, chiffres repliés sur les lettres qu'ils imitent : `n1gg3r` devient
-- `nigger`, `s4l0p3` devient `salope`.
--
-- Les deux formes sont conservées et testées toutes les deux, parce que le
-- repli en détruit une partie : `1488`, code néonazi, devient `iabb` et ne
-- ressemble plus à rien. C'est `repli_brut` qui l'attrape.
create or replace function public.repli_lettres(p_texte text)
  returns text
  language sql
  stable
  set search_path = ''
as $$
  select regexp_replace(
    translate(public.repli_brut(p_texte), '0123456789', 'oizeasgtbg'),
    '[^a-z]', '', 'g');
$$;

-- ---------------------------------------------------------------------------
-- La liste
-- ---------------------------------------------------------------------------

create table if not exists public.identifiants_interdits (
  -- Déjà replié : on compare du replié à du replié.
  motif text primary key,

  -- `sous_chaine` : le motif suffit à refuser, où qu'il soit dans la saisie.
  -- Réservé aux mots qu'aucun mot légitime ne contient.
  --
  -- `exact` : refusé seulement si la saisie entière vaut le motif. C'est le
  -- mode des mots courts ou ambigus, et il y en a plus qu'on ne croit :
  -- « salope » est dans « salopette », « pute » dans « dispute » et
  -- « réputé », « nazi » dans le prénom Nazim, « pédo » dans « pédologie »,
  -- « râpe » est un ustensile. Une correspondance en sous-chaîne sur ces
  -- mots-là refuserait des pseudonymes parfaitement innocents.
  mode  text not null default 'sous_chaine'
        check (mode in ('sous_chaine', 'exact')),

  -- À quoi sert l'entrée. Sert à la relire dans six mois sans se demander
  -- pourquoi tel mot est là, et à retrouver un faux positif par catégorie.
  note  text
);

alter table public.identifiants_interdits enable row level security;
-- Aucun privilège, aucune policy : la table n'est atteignable que par le
-- propriétaire de la base. Les fonctions ci-dessous sont la seule lecture.
revoke all on table public.identifiants_interdits from anon, authenticated;

-- `on conflict do nothing` : rejouable, et surtout un mode corrigé à la main
-- après un faux positif ne sera pas réécrit par une relecture du fichier.
insert into public.identifiants_interdits (motif, mode, note) values
  -- Injures racistes
  ('nigger',        'sous_chaine', 'raciste'),
  ('nigga',         'sous_chaine', 'raciste'),
  ('niggah',        'sous_chaine', 'raciste'),
  ('negresse',      'sous_chaine', 'raciste'),
  ('negrillon',     'sous_chaine', 'raciste'),
  ('bamboula',      'sous_chaine', 'raciste'),
  ('bougnoule',     'sous_chaine', 'raciste'),
  ('chinetoque',    'sous_chaine', 'raciste'),
  ('crouille',      'sous_chaine', 'raciste'),
  ('negro',         'exact',       'raciste, mais mot courant en espagnol et portugais'),
  ('negre',         'exact',       'raciste selon l usage, mot legitime par ailleurs'),
  ('bicot',         'exact',       'raciste, mot court'),
  ('salearabe',     'sous_chaine', 'raciste'),
  ('salenoir',      'sous_chaine', 'raciste'),
  ('salenegre',     'sous_chaine', 'raciste'),
  ('saleblanc',     'sous_chaine', 'raciste'),
  ('salebeur',      'sous_chaine', 'raciste'),
  ('salerace',      'sous_chaine', 'raciste'),
  ('whitepower',    'sous_chaine', 'suprematiste'),
  ('whitepride',    'sous_chaine', 'suprematiste'),
  ('kkk',           'exact',       'suprematiste'),

  -- Antisémitisme et apologie nazie
  ('youpin',        'sous_chaine', 'antisemite'),
  ('youpine',       'sous_chaine', 'antisemite'),
  ('salejuif',      'sous_chaine', 'antisemite'),
  ('salejuive',     'sous_chaine', 'antisemite'),
  ('mortauxjuifs',  'sous_chaine', 'antisemite'),
  ('gazlesjuifs',   'sous_chaine', 'antisemite'),
  ('feuj',          'exact',       'verlan, parfois auto-designation, donc exact seulement'),
  ('hitler',        'sous_chaine', 'apologie'),
  ('heilhitler',    'sous_chaine', 'apologie'),
  ('siegheil',      'sous_chaine', 'apologie'),
  ('hitlerien',     'sous_chaine', 'apologie'),
  ('nazisme',       'sous_chaine', 'apologie'),
  ('nazi',          'exact',       'apologie, mais present dans le prenom Nazim'),
  ('1488',          'sous_chaine', 'code neonazi, attrape par repli_brut, pas par repli_lettres'),
  ('88',            'exact',       'code neonazi, mais aussi une annee de naissance, donc exact'),

  -- Injures homophobes et transphobes
  ('tarlouze',      'sous_chaine', 'homophobe'),
  ('pedale',        'exact',       'homophobe, mais une pedale est une piece de velo'),
  ('tapette',       'exact',       'homophobe, mais une tapette est un ustensile'),
  ('pd',            'exact',       'homophobe, deux lettres'),
  ('travelo',       'sous_chaine', 'transphobe'),

  -- Pédocriminalité
  ('pedophile',     'sous_chaine', 'pedocriminalite'),
  ('pedocriminel',  'sous_chaine', 'pedocriminalite'),
  ('pedo',          'exact',       'pedocriminalite, mais present dans pedologie et pedometre'),

  -- Injures ordinaires
  ('encul',         'sous_chaine', 'injure, couvre encule et enculer'),
  ('connard',       'sous_chaine', 'injure'),
  ('connasse',      'sous_chaine', 'injure'),
  ('salopard',      'sous_chaine', 'injure'),
  ('enfoire',       'sous_chaine', 'injure'),
  ('salaud',        'sous_chaine', 'injure'),
  ('putain',        'sous_chaine', 'injure'),
  ('niquetamere',   'sous_chaine', 'injure'),
  ('violeur',       'sous_chaine', 'injure'),
  ('salope',        'exact',       'injure, mais presente dans salopette'),
  ('pute',          'exact',       'injure, mais presente dans dispute et repute'),
  ('batard',        'exact',       'injure, mais un batard est aussi un pain'),
  ('chienne',       'exact',       'injure selon l usage, mot legitime par ailleurs'),
  ('merde',         'exact',       'grossierete'),
  ('fdp',           'exact',       'injure, trois lettres')
on conflict (motif) do nothing;

-- ---------------------------------------------------------------------------
-- Le contrôle
-- ---------------------------------------------------------------------------

-- Vrai si la saisie tombe sur la liste, sous l'une ou l'autre de ses deux
-- formes repliées.
--
-- `strpos` et non `like '%' || motif || '%'` : un motif contenant `%` ou `_`
-- serait un joker et refuserait tout. La table n'est écrite que par le
-- propriétaire, donc le risque est théorique, mais il ne coûte rien d'écarter.
create or replace function public.texte_interdit(p_texte text)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
    from public.identifiants_interdits i,
         lateral (select public.repli_brut(p_texte) as brut,
                         public.repli_lettres(p_texte) as lettres) r
    where case i.mode
            when 'exact' then r.brut = i.motif or r.lettres = i.motif
            else strpos(r.brut, i.motif) > 0 or strpos(r.lettres, i.motif) > 0
          end
  );
$$;

revoke all on function public.texte_interdit(text) from public, anon;
-- `authenticated` en a besoin : le déclencheur d'écriture s'exécute avec les
-- droits de l'appelant, et c'est lui qui appelle cette fonction.
grant execute on function public.texte_interdit(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Application à l'écriture
-- ---------------------------------------------------------------------------

-- Le déclencheur de `profils`, complété. Il contrôle **les deux** colonnes
-- publiques : l'identifiant, mais aussi le nom affiché, qui est libre, plus
-- long, et paraît juste à côté sur la page. Ne filtrer que le premier aurait
-- fait un garde-fou décoratif.
--
-- Les messages distinguent les deux colonnes pour que l'écran sache quel champ
-- montrer en rouge. Ils ne disent pas *pourquoi*, voir `etat_identifiant`.
create or replace function public.profils_normaliser()
  returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.identifiant := lower(btrim(coalesce(new.identifiant, '')));
  new.nom := btrim(coalesce(new.nom, ''));

  -- 23514 : violation de contrainte. PostgREST le rend en 400, là où une
  -- exception sans code sortirait en 500, c'est-à-dire en « panne du site »
  -- pour une saisie que l'utilisateur peut corriger.
  if public.identifiant_reserve(new.identifiant)
     or public.texte_interdit(new.identifiant) then
    raise exception 'identifiant indisponible' using errcode = '23514';
  end if;

  if public.texte_interdit(new.nom) then
    raise exception 'nom indisponible' using errcode = '23514';
  end if;

  new.maj_le := now();
  return new;
end;
$$;

-- La vérification en direct, complétée elle aussi.
--
-- **Elle rend `reserve` pour les deux causes, et c'est délibéré.** Répondre
-- « cet identifiant est interdit » désigne exactement la mutation qui a
-- échoué, donc apprend à contourner une entrée à la fois. L'écran affiche
-- « Cet identifiant n'est pas disponible », qui est vrai dans les deux cas et
-- n'apprend rien.
--
-- Contrepartie assumée : quelqu'un qui tombe sur un faux positif ne comprend
-- pas pourquoi. C'est ce que l'adresse de contact est là pour rattraper, et
-- c'est le sens de la colonne `note`, qui permet de retrouver l'entrée
-- fautive.
create or replace function public.etat_identifiant(p_identifiant text)
  returns text
  language plpgsql
  stable
  security definer
  set search_path = ''
as $$
declare
  v_id text := lower(btrim(coalesce(p_identifiant, '')));
begin
  if auth.uid() is null then
    raise exception 'aucune session';
  end if;
  if v_id !~ '^[a-z0-9_]{3,20}$' then
    return 'invalide';
  end if;
  if public.identifiant_reserve(v_id) or public.texte_interdit(v_id) then
    return 'reserve';
  end if;
  if exists (
    select 1 from public.profils p
     where p.identifiant = v_id
       and p.user_id is distinct from auth.uid()
  ) then
    return 'pris';
  end if;
  return 'libre';
end;
$$;

revoke all on function public.etat_identifiant(text) from public, anon;
grant execute on function public.etat_identifiant(text) to authenticated;
