// Mock data for the Reelio logged-in dashboard.
// Cover art uses cinematic Unsplash imagery as stand-ins for physical-media artwork
// (invented film titles to avoid trademark/copyright concerns).

export const covers = [
  "https://images.unsplash.com/photo-1713981272299-355d7038d708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1778585040075-0991abfd4ed9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1614201842267-206a09286c3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1627424506581-bf2829b29a07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1783287364666-72538236acf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1707662513410-73587823fe34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1603236405450-e74c465a89a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1620608444307-cce60f1fe085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1771448234179-ec7ff3339355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1659698376016-ae05fd9079d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1634840150834-f6d4544f5b9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1637573237661-ec911cf9a696?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
];

export type ActivityAction = "added" | "wishlisted" | "started following";

export interface ActivityItem {
  id: string;
  user: string;
  action: ActivityAction;
  movie?: string;
  edition?: string;
  targetUser?: string; // for "started following"
  cover?: string;
  time: string;
}

export interface PriceDrop {
  id: string;
  movie: string;
  edition: string;
  cover: string;
  price: string;
  wasPrice: string;
  discount: number;
  source: string;
}

export interface Release {
  id: string;
  movie: string;
  edition: string;
  cover: string;
}

export interface Collector {
  id: string;
  name: string;
  handle: string;
  shared: number;
  following: boolean;
}

export const user = {
  name: "Ava Delgado",
  handle: "@ava.collects",
  owned: 342,
  wishlist: 57,
  value: "$12,480",
  following: 128,
  followers: 214,
};

export const priceDrops: PriceDrop[] = [
  { id: "p1", movie: "Neon Requiem", edition: "4K UHD Steelbook", cover: covers[0], price: "$24.99", wasPrice: "$44.99", discount: 44, source: "eBay" },
  { id: "p2", movie: "The Glass Tide", edition: "Blu-ray Collector's Ed.", cover: covers[3], price: "$18.50", wasPrice: "$29.99", discount: 38, source: "eBay" },
  { id: "p3", movie: "Ashfall", edition: "4K UHD Digibook", cover: covers[8], price: "$31.00", wasPrice: "$49.99", discount: 38, source: "eBay" },
  { id: "p4", movie: "Silent Meridian", edition: "Blu-ray Steelbook", cover: covers[5], price: "$14.99", wasPrice: "$24.99", discount: 40, source: "eBay" },
  { id: "p5", movie: "Voidwalker", edition: "4K UHD Slipcover", cover: covers[10], price: "$27.99", wasPrice: "$42.00", discount: 33, source: "eBay" },
];

export const releases: Release[] = [
  { id: "r1", movie: "Crimson Harbor", edition: "4K UHD Steelbook", cover: covers[1] },
  { id: "r2", movie: "Hollow Season", edition: "Blu-ray", cover: covers[2] },
  { id: "r3", movie: "Paper Lanterns", edition: "4K UHD Digibook", cover: covers[4] },
  { id: "r4", movie: "The Long Dusk", edition: "Blu-ray Steelbook", cover: covers[6] },
  { id: "r5", movie: "Ember & Iron", edition: "4K UHD Collector's Ed.", cover: covers[7] },
  { id: "r6", movie: "Northwind", edition: "Blu-ray Slipcover", cover: covers[9] },
  { id: "r7", movie: "Quiet Static", edition: "4K UHD Steelbook", cover: covers[11] },
  { id: "r8", movie: "Marrow", edition: "Blu-ray Digibook", cover: covers[0] },
];

export const collectors: Collector[] = [
  { id: "c1", name: "Marcus Hale", handle: "@steelbook.marcus", shared: 42, following: false },
  { id: "c2", name: "Priya Raman", handle: "@4kpriya", shared: 31, following: false },
  { id: "c3", name: "Tomás Vega", handle: "@vega.vault", shared: 28, following: true },
  { id: "c4", name: "Lena Fischer", handle: "@arthouse.lena", shared: 19, following: false },
  { id: "c5", name: "Dev Okoye", handle: "@devcollects", shared: 12, following: false },
];

