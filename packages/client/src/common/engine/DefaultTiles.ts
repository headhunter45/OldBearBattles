import rawTilesData from '../config/defaultTiles.json';
import type { ModularMapTile } from './ModularTileManager.js';
import { isFeatureEnabled } from '../config/featureFlags.js';

/**
 * Builds standard built-in modular tiles for procedural or quick-start dungeon rooms & terrain.
 * Sourced from defaultTiles.json and client public tile assets.
 */
export const DEFAULT_MODULAR_TILES: ModularMapTile[] = (
  rawTilesData as any[]
).map((tile) => {
  const gridTilesX = tile.gridTilesX ?? tile.tiles?.[0]?.length ?? 1;
  const gridTilesY = tile.gridTilesY ?? tile.tiles?.length ?? 1;
  return {
    ...tile,
    gridTilesX,
    gridTilesY,
    width: tile.width ?? gridTilesX * 50,
    height: tile.height ?? gridTilesY * 50,
  };
});

/**
 * Returns default modular tiles if the default_map_tiles feature flag is enabled.
 */
export function getDefaultModularTiles(): ModularMapTile[] {
  return isFeatureEnabled('default_map_tiles') ? DEFAULT_MODULAR_TILES : [];
}

export default DEFAULT_MODULAR_TILES;
