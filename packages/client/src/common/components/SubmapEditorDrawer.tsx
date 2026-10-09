import React, { useRef } from 'react';
import { GameMap, SubmapConfig, SubmapType } from '@oldbear/shared';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Palette,
  Move,
  Maximize2,
  Grid,
} from 'lucide-react';
import {
  calculateSubmapCells,
  calculateSubmapPixels,
  snapToGrid,
  alignSubmapPosition,
  SubmapAlignment,
  SUBMAP_BORDER_PRESET_COLORS,
  SUBMAP_BG_PRESET_COLORS,
  SUBMAP_TYPE_DEFAULTS,
} from '../engine/SubmapManager.js';
import { StoredAsset, saveAsset } from '../storage/db.js';

export interface SubmapEditorDrawerProps {
  submap: SubmapConfig;
  parentMap: GameMap;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<SubmapConfig>) => void;
  onDelete: () => void;
  savedMapAssets?: StoredAsset[];
}

export const SUBMAP_TYPE_LABELS: Record<SubmapType, string> = {
  building_floor: 'Upper/Lower Floor',
  connected_dungeon: 'Connected Dungeon/Cave',
  deployment_zone: 'Deployment Zone',
  casualty_tray: 'Casualty Tray / Graveyard',
  staging_area: 'Staging Area (Reserves)',
  custom: 'Custom Logical Area',
};