function makeActivity(offset: number): ActivityItem[] {
  const base: ActivityItem[] = [
    { id: "a1", user: "Marcus Hale", action: "added", movie: "Neon Requiem", edition: "4K UHD Steelbook", cover: covers[0], time: "2h ago" },
    { id: "a2", user: "Priya Raman", action: "wishlisted", movie: "The Glass Tide", edition: "Blu-ray Collector's Ed.", cover: covers[3], time: "4h ago" },
    { id: "a3", user: "Tomás Vega", action: "started following", targetUser: "Lena Fischer", time: "5h ago" },
    { id: "a4", user: "Lena Fischer", action: "added", movie: "Paper Lanterns", edition: "4K UHD Digibook", cover: covers[4], time: "7h ago" },
    { id: "a5", user: "Dev Okoye", action: "wishlisted", movie: "Ashfall", edition: "4K UHD Digibook", cover: covers[8], time: "9h ago" },
    { id: "a6", user: "Marcus Hale", action: "added", movie: "The Long Dusk", edition: "Blu-ray Steelbook", cover: covers[6], time: "12h ago" },
  ];
  return base.map((a) => ({ ...a, id: `${a.id}-${offset}` }));
}

export function fetchActivityPage(page: number): ActivityItem[] {
  return makeActivity(page);
}

/* -------------------------------------------------------------------------- */
/* Public profile data                                                        */
/* -------------------------------------------------------------------------- */

export type EditionType = "4K UHD" | "Blu-ray" | "Steelbook" | "Box Set";

export interface CollectionItem {
  id: string;
  movie: string;
  edition: string;
  editionType: EditionType;
  cover: string;
  addedTs: number; // for "date added" sort
  value: number; // for "value" sort
  copies: number; // duplicate count
}

export interface Profile {
  handle: string;
  name: string;
  bio?: string;
  location?: string;
  joined: string;
  avatarName: string; // drives initials avatar
  owned: number;
  wishlist: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  favoriteGenres: string[];
  highlights: string[]; // cover urls
}

const EDITION_TYPES: EditionType[] = ["4K UHD", "Blu-ray", "Steelbook", "Box Set"];
const EDITION_LABELS: Record<EditionType, string> = {
  "4K UHD": "4K UHD Digibook",
  "Blu-ray": "Blu-ray",
  Steelbook: "4K UHD Steelbook",
  "Box Set": "Blu-ray Box Set",
};
const TITLE_POOL = [
  "Neon Requiem", "The Glass Tide", "Ashfall", "Silent Meridian", "Voidwalker",
  "Crimson Harbor", "Hollow Season", "Paper Lanterns", "The Long Dusk", "Ember & Iron",
  "Northwind", "Quiet Static", "Marrow", "Gilded Cage", "Saltwater Kings",
  "The Ninth Hour", "Cold Aurora", "Redwood", "Fever Dream", "Last Transmission",
  "Obsidian", "The Wanderer", "Nightjar", "Pale Fire", "Undertow",
];

// Deterministic collection generator so infinite scroll can page indefinitely.
export function fetchCollectionPage(page: number, pageSize = 18): CollectionItem[] {
  const items: CollectionItem[] = [];
  for (let i = 0; i < pageSize; i++) {
    const idx = page * pageSize + i;
    const et = EDITION_TYPES[idx % EDITION_TYPES.length];
    items.push({
      id: `col-${idx}`,
      movie: TITLE_POOL[idx % TITLE_POOL.length],
      edition: EDITION_LABELS[et],
      editionType: et,
      cover: covers[idx % covers.length],
      addedTs: 1_770_000_000_000 - idx * 86_400_000,
      value: 15 + ((idx * 7) % 60),
      copies: idx % 9 === 0 ? 2 : 1,
    });
  }
  return items;
}

export const profile: Profile = {
  handle: "steelbook.marcus",
  name: "Marcus Hale",
  bio: "Steelbook obsessive · chasing OOP editions and boutique 4K restorations. Trade-friendly.",
  location: "Portland, OR",
  joined: "March 2021",
  avatarName: "Marcus Hale",
  owned: 428,
  wishlist: 63,
  followers: 1240,
  following: 312,
  isFollowing: false,
  favoriteGenres: ["Neo-noir", "Sci-fi", "Horror", "Arthouse", "Thriller", "Westerns"],
  highlights: [covers[0], covers[4], covers[8], covers[6], covers[10]],
};

