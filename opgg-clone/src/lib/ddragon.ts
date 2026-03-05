const BASE = "https://ddragon.leagueoflegends.com";

export interface DDragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  image: { full: string };
}

export interface DDragonSpell {
  id: string;
  name: string;
  description: string;
  image: { full: string };
}

export interface DDragonChampionDetail extends DDragonChampion {
  lore: string;
  spells: DDragonSpell[];
  passive: { name: string; description: string; image: { full: string } };
  stats: {
    hp: number;
    mp: number;
    armor: number;
    spellblock: number;
    attackdamage: number;
    attackspeed: number;
    movespeed: number;
    attackrange: number;
  };
  recommended: Array<{
    blocks: Array<{ type: string; items: Array<{ id: string; count: number }> }>;
  }>;
}

export async function getDDragonVersion(): Promise<string> {
  const res = await fetch(`${BASE}/api/versions.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`DDragon versions fetch failed: ${res.status}`);
  const versions: string[] = await res.json();
  const version = versions[0];
  if (!version) throw new Error("DDragon versions list is empty");
  return version;
}

export async function getAllChampions(): Promise<Record<string, DDragonChampion>> {
  const version = await getDDragonVersion();
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/champion.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`DDragon champions fetch failed: ${res.status}`);
  const data: { data: Record<string, DDragonChampion> } = await res.json();
  return data.data;
}

export async function getChampionDetail(id: string): Promise<DDragonChampionDetail> {
  const version = await getDDragonVersion();
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/champion/${id}.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`DDragon champion detail fetch failed: ${res.status}`);
  const data: { data: Record<string, DDragonChampionDetail> } = await res.json();
  const champion = data.data[id];
  if (!champion) throw new Error(`Champion "${id}" not found in DDragon response`);
  return champion;
}

export function championIconUrl(version: string, id: string): string {
  return `${BASE}/cdn/${version}/img/champion/${id}.png`;
}

export function championLoadingUrl(id: string): string {
  return `${BASE}/cdn/img/champion/loading/${id}_0.jpg`;
}

export function spellIconUrl(version: string, filename: string): string {
  return `${BASE}/cdn/${version}/img/spell/${filename}`;
}

export function passiveIconUrl(version: string, filename: string): string {
  return `${BASE}/cdn/${version}/img/passive/${filename}`;
}

export function itemIconUrl(version: string, itemId: string): string {
  return `${BASE}/cdn/${version}/img/item/${itemId}.png`;
}

/** Returns a map of numeric champion key → DDragon string ID (e.g. 103 → "Ahri") */
export async function getChampionKeyMap(version: string): Promise<Record<number, string>> {
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/champion.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return {};
  const data: { data: Record<string, { key: string }> } = await res.json();
  const map: Record<number, string> = {};
  for (const [id, champ] of Object.entries(data.data)) {
    map[parseInt(champ.key, 10)] = id;
  }
  return map;
}

export function profileIconUrl(version: string, iconId: number): string {
  return `${BASE}/cdn/${version}/img/profileicon/${iconId}.png`;
}

export function summonerSpellIconUrl(version: string, filename: string): string {
  return `${BASE}/cdn/${version}/img/spell/${filename}`;
}

export interface DDragonSummonerSpell {
  key: string; // spell ID as a string, e.g. "4"
  image: { full: string }; // e.g. "SummonerFlash.png"
}

// ---------------------------------------------------------------------------
// Community Dragon — ARAM balance modifiers
// ---------------------------------------------------------------------------

const CDRAGON_BASE = "https://raw.communitydragon.org/latest";

export interface AramChampionModifiers {
  damageDealtMod: number; // 1.0 = unchanged, 0.9 = −10% damage dealt
  damageReceivedMod: number; // 1.05 = +5% damage received
  attackSpeedMod: number; // flat add to attack speed
  healingReceivedMod: number;
  shieldMod: number;
  abilityHasteMultiplier: number; // 0 = no change, 15 = +15 ability haste
  energyRegenMod: number;
}

/** Returns a map of numeric champion ID → ARAM modifiers. Gracefully returns {} on error. */
export async function getAramModifiers(): Promise<Record<number, AramChampionModifiers>> {
  try {
    const res = await fetch(
      `${CDRAGON_BASE}/plugins/rcp-be-lol-game-data/global/default/v1/aram-champion-rates.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<number, AramChampionModifiers>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Summoner spells
// ---------------------------------------------------------------------------

/** Returns a map of numeric spell ID → image filename (e.g. 4 → "SummonerFlash.png") */
export async function getSummonerSpellImages(version: string): Promise<Record<number, string>> {
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/summoner.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return {};
  const data: { data: Record<string, DDragonSummonerSpell> } = await res.json();
  const map: Record<number, string> = {};
  for (const spell of Object.values(data.data)) {
    map[parseInt(spell.key, 10)] = spell.image.full;
  }
  return map;
}
