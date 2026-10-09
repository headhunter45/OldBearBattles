import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameMap, SubmapConfig } from '@oldbear/shared';
import {
  createSubmapPreset,
  isPointInSubmap,
  findSubmapAt,
  duplicateSceneAsTemplate,
  renderSubmap,
  updateSubmapConfig,
  calculateSubmapCells,
  calculateSubmapPixels,
  snapToGrid,
  alignSubmapPosition,
} from './SubmapManager.js';

function mockGameMap(overrides?: Partial<GameMap>): GameMap {
  return {
    id: 'map_main_123',
    name: 'Tavern Ground Floor',
    imageUrl: 'https://example.com/tavern.png',
    gridSize: 50,
    gridType: 'square',
    gridColor: 'rgba(255, 255, 255, 0.4)',
    gridOpacity: 0.4,
    width: 2000,
    height: 1500,
    scaleFtPerCell: 5,
    showGrid: true,
    ...overrides,
  };
}

describe('Submaps & Secondary Logical Maps per Scene (OB-130)', () => {
  it('creates multi-floor building submap positioned side-by-side with parent map', () => {
    const parentMap = mockGameMap();
    const floor = createSubmapPreset('building_floor', parentMap, 'Floor 2 - Bedrooms');

    assert.strictEqual(floor.type, 'building_floor');
    assert.strictEqual(floor.name, 'Floor 2 - Bedrooms');
    assert.ok(floor.x >= parentMap.width, 'Should place floor to the right of parent map');
    assert.strictEqual(floor.y, 0);
    assert.ok(floor.width > 0 && floor.height > 0);
    assert.strictEqual(floor.showGrid, true);
    assert.strictEqual(floor.gridSize, parentMap.gridSize);
  });

  it('creates casualty tray / graveyard positioned below the active map', () => {
    const parentMap = mockGameMap();
    const casualtyTray = createSubmapPreset('casualty_tray', parentMap);

    assert.strictEqual(casualtyTray.type, 'casualty_tray');
    assert.ok(casualtyTray.name.includes('Casualty Tray'));
    assert.strictEqual(casualtyTray.x, 0);
    assert.ok(casualtyTray.y >= parentMap.height, 'Should place casualty tray below parent map');
    assert.strictEqual(casualtyTray.borderColor, '#dc2626');
  });

  it('creates off-table staging area for reserves and embarked units', () => {
    const parentMap = mockGameMap();
    const stagingArea = createSubmapPreset('staging_area', parentMap);

    assert.strictEqual(stagingArea.type, 'staging_area');
    assert.ok(stagingArea.name.includes('Staging Area'));
    assert.strictEqual(stagingArea.x, 0);
    assert.ok(stagingArea.y < 0, 'Should place staging area in top staging gutter');
    assert.strictEqual(stagingArea.borderColor, '#818cf8');
  });

  it('creates color-coded wargaming deployment zone with custom color', () => {
    const parentMap = mockGameMap();
    const deployZone = createSubmapPreset('deployment_zone', parentMap, 'Red Army Deployment', '#ef4444');

    assert.strictEqual(deployZone.type, 'deployment_zone');
    assert.strictEqual(deployZone.name, 'Red Army Deployment');
    assert.strictEqual(deployZone.colorCode, '#ef4444');
    assert.strictEqual(deployZone.borderColor, '#ef4444');
  });

  it('correctly tests point containment and finds submap at world coordinates', () => {
    const submap: SubmapConfig = {
      id: 'sub_1',
      name: 'Basement Crypt',
      type: 'connected_dungeon',
      x: 2100,
      y: 100,
      width: 800,
      height: 600,
      showGrid: true,
    };

    assert.strictEqual(isPointInSubmap(submap, 2200, 200), true);
    assert.strictEqual(isPointInSubmap(submap, 2100, 100), true);
    assert.strictEqual(isPointInSubmap(submap, 2900, 700), true);
    assert.strictEqual(isPointInSubmap(submap, 2099, 100), false);
    assert.strictEqual(isPointInSubmap(submap, 2200, 701), false);
    assert.strictEqual(isPointInSubmap(submap, 100, 100), false);

    const map = mockGameMap({ submaps: [submap] });
    assert.strictEqual(findSubmapAt(map, 2500, 300)?.id, 'sub_1');
    assert.strictEqual(findSubmapAt(map, 500, 500), null);
  });

  it('duplicates scene as a template, preserving all submaps and settings', () => {
    const submap1 = createSubmapPreset('building_floor', mockGameMap());
    const submap2 = createSubmapPreset('casualty_tray', mockGameMap());
    const sourceScene = mockGameMap({
      id: 'scene_base_wargame',
      name: 'Standard Tournament Layout',
      submaps: [submap1, submap2],
    });

    const cloned = duplicateSceneAsTemplate(
      sourceScene,
      'Desert Tournament Battle',
      'https://example.com/desert-map.jpg'
    );

    assert.notStrictEqual(cloned.id, sourceScene.id);
    assert.strictEqual(cloned.name, 'Desert Tournament Battle');
    assert.strictEqual(cloned.imageUrl, 'https://example.com/desert-map.jpg');
    assert.strictEqual(cloned.isTemplate, true);
    assert.strictEqual(cloned.submaps?.length, 2);
    // Submap IDs are regenerated
    assert.notStrictEqual(cloned.submaps?.[0].id, submap1.id);
    assert.strictEqual(cloned.submaps?.[0].name, submap1.name);
    assert.strictEqual(cloned.submaps?.[1].name, submap2.name);
  });

  it('renders submap to canvas 2D context cleanly without error', () => {
    const parentMap = mockGameMap();
    const submap = createSubmapPreset('casualty_tray', parentMap);

    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      roundRect: () => {},
      setLineDash: () => {},
      measureText: (text: string) => ({ width: text.length * 8 }),
      fillText: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
    };

    assert.doesNotThrow(() => {
      renderSubmap(mockCtx, submap, parentMap, 1.0);
    });
  });

  it('duplicates scene with unique ID and preserves baseMap linkage (OB-186)', () => {
    const scene = mockGameMap({
      id: 'map-original',
      name: 'Crypt Entrance',
      baseMapId: 'asset-crypt-img',
      baseMapName: 'Crypt Image',
    });

    const duplicated: GameMap = {
      ...scene,
      id: `map-${crypto.randomUUID()}`,
      name: `${scene.name} (Copy)`,
      baseMapId: scene.baseMapId || scene.id,
      baseMapName: scene.baseMapName || scene.name,
    };

    assert.notStrictEqual(duplicated.id, scene.id);
    assert.strictEqual(duplicated.name, 'Crypt Entrance (Copy)');
    assert.strictEqual(duplicated.baseMapId, 'asset-crypt-img');
    assert.strictEqual(duplicated.baseMapName, 'Crypt Image');
    assert.strictEqual(duplicated.imageUrl, scene.imageUrl);
  });

  describe('Submap Property Updates & Customization UI (OB-187)', () => {
    it('updates position, dimensions, colors, and background image correctly', () => {
      const parent = mockGameMap();
      const initial = createSubmapPreset('deployment_zone', parent, 'Alpha Deploy');

      const updated = updateSubmapConfig(initial, {
        name: 'Vanguard Strike Zone',
        label: 'Vanguard',
        x: 100,
        y: 200,
        width: 1400,
        height: 450,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
        imageUrl: 'https://example.com/custom-deployment-banner.png',
        showGrid: false,
        gridSize: 75,
      });

      assert.strictEqual(updated.name, 'Vanguard Strike Zone');
      assert.strictEqual(updated.label, 'Vanguard');
      assert.strictEqual(updated.x, 100);
      assert.strictEqual(updated.y, 200);
      assert.strictEqual(updated.width, 1400);
      assert.strictEqual(updated.height, 450);
      assert.strictEqual(updated.borderColor, '#10b981');
      assert.strictEqual(updated.colorCode, '#10b981', 'colorCode should sync with borderColor');
      assert.strictEqual(updated.backgroundColor, 'rgba(16, 185, 129, 0.25)');
      assert.strictEqual(updated.imageUrl, 'https://example.com/custom-deployment-banner.png');
      assert.strictEqual(updated.showGrid, false);
      assert.strictEqual(updated.gridSize, 75);
    });

    it('enforces minimum dimensions and clamps bounds', () => {
      const parent = mockGameMap();
      const initial = createSubmapPreset('custom', parent);

      const clamped = updateSubmapConfig(initial, {
        width: 20,
        height: -10,
        x: 15.6,
        y: 24.2,
      });

      assert.strictEqual(clamped.width, 50, 'Minimum width should clamp to 50px');
      assert.strictEqual(clamped.height, 50, 'Minimum height should clamp to 50px');
      assert.strictEqual(clamped.x, 16);
      assert.strictEqual(clamped.y, 24);
    });

    it('converts pixels to grid cells and vice-versa accurately', () => {
      const gridSize = 50;
      assert.strictEqual(calculateSubmapCells(1000, gridSize), 20);
      assert.strictEqual(calculateSubmapCells(1025, gridSize), 21);
      assert.strictEqual(calculateSubmapCells(50, gridSize), 1);
      assert.strictEqual(calculateSubmapCells(0, gridSize), 1);

      assert.strictEqual(calculateSubmapPixels(20, gridSize), 1000);
      assert.strictEqual(calculateSubmapPixels(6, gridSize), 300);
      assert.strictEqual(calculateSubmapPixels(1, gridSize), 50);
    });

    it('snaps coordinates and dimensions to grid size', () => {
      const gridSize = 50;
      assert.strictEqual(snapToGrid(1048, gridSize), 1050);
      assert.strictEqual(snapToGrid(1020, gridSize), 1000);
      assert.strictEqual(snapToGrid(0, gridSize), 0);
    });

    it('calculates preset alignments relative to parent map dimensions', () => {
      const parent = mockGameMap({ width: 2000, height: 1500 });
      const sub = { width: 800, height: 400 };

      const right = alignSubmapPosition(sub, parent, 'right', 80);
      assert.strictEqual(right.x, 2080);
      assert.strictEqual(right.y, 0);

      const left = alignSubmapPosition(sub, parent, 'left', 80);
      assert.strictEqual(left.x, -880);
      assert.strictEqual(left.y, 0);

      const below = alignSubmapPosition(sub, parent, 'below', 80);
      assert.strictEqual(below.x, 0);
      assert.strictEqual(below.y, 1580);

      const above = alignSubmapPosition(sub, parent, 'above', 80);
      assert.strictEqual(above.x, 0);
      assert.strictEqual(above.y, -480);

      const topDeploy = alignSubmapPosition(sub, parent, 'top_deploy');
      assert.strictEqual(topDeploy.x, 0);
      assert.strictEqual(topDeploy.y, 0);

      const bottomDeploy = alignSubmapPosition(sub, parent, 'bottom_deploy');
      assert.strictEqual(bottomDeploy.x, 0);
      assert.strictEqual(bottomDeploy.y, 1100);
    });

    it('preserves all customized submap properties across scene saves and updates', () => {
      const parent = mockGameMap();
      const customizedSubmap: SubmapConfig = {
        id: 'sub_custom_1',
        name: 'Floor 2 - Noble Suite',
        label: 'Suite 2F',
        type: 'building_floor',
        x: 2080,
        y: 120,
        width: 1200,
        height: 900,
        backgroundColor: '#0f172a',
        borderColor: '#f59e0b',
        colorCode: '#f59e0b',
        imageUrl: 'https://example.com/noble-suite.jpg',
        gridSize: 70,
        showGrid: true,
      };

      const sceneAfterSave: GameMap = {
        ...parent,
        submaps: [customizedSubmap],
      };

      assert.strictEqual(sceneAfterSave.submaps?.length, 1);
      const savedSub = sceneAfterSave.submaps![0];
      assert.strictEqual(savedSub.id, 'sub_custom_1');
      assert.strictEqual(savedSub.name, 'Floor 2 - Noble Suite');
      assert.strictEqual(savedSub.label, 'Suite 2F');
      assert.strictEqual(savedSub.x, 2080);
      assert.strictEqual(savedSub.y, 120);
      assert.strictEqual(savedSub.width, 1200);
      assert.strictEqual(savedSub.height, 900);
      assert.strictEqual(savedSub.backgroundColor, '#0f172a');
      assert.strictEqual(savedSub.borderColor, '#f59e0b');
      assert.strictEqual(savedSub.imageUrl, 'https://example.com/noble-suite.jpg');
      assert.strictEqual(savedSub.gridSize, 70);
    });

    it('preserves all customized submap properties across template duplications', () => {
      const sourceScene = mockGameMap({
        id: 'scene_templated_1',
        name: 'Tournament Map Template',
        submaps: [
          {
            id: 'sub_attacker',
            name: 'Attacker Deployment',
            label: 'Red Front',
            type: 'deployment_zone',
            x: 0,
            y: 0,
            width: 2000,
            height: 300,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: '#ef4444',
            colorCode: '#ef4444',
            imageUrl: 'https://example.com/red-crest.png',
            gridSize: 50,
            showGrid: true,
          },
        ],
      });

      const cloned = duplicateSceneAsTemplate(
        sourceScene,
        'Round 1 Match',
        'https://example.com/desert-arena.png'
      );

      assert.strictEqual(cloned.submaps?.length, 1);
      const clonedSub = cloned.submaps![0];
      assert.notStrictEqual(clonedSub.id, 'sub_attacker', 'Submap ID must be regenerated');
      assert.strictEqual(clonedSub.name, 'Attacker Deployment');
      assert.strictEqual(clonedSub.label, 'Red Front');
      assert.strictEqual(clonedSub.type, 'deployment_zone');
      assert.strictEqual(clonedSub.x, 0);
      assert.strictEqual(clonedSub.y, 0);
      assert.strictEqual(clonedSub.width, 2000);
      assert.strictEqual(clonedSub.height, 300);
      assert.strictEqual(clonedSub.backgroundColor, 'rgba(239, 68, 68, 0.2)');
      assert.strictEqual(clonedSub.borderColor, '#ef4444');
      assert.strictEqual(clonedSub.colorCode, '#ef4444');
      assert.strictEqual(clonedSub.imageUrl, 'https://example.com/red-crest.png');
      assert.strictEqual(clonedSub.gridSize, 50);
      assert.strictEqual(clonedSub.showGrid, true);
    });

    it('renders submap with custom background image without throwing', () => {
      const parent = mockGameMap();
      const submap: SubmapConfig = {
        id: 'sub_img_1',
        name: 'Tavern Attic',
        type: 'building_floor',
        x: 2080,
        y: 0,
        width: 800,
        height: 600,
        imageUrl: 'https://example.com/attic.png',
        borderColor: '#38bdf8',
        backgroundColor: '#1e293b',
      };

      let drewImage = false;
      const mockCtx: any = {
        save: () => {},
        restore: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        roundRect: () => {},
        setLineDash: () => {},
        measureText: () => ({ width: 60 }),
        fillText: () => {},
        drawImage: () => {
          drewImage = true;
        },
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
        textBaseline: '',
        globalAlpha: 1,
      };

      const mockGetCachedImage = () =>
        ({
          complete: true,
          naturalWidth: 800,
          naturalHeight: 600,
        } as HTMLImageElement);

      assert.doesNotThrow(() => {
        renderSubmap(mockCtx, submap, parent, 1.0, mockGetCachedImage);
      });
      assert.strictEqual(drewImage, true, 'Should draw cached background image onto canvas');
    });
  });
});


