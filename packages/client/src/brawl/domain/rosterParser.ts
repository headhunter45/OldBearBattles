import { WargameArmy, WargameUnit, WargameModel, WargameAction, BaseShape } from '../types/brawl.js';
import { disambiguateArmy } from './armyManager.js';

export interface ParseRosterResult {
  army: WargameArmy;
  format: 'newrecruit' | 'battlescribe_xml' | 'battlescribe_rosz';
  warnings: string[];
}

/**
 * Infers an appropriate base shape and diameter in millimeters from unit keywords, toughness, and wounds.
 */
export function inferBaseShape(name: string, toughness = 4, wounds = 1, baseSpec?: string): BaseShape {
  if (baseSpec) {
    const clean = baseSpec.trim().toLowerCase();
    if (clean.includes('hull') || clean.includes('rect') || clean.includes('vehicle')) {
      return { type: 'rect', widthMm: 120, heightMm: 75 };
    }
    const num = parseInt(clean.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      return { type: 'circle', widthMm: num, heightMm: num };
    }
  }

  const lower = name.toLowerCase();

  if (
    lower.includes('tank') ||
    lower.includes('rhino') ||
    lower.includes('land raider') ||
    lower.includes('repulsor') ||
    lower.includes('predator') ||
    lower.includes('battery')
  ) {
    return { type: 'rect', widthMm: 120, heightMm: 75 };
  }
  if (lower.includes('dreadnought') || lower.includes('helbrute') || lower.includes('carnifex')) {
    return { type: 'circle', widthMm: 60, heightMm: 60 };
  }
  if (lower.includes('terminator') || lower.includes('gravis') || lower.includes('custodian') || lower.includes('captain') || lower.includes('character') || wounds >= 4) {
    return { type: 'circle', widthMm: 40, heightMm: 40 };
  }
  if (lower.includes('grot') || lower.includes('guardsman') || lower.includes('gaunt') || lower.includes('cultist') || toughness <= 3) {
    return { type: 'circle', widthMm: 28, heightMm: 28 };
  }
  return { type: 'circle', widthMm: 32, heightMm: 32 };
}

/**
 * Parses NewRecruit JSON export.
 */
