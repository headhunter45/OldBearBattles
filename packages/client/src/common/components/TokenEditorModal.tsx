import React, { useState, useEffect, useRef } from 'react';
import { Token, Player, GameMap, DnDAction, DnDSpell } from '@oldbear/shared';
import { X, Upload, Check, ZoomIn, ZoomOut, RotateCcw, Move, Swords, Sparkles, Plus, Trash2, Edit2 } from 'lucide-react';
import { saveAsset } from '../storage/db.js';
import { traceTokenShape } from '../engine/TokenRenderer.js';
import { resolveStatusDefinitions, formatCondition } from '../status/StatusManager.js';
import { CustomStatusModal } from './CustomStatusModal.js';

interface TokenEditorModalProps {
  token: Token;
  onClose: () => void;
  onSave: (updates: Partial<Token>) => void;
  players: Player[];
  isGm: boolean;
  activeMap?: GameMap;
  onUpdateMap?: (mapId: string, updates: Partial<GameMap>) => void;
}

const RING_COLORS = ['transparent', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#ffffff'];
const FILL_COLORS = ['#0f172a', '#1e293b', '#1e3a8a', '#7f1d1d', '#064e3b', '#78350f', '#581c87', '#000000'];

export const TokenEditorModal: React.FC<TokenEditorModalProps> = ({
  token,
  onClose,
  onSave,
  players,
  isGm,
  activeMap,
  onUpdateMap,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const statusDefs = resolveStatusDefinitions(activeMap);
  const allAvailableStatuses = Object.keys(statusDefs).sort();
  const [name, setName] = useState(token.name);
  const [imageUrl, setImageUrl] = useState(token.imageUrl || '');
  const [size, setSize] = useState(token.size);
  const [speed, setSpeed] = useState(token.speed || 30);
  const [currentHp, setCurrentHp] = useState(token.currentHp);
  const [maxHp, setMaxHp] = useState(token.maxHp);
  const isPropOrTile = Boolean(token.isProp || token.layer === 'map' || token.layer === 'prop');
  const [ringColor, setRingColor] = useState(
    token.ringColor !== undefined && token.ringColor !== ''
      ? token.ringColor
      : (isPropOrTile ? 'transparent' : '#3b82f6')
  );
  const [fillColor, setFillColor] = useState(token.fillColor || '#1e293b');
  const [ownerId, setOwnerId] = useState(token.ownerId || '');
  const [isPlayerToken, setIsPlayerToken] = useState(token.isPlayerToken || token.ownerId === 'unassigned');
  const [clipShape, setClipShape] = useState<'circle' | 'square' | 'rounded' | 'hexagon' | 'octagon'>(
    token.clipShape || (token.clipCircle === false ? 'square' : 'circle')
  );
  const [borderWidth, setBorderWidth] = useState(token.borderWidth || 4);
  const [clipZoom, setClipZoom] = useState(token.clipZoom || 1.0);
  const [clipPanX, setClipPanX] = useState(token.clipPanX || 0);
  const [clipPanY, setClipPanY] = useState(token.clipPanY || 0);
  const [isProp, setIsProp] = useState(token.isProp || token.layer === 'map' || false);
  const [propWidth, setPropWidth] = useState<number | undefined>(token.propWidth ?? (token.isProp || token.layer === 'map' ? token.size : undefined));
  const [propHeight, setPropHeight] = useState<number | undefined>(token.propHeight ?? (token.isProp || token.layer === 'map' ? token.size : undefined));
  const [rotation, setRotation] = useState<number>(token.rotation || 0);
  const [locked, setLocked] = useState<boolean>(token.locked || false);
  const [conditions, setConditions] = useState<string[]>(token.conditions || []);
  const [actions, setActions] = useState<DnDAction[]>(
    token.actions && token.actions.length > 0
      ? token.actions
      : token.character?.actions || []
  );
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [actionForm, setActionForm] = useState<DnDAction>({
    name: '',
    type: 'melee',
    toHitModifier: 0,
    damageDice: '',
    range: '',
    reach: '',
    description: '',
    diceMacro: '',
  });
  const [spells, setSpells] = useState<DnDSpell[]>(
    token.spells && token.spells.length > 0
      ? token.spells
      : token.character?.spells || []
  );
  const [isAddingSpell, setIsAddingSpell] = useState(false);
  const [editingSpellIndex, setEditingSpellIndex] = useState<number | null>(null);
  const [spellForm, setSpellForm] = useState<DnDSpell>({
    id: '',
    name: '',
    level: 0,
    school: 'Evocation',
    castingTime: '1 action',
    range: '60 ft',
    duration: 'Instantaneous',
    description: '',
    dndBeyondUrl: '',
  });

  const [previewImg, setPreviewImg] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const touchDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  // Load preview image element
  useEffect(() => {
    if (!imageUrl) {
      setPreviewImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setPreviewImg(img);
    img.onerror = () => setPreviewImg(null);
    img.src = imageUrl;
  }, [imageUrl]);

  // Render interactive canvas preview with shape clipping, zoom, pan, and border (Bug #72)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = (w - 20) / 2;

    ctx.clearRect(0, 0, w, h);

    // Dark backdrop with subtle grid
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    if (rotation) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    const zoom = clipZoom;
    const panX = (clipPanX / 100) * r;
    const panY = (clipPanY / 100) * r;
    const drawSize = r * 2 * zoom;

    if (previewImg) {
      // 1. Draw entire uncropped image lightly dimmed in background to show cropping area
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(previewImg, -drawSize / 2 + panX, -drawSize / 2 + panY, drawSize, drawSize);
      ctx.restore();
    }

    // 2. Token base background
    traceTokenShape(ctx, clipShape, r);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 3. Clipped image / initials
    ctx.save();
    traceTokenShape(ctx, clipShape, r - borderWidth / 2);
    ctx.clip();

    if (previewImg) {
      ctx.drawImage(previewImg, -drawSize / 2 + panX, -drawSize / 2 + panY, drawSize, drawSize);
    } else {
      ctx.fillStyle = fillColor;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(22, r * 0.5)}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
      ctx.fillText(initials || '?', 0, 0);
    }
    ctx.restore();

    // 4. Outer Ring
    if (ringColor && ringColor !== 'transparent') {
      traceTokenShape(ctx, clipShape, r - borderWidth / 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }

    // 5. Guides when dragging
    if (isDragging) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [previewImg, clipShape, borderWidth, ringColor, fillColor, clipZoom, clipPanX, clipPanY, name, isDragging, rotation]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: clipPanX,
      panY: clipPanY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const r = (180 - 20) / 2;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextPanX = Math.round(Math.max(-100, Math.min(100, dragStartRef.current.panX + (dx / r) * 100)));
    const nextPanY = Math.round(Math.max(-100, Math.min(100, dragStartRef.current.panY + (dy / r) * 100)));
    setClipPanX(nextPanX);
    setClipPanY(nextPanY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setClipZoom((prev) => Math.max(0.5, Math.min(4.0, Number((prev + delta).toFixed(2)))));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: clipPanX,
        panY: clipPanY,
      };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
      touchStartZoomRef.current = clipZoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging && dragStartRef.current) {
      const r = (180 - 20) / 2;
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      const nextPanX = Math.round(Math.max(-100, Math.min(100, dragStartRef.current.panX + (dx / r) * 100)));
      const nextPanY = Math.round(Math.max(-100, Math.min(100, dragStartRef.current.panY + (dy / r) * 100)));
      setClipPanX(nextPanX);
      setClipPanY(nextPanY);
    } else if (e.touches.length === 2 && touchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchDistRef.current;
      setClipZoom(Math.max(0.5, Math.min(4.0, Number((touchStartZoomRef.current * scale).toFixed(2)))));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    touchDistRef.current = null;
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      // Save asset to local browser IndexedDB
      await saveAsset({
        id: crypto.randomUUID(),
        name: file.name,
        type: isProp ? 'prop' : 'token',
        dataUrl,
        isProp,
        layer: isProp ? 'prop' : 'token',
        createdAt: Date.now(),
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleCondition = (label: string) => {
    const isPresent = conditions.some((c) => c.split(':')[0] === label);
    if (isPresent) {
      setConditions((prev) => prev.filter((item) => item.split(':')[0] !== label));
    } else {
      const def = statusDefs[label];
      const conditionFormatted =
        def?.counter?.start !== undefined ? formatCondition(label, def.counter.start) : label;
      setConditions((prev) => [...prev, conditionFormatted]);
    }
  };

  const handleStartAddAction = () => {
    setActionForm({
      name: '',
      type: 'melee',
      toHitModifier: 0,
      damageDice: '',
      range: '',
      reach: '',
      description: '',
      diceMacro: '',
    });
    setEditingActionIndex(null);
    setIsAddingAction(true);
  };

  const handleStartEditAction = (idx: number) => {
    setActionForm({ ...actions[idx] });
    setEditingActionIndex(idx);
    setIsAddingAction(true);
  };

  const handleSaveAction = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!actionForm.name?.trim()) return;
    const toHit =
      actionForm.toHitModifier !== undefined &&
      actionForm.toHitModifier !== null &&
      String(actionForm.toHitModifier).trim() !== '' &&
      !isNaN(Number(actionForm.toHitModifier))
        ? Number(actionForm.toHitModifier)
        : undefined;
    const newAction: DnDAction = {
      name: actionForm.name.trim(),
      type: actionForm.type || 'melee',
      toHitModifier: toHit,
      damageDice: actionForm.damageDice?.trim() || undefined,
      range: actionForm.range?.trim() || undefined,
      reach: actionForm.reach?.trim() || undefined,
      description: actionForm.description?.trim() || undefined,
      diceMacro: actionForm.diceMacro?.trim() || undefined,
    };
    if (editingActionIndex !== null) {
      setActions((prev) => prev.map((a, i) => (i === editingActionIndex ? newAction : a)));
    } else {
      setActions((prev) => [...prev, newAction]);
    }
    setIsAddingAction(false);
    setEditingActionIndex(null);
  };

  const handleDeleteAction = (idx: number) => {
    setActions((prev) => prev.filter((_, i) => i !== idx));
    if (editingActionIndex === idx) {
      setIsAddingAction(false);
      setEditingActionIndex(null);
    }
  };

  const handleStartAddSpell = () => {
    setSpellForm({
      id: crypto.randomUUID(),
      name: '',
      level: 0,
      school: 'Evocation',
      castingTime: '1 action',
      range: '60 ft',
      duration: 'Instantaneous',
      description: '',
      dndBeyondUrl: '',
    });
    setEditingSpellIndex(null);
    setIsAddingSpell(true);
  };

  const handleStartEditSpell = (idx: number) => {
    setSpellForm({ ...spells[idx] });
    setEditingSpellIndex(idx);
    setIsAddingSpell(true);
  };

  const handleSaveSpell = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!spellForm.name?.trim()) return;
    const newSpell: DnDSpell = {
      id: spellForm.id || crypto.randomUUID(),
      name: spellForm.name.trim(),
      level: Number(spellForm.level) || 0,
      school: spellForm.school?.trim() || 'Evocation',
      castingTime: spellForm.castingTime?.trim() || '1 action',
      range: spellForm.range?.trim() || 'Self',
      duration: spellForm.duration?.trim() || 'Instantaneous',
      description: spellForm.description?.trim() || '',
      dndBeyondUrl: spellForm.dndBeyondUrl?.trim() || '',
    };
    if (editingSpellIndex !== null) {
      setSpells((prev) => prev.map((s, i) => (i === editingSpellIndex ? newSpell : s)));
    } else {
      setSpells((prev) => [...prev, newSpell]);
    }
    setIsAddingSpell(false);
    setEditingSpellIndex(null);
  };

  const handleDeleteSpell = (idx: number) => {
    setSpells((prev) => prev.filter((_, i) => i !== idx));
    if (editingSpellIndex === idx) {
      setIsAddingSpell(false);
      setEditingSpellIndex(null);
    }
  };

  const handleSave = () => {
    const updatedCharacter = token.character
      ? {
          ...token.character,
          actions,
          spells,
        }
      : undefined;

    onSave({
      name,
      imageUrl,
      size: Number(size),
      speed: Number(speed),
      currentHp: Number(currentHp),
      maxHp: Number(maxHp),
      tempHp: Number(tempHp),
      ringColor,
      fillColor,
      clipCircle: clipShape === 'circle',
      clipShape,
      borderWidth: Number(borderWidth),
      clipZoom: Number(clipZoom),
      clipPanX: Number(clipPanX),
      clipPanY: Number(clipPanY),
      ownerId: ownerId || (isPlayerToken ? 'unassigned' : undefined),
      isPlayerToken,
      isProp,
      propWidth: isProp ? (propWidth !== undefined ? Number(propWidth) : Number(size)) : undefined,
      propHeight: isProp ? (propHeight !== undefined ? Number(propHeight) : Number(size)) : undefined,
      rotation: Number(rotation) || 0,
      locked,
      conditions,
      actions,
      spells,
      character: updatedCharacter,
    });
    onClose();
  };

  return (
    <>
      <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-elevated animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            Edit Token
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Token Preview & Interactive Cropper (Bug #72) */}
        <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Move size={15} /> Token Preview & Crop
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setClipZoom((z) => Math.min(4.0, Number((z + 0.1).toFixed(2))))}
                title="Zoom In"
                style={{ width: '28px', height: '28px' }}
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setClipZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                title="Zoom Out"
                style={{ width: '28px', height: '28px' }}
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => {
                  setClipZoom(1.0);
                  setClipPanX(0);
                  setClipPanY(0);
                }}
                title="Reset Crop & Pan"
                style={{ width: '28px', height: '28px' }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                position: 'relative',
                width: '180px',
                height: '180px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#090d16',
                border: '1px solid var(--border-subtle)',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
                boxShadow: ringColor === 'transparent' ? '0 4px 20px rgba(0, 0, 0, 0.2)' : `0 4px 20px ${ringColor}22`,
                flexShrink: 0,
              }}
            >
              <canvas
                ref={canvasRef}
                width={180}
                height={180}
                style={{ width: '100%', height: '100%', display: 'block' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '6px',
                  fontSize: '0.65rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  pointerEvents: 'none',
                }}
              >
                {clipZoom.toFixed(1)}x
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', marginBottom: '0.6rem' }}>
                <Upload size={16} /> Upload Image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>• Drag</span> preview to pan image.
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>• Scroll or pinch</span> to zoom in/out.
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Dimmed area shows full picture outside the token border.
              </div>
            </div>
          </div>
        </div>

        {/* Ring & Fill Color Palettes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ring Color</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', alignItems: 'center' }}>
            {RING_COLORS.map((c) => {
              const isSelected = ringColor === c;
              if (c === 'transparent') {
                return (
                  <div
                    key="transparent"
                    onClick={() => setRingColor('transparent')}
                    title="Transparent (No Ring)"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid white' : '1px solid transparent',
                      transform: isSelected ? 'scale(1.15)' : 'none',
                      transition: 'transform 0.15s',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <circle cx="12" cy="12" r="12" fill="#e2e8f0" />
                      <circle cx="12" cy="12" r="7" fill="none" stroke="#ef4444" strokeWidth="2" />
                      <line x1="7.05" y1="7.05" x2="16.95" y2="16.95" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                );
              }
              return (
                <div
                  key={c}
                  onClick={() => setRingColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    border: isSelected ? '2px solid white' : '1px solid transparent',
                    transform: isSelected ? 'scale(1.15)' : 'none',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Background Fill Color</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
            {FILL_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setFillColor(c)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  cursor: 'pointer',
                  border: fillColor === c ? '2px solid white' : '1px solid transparent',
                  transform: fillColor === c ? 'scale(1.15)' : 'none',
                  transition: 'transform 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Token Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                marginTop: '0.25rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Speed (ft)</label>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                marginTop: '0.25rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Current HP</label>
            <input
              type="number"
              value={currentHp}
              onChange={(e) => setCurrentHp(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                marginTop: '0.25rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Max HP</label>
            <input
              type="number"
              value={maxHp}
              onChange={(e) => setMaxHp(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                marginTop: '0.25rem',
              }}
            />
          </div>

          {isProp ? (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Prop Width (tiles)</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={propWidth ?? size}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPropWidth(isNaN(val) ? 1 : val);
                  }}
                  placeholder="e.g. 1.5"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    marginTop: '0.25rem',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Prop Height (tiles)</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={propHeight ?? size}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPropHeight(isNaN(val) ? 1 : val);
                  }}
                  placeholder="e.g. 3.24"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    marginTop: '0.25rem',
                  }}
                />
              </div>
            </>
          ) : (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Size (Grid cells)</label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                  marginTop: '0.25rem',
                }}
              >
                <option value={1}>1x1 (Medium)</option>
                <option value={2}>2x2 (Large)</option>
                <option value={3}>3x3 (Huge)</option>
                <option value={4}>4x4 (Gargantuan)</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Rotation ({rotation}°)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <input
                type="range"
                min={0}
                max={359}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <input
                type="number"
                min={0}
                max={360}
                value={rotation}
                onChange={(e) => setRotation(((Number(e.target.value) % 360) + 360) % 360)}
                style={{
                  width: '54px',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>°</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.8rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setLocked(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>🔒 Lock {isProp ? 'Prop' : 'Token'} (prevent moving)</span>
            </label>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Border Shape</label>
            <select
              value={clipShape}
              onChange={(e) => setClipShape(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                marginTop: '0.25rem',
              }}
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="rounded">Rounded Square</option>
              <option value="hexagon">Hexagon</option>
              <option value="octagon">Octagon</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Border Width ({borderWidth}px)
            </label>
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={borderWidth}
              onChange={(e) => setBorderWidth(Number(e.target.value))}
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Image Zoom ({clipZoom.toFixed(2)}x)
            </label>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.05"
              value={clipZoom}
              onChange={(e) => setClipZoom(Number(e.target.value))}
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pan Image (X: {clipPanX}%, Y: {clipPanY}%)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={clipPanX}
                onChange={(e) => setClipPanX(Number(e.target.value))}
                title="Pan X"
                style={{ flex: 1 }}
              />
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={clipPanY}
                onChange={(e) => setClipPanY(Number(e.target.value))}
                title="Pan Y"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {isGm && (
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Assigned Player & Ownership</label>
              <select
                value={ownerId}
                onChange={(e) => {
                  const val = e.target.value;
                  setOwnerId(val);
                  setIsPlayerToken(val !== '');
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                  marginTop: '0.25rem',
                }}
              >
                <option value="">GM Only (NPC / Monster)</option>
                <option value="unassigned">⭐ Unclaimed Player Token (Any player can choose upon joining)</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    Player: {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Token Attacks & Actions (OB-200) */}
        {!isProp && (
          <div
            style={{
              marginBottom: '1.5rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Swords size={16} color="var(--accent-primary)" />
                <span>Attacks & Actions ({actions.length})</span>
              </div>
              {!isAddingAction && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  onClick={handleStartAddAction}
                >
                  <Plus size={14} /> Add Attack
                </button>
              )}
            </div>

            {/* Inline Add / Edit Action Form */}
            {isAddingAction && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '0.85rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '0.65rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {editingActionIndex !== null ? 'Edit Attack / Action' : 'New Attack / Action'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Attack Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Longsword, Bite, Shortbow"
                      value={actionForm.name}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Type
                    </label>
                    <select
                      value={actionForm.type || 'melee'}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, type: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    >
                      <option value="melee">Melee Attack</option>
                      <option value="ranged">Ranged Attack</option>
                      <option value="spell">Spell</option>
                      <option value="action">Action / Ability</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      To-Hit Modifier
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5 for +5"
                      value={actionForm.toHitModifier ?? ''}
                      onChange={(e) =>
                        setActionForm((prev) => ({
                          ...prev,
                          toHitModifier: e.target.value === '' ? undefined : Number(e.target.value),
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Damage Formula
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1d8+3, 2d6"
                      value={actionForm.damageDice || ''}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, damageDice: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Reach / Range
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 ft, 30/120 ft"
                      value={actionForm.range || actionForm.reach || ''}
                      onChange={(e) =>
                        setActionForm((prev) => ({
                          ...prev,
                          range: e.target.value,
                          reach: e.target.value,
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Dice Macro (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1d20+5 or 2d6+3"
                      value={actionForm.diceMacro || ''}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, diceMacro: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Description / Effect Notes (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. Slashing damage, versatile (1d10)"
                      value={actionForm.description || ''}
                      onChange={(e) => setActionForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                    onClick={() => {
                      setIsAddingAction(false);
                      setEditingActionIndex(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                    onClick={handleSaveAction}
                    disabled={!actionForm.name?.trim()}
                  >
                    <Check size={14} /> {editingActionIndex !== null ? 'Update Attack' : 'Save Attack'}
                  </button>
                </div>
              </div>
            )}

            {/* List of Actions */}
            {actions.length === 0 && !isAddingAction ? (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  padding: '0.5rem 0',
                }}
              >
                No attacks added to this token. Click "+ Add Attack" to give this token attacks without needing a character sheet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {actions.map((act, idx) => (
                  <div
                    key={`${act.name}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {act.name}
                        </span>
                        {act.type && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {act.type}
                          </span>
                        )}
                        {act.toHitModifier !== undefined && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'var(--accent-primary)',
                            }}
                          >
                            {act.toHitModifier >= 0 ? `+${act.toHitModifier}` : act.toHitModifier} to hit
                          </span>
                        )}
                        {act.damageDice && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {act.damageDice} dmg
                          </span>
                        )}
                        {(act.range || act.reach) && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ({act.range || act.reach})
                          </span>
                        )}
                      </div>
                      {act.description && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.15rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {act.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => handleStartEditAction(idx)}
                        title="Edit Attack"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', padding: 0, color: '#f43f5e' }}
                        onClick={() => handleDeleteAction(idx)}
                        title="Delete Attack"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spells & Magic Section */}
        {!isProp && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.6rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Sparkles size={16} color="#a855f7" />
                <span>Spells & Magic ({spells.length})</span>
              </div>
              {!isAddingSpell && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  onClick={handleStartAddSpell}
                >
                  <Plus size={14} /> Add Spell
                </button>
              )}
            </div>

            {/* Add / Edit Spell Inline Form */}
            {isAddingSpell && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c084fc' }}>
                  {editingSpellIndex !== null ? 'Edit Spell' : 'Add New Spell'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Spell Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fireball, Cure Wounds, Misty Step"
                      value={spellForm.name}
                      onChange={(e) => setSpellForm((prev) => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Level
                    </label>
                    <select
                      value={spellForm.level}
                      onChange={(e) => setSpellForm((prev) => ({ ...prev, level: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    >
                      <option value={0}>Cantrip (0)</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Level {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      School
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Evocation, Abjuration"
                      value={spellForm.school}
                      onChange={(e) => setSpellForm((prev) => ({ ...prev, school: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Casting Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 action, 1 bonus action"
                      value={spellForm.castingTime}
                      onChange={(e) => setSpellForm((prev) => ({ ...prev, castingTime: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Range
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 60 ft, Self, Touch"
                      value={spellForm.range}
                      onChange={(e) => setSpellForm((prev) => ({ ...prev, range: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Instantaneous, 1 minute (Concentration)"
                      value={spellForm.duration}
                      onChange={(e) => setSpellForm((prev) => ({ ...prev, duration: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Description / Effect Notes
                    </label>
                    <textarea
                      placeholder="Spell details, damage formula, saving throw notes..."
                      value={spellForm.description}
                      onChange={(e) => setSpellForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'white',
                        fontSize: '0.85rem',
                        marginTop: '0.2rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                    onClick={() => {
                      setIsAddingSpell(false);
                      setEditingSpellIndex(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                    onClick={handleSaveSpell}
                    disabled={!spellForm.name?.trim()}
                  >
                    <Check size={14} /> {editingSpellIndex !== null ? 'Update Spell' : 'Save Spell'}
                  </button>
                </div>
              </div>
            )}

            {/* List of Spells */}
            {spells.length === 0 && !isAddingSpell ? (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  padding: '0.5rem 0',
                }}
              >
                No spells added to this token. Click "+ Add Spell" to assign spells to this token.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {spells.map((sp, idx) => (
                  <div
                    key={`${sp.name}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      borderLeft: '3px solid #a855f7',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {sp.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            fontWeight: 700,
                          }}
                        >
                          {sp.level === 0 ? 'Cantrip' : `Level ${sp.level}`}
                        </span>
                        {sp.school && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {sp.school}
                          </span>
                        )}
                        {sp.castingTime && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            • {sp.castingTime}
                          </span>
                        )}
                        {sp.range && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            • {sp.range}
                          </span>
                        )}
                      </div>
                      {sp.description && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.15rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {sp.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => handleStartEditSpell(idx)}
                        title="Edit Spell"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ width: '26px', height: '26px', padding: 0, color: '#f43f5e' }}
                        onClick={() => handleDeleteSpell(idx)}
                        title="Delete Spell"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conditions Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Conditions & Statuses
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowStatusModal(true)}
              style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Sparkles size={12} color="var(--accent-primary)" /> Manage Custom Statuses...
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {allAvailableStatuses.map((label) => {
              const active = conditions.some((c) => c.split(':')[0] === label);
              const def = statusDefs[label];
              const badgeColor = def?.color || '#f43f5e';
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleCondition(label)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: active ? badgeColor : 'var(--border-subtle)',
                    backgroundColor: active ? `${badgeColor}25` : 'var(--bg-surface)',
                    color: active ? badgeColor : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {label}
                  {def?.counter && active && (
                    <span> ({conditions.find((c) => c.startsWith(`${label}:`))?.split(':')[1] || def.counter.start})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prop toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            type="checkbox"
            id="isPropCheck"
            checked={isProp}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsProp(checked);
              if (checked && (!ringColor || ringColor === '#3b82f6')) {
                setRingColor('transparent');
              }
            }}
          />
          <label htmlFor="isPropCheck" style={{ fontSize: '0.875rem' }}>
            Treat as Map Prop (no health bar)
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
    {showStatusModal && (
      <CustomStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        activeMap={activeMap}
        onUpdateMap={onUpdateMap}
        onApplyStatusToToken={(conditionStr) => {
          const base = conditionStr.split(':')[0];
          if (!conditions.some((c) => c.split(':')[0] === base)) {
            setConditions((prev) => [...prev, conditionStr]);
          }
        }}
      />
    )}
    </>
  );
};