/* -------------------------------------------------------------------------- */
/* Movie detail (Master + Releases)                                           */
/* -------------------------------------------------------------------------- */

export interface Edition {
  id: string;
  name: string;
  format: EditionType | "DVD" | "Digibook";
  region: string; // "Region A", "Region B", "Region Free"
  country: string;
  year: number;
  cover: string;
  price: number;
  source: string;
  owners: number;
  ownerNames: string[];
  listings: { source: string; price: number; condition: string }[];
  priceHistory: number[]; // last ~90 days sampled
}

export interface Review {
  id: string;
  user: string;
  rating: number; // out of 5
  time: string;
  body: string;
}

export interface CuratedList {
  id: string;
  title: string;
  curator: string;
  count: number;
  covers: string[];
}

export interface MovieMaster {
  id: string;
  title: string;
  year: number;
  director: string;
  runtime: string;
  genres: string[];
  rating: number;
  ratingCount: number;
  own: number;
  want: number;
  cover: string;
  backdrop: string;
  synopsis: string;
  theatrical: string;
  cast: { actor: string; role: string }[];
  specs: {
    aspectRatio: string;
    audio: string[];
    subtitles: string[];
    hdr: string;
    features: string[];
  };
}

const FORMAT_LABELS = ["4K UHD", "Blu-ray", "DVD", "Steelbook", "Digibook", "Box Set"] as const;

function history(base: number): number[] {
  const out: number[] = [];
  let v = base * 1.4;
  for (let i = 0; i < 30; i++) {
    v += (Math.sin(i / 3) * base) / 12 - base / 90;
    out.push(Math.max(base * 0.85, Math.round(v * 100) / 100));
  }
  out[out.length - 1] = base;
  return out;
}

export const movieMaster: MovieMaster = {
  id: "neon-requiem",
  title: "Neon Requiem",
  year: 2024,
  director: "Isadora Vance",
  runtime: "2h 17m",
  genres: ["Neo-noir", "Sci-fi", "Thriller"],
  rating: 4.3,
  ratingCount: 1842,
  own: 1204,
  want: 312,
  cover: covers[0],
  backdrop: covers[8],
  synopsis:
    "In a rain-drenched megacity where memories are traded like currency, a burnt-out data-courier takes one last job that unravels a conspiracy reaching the highest towers of the corporate elite. As neon bleeds across flooded streets, she must decide which of her own memories are worth keeping — and which were never hers to begin with.",
  theatrical: "Premiered at the Venice Film Festival, September 2024. Wide theatrical release October 2024.",
  cast: [
    { actor: "Mara Quinn", role: "Elian Voss" },
    { actor: "Dev Okonkwo", role: "The Broker" },
    { actor: "Lena Fischer", role: "Cassian" },
    { actor: "Tomás Vega", role: "Detective Rho" },
    { actor: "Priya Raman", role: "Mother Node" },
    { actor: "Marcus Hale", role: "Wire" },
  ],
  specs: {
    aspectRatio: "2.39:1",
    audio: ["English Dolby Atmos", "English DTS-HD MA 5.1", "French DTS 5.1"],
    subtitles: ["English SDH", "French", "Spanish", "German", "Japanese"],
    hdr: "Dolby Vision / HDR10",
    features: [
      "Audio commentary with director Isadora Vance",
      "\"Building the Drowned City\" — 42 min making-of",
      "Deleted & extended scenes (18 min)",
      "Concept art gallery",
      "Theatrical & teaser trailers",
    ],
  },
};

