import React, { useState } from 'react';
import { CustomStatusDefinition, GameMap, StatusTurnTrigger } from '@oldbear/shared';
import { X, Plus, Trash2, Check, Sparkles, Tag, Layers, Globe, Shield, RefreshCw } from 'lucide-react';
import {
  DEFAULT_STATUS_DEFINITIONS,
  getGlobalStatusDefinitions,
  saveGlobalStatusDefinition,
  deleteGlobalStatusDefinition,
  saveSceneStatusDefinition,
  deleteSceneStatusDefinition,
  resolveStatusDefinitions,
  formatCondition,
} from '../status/StatusManager.js';

interface CustomStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMap?: GameMap;
  onUpdateMap?: (mapId: string, updates: Partial<GameMap>) => void;
  onApplyStatusToToken?: (conditionString: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#10b981', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#64748b', // slate
  '#ffffff', // white
];

export const CustomStatusModal: React.FC<CustomStatusModalProps> = ({
  isOpen,
  onClose,
  activeMap,
  onUpdateMap,
  onApplyStatusToToken,
}) => {
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'custom' | 'scene' | 'default'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form state for creating a new custom status
  const [isCreating, setIsCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [showOnToken, setShowOnToken] = useState(true);
  const [hasCounter, setHasCounter] = useState(false);
  const [counterStart, setCounterStart] = useState<number>(1);
  const [counterUpdate, setCounterUpdate] = useState<number>(1);
  const [counterMin, setCounterMin] = useState<string>('0');
  const [counterMax, setCounterMax] = useState<string>('');
  const [clearWhen, setClearWhen] = useState<StatusTurnTrigger | ''>('');
  const [updates, setUpdates] = useState<StatusTurnTrigger | ''>('');
  const [scope, setScope] = useState<'global' | 'scene'>('global');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const globalDefs = getGlobalStatusDefinitions();
  const sceneDefs = activeMap?.customStatuses || {};
  const resolvedDefs = resolveStatusDefinitions(activeMap);

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setColor('#6366f1');
    setShowOnToken(true);
    setHasCounter(false);
    setCounterStart(1);
    setCounterUpdate(1);
    setCounterMin('0');
    setCounterMax('');
    setClearWhen('');
    setUpdates('');
    setScope(activeMap ? 'global' : 'global');
    setFormError('');
    setIsCreating(false);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setFormError('Status label is required.');
      return;
    }

    const newDef: CustomStatusDefinition = {
      label: cleanLabel,
      description: description.trim() || undefined,
      color,
      showOnToken,
      clearWhen: (clearWhen as StatusTurnTrigger) || undefined,
      updates: (updates as StatusTurnTrigger) || undefined,
    };

    if (hasCounter) {
      newDef.counter = {
        start: Number(counterStart) || 1,
        update: Number(counterUpdate) || 1,
        min: counterMin !== '' ? Number(counterMin) : undefined,
        max: counterMax !== '' ? Number(counterMax) : undefined,
      };
    }

    if (scope === 'scene' && activeMap && onUpdateMap) {
      const updatedSceneStatuses = saveSceneStatusDefinition(activeMap, newDef);
      onUpdateMap(activeMap.id, { customStatuses: updatedSceneStatuses });
    } else {
      saveGlobalStatusDefinition(newDef);
    }

    setRefreshTrigger((v) => v + 1);

    if (onApplyStatusToToken) {
      const conditionStr = hasCounter ? formatCondition(cleanLabel, newDef.counter?.start) : cleanLabel;
      onApplyStatusToToken(conditionStr);
      onClose();
      return;
    }

    resetForm();
  };

  const handleDeleteStatus = (statusLabel: string, isSceneScope: boolean) => {
    if (isSceneScope && activeMap && onUpdateMap) {
      const updatedSceneStatuses = deleteSceneStatusDefinition(activeMap, statusLabel);
      onUpdateMap(activeMap.id, { customStatuses: updatedSceneStatuses });
    } else {
      deleteGlobalStatusDefinition(statusLabel);
    }
    setRefreshTrigger((v) => v + 1);
  };

  const handleApply = (def: CustomStatusDefinition) => {
    if (!onApplyStatusToToken) return;
    const conditionStr = def.counter?.start !== undefined ? formatCondition(def.label, def.counter.start) : def.label;
    onApplyStatusToToken(conditionStr);
    onClose();
  };

  const allEntries = Object.values(resolvedDefs).filter((def) => {
    const isDefault = Boolean(DEFAULT_STATUS_DEFINITIONS[def.label]);
    const isScene = Boolean(sceneDefs[def.label]);
    const isGlobal = Boolean(globalDefs[def.label]);

    if (filterScope === 'default' && !isDefault) return false;
    if (filterScope === 'custom' && !isGlobal && !isScene) return false;
    if (filterScope === 'scene' && !isScene) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return def.label.toLowerCase().includes(q) || (def.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '14px',
          width: '640px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #1e293b, #0f172a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#6366f1" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Status & Condition Definitions
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto' }}>
          {!isCreating ? (
            <div>
              {/* Controls bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="text"
                  placeholder="Search statuses & conditions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />

                <select
                  value={filterScope}
                  onChange={(e) => setFilterScope(e.target.value as any)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="all">All Statuses ({Object.keys(resolvedDefs).length})</option>
                  <option value="custom">Custom Only ({Object.keys(globalDefs).length + Object.keys(sceneDefs).length})</option>
                  <option value="scene">Scene Overrides ({Object.keys(sceneDefs).length})</option>
                  <option value="default">Built-in Defaults ({Object.keys(DEFAULT_STATUS_DEFINITIONS).length})</option>
                </select>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCreating(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
                >
                  <Plus size={16} /> New Status
                </button>
              </div>

              {/* Status List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    No statuses found matching "{search}".
                  </div>
                ) : (
                  allEntries.map((def) => {
                    const isDefault = Boolean(DEFAULT_STATUS_DEFINITIONS[def.label]);
                    const isScene = Boolean(sceneDefs[def.label]);
                    const isGlobal = Boolean(globalDefs[def.label]);

                    return (
                      <div
                        key={def.label}
                        style={{
                          backgroundColor: '#0f172a',
                          border: `1px solid ${isScene ? 'rgba(147, 51, 234, 0.4)' : isGlobal ? 'rgba(59, 130, 246, 0.4)' : '#334155'}`,
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          {/* Color Badge */}
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              backgroundColor: def.color || '#6366f1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: '#fff',
                              flexShrink: 0,
                              boxShadow: `0 2px 8px ${def.color}44`,
                            }}
                          >
                            {def.label.slice(0, 2).toUpperCase()}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                                {def.label}
                              </span>

                              {def.counter && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#f59e0b',
                                    fontWeight: 600,
                                  }}
                                >
                                  Counter: {def.counter.start}{def.counter.max ? ` / ${def.counter.max}` : ''}
                                </span>
                              )}

                              {isScene && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(147, 51, 234, 0.15)',
                                    color: '#c084fc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Layers size={10} /> Scene: {activeMap?.name || 'Current'}
                                </span>
                              )}

                              {isGlobal && !isScene && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    color: '#60a5fa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Globe size={10} /> Global Custom
                                </span>
                              )}

                              {isDefault && !isGlobal && !isScene && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(100, 116, 139, 0.15)',
                                    color: '#94a3b8',
                                  }}
                                >
                                  Built-in
                                </span>
                              )}
                            </div>

                            {def.description && (
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.3 }}>
                                {def.description}
                              </div>
                            )}

                            {(def.clearWhen || def.updates) && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '0.75rem' }}>
                                {def.clearWhen && <span>Clears: {def.clearWhen.replace(/_/g, ' ')}</span>}
                                {def.updates && <span>Updates: {def.updates.replace(/_/g, ' ')}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {onApplyStatusToToken && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleApply(def)}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                            >
                              Apply to Token
                            </button>
                          )}

                          {(isScene || isGlobal) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStatus(def.label, isScene)}
                              title="Delete custom status"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSaveStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Create New Custom Status
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              {/* Label */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                  Status Label / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blessed, Burning, Shielded, Haste..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Color Swatches */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Status Badge Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: color === c ? '2px solid #ffffff' : '1px solid transparent',
                        transform: color === c ? 'scale(1.2)' : 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: 'transform 0.1s',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: 'none',
                      padding: 0,
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                  Description / Gameplay Effect
                </label>
                <textarea
                  placeholder="e.g. Grants +1d4 to all attack rolls and saving throws..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Counter Checkbox */}
              <div style={{ backgroundColor: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={hasCounter}
                    onChange={(e) => setHasCounter(e.target.checked)}
                  />
                  Has Numeric Counter / Stacks (e.g. Bleeding 3, Dying 1)
                </label>

                {hasCounter && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Start</span>
                      <input
                        type="number"
                        value={counterStart}
                        onChange={(e) => setCounterStart(Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Step per Turn</span>
                      <input
                        type="number"
                        value={counterUpdate}
                        onChange={(e) => setCounterUpdate(Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Min</span>
                      <input
                        type="number"
                        value={counterMin}
                        onChange={(e) => setCounterMin(e.target.value)}
                        placeholder="None"
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Max</span>
                      <input
                        type="number"
                        value={counterMax}
                        onChange={(e) => setCounterMax(e.target.value)}
                        placeholder="None"
                        style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Turn Triggers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Auto-Clear Trigger
                  </label>
                  <select
                    value={clearWhen}
                    onChange={(e) => setClearWhen(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="">Manual removal only</option>
                    <option value="beginning_of_turn">Start of Turn</option>
                    <option value="end_of_turn">End of Turn</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                    Counter Update Trigger
                  </label>
                  <select
                    value={updates}
                    onChange={(e) => setUpdates(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="">Manual counter update</option>
                    <option value="beginning_of_turn">Start of Turn</option>
                    <option value="end_of_turn">End of Turn</option>
                  </select>
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                  Storage Scope
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="statusScope"
                      checked={scope === 'global'}
                      onChange={() => setScope('global')}
                    />
                    <Globe size={14} color="#60a5fa" /> Global (All scenes)
                  </label>

                  {activeMap && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="statusScope"
                        checked={scope === 'scene'}
                        onChange={() => setScope('scene')}
                      />
                      <Layers size={14} color="#c084fc" /> Scene Specific ({activeMap.name})
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> Save Status Definition
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #334155',
            backgroundColor: '#0f172a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#94a3b8',
          }}
        >
          <span>
            {Object.keys(resolvedDefs).length} statuses active ({Object.keys(globalDefs).length} global custom, {Object.keys(sceneDefs).length} scene overrides)
          </span>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
