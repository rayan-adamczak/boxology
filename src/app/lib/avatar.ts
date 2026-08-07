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

/** Le plafond du seau, repris ici pour ne pas le découvrir au refus. */
const POIDS_ENVOYE_MAX = 2 * 1024 * 1024;

/**
 * Les types acceptés, et **la liste fait autorité côté code**.
 *
 * L'attribut `accept` d'un champ de fichier n'est qu'une amabilité : il filtre
 * la fenêtre du système, et « Tous les fichiers » le contourne d'un clic. Le
 * vrai contrôle est `verifierFichier`, et derrière lui le seau, qui n'accepte
 * que `image/webp` (`20260807_avatars.sql`).
 *
 * HEIC n'y est pas, et n'a pas à y être : aucun navigateur ne le décode dans un
 * canevas hors Safari, et iOS convertit déjà en JPEG au moment de l'envoi.
 */
export const TYPES_ACCEPTES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

/** La chaîne pour l'attribut `accept`, dérivée de la liste. Jamais recopiée. */
export const ACCEPT = TYPES_ACCEPTES.join(",");

/**
 * Plafond du fichier **en entrée**, avant recadrage.
 *
 * Il ne protège pas le seau, qui a le sien : il protège le navigateur. Dix
 * mégaoctets couvrent large une photo de téléphone, qui pèse trois à huit ; au
 * delà, on a affaire à un scan ou à un fichier qui n'a rien à faire là.
 */
export const POIDS_MAX = 10 * 1024 * 1024;

/**
 * Plafond en **pixels**, et c'est le vrai garde-fou.
 *
 * Le poids d'un fichier ne dit rien de ce qu'il coûte à décoder : un PNG de
 * 3 Mo bien compressé peut faire 20 000 × 20 000, soit 1,6 Go une fois
 * décompressé en mémoire. C'est comme ça qu'on fait tomber un onglet, et le
 * plafond de poids seul ne l'attrape pas.
 *
 * 50 mégapixels laissent passer tout ce qu'un appareil grand public produit,
 * un 48 Mpx de téléphone compris.
 */
export const PIXELS_MAX = 50_000_000;

/**
 * Ce qui empêche ce fichier d'être une photo de profil, ou `null`.
 *
 * Rend une phrase et non un booléen, comme `etat_identifiant` en base : « trop
 * lourd » et « pas une image » ne se corrigent pas de la même façon, et l'écran
 * doit pouvoir le dire.
 */
export function verifierFichier(fichier: File): string | null {
  if (!(TYPES_ACCEPTES as readonly string[]).includes(fichier.type)) {
    return "Formats acceptés : JPEG, PNG, WebP, AVIF et GIF.";
  }
  if (fichier.size > POIDS_MAX) {
    return `Image trop lourde : ${enMo(fichier.size)} pour ${enMo(POIDS_MAX)} au plus.`;
  }
  return null;
}

/** `1,4 Mo`. Une taille de fichier se lit en mégaoctets, pas en octets. */
export function enMo(octets: number): string {
  return `${(octets / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

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

  return encoder(canevas, QUALITE);
}

/**
 * Encode le canevas, et **redescend en qualité si le résultat dépasse le seau**.
 *
 * À 512 px, un WebP à 0,85 pèse quelques dizaines de kilo-octets : ce repli ne
 * jouera sans doute jamais. Il est là parce que le plafond est posé côté
 * serveur, et qu'un refus à l'envoi est le pire endroit pour découvrir qu'on
 * avait deux cents kilo-octets de trop — l'utilisateur a déjà recadré.
 *
 * **Le type produit est vérifié.** Un navigateur qui ne sait pas encoder en
 * WebP ne lève pas d'erreur, il rend un PNG sous le même appel ; le seau, lui,
 * n'accepte que `image/webp`, et le refus arriverait sous la forme d'un message
 * de stockage incompréhensible. Mieux vaut le dire ici.
 */
function encoder(canevas: HTMLCanvasElement, qualite: number): Promise<Blob> {
  return new Promise((resoudre, rejeter) => {
    canevas.toBlob(
      (blob) => {
        if (!blob) { rejeter(new Error("Encodage impossible.")); return; }
        if (blob.type !== "image/webp") {
          rejeter(new Error("Ce navigateur ne sait pas produire de WebP. Essayez-en un autre."));
          return;
        }
        if (blob.size > POIDS_ENVOYE_MAX && qualite > 0.5) {
          encoder(canevas, qualite - 0.15).then(resoudre, rejeter);
          return;
        }
        resoudre(blob);
      },
      "image/webp",
      qualite,
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
