import {CustomStatusDefinition, GameMap, Token} from '@oldbear/shared';

export const DEFAULT_STATUS_DEFINITIONS: Record<
    string, CustomStatusDefinition> = {
  Dying: {
    label: 'Dying',
    description: 'The unit is dying and making death saving throws',
    color: '#ef4444',
    counter: {start: 1, update: 1, max: 3},
    showOnToken: true,
    clearWhen: 'beginning_of_turn',
    updates: 'end_of_turn',
  },
  Bleeding: {
    label: 'Bleeding',
    description: 'Taking bleed damage each turn',
    color: '#dc2626',
    counter: {start: 3, update: -1, min: 0},
    showOnToken: true,
    clearWhen: 'beginning_of_turn',
    updates: 'beginning_of_turn',
  },
  Stunned: {
    label: 'Stunned',
    description: 'The unit cannot take actions or reactions',
    color: '#eab308',
    showOnToken: true,
    clearWhen: 'end_of_turn',
  },
  Blinded: {
    label: 'Blinded',
    description:
        'Cannot see and automatically fails sight-based ability checks',
    color: '#64748b',
    showOnToken: true,
  },
  Charmed: {
    label: 'Charmed',
    description: 'Cannot attack charmer and charmer has social advantage',
    color: '#ec4899',
    showOnToken: true,
  },
  Concentrating: {
    label: 'Concentrating',
    description: 'Maintaining focus on an active spell',
    color: '#3b82f6',
    showOnToken: true,
  },
  Deafened: {
    label: 'Deafened',
    description: 'Cannot hear and automatically fails hearing-based ability checks',
    color: '#7c3aed',
    showOnToken: true,
  },
  Exhaustion: {
    label: 'Exhaustion',
    description: 'Cumulative penalties to rolls, speed, and health',
    color: '#475569',
    counter: {start: 1, update: 1, max: 6},
    showOnToken: true,
  },
  Frightened: {
    label: 'Frightened',
    description: 'Disadvantage on ability checks and attack rolls while source of fear is in line of sight',
    color: '#e11d48',
    showOnToken: true,
  },
  Grappled: {
    label: 'Grappled',
    description: 'Speed is 0 and cannot benefit from bonuses to speed',
    color: '#c2410c',
    showOnToken: true,
  },
  Incapacitated: {
    label: 'Incapacitated',
    description: 'Cannot take actions or reactions',
    color: '#991b1b',
    showOnToken: true,
  },
  Invisible: {
    label: 'Invisible',
    description: 'Impossible to see without magic or special senses',
    color: '#06b6d4',
    showOnToken: true,
  },
  Paralyzed: {
    label: 'Paralyzed',
    description: 'Incapacitated and cannot move or speak. Attacks within 5ft are critical hits',
    color: '#f97316',
    showOnToken: true,
  },
  Petrified: {
    label: 'Petrified',
    description: 'Transformed into solid inanimate substance with resistance to all damage',
    color: '#52525b',
    showOnToken: true,
  },
  Poisoned: {
    label: 'Poisoned',
    description: 'Disadvantage on attack rolls and ability checks',
    color: '#10b981',
    showOnToken: true,
  },
  Prone: {
    label: 'Prone',
    description: 'Can only crawl. Disadvantage on attack rolls; melee attacks against have advantage',
    color: '#ea580c',
    showOnToken: true,
  },
  Restrained: {
    label: 'Restrained',
    description:
        'Speed 0, attack rolls against have advantage, unit has disadvantage',
    color: '#a855f7',
    showOnToken: true,
  },
  Unconscious: {
    label: 'Unconscious',
    description: 'Incapacitated, drops held items, falls prone, automatically fails Str and Dex saves',
    color: '#7f1d1d',
    showOnToken: true,
  },
};

const STORAGE_KEY = 'obb_custom_statuses';

/**
 * Retrieves global custom status definitions stored in localStorage.
 */
export function getGlobalStatusDefinitions():
    Record<string, CustomStatusDefinition> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Saves a custom status definition to global defaults in localStorage.
 */
export function saveGlobalStatusDefinition(status: CustomStatusDefinition):
    void {
  if (typeof localStorage === 'undefined') return;
  const current = getGlobalStatusDefinitions();
  current[status.label] = status;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
  }
}

/**
 * Deletes a custom status definition from global defaults.
 */
export function deleteGlobalStatusDefinition(label: string): void {
  if (typeof localStorage === 'undefined') return;
  const current = getGlobalStatusDefinitions();
  delete current[label];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
  }
}

/**
 * Saves or updates a custom status definition on a scene (GameMap).
 */
export function saveSceneStatusDefinition(
    scene: GameMap, status: CustomStatusDefinition): Record<string, CustomStatusDefinition> {
  const current = { ...(scene.customStatuses || {}) };
  current[status.label] = status;
  return current;
}

