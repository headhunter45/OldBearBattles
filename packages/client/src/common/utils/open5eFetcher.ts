import {
  EntityStatBlock,
  EntityAction,
  parseActionCost,
} from '@oldbear/shared';
import { isFeatureEnabled } from '../config/featureFlags';

// In-memory cache for fast retrieval and offline resilience
const memoryCache = new Map<string, EntityStatBlock>();

export const OPEN5E_API_BASE = 'https://api.open5e.com/v2';
export const OPEN5E_API_V1_BASE = 'https://api.open5e.com/v1';

export interface Open5eFetchOptions {
  document?: string;
  gamesystem?: string;
  category?: 'spell' | 'item' | 'monster' | 'attack' | 'ability';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Reads from in-memory cache or localStorage
 */
function getCached(cacheKey: string): EntityStatBlock | null {
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`oldbear_open5e_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as EntityStatBlock;
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors in test or sandbox environments
  }
  return null;
}

/**
 * Stores in memory cache and localStorage
 */
function setCache(cacheKey: string, block: EntityStatBlock): void {
  memoryCache.set(cacheKey, block);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`oldbear_open5e_${cacheKey}`, JSON.stringify(block));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Helper to extract name string from either string or { name: string } object
 */
function extractName(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.name) return String(val.name);
  return '';
}

/**
 * Fetches a 5e spell by name, slug, or search query from Open5e API (v2 with v1 fallback).
 */
export async function fetchOpen5eSpell(
  query: string,
  options: Open5eFetchOptions = {},
): Promise<EntityStatBlock | null> {
  if (!isFeatureEnabled('search_open5e')) {
    return Promise.resolve(null);
  }

  const clean = query.trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const cacheKey = `spell:${slug}${options.document ? `:${options.document}` : ''}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    let data: any = null;

    // 1. Try v2 direct slug/key fetch
    try {
      const res = await fetch(`${OPEN5E_API_BASE}/spells/${slug}/`);
      if (res.ok) {
        data = await res.json();
      }
    } catch {}

    // Fallback to v1 direct slug fetch if v2 direct failed
    if (!data) {
      try {
        const v1Res = await fetch(`${OPEN5E_API_V1_BASE}/spells/${slug}/`);
        if (v1Res.ok) {
          data = await v1Res.json();
        }
      } catch {}
    }

    // 2. Search v2 spells
    if (!data) {
      let searchUrl = `${OPEN5E_API_BASE}/spells/?search=${encodeURIComponent(clean)}&limit=10`;
      if (options.document)
        searchUrl += `&document=${encodeURIComponent(options.document)}`;
      if (options.gamesystem)
        searchUrl += `&gamesystem=${encodeURIComponent(options.gamesystem)}`;

      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          data =
            searchData.results.find((s: any) => {
              const sKey = s.key || s.slug || '';
              return (
                sKey === slug ||
                sKey.endsWith(`_${slug}`) ||
                s.name.toLowerCase() === clean.toLowerCase()
              );
            }) || searchData.results[0];
        }
      }
    }

    // 3. Fallback to v1 search if still not found
    if (!data) {
      try {
        const v1Res = await fetch(
          `${OPEN5E_API_V1_BASE}/spells/?search=${encodeURIComponent(clean)}&limit=5`,
        );
        if (v1Res.ok) {
          const v1Data = await v1Res.json();
          if (v1Data.results && v1Data.results.length > 0) {
            data = v1Data.results[0];
          }
        }
      } catch {}
    }

    if (!data || !data.name) return null;

    const schoolName = extractName(data.school);
    const levelInt =
      typeof data.level === 'number'
        ? data.level
        : typeof data.level_int === 'number'
          ? data.level_int
          : data.level === 'Cantrip'
            ? 0
            : parseInt(data.level, 10) || 0;

    const traits: string[] = [];
    if (schoolName) traits.push(schoolName);
    if (
      data.requires_concentration ||
      data.concentration === 'yes' ||
      data.concentration === true
    ) {
      traits.push('Concentration');
    }
    if (
      data.can_be_cast_as_ritual ||
      data.ritual === 'yes' ||
      data.ritual === true
    ) {
      traits.push('Ritual');
    }

    const desc = data.higher_level
      ? `${data.desc}\n\n**At Higher Levels:** ${data.higher_level}`
      : data.desc || '';

    const rawRange = data.range_text || data.range;
    const rangeStr =
      rawRange !== undefined && rawRange !== null
        ? typeof rawRange === 'number'
          ? `${rawRange} feet`
          : String(rawRange)
        : undefined;

    const itemKey = data.key || data.slug || slug;

    const block: EntityStatBlock = {
      id: `open5e-spell-${itemKey}`,
      name: data.name,
      type: 'spell',
      description: desc,
      cost: parseActionCost(data.casting_time, '5e') || 'action',
      traits,
      range: rangeStr,
      duration: data.duration,
      level: levelInt,
      school: schoolName,
      castingTime: data.casting_time,
      subtitle:
        levelInt === 0
          ? `Cantrip (${schoolName || 'Magic'})`
          : `Level ${levelInt} (${schoolName || 'Magic'})`,
      sourceUrl: `https://open5e.com/spells/${itemKey}`,
      sourceSystem: '5e',
    };

    setCache(cacheKey, block);
    return block;
  } catch (err) {
    console.warn(`[Open5e] Failed to fetch spell "${query}":`, err);
    return null;
  }
}

