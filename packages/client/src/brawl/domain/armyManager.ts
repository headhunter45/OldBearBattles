import { Token } from '@oldbear/shared';
import { WargameArmy, WargameUnit, WargameModel, BaseShape } from '../types/brawl.js';

export const MM_PER_INCH = 25.4;
export const DEFAULT_PX_PER_INCH = 50;

/**
 * Automatically disambiguates duplicate units and auto-numbers models in an army roster.
 * Example: Two "Terminators" units become "Terminators A" and "Terminators B",
 * and models inside become "Terminators A 1", "Terminators A 2", etc.
 */
export function disambiguateArmy(army: WargameArmy): WargameArmy {
  // Count unit names to identify duplicates
  const nameCounts: Record<string, number> = {};
  army.units.forEach((u) => {
    nameCounts[u.name] = (nameCounts[u.name] || 0) + 1;
  });

  const nameOccurrences: Record<string, number> = {};

  const disambiguatedUnits: WargameUnit[] = army.units.map((unit) => {
    let resolvedUnitName = unit.name;
    if (nameCounts[unit.name] > 1) {
      const occurrence = (nameOccurrences[unit.name] || 0) + 1;
      nameOccurrences[unit.name] = occurrence;
      const letter = String.fromCharCode(64 + occurrence); // 1 -> 'A', 2 -> 'B'
      resolvedUnitName = `${unit.name} ${letter}`;
    }

    // Disambiguate and auto-number models inside unit
    const models: WargameModel[] = unit.models.map((model, idx) => {
      const modelNum = idx + 1;
      const expectedDefaultPrefix = `${resolvedUnitName} ${modelNum}`;
      const name = !model.name || model.name.trim() === '' || model.name.startsWith(unit.name)
        ? expectedDefaultPrefix
        : model.name;

      return {
        ...model,
        name,
        unitId: unit.id,
      };
    });

    return {
      ...unit,
      name: resolvedUnitName,
      models,
    };
  });

  return {
    ...army,
    units: disambiguatedUnits,
  };
}

/**
 * Calculates true perimeter-to-perimeter (base-to-base) measurement in inches.
 * Accounts for circular and oval base dimensions in millimeters.
 */
export function calculateBaseToDistanceInches(
  modelA: WargameModel,
  modelB: WargameModel,
  pxPerInch: number = DEFAULT_PX_PER_INCH
): number {
  const centerDistPx = Math.hypot(modelA.x - modelB.x, modelA.y - modelB.y);

  // Compute radii in pixels based on base shape
  const radiusAPx = getBaseRadiusPx(modelA.baseShape, pxPerInch);
  const radiusBPx = getBaseRadiusPx(modelB.baseShape, pxPerInch);

  const edgeToEdgeDistPx = Math.max(0, centerDistPx - (radiusAPx + radiusBPx));
  return edgeToEdgeDistPx / pxPerInch;
}

/**
 * Returns average radial size in canvas pixels for a given base shape in millimeters.
 */
export function getBaseRadiusPx(baseShape: BaseShape, pxPerInch: number = DEFAULT_PX_PER_INCH): number {
  const widthInches = (baseShape.widthMm || 32) / MM_PER_INCH;
  const heightInches = (baseShape.heightMm || baseShape.widthMm || 32) / MM_PER_INCH;
  const avgDiameterInches = (widthInches + heightInches) / 2;
  return (avgDiameterInches * pxPerInch) / 2;
}

/**
 * Calculates radius in inches for a token's base geometry.
 */
export function calculateBaseRadiusInches(token: Token): number {
  if (token.baseShape) {
    const widthInches = (token.baseShape.widthMm || 32) / MM_PER_INCH;
    const heightInches = (token.baseShape.heightMm || token.baseShape.widthMm || 32) / MM_PER_INCH;
    return (widthInches + heightInches) / 4;
  }
  const sizeNum = typeof token.size === 'number' ? token.size : (token.size === 'large' ? 2 : token.size === 'huge' ? 3 : 1);
  return sizeNum / 2;
}

export const UNIT_COHERENCY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#a855f7', // violet
  '#14b8a6', // teal
];

export function getUnitColor(unitId: string): string {
  let hash = 0;
  for (let i = 0; i < unitId.length; i++) {
    hash = (hash * 31 + unitId.charCodeAt(i)) >>> 0;
  }
  return UNIT_COHERENCY_COLORS[hash % UNIT_COHERENCY_COLORS.length];
}

/**
 * Converts a WargameModel into a fully ready-to-fight VTT canvas Token.
 */
export function modelToToken(
  model: WargameModel,
  unit: WargameUnit,
  army: WargameArmy,
  pxPerInch: number = DEFAULT_PX_PER_INCH,
  mapId: string = ''
): Token {
  const widthInches = (model.baseShape.widthMm || 32) / MM_PER_INCH;
  const heightInches = (model.baseShape.heightMm || model.baseShape.widthMm || 32) / MM_PER_INCH;
  const size = Math.max(0.5, Math.round(widthInches * 10) / 10);

  const wounds = unit.datasheet?.woundsPerModel || 1;
  const unitColor = getUnitColor(unit.id);

  const actions = (model.actionOverrides && model.actionOverrides.length > 0
    ? model.actionOverrides
    : unit.baseActions || []
  ).map((act) => ({
    id: act.id,
    name: act.name,
    type: act.type === 'ranged' ? ('ranged' as const) : ('melee' as const),
    range: act.rangeInches ? `${act.rangeInches}"` : 'Melee',
    attackBonus: parseInt(act.skill?.replace('+', '') || '3', 10),
    damage: `${act.damage || 1}`,
    description: act.rulesDescription || `A: ${act.attacks}, S: ${act.strength}, AP: ${act.ap}`,
  }));

  return {
    id: `token_${model.id}`,
    mapId,
    name: model.name,
    x: model.x,
    y: model.y,
    size,
    color: unitColor,
    ringColor: unitColor,
    fillColor: '#1e293b',
    clipCircle: true,
    clipShape: model.baseShape.type === 'rect' ? 'square' : 'circle',
    rotation: 0,
    currentHp: wounds,
    maxHp: wounds,
    tempHp: 0,
    speed: (unit.datasheet?.movementInches || 6) * 5,
    armorClass: parseInt(unit.datasheet?.armorSave?.replace('+', '') || '3', 10) || 10,
    initiativeBonus: 0,
    conditions: [],
    isProp: false,
    layer: 'token',
    actions,
    unitId: unit.id,
    wargameArmyId: army.id,
    wargameUnitId: unit.id,
    wargameModelId: model.id,
    unitHaloColor: unitColor,
    baseShape: model.baseShape,
  };
}