export const editions: Edition[] = [
  {
    id: "e1", name: "4K UHD Steelbook — Zavvi Exclusive", format: "Steelbook", region: "Region Free", country: "UK", year: 2024,
    cover: covers[0], price: 34.99, source: "eBay", owners: 428, ownerNames: ["Marcus Hale", "Priya Raman", "Dev Okoye", "Lena Fischer"],
    listings: [ { source: "eBay", price: 34.99, condition: "New" }, { source: "Amazon UK", price: 39.99, condition: "New" }, { source: "eBay", price: 28.5, condition: "Like New" } ],
    priceHistory: history(34.99),
  },
  {
    id: "e2", name: "4K UHD Digibook — US Standard", format: "Digibook", region: "Region A", country: "USA", year: 2024,
    cover: covers[8], price: 29.99, source: "eBay", owners: 356, ownerNames: ["Tomás Vega", "Marcus Hale", "Ava Delgado"],
    listings: [ { source: "eBay", price: 29.99, condition: "New" }, { source: "Amazon", price: 32.99, condition: "New" } ],
    priceHistory: history(29.99),
  },
  {
    id: "e3", name: "Blu-ray Standard Edition", format: "Blu-ray", region: "Region B", country: "Germany", year: 2024,
    cover: covers[3], price: 16.99, source: "eBay", owners: 512, ownerNames: ["Lena Fischer", "Priya Raman"],
    listings: [ { source: "eBay", price: 16.99, condition: "New" }, { source: "Amazon DE", price: 18.99, condition: "New" } ],
    priceHistory: history(16.99),
  },
  {
    id: "e4", name: "4K UHD Collector's Box Set", format: "Box Set", region: "Region Free", country: "UK", year: 2025,
    cover: covers[10], price: 89.99, source: "eBay", owners: 143, ownerNames: ["Marcus Hale", "Dev Okoye"],
    listings: [ { source: "eBay", price: 89.99, condition: "New" }, { source: "Zavvi", price: 94.99, condition: "New" } ],
    priceHistory: history(89.99),
  },
  {
    id: "e5", name: "DVD — Standard Release", format: "DVD", region: "Region 2", country: "France", year: 2024,
    cover: covers[5], price: 9.99, source: "eBay", owners: 88, ownerNames: ["Tomás Vega"],
    listings: [ { source: "eBay", price: 9.99, condition: "New" }, { source: "Amazon FR", price: 11.5, condition: "New" } ],
    priceHistory: history(9.99),
  },
  {
    id: "e6", name: "Blu-ray Steelbook — FNAC Exclusive", format: "Steelbook", region: "Region B", country: "France", year: 2025,
    cover: covers[6], price: 24.99, source: "eBay", owners: 201, ownerNames: ["Priya Raman", "Lena Fischer", "Ava Delgado"],
    listings: [ { source: "eBay", price: 24.99, condition: "New" }, { source: "FNAC", price: 27.99, condition: "New" } ],
    priceHistory: history(24.99),
  },
];

export const FORMAT_OPTIONS = FORMAT_LABELS;

export const reviews: Review[] = [
  { id: "rv1", user: "Marcus Hale", rating: 5, time: "3d ago", body: "The Zavvi steelbook is stunning — the embossing catches the light beautifully and the Dolby Vision transfer is reference quality. Easily the definitive edition." },
  { id: "rv2", user: "Priya Raman", rating: 4, time: "1w ago", body: "Fantastic film and a great disc. Only knocking a star because the US digibook is missing the director's commentary that the UK release includes." },
  { id: "rv3", user: "Lena Fischer", rating: 5, time: "2w ago", body: "A modern noir masterpiece. The making-of doc alone is worth the upgrade. HDR grade is gorgeous on an OLED." },
  { id: "rv4", user: "Dev Okoye", rating: 3, time: "3w ago", body: "Solid release but the box set packaging feels flimsy for the price. Wait for a drop." },
];

export const curatedLists: CuratedList[] = [
  { id: "l1", title: "Best Steelbooks of 2026", curator: "steelbook.marcus", count: 42, covers: [covers[0], covers[6], covers[3]] },
  { id: "l2", title: "Essential Neo-Noir on 4K", curator: "arthouse.lena", count: 28, covers: [covers[8], covers[0], covers[5]] },
  { id: "l3", title: "Reference Quality HDR Discs", curator: "4kpriya", count: 61, covers: [covers[0], covers[10], covers[8]] },
  { id: "l4", title: "Sci-fi Collection Highlights", curator: "vega.vault", count: 35, covers: [covers[0], covers[3], covers[6]] },
];

