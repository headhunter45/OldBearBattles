import {
  DnDAction,
  DnDCharacter,
  DnDSpell,
  Player,
  Token,
  getActivationCategory,
} from '@oldbear/shared';
import {
  ChevronDown,
  ChevronUp,
  Coins,
  Dices,
  ExternalLink,
  FileText,
  Flame,
  Heart,
  Link as LinkIcon,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Plus,
  Trash2,
  Edit2,
  Upload,
  User,
  Zap,
  Save,
  Check
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { DraggableWindowTitleBar } from '../../common/components/DraggableWindow.js';
import HelpTip from '../../common/components/HelpTip.js';
import { useDraggableWindow } from '../../common/hooks/useDraggableWindow.js';
import {
  SavedCharacterRecord,
  deleteSavedCharacter,
  getSavedCharacters,
  saveCharacterToStorage,
} from '../storage/characterStorage.js';
import {
  SAMPLE_PATHBUILDER_VALEROS,
  fetchPathbuilderBuild,
  isPathbuilderExport,
  parsePathbuilderExport,
} from '../utils/pathbuilderParser.js';

export { deleteSavedCharacter, getSavedCharacters, saveCharacterToStorage };
export type { SavedCharacterRecord };

interface CharacterFlyoutProps {
  player: Player;
  targetToken?: Token | null;
  ownedTokens?: Token[];
  onSyncToken?: (tokenId: string, updates: Partial<Token>) => void;
  onCreateTokenForCharacter?: (char: DnDCharacter) => void;
  onUpdatePlayerChar?: (char: DnDCharacter) => void;
  onRollAction?: (action: DnDAction) => void;
  onClose: () => void;
  isGm?: boolean;
}

export const CharacterFlyout: React.FC<CharacterFlyoutProps> = ({
  player,
  targetToken,
  ownedTokens = [],
  onSyncToken,
  onCreateTokenForCharacter,
  onUpdatePlayerChar,
  onRollAction,
  onClose,
  isGm = false,
}) => {
  const initialChar = targetToken
    ? (targetToken.character || null)
    : (player.dndBeyondCharacter || null);

  const isDndBeyondSource = (idOrUrl?: string): boolean => {
    if (!idOrUrl) return false;
    const str = String(idOrUrl).trim();
    return (
      /^\d+$/.test(str) ||
      str.includes('dndbeyond.com/characters/') ||
      str.toLowerCase() === 'demo'
    );
  };

  const formatDndBeyondUrl = (idOrUrl: string): string => {
    const str = idOrUrl.trim();
    if (/^\d+$/.test(str)) {
      return `https://www.dndbeyond.com/characters/${str}`;
    }
    return str;
  };

  const getKnownSyncUrl = (char: DnDCharacter | null): string => {
    const cid = char?.id || targetToken?.character?.id;
    if (cid && isDndBeyondSource(cid)) {
      return formatDndBeyondUrl(cid);
    }
    if (!targetToken) {
      const pid = player.dndBeyondCharacterId || player.dndBeyondCharacter?.id;
      if (pid && isDndBeyondSource(pid)) {
        return formatDndBeyondUrl(pid);
      }
    }
    return '';
  };

  const [charInput, setCharInput] = useState(() =>
    getKnownSyncUrl(initialChar),
  );
  const [character, setCharacter] = useState<DnDCharacter | null>(initialChar);
  const [syncTokenId, setSyncTokenId] = useState<string>(
    targetToken?.id ||
      (ownedTokens.length > 0 ? ownedTokens[0].id : 'create_new'),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [showOnlyTrainedSkills, setShowOnlyTrainedSkills] = useState(false);
  const [savedCharacters, setSavedCharacters] = useState<
    SavedCharacterRecord[]
  >(() => getSavedCharacters(isGm));
  const [isMinimized, setIsMinimized] = useState(false);

  // Pathbuilder 2e state (OB-144)
  const [importSource, setImportSource] = useState<'dndbeyond' | 'pathbuilder'>(
    'dndbeyond',
  );
  const [pathbuilderInput, setPathbuilderInput] = useState('');
  const [pathbuilderPasteOpen, setPathbuilderPasteOpen] = useState(false);
  const [pathbuilderPasteText, setPathbuilderPasteText] = useState('');
  const pathbuilderFileRef = useRef<HTMLInputElement>(null);

  const { windowRef, position, isDragging, handleMouseDown, zIndex } =
    useDraggableWindow({
      storageKey: 'obb_character_sheet_pos',
      defaultZIndex: 50,
    });

  // Manual fallback HP
  const [localHp, setLocalHp] = useState(targetToken?.currentHp ?? 25);
  const [localMaxHp, setLocalMaxHp] = useState(targetToken?.maxHp ?? 25);

  // Standalone Token Actions (OB-200)
  const [isAddingTokenAction, setIsAddingTokenAction] = useState(false);
  const [tokenActionForm, setTokenActionForm] = useState<DnDAction>({
    name: '',
    type: 'melee',
    toHitModifier: 0,
    damageDice: '',
    range: '',
    reach: '',
    description: '',
    diceMacro: '',
  });

  const handleSaveTokenAction = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!targetToken || !onSyncToken || !tokenActionForm.name.trim()) return;
    const toHit =
      tokenActionForm.toHitModifier !== undefined &&
      tokenActionForm.toHitModifier !== null &&
      String(tokenActionForm.toHitModifier).trim() !== '' &&
      !isNaN(Number(tokenActionForm.toHitModifier))
        ? Number(tokenActionForm.toHitModifier)
        : undefined;
    const newAction: DnDAction = {
      name: tokenActionForm.name.trim(),
      type: tokenActionForm.type || 'melee',
      toHitModifier: toHit,
      damageDice: tokenActionForm.damageDice?.trim() || undefined,
      range: tokenActionForm.range?.trim() || undefined,
      reach: tokenActionForm.reach?.trim() || undefined,
      description: tokenActionForm.description?.trim() || undefined,
      diceMacro: tokenActionForm.diceMacro?.trim() || undefined,
    };
    const updatedActions = [...(targetToken.actions || []), newAction];
    onSyncToken(targetToken.id, { actions: updatedActions });
    setIsAddingTokenAction(false);
    setTokenActionForm({
      name: '',
      type: 'melee',
      toHitModifier: 0,
      damageDice: '',
      range: '',
      reach: '',
      description: '',
      diceMacro: '',
    });
  };

  const handleDeleteTokenAction = (idx: number) => {
    if (!targetToken || !onSyncToken) return;
    const updatedActions = (targetToken.actions || []).filter((_, i) => i !== idx);
    onSyncToken(targetToken.id, { actions: updatedActions });
  };

  // Standalone Token Spells
  const [isAddingTokenSpell, setIsAddingTokenSpell] = useState(false);
  const [expandedTokenSpell, setExpandedTokenSpell] = useState<string | null>(null);
  const [tokenSpellForm, setTokenSpellForm] = useState<DnDSpell>({
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

  const handleSaveTokenSpell = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!targetToken || !onSyncToken || !tokenSpellForm.name.trim()) return;
    const newSpell: DnDSpell = {
      id: tokenSpellForm.id || crypto.randomUUID(),
      name: tokenSpellForm.name.trim(),
      level: Number(tokenSpellForm.level) || 0,
      school: tokenSpellForm.school?.trim() || 'Evocation',
      castingTime: tokenSpellForm.castingTime?.trim() || '1 action',
      range: tokenSpellForm.range?.trim() || 'Self',
      duration: tokenSpellForm.duration?.trim() || 'Instantaneous',
      description: tokenSpellForm.description?.trim() || '',
      dndBeyondUrl: tokenSpellForm.dndBeyondUrl?.trim() || '',
    };
    const updatedSpells = [...(targetToken.spells || []), newSpell];
    onSyncToken(targetToken.id, { spells: updatedSpells });
    setIsAddingTokenSpell(false);
    setTokenSpellForm({
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
  };

  const handleDeleteTokenSpell = (idx: number) => {
    if (!targetToken || !onSyncToken) return;
    const updatedSpells = (targetToken.spells || []).filter((_, i) => i !== idx);
    onSyncToken(targetToken.id, { spells: updatedSpells });
  };

  const refreshSavedCharacters = () => {
    setSavedCharacters(getSavedCharacters(isGm));
  };

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleSaveCurrentCharacter = () => {
    if (!character) return;
    saveCharacterToStorage(character, isGm);
    refreshSavedCharacters();
    onUpdatePlayerChar?.(character);
    if (targetToken && onSyncToken) {
      onSyncToken(targetToken.id, {
        character,
        name: character.name,
        currentHp: character.currentHp,
        maxHp: character.maxHp,
      });
    }
    setSaveFeedback(`Saved ${character.name} to database!`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleSaveCustomCharacter = () => {
    const name = targetToken?.name || 'Custom Character';
    const customChar: DnDCharacter = {
      id: `custom_${Date.now()}`,
      name,
      currentHp: localHp,
      maxHp: localMaxHp,
      tempHp: 0,
      armorClass: targetToken?.ac ?? 10,
      speed: targetToken?.speed ?? 30,
      avatarUrl: targetToken?.imageUrl || '',
      race: 'Custom',
      classes: 'Custom',
      level: 1,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: targetToken?.actions || [],
      spells: targetToken?.spells || [],
      spellSlots: {},
    };
    setCharacter(customChar);
    saveCharacterToStorage(customChar, isGm);
    refreshSavedCharacters();
    onUpdatePlayerChar?.(customChar);
    if (targetToken && onSyncToken) {
      onSyncToken(targetToken.id, {
        character: customChar,
        name: customChar.name,
        currentHp: customChar.currentHp,
        maxHp: customChar.maxHp,
      });
    }
    setSaveFeedback(`Saved ${name} to database!`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const syncToToken = (char: DnDCharacter, tokenId?: string) => {
    const id = tokenId || targetToken?.id;
    if (!id || !onSyncToken) return;
    const updates: Partial<Token> = {
      name: char.name,
      currentHp: char.currentHp,
      maxHp: char.maxHp,
      speed: char.speed,
      initiativeBonus: char.initiativeBonus,
      character: char,
    };
    if (char.avatarUrl) {
      updates.imageUrl = char.avatarUrl;
    }
    onSyncToken(id, updates);
  };

  const applyCharacterToBoard = (char: DnDCharacter) => {
    if (syncTokenId === 'create_new' || (!syncTokenId && !targetToken)) {
      onCreateTokenForCharacter?.(char);
    } else {
      const tokenIdToSync =
        syncTokenId === 'create_new'
          ? undefined
          : syncTokenId || targetToken?.id;
      if (tokenIdToSync) {
        syncToToken(char, tokenIdToSync);
      } else {
        onCreateTokenForCharacter?.(char);
      }
    }
  };

  const handleSelectSavedCharacter = (selectedId: string) => {
    if (!selectedId) return;
    const found = savedCharacters.find((c) => c.id === selectedId);
    if (!found) return;

    setCharacter(found.charData);
    const cid = found.charData.id || found.id;
    if (cid && isDndBeyondSource(cid)) {
      setCharInput(formatDndBeyondUrl(cid));
    } else {
      setCharInput('');
    }
    onUpdatePlayerChar?.(found.charData);
    applyCharacterToBoard(found.charData);
    saveCharacterToStorage(found.charData, isGm);
    refreshSavedCharacters();
  };

  useEffect(() => {
    if (targetToken) {
      setSyncTokenId(targetToken.id);
      setLocalHp(targetToken.currentHp ?? 25);
      setLocalMaxHp(targetToken.maxHp ?? 25);
      setError(null);
      setExpandedSpell(null);
      setExpandedAction(null);

      if (targetToken.character) {
        setCharacter(targetToken.character);
        const cid = targetToken.character.id;
        if (cid && isDndBeyondSource(cid)) {
          setCharInput(formatDndBeyondUrl(cid));
        } else {
          setCharInput('');
        }
      } else {
        // Reset to default state for unbound token (OB-207)
        setCharacter(null);
        setCharInput('');
      }
    } else {
      const fallbackChar = player.dndBeyondCharacter || null;
      setCharacter(fallbackChar);
      setCharInput(getKnownSyncUrl(fallbackChar));
      setSyncTokenId(
        ownedTokens.length > 0 ? ownedTokens[0].id : 'create_new',
      );
      setLocalHp(fallbackChar?.currentHp ?? 25);
      setLocalMaxHp(fallbackChar?.maxHp ?? 25);
      setError(null);
      setExpandedSpell(null);
      setExpandedAction(null);
    }
  }, [targetToken?.id, targetToken?.character, player.dndBeyondCharacter]);

  useEffect(() => {
    if (!charInput && character) {
      const known = getKnownSyncUrl(character);
      if (known) setCharInput(known);
    }
  }, [
    character?.id,
    player.dndBeyondCharacterId,
    player.dndBeyondCharacter?.id,
  ]);

  const handleImportPathbuilder = async (inputStr: string) => {
    setLoading(true);
    setError(null);
    try {
      let char: DnDCharacter;
      const trimmed = inputStr.trim();
      if (trimmed.startsWith('{') || isPathbuilderExport(trimmed)) {
        char = parsePathbuilderExport(trimmed);
      } else {
        const buildData = await fetchPathbuilderBuild(trimmed);
        char = parsePathbuilderExport(buildData);
      }
      setCharacter(char);
      onUpdatePlayerChar?.(char);
      saveCharacterToStorage(char, isGm);
      refreshSavedCharacters();
      applyCharacterToBoard(char);
      setPathbuilderPasteOpen(false);
      setPathbuilderPasteText('');
    } catch (err: any) {
      setError(err.message || 'Could not import Pathbuilder 2e character.');
    } finally {
      setLoading(false);
    }
  };

  const handlePathbuilderFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      handleImportPathbuilder(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const fetchCharacter = async (charId: string) => {
    if (
      charId.includes('pathbuilder2e.com') ||
      charId.startsWith('pathbuilder:')
    ) {
      return handleImportPathbuilder(charId);
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dndbeyond/${encodeURIComponent(charId)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.error || `Error ${res.status}: Failed to load character`,
        );
      }
      const data: DnDCharacter = await res.json();
      setCharacter(data);
      onUpdatePlayerChar?.(data);

      saveCharacterToStorage(data, isGm);
      refreshSavedCharacters();

      applyCharacterToBoard(data);
    } catch (err: any) {
      setError(err.message || 'Could not fetch character.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToToken = () => {
    if (!targetToken || !onSyncToken) return;
    if (character) {
      syncToToken(character);
    } else {
      onSyncToken(targetToken.id, {
        currentHp: localHp,
        maxHp: localMaxHp,
      });
    }
  };

  const handleHpChange = (delta: number) => {
    if (character) {
      const newHp = Math.max(
        0,
        Math.min(character.maxHp, character.currentHp + delta),
      );
      const updated = { ...character, currentHp: newHp };
      setCharacter(updated);
      onUpdatePlayerChar?.(updated);
      saveCharacterToStorage(updated, isGm);
      if (targetToken && onSyncToken) {
        onSyncToken(targetToken.id, { currentHp: newHp });
      }
    } else if (targetToken && onSyncToken) {
      const newHp = Math.max(0, Math.min(localMaxHp, localHp + delta));
      setLocalHp(newHp);
      onSyncToken(targetToken.id, { currentHp: newHp, maxHp: localMaxHp });
    }
  };

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const proficiencyBonus =
    character?.proficiencyBonus ??
    (character ? Math.floor((character.level - 1) / 4) + 2 : 2);

  return (
    <div
      ref={windowRef}
      className="glass-panel-elevated animate-fade-in draggable-window"
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : '4.5rem',
        right: position ? 'auto' : '1rem',
        display: 'flex',
        flexDirection: 'column',
        height: isMinimized ? '46px' : '100%',
        maxHeight: isMinimized ? '46px' : 'calc(100vh - 6rem)',
        width: '420px',
        maxWidth: 'calc(100vw - 1.5rem)',
        zIndex: zIndex ?? 50,
        boxShadow: isDragging
          ? '0 24px 48px rgba(0,0,0,0.8)'
          : '0 16px 36px rgba(0,0,0,0.6)',
        transition: isDragging
          ? 'none'
          : 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Header */}
      <DraggableWindowTitleBar
        onMouseDown={handleMouseDown}
        isDragging={isDragging}
        icon={<User size={18} color="var(--accent-primary)" />}
        title={character ? character.name : 'Character Sheet'}
        subtitle={
          character && character.level ? (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              (Lv {character.level})
            </span>
          ) : undefined
        }
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized((v) => !v)}
        onClose={onClose}
      />

      <div
        className={`draggable-window-body ${isMinimized ? 'minimized' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* D&D Beyond Link Input */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {/* Saved Characters Dropdown */}
          {savedCharacters.length > 0 && (
            <div style={{ marginBottom: '0.6rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem',
                  fontWeight: 600,
                }}
              >
                LOAD SAVED CHARACTER ({savedCharacters.length})
              </div>
              <select
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'white',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
                value={character?.id || ''}
                onChange={(e) => handleSelectSavedCharacter(e.target.value)}
              >
                <option value="">-- Choose from saved characters --</option>
                {savedCharacters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.classes ? `(${c.classes})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Import Source Tabs (OB-144) */}
          <div
            style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.6rem' }}
          >
            <button
              type="button"
              className={`btn ${importSource === 'dndbeyond' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.75rem',
                justifyContent: 'center',
              }}
              onClick={() => setImportSource('dndbeyond')}
            >
              D&D Beyond (5e)
            </button>
            <button
              type="button"
              className={`btn ${importSource === 'pathbuilder' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                fontSize: '0.75rem',
                justifyContent: 'center',
              }}
              onClick={() => setImportSource('pathbuilder')}
            >
              Pathbuilder 2e (PF2e)
            </button>
          </div>

          {importSource === 'dndbeyond' ? (
            <>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem',
                  textDecoration: 'uppercase',
                }}
              >
                Link Online Character{' '}
                <HelpTip text="Public dndbeyond.com character ids and pages supported." />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Character ID or URL (or 'demo')"
                  value={charInput}
                  onChange={(e) => setCharInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 0.8rem' }}
                  disabled={loading || !charInput.trim()}
                  onClick={() => fetchCharacter(charInput.trim())}
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <LinkIcon size={14} />
                  )}
                  {loading ? 'Syncing...' : 'Sync'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem',
                }}
              >
                IMPORT PATHBUILDER 2E CHARACTER
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.4rem',
                }}
              >
                <input
                  type="text"
                  placeholder="Build ID or URL (e.g. 12345 or json.php?id=...)"
                  value={pathbuilderInput}
                  onChange={(e) => setPathbuilderInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 0.8rem' }}
                  disabled={loading || !pathbuilderInput.trim()}
                  onClick={() => handleImportPathbuilder(pathbuilderInput)}
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <LinkIcon size={14} />
                  )}
                  {loading ? 'Importing...' : 'Import'}
                </button>
              </div>

              <div
                style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    padding: '0.35rem 0.5rem',
                    justifyContent: 'center',
                  }}
                  onClick={() => pathbuilderFileRef.current?.click()}
                >
                  <Upload size={13} /> Upload .json File
                </button>
                <input
                  type="file"
                  ref={pathbuilderFileRef}
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={handlePathbuilderFileUpload}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    padding: '0.35rem 0.5rem',
                    justifyContent: 'center',
                  }}
                  onClick={() => setPathbuilderPasteOpen((v) => !v)}
                >
                  <FileText size={13} />{' '}
                  {pathbuilderPasteOpen ? 'Hide Paste' : 'Paste JSON'}
                </button>
              </div>

              {pathbuilderPasteOpen && (
                <div style={{ marginTop: '0.5rem' }}>
                  <textarea
                    placeholder="Paste exported Pathbuilder 2e JSON here..."
                    rows={4}
                    value={pathbuilderPasteText}
                    onChange={(e) => setPathbuilderPasteText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      marginTop: '0.35rem',
                      padding: '0.4rem',
                      fontSize: '0.75rem',
                      justifyContent: 'center',
                    }}
                    disabled={loading || !pathbuilderPasteText.trim()}
                    onClick={() =>
                      handleImportPathbuilder(pathbuilderPasteText)
                    }
                  >
                    Apply Pasted JSON
                  </button>
                </div>
              )}
            </>
          )}

          {/* Board Token Assignment (Bug #41) */}
          <div style={{ marginTop: '0.6rem', marginBottom: '0.4rem' }}>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
                fontWeight: 600,
              }}
            >
              BOARD TOKEN ASSIGNMENT
            </div>
            <select
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'white',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
              value={syncTokenId}
              onChange={(e) => setSyncTokenId(e.target.value)}
            >
              <option value="create_new">
                ➕ Create New Token (Place at bottom of map)
              </option>
              {targetToken && (
                <option value={targetToken.id}>
                  🎯 Currently Selected: {targetToken.name}
                </option>
              )}
              {ownedTokens
                .filter((t) => t.id !== targetToken?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    👤 Owned Token: {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Quick Demo Button */}
          {!character && (
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                marginTop: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={() => {
                if (importSource === 'pathbuilder') {
                  const char = parsePathbuilderExport(
                    SAMPLE_PATHBUILDER_VALEROS,
                  );
                  setCharacter(char);
                  onUpdatePlayerChar?.(char);
                  saveCharacterToStorage(char, isGm);
                  refreshSavedCharacters();
                  applyCharacterToBoard(char);
                } else {
                  setCharInput('demo');
                  fetchCharacter('demo');
                }
              }}
            >
              <Sparkles size={12} />{' '}
              {importSource === 'pathbuilder'
                ? 'Click here to test with Valeros (PF2e Fighter Lvl 5)'
                : 'Click here to test with Demo Character'}
            </button>
          )}

          {error && (
            <div
              style={{
                color: '#f43f5e',
                fontSize: '0.75rem',
                marginTop: '0.4rem',
              }}
            >
              {error}
            </div>
          )}

          {saveFeedback && (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#22c55e',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                marginTop: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={14} /> {saveFeedback}
            </div>
          )}
        </div>

        {/* Sheet Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {/* Saved Characters Cards (Bug #44) */}
          {!character && savedCharacters.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.75rem',
                }}
              >
                SELECT FROM SAVED CHARACTERS ({savedCharacters.length})
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                {savedCharacters.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectSavedCharacter(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--border-subtle)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <img
                        src={
                          c.avatarUrl ||
                          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={c.name}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--border-subtle)',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {c.classes || 'Adventurer'}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.75rem',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSavedCharacter(c.id);
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {character ? (
            <div>
              {/* Profile Overview */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <img
                  src={
                    character.avatarUrl ||
                    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={character.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '2px solid var(--accent-primary)',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {character.name}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {character.race} • {character.classes}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveCurrentCharacter}
                  style={{
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '0.4rem 0.65rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  title="Save character to local database"
                >
                  <Save size={13} />
                  <span>Save to Database</span>
                </button>
              </div>

              {/* Currency Bar (Bug #51) */}
              {character.currencies && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.6rem',
                    marginBottom: '1rem',
                    fontSize: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: '#eab308',
                      fontWeight: 700,
                    }}
                  >
                    <Coins size={14} />
                    <span>CURRENCY</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontWeight: 600 }}>
                    <span>
                      <span style={{ color: '#b45309' }}>
                        {character.currencies.cp ?? 0}
                      </span>{' '}
                      CP
                    </span>
                    <span>
                      <span style={{ color: '#94a3b8' }}>
                        {character.currencies.sp ?? 0}
                      </span>{' '}
                      SP
                    </span>
                    <span>
                      <span style={{ color: '#0284c7' }}>
                        {character.currencies.ep ?? 0}
                      </span>{' '}
                      EP
                    </span>
                    <span>
                      <span style={{ color: '#eab308' }}>
                        {character.currencies.gp ?? 0}
                      </span>{' '}
                      GP
                    </span>
                    <span>
                      <span style={{ color: '#cbd5e1' }}>
                        {character.currencies.pp ?? 0}
                      </span>{' '}
                      PP
                    </span>
                  </div>
                </div>
              )}

              {/* Combat Vitals (AC, Speed, Initiative, Prof) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '3px',
                      color: '#38bdf8',
                    }}
                  >
                    <Shield size={12} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                      ARMOR
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      marginTop: '2px',
                    }}
                  >
                    {character.armorClass}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '3px',
                      color: '#10b981',
                    }}
                  >
                    <Zap size={12} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                      SPEED
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      marginTop: '2px',
                    }}
                  >
                    {character.speed} ft
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '3px',
                      color: '#f97316',
                    }}
                  >
                    <Flame size={12} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                      INITIATIVE
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      marginTop: '2px',
                    }}
                  >
                    {character.initiativeBonus !== undefined
                      ? character.initiativeBonus >= 0
                        ? `+${character.initiativeBonus}`
                        : character.initiativeBonus
                      : '+0'}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '3px',
                      color: '#a855f7',
                    }}
                  >
                    <Sparkles size={12} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                      PROF
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      marginTop: '2px',
                    }}
                  >
                    +{proficiencyBonus}
                  </div>
                </div>
              </div>

              {/* Passives Bar (Perception, Investigation, Insight) (Bug #51) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.4rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.25rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                    }}
                  >
                    PASSIVE PERCEPTION
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#f59e0b',
                      marginTop: '1px',
                    }}
                  >
                    {character.passives?.perception ??
                      character.passivePerception}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.25rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                    }}
                  >
                    PASSIVE INVESTIGATION
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#38bdf8',
                      marginTop: '1px',
                    }}
                  >
                    {character.passives?.investigation ?? 10}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.25rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                    }}
                  >
                    PASSIVE INSIGHT
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#a855f7',
                      marginTop: '1px',
                    }}
                  >
                    {character.passives?.insight ?? 10}
                  </div>
                </div>
              </div>

              {/* Live Interactive HP Tracker */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Heart size={16} color="#ef4444" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      HIT POINTS
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    {character.currentHp} / {character.maxHp}
                    {character.tempHp > 0 && (
                      <span style={{ color: '#38bdf8' }}>
                        {' '}
                        (+{character.tempHp})
                      </span>
                    )}
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (character.currentHp / character.maxHp) * 100)}%`,
                      backgroundColor:
                        character.currentHp <= character.maxHp * 0.25
                          ? '#ef4444'
                          : '#10b981',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {/* Quick Health Adjustments */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.35rem' }}
                    onClick={() => handleHpChange(-5)}
                  >
                    -5
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.35rem' }}
                    onClick={() => handleHpChange(-1)}
                  >
                    -1
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.35rem' }}
                    onClick={() => handleHpChange(1)}
                  >
                    +1
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.35rem' }}
                    onClick={() => handleHpChange(5)}
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Ability Scores Grid (Modifier Large, Score Small) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                  }}
                >
                  ABILITY SCORES
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '0.35rem',
                  }}
                >
                  {Object.entries(character.stats).map(([stat, score]) => (
                    <div
                      key={stat}
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.45rem 0.2rem 0.35rem 0.2rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {stat.toUpperCase()}
                      </div>
                      {/* MODIFIER LARGE */}
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          lineHeight: 1.15,
                          marginTop: '2px',
                        }}
                      >
                        {getModifier(score)}
                      </div>
                      {/* SCORE SMALL */}
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          borderRadius: '999px',
                          padding: '1px 5px',
                          marginTop: '2px',
                        }}
                      >
                        {score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saving Throws Section (Bug #51) */}
              {character.savingThrows && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    SAVING THROWS
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '0.35rem',
                    }}
                  >
                    {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(
                      (st) => {
                        const bonus = character.savingThrows![st];
                        const isProf =
                          character.savingThrows?.proficiencies?.includes(st);
                        return (
                          <div
                            key={st}
                            style={{
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: isProf
                                ? '1px solid var(--color-primary)'
                                : '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.45rem 0.2rem',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                color: isProf
                                  ? 'var(--color-primary)'
                                  : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              {isProf && (
                                <span style={{ color: 'var(--color-primary)' }}>
                                  ●
                                </span>
                              )}
                              {st.toUpperCase()}
                            </div>
                            <div
                              style={{
                                fontSize: '1.15rem',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                marginTop: '2px',
                              }}
                            >
                              {bonus >= 0 ? `+${bonus}` : bonus}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Skills & Proficiencies Section */}
              {character.skills && character.skills.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      SKILLS (
                      {
                        character.skills.filter((s) => s.proficiency !== 'none')
                          .length
                      }{' '}
                      Trained)
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                      onClick={() => setShowOnlyTrainedSkills((v) => !v)}
                    >
                      {showOnlyTrainedSkills
                        ? 'Show All Skills'
                        : 'Trained Only'}
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {(showOnlyTrainedSkills
                      ? character.skills.filter((s) => s.proficiency !== 'none')
                      : character.skills
                    ).map((skill) => (
                      <div
                        key={skill.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.25rem 0.4rem',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor:
                            skill.proficiency === 'expertise'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : skill.proficiency === 'proficient'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor:
                                skill.proficiency === 'expertise'
                                  ? '#f59e0b'
                                  : skill.proficiency === 'proficient'
                                    ? '#10b981'
                                    : 'transparent',
                              border:
                                skill.proficiency === 'none'
                                  ? '1.5px solid var(--text-muted)'
                                  : 'none',
                            }}
                            title={skill.proficiency.toUpperCase()}
                          />
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight:
                                skill.proficiency !== 'none' ? 600 : 400,
                            }}
                          >
                            {skill.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                            }}
                          >
                            ({skill.stat})
                          </span>
                          {skill.proficiency === 'expertise' && (
                            <span
                              style={{
                                fontSize: '0.6rem',
                                color: '#f59e0b',
                                fontWeight: 700,
                                background: 'rgba(245, 158, 11, 0.2)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                              }}
                            >
                              EXP
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color:
                              skill.proficiency !== 'none'
                                ? 'var(--text-primary)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {skill.modifier >= 0
                            ? `+${skill.modifier}`
                            : skill.modifier}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Section (Bug #50) */}
              {(character.actions || []).length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    ACTIONS ({(character.actions || []).length})
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    {(character.actions || []).map((action, idx) => {
                      const actionKey = `${action.name}-${idx}`;
                      const isExpanded = expandedAction === actionKey;
                      const category = getActivationCategory(action);
                      const details: string[] = [];
                      if (action.reach) details.push(action.reach);
                      else if (action.range) details.push(action.range);
                      if (action.toHitModifier !== undefined) {
                        details.push(
                          action.toHitModifier >= 0
                            ? `+${action.toHitModifier} to hit`
                            : `${action.toHitModifier} to hit`,
                        );
                      }
                      if (action.damage) details.push(action.damage);
                      else if (action.damageDice)
                        details.push(`${action.damageDice} damage`);

                      const borderAccent =
                        category === 'bonus'
                          ? '2px solid #f59e0b'
                          : category === 'reaction'
                            ? '2px solid #a855f7'
                            : '1px solid var(--border-subtle)';

                      return (
                        <div
                          key={actionKey}
                          style={{
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: borderAccent,
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.6rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: action.description
                                ? 'pointer'
                                : 'default',
                            }}
                            onClick={() => {
                              if (action.description) {
                                setExpandedAction(
                                  isExpanded ? null : actionKey,
                                );
                              }
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {action.name}
                                </span>
                                {category === 'bonus' && (
                                  <span
                                    style={{
                                      backgroundColor:
                                        'rgba(245, 158, 11, 0.18)',
                                      color: '#f59e0b',
                                      border:
                                        '1px solid rgba(245, 158, 11, 0.45)',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    Bonus Action
                                  </span>
                                )}
                                {category === 'reaction' && (
                                  <span
                                    style={{
                                      backgroundColor:
                                        'rgba(168, 85, 247, 0.18)',
                                      color: '#c084fc',
                                      border:
                                        '1px solid rgba(168, 85, 247, 0.45)',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    Reaction
                                  </span>
                                )}
                              </div>
                              {details.length > 0 && (
                                <div
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {details.join(' • ')}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                              }}
                            >
                              {onRollAction && (
                                <button
                                  className="btn btn-secondary"
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRollAction(action);
                                  }}
                                  title={`Roll ${action.name}`}
                                >
                                  <Dices
                                    size={13}
                                    color="var(--accent-indigo)"
                                  />
                                  <span>Roll</span>
                                </button>
                              )}
                              {action.description && (
                                <div>
                                  {isExpanded ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {isExpanded && action.description && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid var(--border-subtle)',
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.4,
                              }}
                            >
                              {action.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Spells Section */}
              {(character.spells || []).length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    SPELLS ({character.spells.length})
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    {character.spells.map((spell) => {
                      const isExpanded = expandedSpell === spell.id;
                      const spellCat = getActivationCategory(spell);
                      const spellBorderAccent =
                        spellCat === 'bonus'
                          ? '2px solid #f59e0b'
                          : spellCat === 'reaction'
                            ? '2px solid #a855f7'
                            : '1px solid var(--border-subtle)';

                      return (
                        <div
                          key={spell.id}
                          style={{
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: spellBorderAccent,
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.6rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                            }}
                            onClick={() =>
                              setExpandedSpell(isExpanded ? null : spell.id)
                            }
                          >
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {spell.name}
                                </span>
                                {spellCat === 'bonus' && (
                                  <span
                                    style={{
                                      backgroundColor:
                                        'rgba(245, 158, 11, 0.18)',
                                      color: '#f59e0b',
                                      border:
                                        '1px solid rgba(245, 158, 11, 0.45)',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    Bonus Action
                                  </span>
                                )}
                                {spellCat === 'reaction' && (
                                  <span
                                    style={{
                                      backgroundColor:
                                        'rgba(168, 85, 247, 0.18)',
                                      color: '#c084fc',
                                      border:
                                        '1px solid rgba(168, 85, 247, 0.45)',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    Reaction
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {spell.level === 0
                                  ? 'Cantrip'
                                  : `Level ${spell.level}`}{' '}
                                • {spell.castingTime}
                              </div>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                              }}
                            >
                              <a
                                href={spell.dndBeyondUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--text-secondary)' }}
                                onClick={(e) => e.stopPropagation()}
                                title="View on D&D Beyond"
                              >
                                <ExternalLink size={14} />
                              </a>
                              {isExpanded ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid var(--border-subtle)',
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '4px',
                                  marginBottom: '4px',
                                }}
                              >
                                <div>Range: {spell.range}</div>
                                <div>Duration: {spell.duration}</div>
                              </div>
                              <div style={{ lineHeight: 1.4 }}>
                                {spell.description}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Player HP Editor (No sheet linked) */
            <div>
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: '1rem 0',
                }}
              >
                No D&D Beyond character linked.
                <br />
                You can still track and edit your token HP below:
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Current HP
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <button
                      className="btn-icon"
                      onClick={() => handleHpChange(-1)}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        minWidth: '32px',
                        textAlign: 'center',
                      }}
                    >
                      {localHp}
                    </span>
                    <button
                      className="btn-icon"
                      onClick={() => handleHpChange(1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Max HP
                  </span>
                  <input
                    type="number"
                    value={localMaxHp}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLocalMaxHp(val);
                      if (targetToken && onSyncToken) {
                        onSyncToken(targetToken.id, {
                          currentHp: localHp,
                          maxHp: val,
                        });
                      }
                    }}
                    style={{
                      width: '60px',
                      padding: '0.3rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'white',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveCustomCharacter}
                  style={{
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '0.45rem 0.85rem',
                  }}
                  title="Save this token as a custom character to your database"
                >
                  <Save size={14} />
                  <span>Save as Custom Character</span>
                </button>
              </div>

              {/* Standalone Token Attacks (OB-200) */}
              {targetToken && (
                <div style={{ marginTop: '1.25rem' }}>
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
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Swords size={15} color="var(--accent-primary)" />
                      <span>Token Attacks ({(targetToken.actions || []).length})</span>
                    </div>
                    {!isAddingTokenAction && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                        onClick={() => setIsAddingTokenAction(true)}
                      >
                        <Plus size={13} /> Add Attack
                      </button>
                    )}
                  </div>

                  {/* Add Attack Inline Form */}
                  {isAddingTokenAction && (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        New Token Attack
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Longsword, Bite, Shortbow"
                            value={tokenActionForm.name}
                            onChange={(e) => setTokenActionForm((prev) => ({ ...prev, name: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Type
                          </label>
                          <select
                            value={tokenActionForm.type || 'melee'}
                            onChange={(e) => setTokenActionForm((prev) => ({ ...prev, type: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          >
                            <option value="melee">Melee</option>
                            <option value="ranged">Ranged</option>
                            <option value="spell">Spell</option>
                            <option value="action">Action</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            To-Hit Bonus
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 5 for +5"
                            value={tokenActionForm.toHitModifier ?? ''}
                            onChange={(e) =>
                              setTokenActionForm((prev) => ({
                                ...prev,
                                toHitModifier: e.target.value === '' ? undefined : Number(e.target.value),
                              }))
                            }
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Damage Formula
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1d8+3, 2d6"
                            value={tokenActionForm.damageDice || ''}
                            onChange={(e) => setTokenActionForm((prev) => ({ ...prev, damageDice: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Range / Reach
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 5 ft, 30/120 ft"
                            value={tokenActionForm.range || tokenActionForm.reach || ''}
                            onChange={(e) =>
                              setTokenActionForm((prev) => ({
                                ...prev,
                                range: e.target.value,
                                reach: e.target.value,
                              }))
                            }
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Slashing, versatile"
                            value={tokenActionForm.description || ''}
                            onChange={(e) =>
                              setTokenActionForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => setIsAddingTokenAction(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                          onClick={handleSaveTokenAction}
                          disabled={!tokenActionForm.name.trim()}
                        >
                          Save Attack
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Token Actions */}
                  {(!targetToken.actions || targetToken.actions.length === 0) && !isAddingTokenAction ? (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        padding: '0.4rem 0',
                      }}
                    >
                      No attacks added to {targetToken.name}. Click "+ Add Attack" to add attacks directly without syncing with a character sheet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {(targetToken.actions || []).map((action, idx) => (
                        <div
                          key={`${action.name}-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{action.name}</span>
                              {action.type && (
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
                                  {action.type}
                                </span>
                              )}
                              {action.toHitModifier !== undefined && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: 'var(--accent-primary)',
                                  }}
                                >
                                  {action.toHitModifier >= 0 ? `+${action.toHitModifier}` : action.toHitModifier} to hit
                                </span>
                              )}
                              {action.damageDice && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  {action.damageDice} dmg
                                </span>
                              )}
                              {(action.range || action.reach) && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  ({action.range || action.reach})
                                </span>
                              )}
                            </div>
                            {action.description && (
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.15rem',
                                }}
                              >
                                {action.description}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
                            {onRollAction && (
                              <button
                                className="btn btn-secondary"
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.72rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRollAction(action);
                                }}
                                title={`Roll ${action.name}`}
                              >
                                <Dices size={13} color="var(--accent-indigo)" />
                                <span>Roll</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ width: '24px', height: '24px', padding: 0, color: '#f43f5e' }}
                              onClick={() => handleDeleteTokenAction(idx)}
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

              {/* Standalone Token Spells */}
              {targetToken && (
                <div style={{ marginTop: '1.25rem' }}>
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
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Sparkles size={15} color="#a855f7" />
                      <span>Token Spells ({(targetToken.spells || []).length})</span>
                    </div>
                    {!isAddingTokenSpell && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                        onClick={() => setIsAddingTokenSpell(true)}
                      >
                        <Plus size={13} /> Add Spell
                      </button>
                    )}
                  </div>

                  {/* Add Spell Inline Form */}
                  {isAddingTokenSpell && (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: '#c084fc' }}>
                        New Token Spell
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Spell Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Fireball, Cure Wounds, Misty Step"
                            value={tokenSpellForm.name}
                            onChange={(e) => setTokenSpellForm((prev) => ({ ...prev, name: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Level
                          </label>
                          <select
                            value={tokenSpellForm.level}
                            onChange={(e) => setTokenSpellForm((prev) => ({ ...prev, level: Number(e.target.value) }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
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
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            School
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Evocation, Abjuration"
                            value={tokenSpellForm.school}
                            onChange={(e) => setTokenSpellForm((prev) => ({ ...prev, school: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Casting Time
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1 action"
                            value={tokenSpellForm.castingTime}
                            onChange={(e) => setTokenSpellForm((prev) => ({ ...prev, castingTime: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Range
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 60 ft, Self, Touch"
                            value={tokenSpellForm.range}
                            onChange={(e) => setTokenSpellForm((prev) => ({ ...prev, range: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Description / Effect Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Deals 8d6 fire damage in 20ft sphere"
                            value={tokenSpellForm.description || ''}
                            onChange={(e) => setTokenSpellForm((prev) => ({ ...prev, description: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              color: 'white',
                              fontSize: '0.8rem',
                              marginTop: '0.15rem',
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => setIsAddingTokenSpell(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                          onClick={handleSaveTokenSpell}
                          disabled={!tokenSpellForm.name.trim()}
                        >
                          Save Spell
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Token Spells */}
                  {(!targetToken.spells || targetToken.spells.length === 0) && !isAddingTokenSpell ? (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        padding: '0.4rem 0',
                      }}
                    >
                      No spells added to {targetToken.name}. Click "+ Add Spell" to give this token spells directly without needing a character sheet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {(targetToken.spells || []).map((spell, idx) => {
                        const isExpanded = expandedTokenSpell === spell.id;
                        return (
                          <div
                            key={`${spell.name}-${idx}`}
                            style={{
                              backgroundColor: 'var(--bg-surface-elevated)',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              borderLeft: '3px solid #a855f7',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: spell.description ? 'pointer' : 'default',
                              }}
                              onClick={() => {
                                if (spell.description) {
                                  setExpandedTokenSpell(isExpanded ? null : spell.id);
                                }
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{spell.name}</span>
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
                                    {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                                  </span>
                                  {spell.school && (
                                    <span
                                      style={{
                                        fontSize: '0.65rem',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                        color: 'var(--text-secondary)',
                                      }}
                                    >
                                      {spell.school}
                                    </span>
                                  )}
                                  {spell.castingTime && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      • {spell.castingTime}
                                    </span>
                                  )}
                                  {spell.range && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      • {spell.range}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
                                {onRollAction && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '0.2rem 0.5rem',
                                      fontSize: '0.72rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRollAction({
                                        name: spell.name,
                                        type: 'spell',
                                        description: spell.description,
                                        range: spell.range,
                                      });
                                    }}
                                    title={`Cast ${spell.name}`}
                                  >
                                    <Dices size={13} color="#a855f7" />
                                    <span>Cast</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn-icon"
                                  style={{ width: '24px', height: '24px', padding: 0, color: '#f43f5e' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTokenSpell(idx);
                                  }}
                                  title="Delete Spell"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            {isExpanded && spell.description && (
                              <div
                                style={{
                                  marginTop: '0.4rem',
                                  paddingTop: '0.4rem',
                                  borderTop: '1px solid var(--border-subtle)',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  lineHeight: 1.4,
                                }}
                              >
                                {spell.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {targetToken ? (
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handleSyncToToken}
              >
                <RefreshCw size={14} /> Sync with Token ({targetToken.name})
              </button>
              <button
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={character ? handleSaveCurrentCharacter : handleSaveCustomCharacter}
                title="Save character to database"
              >
                <Save size={14} /> Save
              </button>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: '0.35rem',
              }}
            >
              Sets token name, avatar, HP, and speed.
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Select a token on the map to sync this character to it.
            </span>
            {character && (
              <button
                className="btn btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
                onClick={handleSaveCurrentCharacter}
              >
                <Save size={13} /> Save to Database
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
