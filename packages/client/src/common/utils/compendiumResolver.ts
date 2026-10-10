import { EntityStatBlock } from '@oldbear/shared';
import { fetchOpen5eSpell, fetchOpen5eMonster, fetchOpen5eItem } from './open5eFetcher.js';
import { fetchPF2eReference } from './pf2eFetcher.js';

export type CompendiumCategory =
  | 'spell'
  | 'item'
  | 'monster'
  | 'attack'
  | 'ability'
  | 'class'
  | 'race'
  | 'feat';

export interface SystemVariantInfo {
  id: string;
  name: string;
  aliases: string[];
  backend: 'open5e-v2' | 'foundry-pf2e' | 'stub' | 'planned';
  status: 'active' | 'stubbed' | 'planned';
  description: string;
}

export const SYSTEM_VARIANTS: Record<string, SystemVariantInfo> = {
  '5e-2014': {
    id: '5e-2014',
    name: 'D&D 5e (2014 SRD 5.1)',
    aliases: ['5e-2014', '2014', '5e', 'dnd5e', 'srd51'],
    backend: 'open5e-v2',
    status: 'active',
    description: 'Original 2014 5th Edition System Reference Document.',
  },
  '5e-2024': {
    id: '5e-2024',
    name: 'D&D 5e (2024 SRD 5.2)',
    aliases: ['5e-2024', '2024', 'dnd2024', 'srd52'],
    backend: 'open5e-v2',
    status: 'active',
    description: 'Revised 2024 5th Edition System Reference Document.',
  },
  'pf2': {
    id: 'pf2',
    name: 'Pathfinder 2e',
    aliases: ['pf2', 'pf2e', 'pathfinder2', 'pathfinder2e'],
    backend: 'foundry-pf2e',
    status: 'active',
    description: 'Pathfinder 2nd Edition compendium packs & reference.',
  },
  'sf2': {
    id: 'sf2',
    name: 'Starfinder 2e',
    aliases: ['sf2', 'sf2e', 'starfinder2', 'starfinder2e'],
    backend: 'stub',
    status: 'stubbed',
    description: 'Starfinder 2nd Edition (Pathfinder 2e compatible engine).',
  },
  'pf1': {
    id: 'pf1',
    name: 'Pathfinder 1e (OGL 3.5)',
    aliases: ['pf1', 'pf1e', 'pathfinder', 'pathfinder1'],
    backend: 'stub',
    status: 'stubbed',
    description: 'Pathfinder 1st Edition OGL compendium.',
  },
  'sf1': {
    id: 'sf1',
    name: 'Starfinder 1e',
    aliases: ['sf1', 'sf1e', 'starfinder', 'starfinder1'],
    backend: 'stub',
    status: 'stubbed',
    description: 'Starfinder 1st Edition OGL compendium.',
  },
  'a5e': {
    id: 'a5e',
    name: 'Advanced 5e (Level Up)',
    aliases: ['a5e', 'levelup', 'advanced5e'],
    backend: 'open5e-v2',
    status: 'active',
    description: 'Advanced 5th Edition SRD by EN Publishing.',
  },
};

/**
 * Normalizes system alias string to canonical system key.
 */
export function normalizeSystemAlias(raw?: string): string | undefined {
  if (!raw) return undefined;
  const clean = raw.toLowerCase().trim().replace(/^[-_]+|[-_]+$/g, '');
  for (const [key, info] of Object.entries(SYSTEM_VARIANTS)) {
    if (info.aliases.some((a) => a.toLowerCase() === clean)) {
      return key;
    }
  }
  return clean;
}

/**
 * Extracts system variant specification from raw command query.
 *
 * Supported syntaxes:
 * - Prefix tag: "[2024] fireball", "(pf2) heal"
 * - Colon tag: "2024:fireball", "pf2:heal", "sf1:laser-pistol"
 * - Flag syntax: "-s 2024 fireball", "--system pf2 heal", "sys:2024 fireball"
 * - Leading word keyword: "2024 fireball", "2014 shield", "pf2 heal", "sf2 laser"
 */
export function parseCompendiumQuery(raw: string): {
  system?: string;
  cleanQuery: string;
} {
  let str = raw.trim();
  if (!str) return { cleanQuery: '' };

  // 1. Bracket / parenthesis prefix: e.g. [2024] fireball or (pf2) heal
  const bracketMatch = str.match(/^\[([a-zA-Z0-9_-]+)\]\s*(.*)$/i) ||
                       str.match(/^\(([a-zA-Z0-9_-]+)\)\s*(.*)$/i);
  if (bracketMatch) {
    const sys = normalizeSystemAlias(bracketMatch[1]);
    return { system: sys, cleanQuery: bracketMatch[2].trim() };
  }

  // 2. Colon tag: e.g. 2024:fireball or pf2:heal
  const colonMatch = str.match(/^([a-zA-Z0-9_-]+):(.*)$/i);
  if (colonMatch) {
    const potentialSys = normalizeSystemAlias(colonMatch[1]);
    if (potentialSys && (SYSTEM_VARIANTS[potentialSys] || /^(2014|2024|5e|pf1|pf2|sf1|sf2)$/i.test(colonMatch[1]))) {
      return { system: potentialSys, cleanQuery: colonMatch[2].trim() };
    }
  }

  // 3. Command flag: e.g. -s 2024 fireball or --system pf2 heal or sys:2024 fireball
  const flagMatch = str.match(/^(?:-s|--system|sys:)\s*([a-zA-Z0-9_-]+)\s+(.*)$/i);
  if (flagMatch) {
    const sys = normalizeSystemAlias(flagMatch[1]);
    return { system: sys, cleanQuery: flagMatch[2].trim() };
  }

  // 4. Leading word keyword: e.g. "2024 fireball", "pf2 heal", "2014 magic missile"
  const parts = str.split(/\s+/);
  if (parts.length > 1) {
    const first = parts[0].toLowerCase();
    const resolved = normalizeSystemAlias(first);
    if (resolved && (SYSTEM_VARIANTS[resolved] || /^(2014|2024|pf1|pf2|pf2e|sf1|sf2|a5e)$/i.test(first))) {
      return {
        system: resolved,
        cleanQuery: parts.slice(1).join(' ').trim(),
      };
    }
  }

  return { cleanQuery: str };
}

