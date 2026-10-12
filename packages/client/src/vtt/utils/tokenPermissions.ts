import type { Token, Player } from '@oldbear/shared';

/**
 * Determines whether a player is permitted to duplicate a token.
 *
 * Rules:
 * - GM can duplicate any token.
 * - Players can duplicate tokens they own or have assigned to them.
 * - Players can duplicate unowned tokens (unclaimed player tokens, props, scenery).
 * - Players CANNOT duplicate tokens owned by other players.
 * - Players CANNOT duplicate GM-only tokens, NPCs, monsters, or bosses (preventing
 *   them from cloning a boss to view hidden stats/actions).
 */
export function canPlayerDuplicateToken(
  token: Token,
  player: Player | null,
  isGm: boolean
): boolean {
  if (isGm) return true;
  if (!player) return false;

  // 1. Their own tokens (owned or assigned)
  if (
    token.ownerId === player.id ||
    Boolean(player.assignedTokenIds?.includes(token.id))
  ) {
    return true;
  }

  // 2. Tokens explicitly owned by another player cannot be duplicated
  if (
    token.ownerId &&
    token.ownerId !== 'unassigned' &&
    token.ownerId !== player.id
  ) {
    return false;
  }

  // 3. Bosses and GM NPCs/Monsters cannot be duplicated by players
  const isPropOrTile = Boolean(
    token.isProp || token.layer === 'prop' || token.layer === 'map'
  );
  const hasMonsterOrBossSheet = Boolean(
    token.character?.actions && token.character.actions.length > 0
  );

  // If it has monster/boss actions and is not an assignable player token
  if (hasMonsterOrBossSheet && !token.isPlayerToken) {
    return false;
  }

  // Any non-player, non-prop token with no owner is GM-only (NPC / Monster)
  if (!token.isPlayerToken && !isPropOrTile) {
    return false;
  }

  // 4. Unowned tokens that are allowed to be duplicated:
  // - Unassigned player tokens (marked for player use, unclaimed)
  // - Decorative props and modular tiles
  const isUnassignedPlayerToken =
    token.isPlayerToken && (!token.ownerId || token.ownerId === 'unassigned');
  if (
    token.ownerId === 'unassigned' ||
    isUnassignedPlayerToken ||
    isPropOrTile
  ) {
    return true;
  }

  return false;
}