/**
 * Fetches a 5e monster / creature statblock by name, slug, or search query from Open5e API (v2 creatures with v1 monsters fallback).
 */
export async function fetchOpen5eMonster(
  query: string,
  options: Open5eFetchOptions = {},
): Promise<EntityStatBlock | null> {
  if (!isFeatureEnabled('search_open5e')) {
    return Promise.resolve(null);
  }

  const clean = query.trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const cacheKey = `monster:${slug}${options.document ? `:${options.document}` : ''}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    let data: any = null;

    // 1. Try v2 direct slug/key fetch on creatures
    try {
      const res = await fetch(`${OPEN5E_API_BASE}/creatures/${slug}/`);
      if (res.ok) {
        data = await res.json();
      }
    } catch {}

    // 2. Search v2 creatures
    if (!data) {
      let searchUrl = `${OPEN5E_API_BASE}/creatures/?search=${encodeURIComponent(clean)}&limit=10`;
      if (options.document)
        searchUrl += `&document=${encodeURIComponent(options.document)}`;
      if (options.gamesystem)
        searchUrl += `&gamesystem=${encodeURIComponent(options.gamesystem)}`;

      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          data =
            searchData.results.find((m: any) => {
              const mKey = m.key || m.slug || '';
              return (
                mKey === slug ||
                mKey.endsWith(`_${slug}`) ||
                m.name.toLowerCase() === clean.toLowerCase()
              );
            }) || searchData.results[0];
        }
      }
    }

    // 3. Fallback to v1 monsters if v2 returned nothing
    if (!data) {
      try {
        const v1Direct = await fetch(`${OPEN5E_API_V1_BASE}/monsters/${slug}/`);
        if (v1Direct.ok) {
          data = await v1Direct.json();
        } else {
          const v1Search = await fetch(
            `${OPEN5E_API_V1_BASE}/monsters/?search=${encodeURIComponent(clean)}&limit=5`,
          );
          if (v1Search.ok) {
            const v1Data = await v1Search.json();
            if (v1Data.results && v1Data.results.length > 0) {
              data = v1Data.results[0];
            }
          }
        }
      } catch {}
    }

    if (!data || !data.name) return null;

    const sizeStr = extractName(data.size);
    const typeStr = extractName(data.type);
    const subtypeStr = data.subtype ? `(${data.subtype})` : '';

    const subParts: string[] = [];
    if (sizeStr) subParts.push(sizeStr);
    if (typeStr) subParts.push(typeStr);
    if (subtypeStr) subParts.push(subtypeStr);
    const alignment = data.alignment ? `, ${data.alignment}` : '';
    const subtitle = `${subParts.join(' ')}${alignment}`.trim() || 'Creature';

    // Speed formatting
    let speedStr = '';
    if (data.speed && typeof data.speed === 'object') {
      speedStr = Object.entries(data.speed)
        .filter(([k]) => k !== 'unit')
        .map(([k, v]) => (k === 'walk' ? `${v} ft.` : `${k} ${v} ft.`))
        .join(', ');
    } else if (data.speed) {
      speedStr = String(data.speed);
    }

    // Stats from v2 ability_scores or v1 root properties
    const abilityScores = data.ability_scores || {};
    const str = abilityScores.strength ?? data.strength ?? 10;
    const dex = abilityScores.dexterity ?? data.dexterity ?? 10;
    const con = abilityScores.constitution ?? data.constitution ?? 10;
    const int = abilityScores.intelligence ?? data.intelligence ?? 10;
    const wis = abilityScores.wisdom ?? data.wisdom ?? 10;
    const cha = abilityScores.charisma ?? data.charisma ?? 10;

    // Actions
    const rawActions: any[] = Array.isArray(data.actions) ? data.actions : [];
    const actions: EntityAction[] = rawActions
      .filter((act: any) => !act.action_type || act.action_type === 'ACTION')
      .map((act: any) => ({
        id: crypto.randomUUID(),
        name: act.name,
        type: 'attack',
        description: act.desc || '',
        cost: 'action',
        sourceSystem: '5e',
      }));

    // Reactions
    const reactions: EntityAction[] = Array.isArray(data.reactions)
      ? data.reactions.map((act: any) => ({
          id: crypto.randomUUID(),
          name: act.name,
          type: 'ability',
          description: act.desc || '',
          cost: 'reaction',
          sourceSystem: '5e',
        }))
      : rawActions
          .filter((act: any) => act.action_type === 'REACTION')
          .map((act: any) => ({
            id: crypto.randomUUID(),
            name: act.name,
            type: 'ability',
            description: act.desc || '',
            cost: 'reaction',
            sourceSystem: '5e',
          }));

    // Special abilities / traits
    const rawTraits = data.traits || data.special_abilities || [];
    const specialAbilities: EntityAction[] = Array.isArray(rawTraits)
      ? rawTraits.map((act: any) => ({
          id: crypto.randomUUID(),
          name: act.name,
          type: 'ability',
          description: act.desc || '',
          sourceSystem: '5e',
        }))
      : [];

    const itemKey = data.key || data.slug || slug;

    // Hit points format
    const hpStr = data.hit_dice
      ? `${data.hit_points} (${data.hit_dice})`
      : data.hit_points !== undefined
        ? String(data.hit_points)
        : '10';

    const crVal = data.challenge_rating;
    const challenge =
      crVal !== undefined && crVal !== null
        ? String(crVal).startsWith('CR')
          ? String(crVal)
          : `CR ${crVal}`
        : undefined;

    const block: EntityStatBlock = {
      id: `open5e-monster-${itemKey}`,
      name: data.name,
      type: 'monster',
      description: data.desc || subtitle,
      subtitle,
      armorClass: data.armor_class,
      hp: hpStr,
      speed: speedStr || '30 ft.',
      challenge,
      stats: {
        str,
        dex,
        con,
        int,
        wis,
        cha,
      },
      actions,
      reactions,
      specialAbilities,
      sourceUrl: `https://open5e.com/creatures/${itemKey}`,
      sourceSystem: '5e',
    };

    setCache(cacheKey, block);
    return block;
  } catch (err) {
    console.warn(`[Open5e] Failed to fetch monster "${query}":`, err);
    return null;
  }
}