/**
 * Removes a custom status definition from a scene (GameMap).
 */
export function deleteSceneStatusDefinition(
    scene: GameMap, label: string): Record<string, CustomStatusDefinition> {
  const current = { ...(scene.customStatuses || {}) };
  delete current[label];
  return current;
}

/**
 * Resolves the merged status hierarchy:
 * 1. Default built-ins
 * 2. Global localStorage customizations
 * 3. Per-scene overrides (from scene.customStatuses)
 */
export function resolveStatusDefinitions(scene?: GameMap|null):
    Record<string, CustomStatusDefinition> {
  const globalDefs = getGlobalStatusDefinitions();
  const sceneDefs = scene?.customStatuses || {};
  return {
    ...DEFAULT_STATUS_DEFINITIONS,
    ...globalDefs,
    ...sceneDefs,
  };
}

/**
 * Extracts condition label and optional counter value from condition string or
 * token state.
 */
export function parseCondition(
    cond: string, token?: Token): {label: string; count?: number} {
  const parts = cond.split(':');
  const label = parts[0];
  let count: number|undefined;

  if (parts.length > 1) {
    const parsed = parseInt(parts[1], 10);
    if (!isNaN(parsed)) count = parsed;
  } else if (
      token?.statusCounters && token.statusCounters[label] !== undefined) {
    count = token.statusCounters[label];
  }

  return {label, count};
}

/**
 * Formats condition string with counter.
 */
export function formatCondition(label: string, count?: number): string {
  if (count === undefined) return label;
  return `${label}:${count}`;
}

export interface TurnTransitionResult {
  updatedTokens: Record<string, Token>;
  auditMessages: string[];
}

/**
 * Evaluates turn lifecycle triggers (beginning_of_turn, end_of_turn) across
 * tokens. Advances counters or clears statuses based on schema configuration.
 */
export function processTurnTransition(
    tokens: Record<string, Token>, endingTokenId: string|undefined,
    startingTokenId: string|undefined,
    definitions: Record<string, CustomStatusDefinition>): TurnTransitionResult {
  const updatedTokens: Record<string, Token> = {};
  const auditMessages: string[] = [];

  // Helper to process triggers for a specific combatant
  const processTrigger =
      (tokenId: string, trigger: 'beginning_of_turn'|'end_of_turn',
       triggerDescription: string) => {
        const token = updatedTokens[tokenId] || tokens[tokenId];
        if (!token || !token.conditions || token.conditions.length === 0)
          return;

        let hasChanges = false;
        const nextConditions: string[] = [];
        const nextCounters:
            Record<string, number> = {...(token.statusCounters || {})};

        for (const cond of token.conditions) {
          const {label, count} = parseCondition(cond, token);
          const def = definitions[label];

          if (!def) {
            nextConditions.push(cond);
            continue;
          }

          // 1. Check if counter should update on this turn trigger
          if (def.updates === trigger && def.counter) {
            hasChanges = true;
            const currentVal = count ?? def.counter.start;
            let newVal = currentVal + def.counter.update;

            // Check if counter has expired / reached min and should clear
            const minVal = def.counter.min ?? 0;
            if (def.clearWhen === trigger && newVal <= minVal) {
              delete nextCounters[label];
              auditMessages.push(`✨ **${token.name}**: Condition **${
                  label}** expired at the ${triggerDescription}.`);
              continue;
            }

            // Min clamp
            if (def.counter.min !== undefined && newVal < def.counter.min) {
              newVal = def.counter.min;
            }

            // Max check
            if (def.counter.max !== undefined && newVal > def.counter.max) {
              newVal = def.counter.max;
            }

            nextCounters[label] = newVal;
            nextConditions.push(formatCondition(label, newVal));
            auditMessages.push(`⏱️ **${token.name}**: **${
                label}** counter updated to **${newVal}** (was ${
                currentVal}) at the ${triggerDescription}.`);
            continue;
          }

          // 2. Check if condition should be cleared on this turn trigger
          if (def.clearWhen === trigger) {
            hasChanges = true;
            delete nextCounters[label];
            auditMessages.push(`✨ **${token.name}**: Condition **${
                label}** expired at the ${triggerDescription}.`);
            continue;
          }

          nextConditions.push(cond);
        }

        if (hasChanges) {
          updatedTokens[tokenId] = {
            ...token,
            conditions: nextConditions,
            statusCounters: nextCounters,
          };
        }
      };

  // 1. End of turn for the combatant finishing their action
  if (endingTokenId) {
    processTrigger(endingTokenId, 'end_of_turn', 'end of their turn');
  }

  // 2. Beginning of turn for the combatant starting their action
  if (startingTokenId) {
    processTrigger(
        startingTokenId, 'beginning_of_turn', 'beginning of their turn');
  }

  return {
    updatedTokens,
    auditMessages,
  };
}