export function parseNewRecruitJson(jsonContent: string | Record<string, any>): WargameArmy {
  const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
  const root = data.roster || data;

  const armyId = `army_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const armyName = root.name || data.name || 'Imported Army';
  const faction = root.faction || root.gameSystemName || data.faction || 'Unknown Faction';

  let pointsLimit = root.pointsLimit || root.maxPoints || 2000;
  let totalCost = 0;

  const rawUnits: any[] = root.units || root.selections || root.forces?.[0]?.selections || [];
  const parsedUnits: WargameUnit[] = [];

  for (let uIdx = 0; uIdx < rawUnits.length; uIdx++) {
    const rawUnit = rawUnits[uIdx];
    const unitName = rawUnit.name || `Unit ${uIdx + 1}`;
    const unitId = `unit_${armyId}_${uIdx}`;

    // Extract unit points
    const unitPts =
      typeof rawUnit.costs?.pts === 'number'
        ? rawUnit.costs.pts
        : typeof rawUnit.cost === 'number'
        ? rawUnit.cost
        : typeof rawUnit.points === 'number'
        ? rawUnit.points
        : 100;

    totalCost += unitPts;

    // Find stats profile if present
    let movement = 6;
    let toughness = 4;
    let armorSave = '3+';
    let wounds = 2;
    let leadership = '6+';
    let oc = 1;

    const profiles = rawUnit.profiles || [];
    const unitProfile = profiles.find(
      (p: any) => p.typeName === 'Unit' || p.type === 'unit' || p.name === unitName
    );

    if (unitProfile?.attributes || unitProfile?.characteristics) {
      const attrs = unitProfile.attributes || unitProfile.characteristics;
      const getAttr = (key: string) => {
        if (typeof attrs === 'object') {
          for (const k of Object.keys(attrs)) {
            if (k.toLowerCase() === key.toLowerCase()) return attrs[k];
          }
        }
        return undefined;
      };

      movement = parseInt(String(getAttr('M') || '6').replace(/\D/g, ''), 10) || 6;
      toughness = parseInt(String(getAttr('T') || '4').replace(/\D/g, ''), 10) || 4;
      armorSave = String(getAttr('SV') || getAttr('Save') || '3+');
      wounds = parseInt(String(getAttr('W') || '2').replace(/\D/g, ''), 10) || 2;
      leadership = String(getAttr('LD') || '6+');
      oc = parseInt(String(getAttr('OC') || '1').replace(/\D/g, ''), 10) || 1;
    }

    // Extract weapons into baseActions
    const baseActions: WargameAction[] = [];
    const weaponProfiles = profiles.filter(
      (p: any) =>
        p.typeName?.includes('Weapon') ||
        p.type?.includes('weapon') ||
        p.attributes?.Range ||
        p.characteristics?.Range
    );

    weaponProfiles.forEach((wp: any, wIdx: number) => {
      const wName = wp.name || `Weapon ${wIdx + 1}`;
      const isMelee = wp.typeName?.toLowerCase().includes('melee') || wp.type?.toLowerCase().includes('melee');
      const attrs = wp.attributes || wp.characteristics || {};
      const getVal = (k: string) => {
        for (const key of Object.keys(attrs)) {
          if (key.toLowerCase() === k.toLowerCase()) return String(attrs[key]);
        }
        return '';
      };

      baseActions.push({
        id: `act_${unitId}_${wIdx}`,
        name: wName,
        type: isMelee ? 'melee' : 'ranged',
        rangeInches: isMelee ? 0 : parseInt(getVal('range').replace(/\D/g, ''), 10) || 24,
        attacks: getVal('A') || '2',
        skill: getVal('BS') || getVal('WS') || '3+',
        strength: parseInt(getVal('S').replace(/\D/g, ''), 10) || 4,
        ap: parseInt(getVal('AP').replace(/[^0-9-]/g, ''), 10) || 0,
        damage: getVal('D') || '1',
      });
    });

    // Model count
    const modelCount =
      rawUnit.count ||
      rawUnit.number ||
      rawUnit.models?.length ||
      rawUnit.selections?.filter((s: any) => s.type === 'model').length ||
      5;

    const baseShape = inferBaseShape(unitName, toughness, wounds);

    const models: WargameModel[] = [];
    for (let m = 0; m < modelCount; m++) {
      models.push({
        id: `model_${unitId}_${m}`,
        name: `${unitName} ${m + 1}`,
        unitId,
        x: 0,
        y: 0,
        baseShape,
      });
    }

    parsedUnits.push({
      id: unitId,
      name: unitName,
      armyId,
      points: unitPts,
      coherencyDistanceInches: 2.0,
      models,
      baseActions,
      datasheet: {
        movementInches: movement,
        toughness,
        armorSave,
        woundsPerModel: wounds,
        leadership,
        objectiveControl: oc,
      },
    });
  }

  const army: WargameArmy = {
    id: armyId,
    name: armyName,
    faction,
    pointsLimit: Math.max(pointsLimit, totalCost),
    units: parsedUnits,
  };

  return disambiguateArmy(army);
}

interface XmlNode {
  tagName: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
}

/**
 * Lightweight, zero-dependency XML element parser suitable for browser & node test runners.
 */
function parseXmlSimple(str: string): XmlNode | null {
  let pos = 0;
  function parseNode(): XmlNode | { type: 'close'; tagName: string } | null {
    while (pos < str.length && str[pos] !== '<') pos++;
    if (pos >= str.length) return null;
    if (str.startsWith('<!--', pos)) {
      const end = str.indexOf('-->', pos);
      pos = end === -1 ? str.length : end + 3;
      return parseNode();
    }
    if (str.startsWith('<?', pos)) {
      const end = str.indexOf('?>', pos);
      pos = end === -1 ? str.length : end + 2;
      return parseNode();
    }
    if (str.startsWith('<!', pos)) {
      const end = str.indexOf('>', pos);
      pos = end === -1 ? str.length : end + 1;
      return parseNode();
    }
    if (str.startsWith('</', pos)) {
      const end = str.indexOf('>', pos);
      const closeTagName = str.slice(pos + 2, end).trim();
      pos = end === -1 ? str.length : end + 1;
      return { type: 'close', tagName: closeTagName };
    }
    const tagEnd = str.indexOf('>', pos);
    if (tagEnd === -1) return null;
    const tagContent = str.slice(pos + 1, tagEnd);
    const isSelfClosing = tagContent.endsWith('/');
    const cleanContent = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent.trim();

    const spaceIdx = cleanContent.search(/\s/);
    const tagName = spaceIdx === -1 ? cleanContent : cleanContent.slice(0, spaceIdx);
    const attrStr = spaceIdx === -1 ? '' : cleanContent.slice(spaceIdx);
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9_:-]+)="([^"]*)"/g;
    let aMatch: RegExpExecArray | null;
    while ((aMatch = attrRegex.exec(attrStr)) !== null) {
      attrs[aMatch[1]] = aMatch[2];
    }

    pos = tagEnd + 1;
    const node: XmlNode = { tagName, attrs, children: [], text: '' };
    if (isSelfClosing) return node;

    while (pos < str.length) {
      const textStart = pos;
      const nextTag = str.indexOf('<', pos);
      if (nextTag === -1) break;
      if (nextTag > textStart) {
        node.text += str.slice(textStart, nextTag);
      }
      pos = nextTag;
      if (str.startsWith('</', pos)) {
        const closeEnd = str.indexOf('>', pos);
        pos = closeEnd === -1 ? str.length : closeEnd + 1;
        break;
      }
      const child = parseNode();
      if (child) {
        if ('type' in child && child.type === 'close') {
          break;
        } else {
          node.children.push(child as XmlNode);
        }
      }
    }
    return node;
  }
  const root = parseNode();
  return root && !('type' in root) ? root : null;
}

function findChildren(node: XmlNode, tagName: string): XmlNode[] {
  return (node.children || []).filter((c) => c.tagName === tagName);
}

function findDescendants(node: XmlNode, tagName: string): XmlNode[] {
  const res: XmlNode[] = [];
  if (node.tagName === tagName) res.push(node);
  for (const c of node.children || []) {
    res.push(...findDescendants(c, tagName));
  }
  return res;
}

/**
 * Parses BattleScribe `.ros` XML format.
 */
export function parseBattleScribeXml(xmlContent: string): WargameArmy {
  const armyId = `army_bs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const root = parseXmlSimple(xmlContent);

  if (!root) {
    throw new Error('Invalid or unparseable BattleScribe XML');
  }

  // Extract roster name
  const armyName = root.attrs.name || 'BattleScribe Army';

  // Extract catalogue / faction & detachment
  const forces = findDescendants(root, 'force');
  let faction = 'Unknown Faction';
  if (forces.length > 0) {
    faction = forces[0].attrs.catalogueName || forces[0].attrs.name || 'Unknown Faction';
  }

  // Check detachment
  let detachment: string | undefined = undefined;
  const detachmentSel = findDescendants(root, 'selection').find(
    (s) => s.attrs.name === 'Detachment' || s.attrs.group === 'Detachment',
  );
  if (detachmentSel) {
    const subSel = findDescendants(detachmentSel, 'selection').find((s) => s !== detachmentSel);
    if (subSel) detachment = subSel.attrs.name;
    else if (detachmentSel.attrs.group === 'Detachment') detachment = detachmentSel.attrs.name;
  }

  // Points limit & Roster Points
  let pointsLimit = 2000;
  let rosterTotalPts = 0;
  for (const costs of findChildren(root, 'costs')) {
    for (const cost of findChildren(costs, 'cost')) {
      if (cost.attrs.name === 'pts') {
        rosterTotalPts = parseInt(cost.attrs.value, 10) || 0;
      }
    }
  }
  for (const limits of findChildren(root, 'costLimits')) {
    for (const limit of findChildren(limits, 'costLimit')) {
      if (limit.attrs.name === 'pts') {
        pointsLimit = parseInt(limit.attrs.value, 10) || 0;
      }
    }
  }
  if ((!pointsLimit || pointsLimit === 0) && rosterTotalPts > 0) {
    pointsLimit = rosterTotalPts;
  }

  // Top-level selections to extract as units
  let unitSelections: XmlNode[] = [];
  if (forces.length > 0) {
    for (const force of forces) {
      const selectionsWrap = findChildren(force, 'selections')[0];
      const directSelections = selectionsWrap
        ? findChildren(selectionsWrap, 'selection')
        : findChildren(force, 'selection');
      for (const sel of directSelections) {
        if (sel.attrs.type === 'unit' || sel.attrs.type === 'model') {
          unitSelections.push(sel);
        }
      }
    }
  }

  // Fallback if not inside <force>
  if (unitSelections.length === 0) {
    const rootSelectionsWrap = findChildren(root, 'selections')[0];
    const directSelections = rootSelectionsWrap
      ? findChildren(rootSelectionsWrap, 'selection')
      : findChildren(root, 'selection');
    for (const sel of directSelections) {
      if (sel.attrs.type === 'unit' || sel.attrs.type === 'model') {
        unitSelections.push(sel);
      }
    }
  }

  // Fallback to any selection of type unit or model if still empty
  if (unitSelections.length === 0) {
    unitSelections = findDescendants(root, 'selection').filter(
      (s) => s.attrs.type === 'unit' || s.attrs.type === 'model',
    );
  }

  const parsedUnits: WargameUnit[] = [];
  let uIdx = 0;

  for (const sel of unitSelections) {
    const unitName = sel.attrs.name || `Unit ${uIdx + 1}`;
    const unitId = `unit_${armyId}_${uIdx}`;

    // Extract unit points: first try direct <costs><cost name="pts"/>, otherwise sum descendants
    const directCostNode = findChildren(sel, 'costs')
      .flatMap((c) => findChildren(c, 'cost'))
      .find((c) => c.attrs.name === 'pts');
    let unitPts = 0;
    if (directCostNode && directCostNode.attrs.value) {
      unitPts = parseInt(directCostNode.attrs.value, 10) || 0;
    } else {
      const descCosts = findDescendants(sel, 'cost').filter((c) => c.attrs.name === 'pts');
      unitPts = descCosts.reduce((sum, c) => sum + (parseInt(c.attrs.value, 10) || 0), 0);
    }

    // Profile characteristics
    const allProfiles = findDescendants(sel, 'profile');
    const unitProfile =
      allProfiles.find((p) => p.attrs.typeName === 'Unit') ||
      allProfiles.find((p) =>
        findDescendants(p, 'characteristic').some(
          (c) => c.attrs.name === 'M' || c.attrs.name === 'T',
        ),
      );

    let movement = 6;
    let toughness = 4;
    let armorSave = '3+';
    let wounds = 2;
    let leadership = '6+';
    let oc = 1;
    let baseSpec: string | undefined = undefined;

    if (unitProfile) {
      const chars = findDescendants(unitProfile, 'characteristic');
      const getChar = (cName: string) => {
        const c = chars.find((x) => x.attrs.name?.toLowerCase() === cName.toLowerCase());
        return c ? c.text.trim() : '';
      };

      movement = parseInt(getChar('M').replace(/\D/g, ''), 10) || 6;
      toughness = parseInt(getChar('T').replace(/\D/g, ''), 10) || 4;
      armorSave = getChar('Sv') || '3+';
      wounds = parseInt(getChar('W').replace(/\D/g, ''), 10) || 2;
      leadership = getChar('Ld') || getChar('LD') || '6+';
      oc = parseInt(getChar('OC').replace(/\D/g, ''), 10) || 1;
      baseSpec = getChar('Base') || undefined;
    }

    // Extract weapons
    const weaponProfiles = allProfiles.filter((p) =>
      (p.attrs.typeName || '').toLowerCase().includes('weapon'),
    );
    const baseActions: WargameAction[] = [];
    const seenWeaponNames = new Set<string>();
    let wIdx = 0;

    for (const wp of weaponProfiles) {
      const typeName = wp.attrs.typeName || '';
      const isMelee = typeName.toLowerCase().includes('melee');
      const wName = wp.attrs.name || `Weapon ${wIdx + 1}`;
      if (seenWeaponNames.has(wName)) continue;
      seenWeaponNames.add(wName);

      const chars = findDescendants(wp, 'characteristic');
      const getWChar = (cName: string) => {
        const c = chars.find((x) => x.attrs.name?.toLowerCase() === cName.toLowerCase());
        return c ? c.text.trim() : '';
      };

      baseActions.push({
        id: `act_${unitId}_${wIdx}`,
        name: wName,
        type: isMelee ? 'melee' : 'ranged',
        rangeInches: isMelee ? 0 : parseInt(getWChar('Range').replace(/\D/g, ''), 10) || 24,
        attacks: getWChar('A') || '2',
        skill: getWChar('BS') || getWChar('WS') || '3+',
        strength: parseInt(getWChar('S').replace(/\D/g, ''), 10) || 4,
        ap: parseInt(getWChar('AP').replace(/[^0-9-]/g, ''), 10) || 0,
        damage: getWChar('D') || '1',
      });
      wIdx++;
    }

    // Model count: sum child models if present, else check unit selection number
    let modelCount = 0;
    const childModels = findDescendants(sel, 'selection').filter(
      (s) => s !== sel && s.attrs.type === 'model',
    );
    if (childModels.length > 0) {
      for (const cm of childModels) {
        modelCount += parseInt(cm.attrs.number || '1', 10);
      }
    } else {
      modelCount = parseInt(sel.attrs.number || '1', 10);
    }
    if (modelCount === 0 || isNaN(modelCount)) {
      modelCount = 1;
    }

    const baseShape = inferBaseShape(unitName, toughness, wounds, baseSpec);

    const models: WargameModel[] = [];
    for (let m = 0; m < modelCount; m++) {
      models.push({
        id: `model_${unitId}_${m}`,
        name: `${unitName} ${m + 1}`,
        unitId,
        x: 0,
        y: 0,
        baseShape,
      });
    }

    parsedUnits.push({
      id: unitId,
      name: unitName,
      armyId,
      points: unitPts,
      coherencyDistanceInches: 2.0,
      models,
      baseActions,
      datasheet: {
        movementInches: movement,
        toughness,
        armorSave,
        woundsPerModel: wounds,
        leadership,
        objectiveControl: oc,
      },
    });

    uIdx++;
  }

  const calculatedTotal = parsedUnits.reduce((sum, u) => sum + u.points, 0);

  const army: WargameArmy = {
    id: armyId,
    name: armyName,
    faction,
    detachment,
    pointsLimit: pointsLimit || Math.max(calculatedTotal, 1000),
    units: parsedUnits,
  };

  return disambiguateArmy(army);
}