/* -------------------------------------------------------------------------- */
/* Wishlist data                                                              */
/* -------------------------------------------------------------------------- */

export interface WishlistItem {
  id: string;
  movie: string;
  edition: string;
  editionType: EditionType;
  cover: string;
  price: number; // current lowest price
  addedPrice: number; // price when added (for drop detection)
  source: string;
  priority: 1 | 2 | 3;
  addedTs: number;
}

export const wishlistItems: WishlistItem[] = [
  { id: "w1", movie: "Neon Requiem", edition: "4K UHD Steelbook", editionType: "Steelbook", cover: covers[0], price: 24.99, addedPrice: 44.99, source: "eBay", priority: 3, addedTs: 1_769_900_000_000 },
  { id: "w2", movie: "The Glass Tide", edition: "Blu-ray Collector's Ed.", editionType: "Blu-ray", cover: covers[3], price: 29.99, addedPrice: 29.99, source: "Amazon", priority: 2, addedTs: 1_769_700_000_000 },
  { id: "w3", movie: "Ashfall", edition: "4K UHD Digibook", editionType: "4K UHD", cover: covers[8], price: 31.0, addedPrice: 49.99, source: "eBay", priority: 3, addedTs: 1_769_500_000_000 },
  { id: "w4", movie: "Silent Meridian", edition: "Blu-ray Steelbook", editionType: "Steelbook", cover: covers[5], price: 14.99, addedPrice: 24.99, source: "eBay", priority: 1, addedTs: 1_769_300_000_000 },
  { id: "w5", movie: "Voidwalker", edition: "4K UHD Slipcover", editionType: "4K UHD", cover: covers[10], price: 27.99, addedPrice: 42.0, source: "eBay", priority: 2, addedTs: 1_769_100_000_000 },
  { id: "w6", movie: "Crimson Harbor", edition: "Blu-ray Box Set", editionType: "Box Set", cover: covers[1], price: 89.99, addedPrice: 89.99, source: "Amazon", priority: 3, addedTs: 1_768_900_000_000 },
  { id: "w7", movie: "Paper Lanterns", edition: "4K UHD Digibook", editionType: "4K UHD", cover: covers[4], price: 34.5, addedPrice: 39.99, source: "eBay", priority: 1, addedTs: 1_768_700_000_000 },
  { id: "w8", movie: "The Long Dusk", edition: "Blu-ray Steelbook", editionType: "Steelbook", cover: covers[6], price: 19.99, addedPrice: 19.99, source: "Amazon", priority: 2, addedTs: 1_768_500_000_000 },
  { id: "w9", movie: "Ember & Iron", edition: "4K UHD Box Set", editionType: "Box Set", cover: covers[7], price: 64.99, addedPrice: 79.99, source: "eBay", priority: 3, addedTs: 1_768_300_000_000 },
  { id: "w10", movie: "Northwind", edition: "Blu-ray Slipcover", editionType: "Blu-ray", cover: covers[9], price: 16.99, addedPrice: 16.99, source: "Amazon", priority: 1, addedTs: 1_768_100_000_000 },
];

export function fetchProfileActivity(): ActivityItem[] {
  return [
    { id: "pa1", user: profile.name, action: "added", movie: "Neon Requiem", edition: "4K UHD Steelbook", cover: covers[0], time: "2h ago" },
    { id: "pa2", user: profile.name, action: "wishlisted", movie: "The Glass Tide", edition: "Blu-ray Collector's Ed.", cover: covers[3], time: "1d ago" },
    { id: "pa3", user: profile.name, action: "started following", targetUser: "Lena Fischer", time: "2d ago" },
    { id: "pa4", user: profile.name, action: "added", movie: "The Long Dusk", edition: "Blu-ray Steelbook", cover: covers[6], time: "3d ago" },
    { id: "pa5", user: profile.name, action: "added", movie: "Ashfall", edition: "4K UHD Digibook", cover: covers[8], time: "5d ago" },
  ];
}
