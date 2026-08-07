import { identiteCourante } from "./auth";
import { majProfil } from "./profils";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/**
 * La photo de profil : recadrage, dépôt, effacement.
 *
 * ## Pourquoi il n'y a pas de client Storage
 *
 * Le site parle directement à PostgREST plutôt que d'instancier
 * `@supabase/supabase-js`, dont les clients auth, realtime et **storage**
 * pesaient 180 Ko bruts pour des fonctions qu'aucune page n'utilisait (§2).
 * Ajouter `@supabase/storage-js` pour trois appels reviendrait à défaire ce
 * gain : l'API REST du Storage tient en un `POST`, un `DELETE` et une URL
 * publique qui se compose. C'est le même arbitrage que `lib/supabase.ts`, et il
 * se relit de la même façon : ce module est la seule copie de ces trois URL.
 *
 * ## Ce qui est envoyé
 *
 * **Jamais le fichier choisi.** Le navigateur recadre et réencode en WebP à
 * 512 px avant le moindre octet réseau : une photo de téléphone fait couramment
 * quatre mille pixels et huit mégaoctets, pour une vignette rendue à 96. Le
 * seau n'accepte d'ailleurs que `image/webp` et 2 Mio (`20260807_avatars.sql`),
 * donc le contrôle existe aussi côté serveur — celui du navigateur est une
 * amabilité, il se contourne avec un `curl` et le jeton de session.
 *
 * Effet de bord voulu du réencodage : les métadonnées EXIF disparaissent, **et
 * avec elles les coordonnées GPS** que les appareils y écrivent. Publier la
 * photo de quelqu'un est une chose, publier l'endroit où elle a été prise en
 * est une autre, et personne ne s'attend à la seconde en changeant d'avatar.
 */

const BASE = `https://${projectId}.supabase.co`;

/**
 * 512 px pour un rendu à 96 au plus grand, soit du simple au quintuple.
 *
 * Ce n'est pas du gaspillage : la vignette du bandeau est à 34 px, celle de
 * l'en-tête à 96, et un écran à densité double demande déjà 192. La marge
 * restante paie l'agrandissement d'un futur écran sans avoir à redemander la
 * photo, qu'on n'a plus.
 */
const TAILLE = 512;

/** Au-delà, on rogne dans la qualité sans que ça se voie sur un rond. */
const QUALITE = 0.85;

/** Ce que le sélecteur de fichier accepte, et ce que le recadrage sait ouvrir. */
export const TYPES_ACCEPTES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/**
 * Plafond du fichier **en entrée**, avant recadrage.
 *
 * Il ne protège pas le seau, qui a le sien : il protège le navigateur. Décoder
 * une image de cent mégaoctets dans un canevas fait tomber l'onglet, et une
 * page qui meurt en silence est pire qu'un refus qui s'explique.
 */
export const POIDS_MAX = 20 * 1024 * 1024;

/** `avatars/<user_id>/<jeton>.webp`, la forme qu'impose le `check` de la table. */
function nouveauChemin(userId: string): string {
  const jeton = Math.random().toString(36).slice(2, 12);
  return `${userId}/${jeton}.webp`;
}

/** L'URL publique d'un objet du seau. Composée, jamais renvoyée par l'API. */
function urlPublique(chemin: string): string {
  return `${BASE}/storage/v1/object/public/avatars/${chemin}`;
}

/**
 * Le chemin d'un objet à partir de son URL publique, ou `null`.
 *
 * Sert à effacer l'ancienne photo au moment d'en poser une neuve. On repart de
 * l'URL déjà en base plutôt que d'énumérer le dossier : une requête de moins,
 * et surtout le `check` de la colonne garantit la forme de cette URL, donc le
 * découpage ne peut pas tomber sur autre chose.
 */
function cheminDepuisUrl(url: string | null): string | null {
  if (!url) return null;
  const marqueur = "/storage/v1/object/public/avatars/";
  const i = url.indexOf(marqueur);
  return i === -1 ? null : url.slice(i + marqueur.length);
}

/**
 * Recadre une image dans un carré et rend un WebP.
 *
 * Le rond de l'écran n'existe pas dans le fichier : on écrit un **carré**, et
 * c'est le CSS qui l'arrondit partout où l'avatar paraît. Découper un disque
 * dans le canevas donnerait des coins transparents, donc un halo sur tout fond
 * qui n'est pas exactement celui de la page, et rendrait la photo inutilisable
 * le jour où un écran la voudrait carrée.
 *
 * `source` est exprimé dans les pixels de l'image d'origine : c'est le
 * recadreur qui convertit sa vue à l'écran en coordonnées natives, pour que la
 * qualité ne dépende pas de la taille du navigateur.
 */