export interface CompendiumLookupResult {
  block: EntityStatBlock | null;
  systemNotice?: string;
  sourceSystem?: string;
}

/**
 * Universal compendium lookup dispatcher supporting system variants (2014, 2024, PF2, SF2, PF1, SF1).
 * Fails gracefully for stubbed/planned backend systems with informative notices.
 */
export async function fetchCompendiumEntry(
  category: CompendiumCategory,
  query: string,
  requestedSystem?: string
): Promise<CompendiumLookupResult> {
  const normSys = normalizeSystemAlias(requestedSystem);
  const clean = query.trim();
  if (!clean) return { block: null };

  // 1. Handle Stubbed Backends (PF1, SF1, SF2)
  if (normSys === 'pf1' || normSys === 'sf1' || normSys === 'sf2') {
    const sysName = SYSTEM_VARIANTS[normSys]?.name || normSys.toUpperCase();
    return {
      block: null,
      systemNotice: `ℹ️ ${sysName} backend compendium API is currently in development. Looking up "${clean}" in ${sysName} will be available once the dedicated API is connected.`,
      sourceSystem: normSys,
    };
  }

  // 2. Handle 2024 SRD (Open5e v2 srd-2024)
  if (normSys === '5e-2024') {
    let block: EntityStatBlock | null = null;
    const fetchOptions = { document: 'srd-2024', gamesystem: '5e-2024' };
    if (category === 'spell') {
      block = await fetchOpen5eSpell(clean, fetchOptions);
    } else if (category === 'monster') {
      block = await fetchOpen5eMonster(clean, fetchOptions);
    } else if (category === 'item' || category === 'attack') {
      block = await fetchOpen5eItem(clean, fetchOptions);
    }
    if (block) {
      block.sourceSystem = '5e-2024';
      if (block.subtitle) {
        block.subtitle = `${block.subtitle} • 2024 Rules`;
      }
    }
    return { block, sourceSystem: '5e-2024' };
  }

  // 3. Handle 2014 SRD (Open5e v2 srd-2014)
  if (normSys === '5e-2014') {
    let block: EntityStatBlock | null = null;
    const fetchOptions = { document: 'srd-2014', gamesystem: '5e-2014' };
    if (category === 'spell') {
      block = await fetchOpen5eSpell(clean, fetchOptions);
    } else if (category === 'monster') {
      block = await fetchOpen5eMonster(clean, fetchOptions);
    } else if (category === 'item' || category === 'attack') {
      block = await fetchOpen5eItem(clean, fetchOptions);
    }
    if (block) {
      block.sourceSystem = '5e-2014';
      if (block.subtitle) {
        block.subtitle = `${block.subtitle} • 2014 Rules`;
      }
    }
    return { block, sourceSystem: '5e-2014' };
  }

  // 4. Handle Advanced 5e (Level Up)
  if (normSys === 'a5e') {
    let block: EntityStatBlock | null = null;
    const fetchOptions = { document: 'a5e-ag' };
    if (category === 'spell') {
      block = await fetchOpen5eSpell(clean, fetchOptions);
    } else if (category === 'monster') {
      block = await fetchOpen5eMonster(clean, fetchOptions);
    } else if (category === 'item' || category === 'attack') {
      block = await fetchOpen5eItem(clean, fetchOptions);
    }
    if (block) {
      block.sourceSystem = 'a5e';
    }
    return { block, sourceSystem: 'a5e' };
  }

  // 5. Handle Pathfinder 2e (PF2)
  if (normSys === 'pf2') {
    const pf2Category = category === 'monster' ? 'monster' : category === 'spell' ? 'spell' : 'item';
    const block = await fetchPF2eReference(pf2Category, clean);
    return { block, sourceSystem: 'pf2' };
  }

  // 6. Default (No system specified): Query Open5e first (D&D 5e standard), fallback to PF2e
  let block: EntityStatBlock | null = null;
  if (category === 'spell') {
    block = await fetchOpen5eSpell(clean);
  } else if (category === 'monster') {
    block = await fetchOpen5eMonster(clean);
  } else if (category === 'item' || category === 'attack') {
    block = await fetchOpen5eItem(clean);
  }

  if (block) {
    return { block, sourceSystem: '5e' };
  }

  // Fallback to PF2e
  const pf2Category = category === 'monster' ? 'monster' : category === 'spell' ? 'spell' : 'item';
  const pf2Block = await fetchPF2eReference(pf2Category, clean);
  if (pf2Block) {
    return { block: pf2Block, sourceSystem: 'pf2' };
  }

  return { block: null };
}