export const SubmapEditorDrawer: React.FC<SubmapEditorDrawerProps> = ({
  submap,
  parentMap,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  savedMapAssets = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const effectiveGridSize = submap.gridSize || parentMap.gridSize || 50;
  const currentCellsW = calculateSubmapCells(submap.width, effectiveGridSize);
  const currentCellsH = calculateSubmapCells(submap.height, effectiveGridSize);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        onUpdate({
          imageUrl: dataUrl,
        });

        // Optionally store into IndexedDB map assets
        try {
          await saveAsset({
            id: `submap_img_${Date.now()}`,
            name: file.name,
            type: 'map',
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            createdAt: Date.now(),
          });
        } catch {
          // Graceful fallback if storage fails or unavailable
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be picked again if desired
    e.target.value = '';
  };

  const handleAlign = (alignment: SubmapAlignment) => {
    const pos = alignSubmapPosition(submap, parentMap, alignment);
    onUpdate({ x: pos.x, y: pos.y });
  };

  const handleSnapDimensions = () => {
    const snappedW = snapToGrid(submap.width, effectiveGridSize);
    const snappedH = snapToGrid(submap.height, effectiveGridSize);
    onUpdate({
      width: Math.max(effectiveGridSize, snappedW),
      height: Math.max(effectiveGridSize, snappedH),
    });
  };

  const typeConfig = SUBMAP_TYPE_DEFAULTS[submap.type] || SUBMAP_TYPE_DEFAULTS.custom;
  const currentBorderColor = submap.borderColor || submap.colorCode || typeConfig.borderColor || '#38bdf8';
  const currentBgColor = submap.backgroundColor ?? typeConfig.bgColor;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${isExpanded ? currentBorderColor : 'var(--border-subtle)'}`,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Header Summary Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.65rem',
          cursor: 'pointer',
          userSelect: 'none',
          background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
          gap: '0.5rem',
        }}
        onClick={onToggleExpand}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Badge Color Dot */}
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: currentBorderColor,
              flexShrink: 0,
              boxShadow: `0 0 6px ${currentBorderColor}88`,
            }}
          />

          {/* Submap Name */}
          <span
            style={{
              fontWeight: 600,
              color: 'white',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {submap.name}
          </span>

          {/* Submap Type Badge */}
          <span
            style={{
              fontSize: '0.65rem',
              padding: '0.1rem 0.35rem',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            {SUBMAP_TYPE_LABELS[submap.type] || submap.type}
          </span>

          {/* Dimensions & Coords Pill */}
          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            ({submap.width}×{submap.height}px · {currentCellsW}×{currentCellsH}c)
          </span>

          {/* Image indicator if image attached */}
          {submap.imageUrl && (
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                flexShrink: 0,
              }}
              title="Custom battlemap background attached"
            >
              <ImageIcon size={11} /> Image
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn-icon"
            style={{
              width: '24px',
              height: '24px',
              color: isExpanded ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}
            onClick={onToggleExpand}
            title={isExpanded ? 'Collapse editor' : 'Expand editor'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            className="btn-icon"
            style={{
              width: '24px',
              height: '24px',
              color: 'var(--accent-rose)',
            }}
            onClick={onDelete}
            title="Remove submap"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded Property Drawer Body */}
      {isExpanded && (
        <div
          style={{
            padding: '0.75rem 0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            background: 'rgba(10, 15, 29, 0.4)',
          }}
        >
          {/* Identity: Name, Badge Label & Type */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.6rem',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                Submap Name
              </label>
              <input
                type="text"
                value={submap.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Floor 2, Red Deployment..."
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                Badge Label (On Canvas)
              </label>
              <input
                type="text"
                value={submap.label ?? ''}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder={submap.name}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                Area Type
              </label>
              <select
                value={submap.type}
                onChange={(e) =>
                  onUpdate({ type: e.target.value as SubmapType })
                }
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                }}
              >
                <option value="building_floor">Upper/Lower Floor</option>
                <option value="connected_dungeon">Connected Dungeon / Cave</option>
                <option value="deployment_zone">Wargaming Deployment Zone</option>
                <option value="casualty_tray">Casualty Tray / Graveyard</option>
                <option value="staging_area">Staging Area (Reserves)</option>
                <option value="custom">Custom Logical Area</option>
              </select>
            </div>
          </div>

          {/* Positioning & Canvas Offsets */}
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                }}
              >
                <Move size={13} />
                <span>Position & Canvas Offset</span>
              </div>
            </div>

            {/* Quick Alignment Chips */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.3rem',
                marginBottom: '0.5rem',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem' }}
                onClick={() => handleAlign('right')}
                title="Place to the right of primary map"
              >
                Right of Map
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem' }}
                onClick={() => handleAlign('left')}
                title="Place to the left of primary map"
              >
                Left of Map
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem' }}
                onClick={() => handleAlign('below')}
                title="Place below primary map"
              >
                Below Map
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem' }}
                onClick={() => handleAlign('above')}
                title="Place above primary map"
              >
                Above Map
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem' }}
                onClick={() => handleAlign('top_deploy')}
                title="Align to top edge of map (e.g. Attacker Deployment)"
              >
                Top Edge
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem' }}
                onClick={() => handleAlign('bottom_deploy')}
                title="Align to bottom edge of map (e.g. Defender Deployment)"
              >
                Bottom Edge
              </button>
            </div>

            {/* Coordinate Inputs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.6rem',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Offset X (px)
                </label>
                <input
                  type="number"
                  value={submap.x}
                  onChange={(e) =>
                    onUpdate({ x: parseInt(e.target.value, 10) || 0 })
                  }
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Offset Y (px)
                </label>
                <input
                  type="number"
                  value={submap.y}
                  onChange={(e) =>
                    onUpdate({ y: parseInt(e.target.value, 10) || 0 })
                  }
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dimensions & Sizing (Pixels & Grid Cells) */}
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                }}
              >
                <Maximize2 size={13} />
                <span>Dimensions & Sizing</span>
              </div>

              {/* Sizing helpers */}
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem' }}
                  onClick={handleSnapDimensions}
                  title="Snap dimensions to nearest grid cell multiple"
                >
                  Snap to Grid
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem' }}
                  onClick={() => onUpdate({ width: parentMap.width })}
                  title="Match parent map width"
                >
                  Full Width
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem' }}
                  onClick={() => onUpdate({ height: parentMap.height })}
                  title="Match parent map height"
                >
                  Full Height
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.6rem',
              }}
            >
              {/* Width in Pixels */}
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Width (px)
                </label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={submap.width}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) onUpdate({ width: Math.max(50, val) });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                  }}
                />
              </div>

              {/* Width in Cells */}
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Width (cells)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={currentCellsW}
                  onChange={(e) => {
                    const cells = parseInt(e.target.value, 10);
                    if (!isNaN(cells) && cells > 0) {
                      onUpdate({
                        width: calculateSubmapPixels(cells, effectiveGridSize),
                      });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                  }}
                />
              </div>

              {/* Height in Pixels */}
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Height (px)
                </label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={submap.height}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) onUpdate({ height: Math.max(50, val) });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                  }}
                />
              </div>

              {/* Height in Cells */}
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Height (cells)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={currentCellsH}
                  onChange={(e) => {
                    const cells = parseInt(e.target.value, 10);
                    if (!isNaN(cells) && cells > 0) {
                      onUpdate({
                        height: calculateSubmapPixels(cells, effectiveGridSize),
                      });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Color & Border Styling */}
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: '0.5rem',
              }}
            >
              <Palette size={13} />
              <span>Color & Border Styling</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.8rem',
              }}
            >
              {/* Border Outline Color */}
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.3rem',
                  }}
                >
                  Border Outline / Badge Color
                </label>
                {/* Swatches */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.3rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  {SUBMAP_BORDER_PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border:
                          currentBorderColor.toLowerCase() === c.toLowerCase()
                            ? '2px solid white'
                            : '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onClick={() =>
                        onUpdate({ borderColor: c, colorCode: c })
                      }
                      title={c}
                    />
                  ))}
                </div>
                {/* Custom Color Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="color"
                    value={
                      currentBorderColor.startsWith('#') && currentBorderColor.length === 7
                        ? currentBorderColor
                        : '#38bdf8'
                    }
                    onChange={(e) =>
                      onUpdate({
                        borderColor: e.target.value,
                        colorCode: e.target.value,
                      })
                    }
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: 0,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={submap.borderColor || submap.colorCode || ''}
                    onChange={(e) =>
                      onUpdate({
                        borderColor: e.target.value,
                        colorCode: e.target.value,
                      })
                    }
                    placeholder="#38bdf8"
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.45rem',
                      fontSize: '0.72rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                    }}
                  />
                </div>
              </div>

              {/* Background Fill / Tint */}
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.3rem',
                  }}
                >
                  Background Fill / Tint
                </label>
                {/* Swatches */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.3rem',
                    marginBottom: '0.4rem',
                  }}
                >
                  {SUBMAP_BG_PRESET_COLORS.map((c) => {
                    const isTransparent = c === 'transparent';
                    return (
                      <button
                        key={c}
                        type="button"
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          backgroundColor: isTransparent ? 'transparent' : c,
                          backgroundImage: isTransparent
                            ? 'linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%, #444), linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%, #444)'
                            : undefined,
                          backgroundSize: isTransparent ? '8px 8px' : undefined,
                          backgroundPosition: isTransparent
                            ? '0 0, 4px 4px'
                            : undefined,
                          border:
                            currentBgColor === c
                              ? '2px solid white'
                              : '1px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        onClick={() => onUpdate({ backgroundColor: c })}
                        title={c}
                      />
                    );
                  })}
                </div>
                {/* Custom Color Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="color"
                    value={
                      currentBgColor.startsWith('#') && currentBgColor.length === 7
                        ? currentBgColor
                        : '#1e293b'
                    }
                    onChange={(e) =>
                      onUpdate({ backgroundColor: e.target.value })
                    }
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: 0,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={submap.backgroundColor || ''}
                    onChange={(e) =>
                      onUpdate({ backgroundColor: e.target.value })
                    }
                    placeholder="rgba(...) or #1e293b"
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.45rem',
                      fontSize: '0.72rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Background Image & Battlemap Support */}
          <div
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: '0.45rem',
              }}
            >
              <ImageIcon size={13} />
              <span>Background Battlemap / Floor Plan Image</span>
            </div>

            {/* Thumbnail preview if attached */}
            {submap.imageUrl && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.4rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.5rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <img
                  src={submap.imageUrl}
                  alt="Submap Preview"
                  style={{
                    width: '60px',
                    height: '42px',
                    objectFit: 'cover',
                    borderRadius: '3px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'white',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Custom Floor Plan Attached
                  </div>
                  <div
                    style={{
                      fontSize: '0.64rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {submap.imageUrl.startsWith('data:')
                      ? 'Local Embedded Image'
                      : submap.imageUrl}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.66rem',
                    padding: '0.2rem 0.45rem',
                    color: 'var(--accent-rose)',
                  }}
                  onClick={() => onUpdate({ imageUrl: undefined })}
                >
                  <X size={12} /> Clear
                </button>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              {/* URL Input */}
              <div>
                <label
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  Image URL
                </label>
                <input
                  type="text"
                  value={submap.imageUrl || ''}
                  onChange={(e) =>
                    onUpdate({ imageUrl: e.target.value.trim() || undefined })
                  }
                  placeholder="https://example.com/floor-2-battlemap.jpg"
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.74rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                  }}
                />
              </div>

              {/* Upload file + Pick stored asset buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '0.3rem 0.55rem' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload floor plan / battlemap image file from computer"
                >
                  <Upload size={12} /> Upload File
                </button>

                {/* Stored map asset selector if any available */}
                {savedMapAssets.length > 0 && (
                  <select
                    style={{
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.7rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                      maxWidth: '220px',
                    }}
                    value=""
                    onChange={(e) => {
                      const selected = savedMapAssets.find(
                        (a) => a.id === e.target.value
                      );
                      if (selected) {
                        onUpdate({
                          imageUrl: selected.dataUrl,
                          width: selected.width || submap.width,
                          height: selected.height || submap.height,
                        });
                      }
                    }}
                  >
                    <option value="" disabled>
                      Choose from Saved Assets...
                    </option>
                    {savedMapAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Grid Settings for Submap */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.45rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Grid size={14} color="var(--accent-primary)" />
              <label
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={submap.showGrid !== false}
                  onChange={(e) => onUpdate({ showGrid: e.target.checked })}
                />
                Show Grid Overlay
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Grid Size:
              </span>
              <input
                type="number"
                min="10"
                max="500"
                value={submap.gridSize ?? parentMap.gridSize ?? 50}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 10) {
                    onUpdate({ gridSize: val });
                  }
                }}
                style={{
                  width: '56px',
                  padding: '0.2rem 0.35rem',
                  fontSize: '0.74rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                }}
              />
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                }}
              >
                px
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