/**
 * Extracts raw XML string from a zipped BattleScribe `.rosz` byte buffer.
 * Uses standard zip local header detection.
 */
export async function extractRosXmlFromRosz(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // Check PKZip signature 'PK\x03\x04' (0x04034b50)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    // Read local file header: compression method at offset 8 (2 bytes)
    const compressionMethod = bytes[8] | (bytes[9] << 8);
    const fileNameLen = bytes[26] | (bytes[27] << 8);
    const extraFieldLen = bytes[28] | (bytes[29] << 8);
    const dataOffset = 30 + fileNameLen + extraFieldLen;

    if (compressionMethod === 0) {
      // Uncompressed stored data
      const compressedSize = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
      const xmlBytes = bytes.slice(dataOffset, dataOffset + compressedSize);
      return new TextDecoder().decode(xmlBytes);
    } else if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
      // Deflated data
      const compressedSize = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
      const compressedData = bytes.slice(dataOffset, dataOffset + compressedSize);

      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compressedData);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const res = await reader.read();
          if (res.done) done = true;
          else chunks.push(res.value);
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        return new TextDecoder().decode(merged);
      } catch {
        // Fallback to text decoding
      }
    }
  }

  // Fallback if already an XML string or raw
  return new TextDecoder().decode(bytes);
}

/**
 * Universal auto-detection and ingestion pipeline for roster exports.
 */
export async function parseRosterFile(
  filename: string,
  content: string | ArrayBuffer | Uint8Array
): Promise<ParseRosterResult> {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.rosz') || (content instanceof ArrayBuffer && !(typeof content === 'string'))) {
    const xml = await extractRosXmlFromRosz(content as any);
    const army = parseBattleScribeXml(xml);
    return {
      army,
      format: 'battlescribe_rosz',
      warnings: [],
    };
  }

  const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content as any);

  if (lowerName.endsWith('.json') || textContent.trim().startsWith('{')) {
    const army = parseNewRecruitJson(textContent);
    return {
      army,
      format: 'newrecruit',
      warnings: [],
    };
  }

  if (lowerName.endsWith('.ros') || textContent.includes('<roster')) {
    const army = parseBattleScribeXml(textContent);
    return {
      army,
      format: 'battlescribe_xml',
      warnings: [],
    };
  }

  throw new Error(`Unsupported roster format: "${filename}". Expected NewRecruit JSON or BattleScribe .ros / .rosz.`);
}