export function recadrerEnWebp(
  image: HTMLImageElement,
  source: { x: number; y: number; cote: number },
): Promise<Blob> {
  const canevas = document.createElement("canvas");
  canevas.width = TAILLE;
  canevas.height = TAILLE;

  const ctx = canevas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Recadrage impossible sur cet appareil."));

  // Une photo agrandie au-delà de sa définition passe par un lissage plutôt que
  // par des pixels carrés : sur un visage, la différence se voit.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, source.x, source.y, source.cote, source.cote, 0, 0, TAILLE, TAILLE);

  return new Promise((resoudre, rejeter) => {
    canevas.toBlob(
      (blob) => (blob ? resoudre(blob) : rejeter(new Error("Encodage impossible."))),
      "image/webp",
      QUALITE,
    );
  });
}

/**
 * Dépose la photo, met à jour le profil, efface l'ancienne.
 *
 * **Dans cet ordre, et il compte.** Si le dépôt échoue, rien n'a bougé. Si la
 * mise à jour du profil échoue, un objet reste dans le seau sans être référencé,
 * ce qui ne se voit nulle part et que le déclencheur d'effacement de compte
 * balaiera. L'ordre inverse, effacer d'abord, laisserait un profil sans photo en
 * cas d'échec du dépôt : une perte visible pour éviter un octet perdu.
 *
 * L'effacement de l'ancienne est **au mieux** : son échec ne doit pas faire
 * échouer un changement de photo qui, lui, a réussi.
 */
export async function televerserAvatar(blob: Blob, ancienneUrl: string | null): Promise<string> {
  const identite = await identiteCourante();
  if (!identite) throw new Error("Un compte est nécessaire.");

  const chemin = nouveauChemin(identite.userId);
  const reponse = await fetch(`${BASE}/storage/v1/object/avatars/${chemin}`, {
    method: "POST",
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${identite.jeton}`,
      "Content-Type": "image/webp",
      // Le nom est tiré au hasard, donc il n'existe pas : un écrasement
      // silencieux masquerait une collision au lieu de la signaler.
      "x-upsert": "false",
    },
    body: blob,
  });

  if (!reponse.ok) throw new Error(await messageStorage(reponse));

  const url = urlPublique(chemin);
  await majProfil({ avatarUrl: url });

  const ancien = cheminDepuisUrl(ancienneUrl);
  if (ancien && ancien !== chemin) await effacerObjet(ancien, identite.jeton).catch(() => {});

  return url;
}

/**
 * Retire la photo : la ligne d'abord, l'objet ensuite.
 *
 * L'ordre inverse de celui du dépôt, et pour la même raison : ce qui décide de
 * l'affichage est `profils.avatar_url`. Une fois la colonne à `null`, la photo
 * a disparu du site même si l'objet survit une seconde de plus. Commencer par
 * l'objet laisserait, en cas d'échec de la mise à jour, un profil pointant une
 * URL qui rend 404, c'est-à-dire un visuel brisé, ce que le §5 refuse
 * explicitement ailleurs.
 */
export async function supprimerAvatar(urlCourante: string | null): Promise<void> {
  const identite = await identiteCourante();
  if (!identite) throw new Error("Un compte est nécessaire.");

  await majProfil({ avatarUrl: null });

  const chemin = cheminDepuisUrl(urlCourante);
  if (chemin) await effacerObjet(chemin, identite.jeton).catch(() => {});
}

async function effacerObjet(chemin: string, jeton: string): Promise<void> {
  const reponse = await fetch(`${BASE}/storage/v1/object/avatars/${chemin}`, {
    method: "DELETE",
    headers: { apikey: publicAnonKey, Authorization: `Bearer ${jeton}` },
  });
  if (!reponse.ok) throw new Error(await messageStorage(reponse));
}

/**
 * Un message lisible pour un refus du Storage.
 *
 * Il rend du JSON quand il peut, du vide quand il ne peut pas : lire le corps
 * sans garde-fou remplacerait un refus explicite par une exception de parsing,
 * et l'écran afficherait « Unexpected token » au lieu de la cause.
 */
async function messageStorage(reponse: Response): Promise<string> {
  if (reponse.status === 413) return "Image trop lourde après recadrage. Réessayez.";
  if (reponse.status === 403 || reponse.status === 401) return "Dépôt refusé. Reconnectez-vous.";
  try {
    const corps = (await reponse.json()) as { message?: string; error?: string };
    const detail = corps.message ?? corps.error;
    if (detail) return `Envoi impossible : ${detail}`;
  } catch {
    /* pas de corps JSON : on retombe sur le code */
  }
  return `Envoi impossible (HTTP ${reponse.status}).`;
}
