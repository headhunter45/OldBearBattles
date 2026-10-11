import { describe, it } from 'node:test';
import assert from 'node:assert';
import { updateActiveFlags } from '../config/featureFlags.js';
import {
  parseCompendiumQuery,
  fetchCompendiumEntry,
  normalizeSystemAlias,
  SYSTEM_VARIANTS,
} from './compendiumResolver.js';

describe('Multi-System Compendium Resolver & Variants (OB-212)', () => {
  updateActiveFlags({ search_open5e: true });

  it('normalizes system aliases correctly', () => {
    assert.strictEqual(normalizeSystemAlias('2024'), '5e-2024');
    assert.strictEqual(normalizeSystemAlias('5e-2024'), '5e-2024');
    assert.strictEqual(normalizeSystemAlias('2014'), '5e-2014');
    assert.strictEqual(normalizeSystemAlias('5e'), '5e-2014');
    assert.strictEqual(normalizeSystemAlias('pf2'), 'pf2');
    assert.strictEqual(normalizeSystemAlias('pf2e'), 'pf2');
    assert.strictEqual(normalizeSystemAlias('sf2'), 'sf2');
    assert.strictEqual(normalizeSystemAlias('pf1'), 'pf1');
    assert.strictEqual(normalizeSystemAlias('sf1'), 'sf1');
    assert.strictEqual(normalizeSystemAlias('a5e'), 'a5e');
  });

  it('parses system variants from multiple syntax forms', () => {
    // 1. Bracket syntax
    const b1 = parseCompendiumQuery('[2024] fireball');
    assert.strictEqual(b1.system, '5e-2024');
    assert.strictEqual(b1.cleanQuery, 'fireball');

    const b2 = parseCompendiumQuery('(pf2) heal');
    assert.strictEqual(b2.system, 'pf2');
    assert.strictEqual(b2.cleanQuery, 'heal');

    // 2. Colon prefix
    const c1 = parseCompendiumQuery('2024:fireball');
    assert.strictEqual(c1.system, '5e-2024');
    assert.strictEqual(c1.cleanQuery, 'fireball');

    const c2 = parseCompendiumQuery('pf2:heal');
    assert.strictEqual(c2.system, 'pf2');
    assert.strictEqual(c2.cleanQuery, 'heal');

    // 3. Flag syntax
    const f1 = parseCompendiumQuery('-s 2024 fireball');
    assert.strictEqual(f1.system, '5e-2024');
    assert.strictEqual(f1.cleanQuery, 'fireball');

    const f2 = parseCompendiumQuery('--system pf2 heal');
    assert.strictEqual(f2.system, 'pf2');
    assert.strictEqual(f2.cleanQuery, 'heal');

    // 4. Leading word keyword
    const k1 = parseCompendiumQuery('2024 fireball');
    assert.strictEqual(k1.system, '5e-2024');
    assert.strictEqual(k1.cleanQuery, 'fireball');

    const k2 = parseCompendiumQuery('pf2e heal');
    assert.strictEqual(k2.system, 'pf2');
    assert.strictEqual(k2.cleanQuery, 'heal');

    const k3 = parseCompendiumQuery('sf1 laser rifle');
    assert.strictEqual(k3.system, 'sf1');
    assert.strictEqual(k3.cleanQuery, 'laser rifle');

    const k4 = parseCompendiumQuery('sf2 plasma pistol');
    assert.strictEqual(k4.system, 'sf2');
    assert.strictEqual(k4.cleanQuery, 'plasma pistol');

    // 5. No system specified
    const n1 = parseCompendiumQuery('magic missile');
    assert.strictEqual(n1.system, undefined);
    assert.strictEqual(n1.cleanQuery, 'magic missile');
  });

  it('returns graceful systemNotice for stubbed/planned backends (PF1, SF1, SF2)', async () => {
    const pf1Result = await fetchCompendiumEntry('spell', 'magic missile', 'pf1');
    assert.strictEqual(pf1Result.block, null);
    assert.ok(pf1Result.systemNotice?.includes('Pathfinder 1e'));
    assert.ok(pf1Result.systemNotice?.includes('development'));

    const sf1Result = await fetchCompendiumEntry('item', 'laser rifle', 'sf1');
    assert.strictEqual(sf1Result.block, null);
    assert.ok(sf1Result.systemNotice?.includes('Starfinder 1e'));

    const sf2Result = await fetchCompendiumEntry('attack', 'plasma cannon', 'sf2');
    assert.strictEqual(sf2Result.block, null);
    assert.ok(sf2Result.systemNotice?.includes('Starfinder 2e'));
  });

  it('documents all supported and planned system variants in registry', () => {
    assert.ok(SYSTEM_VARIANTS['5e-2014']);
    assert.ok(SYSTEM_VARIANTS['5e-2024']);
    assert.ok(SYSTEM_VARIANTS['pf2']);
    assert.ok(SYSTEM_VARIANTS['sf2']);
    assert.ok(SYSTEM_VARIANTS['pf1']);
    assert.ok(SYSTEM_VARIANTS['sf1']);
    assert.ok(SYSTEM_VARIANTS['a5e']);
  });

  it('queries weapon and attack compendium entries with damage formula (OB-217)', async () => {
    // 5e weapon compendium lookup
    const attackRes = await fetchCompendiumEntry('attack', 'greatsword');
    if (attackRes.block) {
      assert.strictEqual(attackRes.block.type, 'attack');
      assert.ok(attackRes.block.damageFormula, 'Has damage formula');
      assert.ok(attackRes.block.sourceUrl?.includes('weapons'), 'Points to weapon source');
    }

    // PF2e weapon compendium lookup
    const pf2AttackRes = await fetchCompendiumEntry('attack', 'shortsword', 'pf2');
    if (pf2AttackRes.block) {
      assert.strictEqual(pf2AttackRes.block.type, 'attack');
      assert.strictEqual(pf2AttackRes.sourceSystem, 'pf2');
    }
  });
});