/**
 * Fetches a 5e magic item or equipment by name, slug, or search query from Open5e API.
 */
export async function fetchOpen5eItem(
  query: string,
  options: Open5eFetchOptions = {},
): Promise<EntityStatBlock | null> {
  if (!isFeatureEnabled('search_open5e')) {
    return Promise.resolve(null);
  }

  const clean = query.trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const isAttackCategory = options.category === 'attack';
  const cacheKey = `${isAttackCategory ? 'attack' : 'item'}:${slug}${options.document ? `:${options.document}` : ''}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    let data: any = null;

    // 1. If attack/weapon search, query weapons first!
    if (isAttackCategory) {
      try {
        let weaponUrl = `${OPEN5E_API_BASE}/weapons/?search=${encodeURIComponent(clean)}&limit=5`;
        if (options.document)
          weaponUrl += `&document=${encodeURIComponent(options.document)}`;
        const weaponRes = await fetch(weaponUrl);
        if (weaponRes.ok) {
          const weaponData = await weaponRes.json();
          if (weaponData.results && weaponData.results.length > 0) {
            const w =
              weaponData.results.find((i: any) => {
                const k = (i.slug || i.key || '').toLowerCase();
                return (
                  k === slug ||
                  (i.name || '').toLowerCase() === clean.toLowerCase()
                );
              }) || weaponData.results[0];
            data = {
              slug: w.slug || w.key,
              name: w.name,
              type: 'Weapon',
              desc: `${w.category || ''} weapon. Damage: ${w.damage_dice || ''} ${w.damage_type || ''}. Properties: ${Array.isArray(w.properties) ? w.properties.join(', ') : ''}`,
              rarity: 'Common',
              damage_dice: w.damage_dice,
              damage_type: w.damage_type,
              category: w.category,
              properties: w.properties,
            };
          }
        }
      } catch {}
    }

    // 2. Try magic items direct slug in v2
    if (!data) {
      try {
        const res = await fetch(`${OPEN5E_API_BASE}/magicitems/${slug}/`);
        if (res.ok) {
          data = await res.json();
        }
      } catch {}
    }

    // 3. Search magic items
    if (!data) {
      let searchUrl = `${OPEN5E_API_BASE}/magicitems/?search=${encodeURIComponent(clean)}&limit=5`;
      if (options.document)
        searchUrl += `&document=${encodeURIComponent(options.document)}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          data =
            searchData.results.find((i: any) => {
              const iKey = i.key || i.slug || '';
              return (
                iKey === slug ||
                iKey.endsWith(`_${slug}`) ||
                i.name.toLowerCase() === clean.toLowerCase()
              );
            }) || searchData.results[0];
        }
      }
    }

    // 4. Search items / weapons / armor
    if (!data) {
      try {
        const itemRes = await fetch(
          `${OPEN5E_API_BASE}/items/?search=${encodeURIComponent(clean)}&limit=5`,
        );
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          if (itemData.results && itemData.results.length > 0) {
            data = itemData.results[0];
          }
        }
      } catch {}
    }

    // 5. Try weapons (standard fallback)
    if (!data) {
      try {
        let weaponUrl = `${OPEN5E_API_BASE}/weapons/?search=${encodeURIComponent(clean)}&limit=5`;
        if (options.document)
          weaponUrl += `&document=${encodeURIComponent(options.document)}`;
        const weaponRes = await fetch(weaponUrl);
        if (weaponRes.ok) {
          const weaponData = await weaponRes.json();
          if (weaponData.results && weaponData.results.length > 0) {
            const w =
              weaponData.results.find((i: any) => {
                const k = (i.slug || i.key || '').toLowerCase();
                return (
                  k === slug ||
                  (i.name || '').toLowerCase() === clean.toLowerCase()
                );
              }) || weaponData.results[0];
            data = {
              slug: w.slug || w.key,
              name: w.name,
              type: 'Weapon',
              desc: `${w.category || ''} weapon. Damage: ${w.damage_dice || ''} ${w.damage_type || ''}. Properties: ${Array.isArray(w.properties) ? w.properties.join(', ') : ''}`,
              rarity: 'Common',
              damage_dice: w.damage_dice,
              damage_type: w.damage_type,
              category: w.category,
              properties: w.properties,
            };
          }
        }
      } catch {}
    }

    // 6. Try armor
    if (!data) {
      try {
        const armorRes = await fetch(
          `${OPEN5E_API_BASE}/armor/?search=${encodeURIComponent(clean)}&limit=5`,
        );
        if (armorRes.ok) {
          const armorData = await armorRes.json();
          if (armorData.results && armorData.results.length > 0) {
            const a = armorData.results[0];
            data = {
              slug: a.slug || a.key,
              name: a.name,
              type: 'Armor',
              desc: `${a.category || ''} armor. AC: ${a.ac_string || a.armor_class}. Strength requirement: ${a.strength_requirement || 'None'}. Stealth: ${a.stealth_disadvantage ? 'Disadvantage' : 'Normal'}.`,
              rarity: 'Common',
            };
          }
        }
      } catch {}
    }

    // 7. Fallback to v1 magicitems
    if (!data) {
      try {
        const v1Res = await fetch(`${OPEN5E_API_V1_BASE}/magicitems/${slug}/`);
        if (v1Res.ok) {
          data = await v1Res.json();
        }
      } catch {}
    }

    if (!data || !data.name) return null;

    const rarityStr = extractName(data.rarity);
    const typeStr = extractName(data.type) || 'Item';

    const traits: string[] = [];
    if (rarityStr && rarityStr !== 'varies') traits.push(rarityStr);
    if (data.requires_attunement) traits.push('Attunement');
    if (Array.isArray(data.properties)) {
      traits.push(...data.properties);
    }

    const isWeapon =
      typeStr.toLowerCase().includes('weapon') ||
      Boolean(data.damage_dice) ||
      isAttackCategory;
    let damageFormula = data.damage_dice || undefined;
    let damageType = data.damage_type || undefined;
    let range: string | undefined;

    if (!damageFormula && data.desc) {
      const dmgMatch =
        data.desc.match(
          /(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*(?:[a-zA-Z]+)?\s*damage/i,
        ) ||
        data.desc.match(/(?:damage:\s*)(\d+d\d+(?:\s*[+-]\s*\d+)?)/i) ||
        data.desc.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
      if (dmgMatch) {
        damageFormula = dmgMatch[1].trim();
      }
    }
    if (!damageType && data.desc) {
      const typeMatch = data.desc.match(
        /\b(slashing|piercing|bludgeoning|fire|cold|lightning|radiant|necrotic|poison|acid|force|psychic)\b/i,
      );
      if (typeMatch) {
        damageType = typeMatch[1].toLowerCase();
      }
    }
    if (data.desc) {
      const rangeMatch =
        data.desc.match(/range\s*(\d+\/\d+)\s*(?:ft|feet)?/i) ||
        data.desc.match(/range\s*(\d+)\s*(?:ft|feet)?/i);
      if (rangeMatch) {
        range = `${rangeMatch[1]} ft`;
      } else if (
        isWeapon &&
        (data.category?.toLowerCase().includes('ranged') ||
          data.desc.toLowerCase().includes('ranged'))
      ) {
        range = '80/320 ft';
      } else if (isWeapon) {
        range = '5 ft';
      }
    }

    const subtitle = `${rarityStr ? `${rarityStr} ` : ''}${typeStr}`.trim();
    const itemKey = data.key || data.slug || slug;

    const block: EntityStatBlock = {
      id: `open5e-item-${itemKey}`,
      name: data.name,
      type: isWeapon ? 'attack' : 'item',
      description: data.desc || '',
      traits,
      subtitle,
      damageFormula,
      damageType,
      range,
      sourceUrl: isWeapon
        ? `https://open5e.com/weapons/${itemKey}`
        : `https://open5e.com/magicitems/${itemKey}`,
      sourceSystem: '5e',
    };

    setCache(cacheKey, block);
    return block;
  } catch (err) {
    console.warn(`[Open5e] Failed to fetch item "${query}":`, err);
    return null;
  }
}

/**
 * Universal reference lookup dispatcher by category and query.
 */
export async function fetchOpen5eReference(
  category: 'spell' | 'item' | 'monster' | 'attack' | 'ability',
  query: string,
  options?: Open5eFetchOptions,
): Promise<EntityStatBlock | null> {
  if (!isFeatureEnabled('search_open5e')) {
    return Promise.resolve(null);
  }

  switch (category) {
    case 'spell':
      return fetchOpen5eSpell(query, options);
    case 'item':
      return fetchOpen5eItem(query, options);
    case 'monster':
      return fetchOpen5eMonster(query, options);
    case 'attack':
      return fetchOpen5eItem(query, { ...options, category: 'attack' });
    default:
      return null;
  }
}
