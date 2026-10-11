import React, { useState } from 'react';
import {
  Share2,
  Menu,
  Check,
  Swords,
  Timer,
  Play,
  Pause,
  ChevronRight,
  Shield,
  MessageSquareHeart,
  ExternalLink,
  Trophy,
  Target,
  Compass,
  Gavel,
  Eye,
  Settings,
  ChevronDown,
  X,
  Dices,
} from 'lucide-react';
import { BrawlUserRole } from '../domain/toManager.js';
import { Player } from '@oldbear/shared';
import { VoiceState } from '../../common/network/VoiceManager.js';
import { FULL_VERSION_STRING } from '../../common/config/version.js';
import { WargamePhase } from '../types/brawl.js';
import { switchGameMode, isSingleGameModeEnforced } from '../../App.js';
import {
  formatChessClock,
  getClockWarningStatus,
} from '../domain/chessClock.js';
import { useFeatureFlag } from '../../common/config/featureFlags.js';

interface BrawlTopBarProps {
  roomName: string;
  activeMapName: string;
  isOrganizer: boolean;
  players: Player[];
  localPlayer: Player | null;
  activePlayerIndex: 1 | 2;
  currentRound: number;
  currentPhase: WargamePhase;
  p1ClockSeconds: number;
  p2ClockSeconds: number;
  isClockRunning: boolean;
  isChessClockEnabled?: boolean;
  onToggleChessClockEnabled?: () => void;
  p1TotalVp?: number;
  p2TotalVp?: number;
  onToggleClock: () => void;
  onNextPhase: () => void;
  onSwitchActivePlayer: () => void;
  onOpenScoreboard?: () => void;
  onOpenObjectives?: () => void;
  onOpenStaging?: () => void;
  onOpenToModal?: () => void;
  currentRole?: BrawlUserRole;
  onOpenArmyRoster: () => void;
  onOpenDice: () => void;
  onOpenMaps: () => void;
  onOpenSoundboard: () => void;
  onOpenBackup: () => void;
  onAddNewModel: () => void;
  onToggleMobileDrawer: () => void;
  onToggleChessClockHUD?: () => void;
  onOpenSceneSettings?: () => void;
  voiceState?: VoiceState;
  headerRef?: React.Ref<HTMLElement>;
  onJumpPhase?: (
    round: number,
    phaseIndex: number,
    playerIndex?: 1 | 2,
  ) => void;
}

const PHASES: WargamePhase[] = [
  'Command',
  'Movement',
  'Shooting',
  'Charge',
  'Fight',
  'Morale',
];

export const BrawlTopBar: React.FC<BrawlTopBarProps> = ({
  roomName,
  activeMapName,
  isOrganizer,
  players,
  localPlayer,
  activePlayerIndex,
  currentRound,
  currentPhase,
  p1ClockSeconds,
  p2ClockSeconds,
  isClockRunning,
  isChessClockEnabled = false,
  onToggleChessClockEnabled,
  p1TotalVp = 0,
  p2TotalVp = 0,
  onToggleClock,
  onNextPhase,
  onSwitchActivePlayer,
  onOpenScoreboard,
  onOpenObjectives,
  onOpenStaging,
  onOpenToModal,
  currentRole = 'player',
  onOpenArmyRoster,
  onOpenDice,
  onOpenMaps,
  onOpenSceneSettings,
  onOpenSoundboard,
  onOpenBackup,
  onAddNewModel,
  onToggleMobileDrawer,
  onToggleChessClockHUD,
  voiceState,
  headerRef,
  onJumpPhase,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPhaseQuickJump, setShowPhaseQuickJump] = useState(false);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clockEnabled = useFeatureFlag('chess_clock');
  const scoreboardEnabled = useFeatureFlag('scoreboard');
  const objectivesEnabled = useFeatureFlag('objectives');
  const armyRosterEnabled = useFeatureFlag('army_roster');
  const toModeEnabled = useFeatureFlag('to_mode');
  const diceRollerEnabled = useFeatureFlag('dice_roller');

  return (
    <header
      ref={headerRef}
      className="floating-hud glass-panel top-bar"
      style={{
        top: '0.75rem',
        left: '0.75rem',
        right: '0.75rem',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        zIndex: 30,
      }}
    >
      <div
        className="top-bar-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn-icon"
          onClick={onToggleMobileDrawer}
          title="Open Menu"
          aria-label="Open Menu"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>

        <div
          className="room-info"
          style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}
        >
          <div
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}
          >
            <span
              className="room-name"
              style={{
                fontWeight: 800,
                color: '#f59e0b',
                letterSpacing: '0.5px',
              }}
            >
              Old Bear Brawl
            </span>
            <span
              className="topbar-desktop-only"
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                padding: '1px 5px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              Wargame
            </span>
          </div>
          <span
            className="topbar-desktop-only"
            style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '-2px' }}
          >
            {FULL_VERSION_STRING}
          </span>
        </div>

        {!isSingleGameModeEnforced() && (
          <button
            className="btn btn-glass"
            onClick={() => switchGameMode('vtt')}
            title="Switch to Tabletop RPG Mode (VTT)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span>🐻 VTT</span>
          </button>
        )}

        <div
          className="topbar-map-label"
          style={{
            width: '1px',
            height: '20px',
            background: 'var(--border-subtle)',
            flexShrink: 0,
          }}
        />

        <div
          className="topbar-map-label"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.85rem',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Scene:</span>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--text-primary)',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeMapName}
          </span>
          {isOrganizer && onOpenSceneSettings && (
            <button
              className="btn-icon"
              onClick={onOpenSceneSettings}
              title="Scene Settings"
              aria-label="Scene Settings"
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Settings size={14} />
            </button>
          )}
        </div>

        {/* Round & Phase Bar (OB-157) */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            Round {currentRound} - Player {activePlayerIndex}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
          <button
            onClick={() => setShowPhaseQuickJump((prev) => !prev)}
            style={{
              background: showPhaseQuickJump
                ? 'rgba(56, 189, 248, 0.2)'
                : 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 5px',
              borderRadius: '4px',
            }}
            title="Click to open phase quick-jump menu"
          >
            {currentPhase} Phase <ChevronDown size={12} />
          </button>
          <button
            onClick={onNextPhase}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Next Phase (Spacebar)"
          >
            <ChevronRight size={13} />
          </button>

          {/* Phase Quick-Jump Dropdown Menu */}
          {showPhaseQuickJump && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                background: 'var(--bg-surface-elevated, #1e293b)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                padding: '10px',
                zIndex: 60,
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
                minWidth: '240px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#f59e0b',
                  }}
                >
                  Phase Quick-Jump
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Spacebar: Next
                </span>
              </div>

              {/* Round Selector */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '3px',
                  }}
                >
                  Round:
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onJumpPhase?.(
                          r,
                          PHASES.indexOf(currentPhase),
                          activePlayerIndex,
                        );
                      }}
                      style={{
                        flex: 1,
                        padding: '3px 0',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border:
                          currentRound === r
                            ? '1px solid #38bdf8'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        background:
                          currentRound === r
                            ? 'rgba(56, 189, 248, 0.25)'
                            : 'rgba(255, 255, 255, 0.04)',
                        color: currentRound === r ? '#38bdf8' : '#e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Player Selector */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '3px',
                  }}
                >
                  Active Turn:
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        onJumpPhase?.(
                          currentRound,
                          PHASES.indexOf(currentPhase),
                          p as 1 | 2,
                        );
                      }}
                      style={{
                        flex: 1,
                        padding: '3px 0',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border:
                          activePlayerIndex === p
                            ? '1px solid #f59e0b'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        background:
                          activePlayerIndex === p
                            ? 'rgba(245, 158, 11, 0.25)'
                            : 'rgba(255, 255, 255, 0.04)',
                        color: activePlayerIndex === p ? '#f59e0b' : '#e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      Player {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase Buttons */}
              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '3px',
                  }}
                >
                  Jump to Phase:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                  }}
                >
                  {PHASES.map((phase, idx) => (
                    <button
                      key={phase}
                      onClick={() => {
                        onJumpPhase?.(currentRound, idx, activePlayerIndex);
                        setShowPhaseQuickJump(false);
                      }}
                      style={{
                        padding: '4px 6px',
                        fontSize: '0.72rem',
                        fontWeight: currentPhase === phase ? 700 : 500,
                        textAlign: 'left',
                        borderRadius: '4px',
                        border:
                          currentPhase === phase
                            ? '1px solid #38bdf8'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        background:
                          currentPhase === phase
                            ? 'rgba(56, 189, 248, 0.2)'
                            : 'rgba(255, 255, 255, 0.03)',
                        color: currentPhase === phase ? '#38bdf8' : '#e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chess Clock Indicator (OB-158) */}
        {isChessClockEnabled &&
          (() => {
            const p1Fmt = formatChessClock(p1ClockSeconds);
            const p2Fmt = formatChessClock(p2ClockSeconds);
            const p1Warn = getClockWarningStatus(p1ClockSeconds);
            const p2Warn = getClockWarningStatus(p2ClockSeconds);

            const getTextColor = (
              warn: string,
              isCurrent: boolean,
              defaultColor: string,
            ) => {
              if (warn === 'overtime') return '#ef4444';
              if (warn === 'danger') return '#ea580c';
              if (warn === 'warning') return '#f59e0b';
              return isCurrent ? defaultColor : 'var(--text-secondary)';
            };

            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: isClockRunning
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(0, 0, 0, 0.25)',
                  border: `1px solid ${isClockRunning ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <Timer
                  size={13}
                  style={{
                    color: isClockRunning ? '#10b981' : 'var(--text-secondary)',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: getTextColor(
                      p1Warn,
                      activePlayerIndex === 1,
                      '#38bdf8',
                    ),
                  }}
                >
                  P1: {p1Fmt.formatted} {p1Fmt.isOvertime ? 'OT' : ''}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>/</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: getTextColor(
                      p2Warn,
                      activePlayerIndex === 2,
                      '#ec4899',
                    ),
                  }}
                >
                  P2: {p2Fmt.formatted} {p2Fmt.isOvertime ? 'OT' : ''}
                </span>
                <button
                  className="btn-icon"
                  style={{ width: '22px', height: '22px' }}
                  onClick={onToggleClock}
                  title={isClockRunning ? 'Pause Clock' : 'Start Clock'}
                >
                  {isClockRunning ? <Pause size={11} /> : <Play size={11} />}
                </button>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '0 2px',
                  }}
                  onClick={onSwitchActivePlayer}
                  title="Pass turn to opponent"
                >
                  Pass Turn
                </button>
                {onToggleChessClockHUD && (
                  <button
                    className="btn-icon"
                    style={{ width: '20px', height: '20px', padding: 0 }}
                    onClick={onToggleChessClockHUD}
                    title="Pop out Floating Chess Clock HUD"
                  >
                    <ExternalLink size={11} />
                  </button>
                )}
                {onToggleChessClockEnabled && (
                  <button
                    className="btn-icon"
                    style={{
                      width: '20px',
                      height: '20px',
                      padding: 0,
                      color: 'var(--text-secondary)',
                    }}
                    onClick={onToggleChessClockEnabled}
                    title="Hide / Disable Chess Clocks"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })()}
      </div>

      <div
        className="top-bar-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Chess Clock Button */}
        {clockEnabled &&
          (onToggleChessClockHUD || onToggleChessClockEnabled) && (
            <button
              className="btn btn-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isChessClockEnabled
                  ? '#10b981'
                  : 'var(--text-secondary)',
                border: `1px solid ${isChessClockEnabled ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.12)'}`,
                background: isChessClockEnabled
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(0, 0, 0, 0.25)',
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
              onClick={() => {
                if (!isChessClockEnabled && onToggleChessClockEnabled) {
                  onToggleChessClockEnabled();
                } else if (onToggleChessClockHUD) {
                  onToggleChessClockHUD();
                }
              }}
              title={
                isChessClockEnabled
                  ? 'Chess Clocks active (Click to toggle HUD)'
                  : 'Enable Match Chess Clocks'
              }
            >
              <Timer size={13} />
              <span className="brawl-topbar-btn-label">Clock</span>
            </button>
          )}

        {/* Scoreboard Button (OB-159) */}
        {scoreboardEnabled && onOpenScoreboard && (
          <button
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'rgba(245, 158, 11, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={onOpenScoreboard}
            title="Open Match Scoreboard (VP, CP, Casualties)"
          >
            <Trophy size={13} />
            <span>
              VP: {p1TotalVp} - {p2TotalVp}
            </span>
          </button>
        )}

        {/* Objectives Button (OB-160) */}
        {objectivesEnabled && onOpenObjectives && (
          <button
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={onOpenObjectives}
            title="Open Objective Markers & Control Zones"
          >
            <Target size={13} />
            <span className="brawl-topbar-btn-label">Objectives</span>
          </button>
        )}

        {/* Deployment & Staging Button (OB-162) */}
        {onOpenStaging && (
          <button
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#a78bfa',
              border: '1px solid rgba(167, 139, 250, 0.35)',
              background: 'rgba(167, 139, 250, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={onOpenStaging}
            title="Open Deployment Zones & Staging Submaps"
          >
            <Compass size={13} />
            <span className="brawl-topbar-btn-label">Deployment</span>
          </button>
        )}

        {/* TO & Spectator Button (OB-163) */}
        {toModeEnabled && onOpenToModal && (
          <button
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color:
                currentRole === 'to'
                  ? '#f59e0b'
                  : currentRole === 'spectator'
                    ? '#38bdf8'
                    : 'var(--text-secondary)',
              border: `1px solid ${currentRole === 'to' ? 'rgba(245, 158, 11, 0.4)' : currentRole === 'spectator' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
              background:
                currentRole === 'to'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : currentRole === 'spectator'
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(0, 0, 0, 0.25)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={onOpenToModal}
            title="Tournament Organizer & Spectator Settings"
          >
            {currentRole === 'spectator' ? (
              <Eye size={13} />
            ) : (
              <Gavel size={13} />
            )}
            <span className="brawl-topbar-btn-label">
              {currentRole === 'to'
                ? 'TO Mode'
                : currentRole === 'spectator'
                  ? 'Spectator'
                  : 'TO / Admin'}
            </span>
          </button>
        )}

        {/* Army Roster Button */}
        {armyRosterEnabled && (
          <button
            className="btn btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderColor: '#b45309',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={onOpenArmyRoster}
            title="Open Army Roster"
          >
            <Shield size={14} /> Army
          </button>
        )}

        {/* Dice Roller Button */}
        {diceRollerEnabled && onOpenDice && (
          <button
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#ec4899',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              background: 'rgba(236, 72, 153, 0.12)',
              padding: '3px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onClick={onOpenDice}
            title="Open Dice Roller"
          >
            <Dices size={13} />
            <span className="brawl-topbar-btn-label">Dice</span>
          </button>
        )}

        {/* Share Room Button */}
        <button
          className="btn-icon"
          onClick={copyInviteLink}
          title={copied ? 'Link Copied!' : 'Copy Room Invite Link'}
          aria-label="Copy Room Invite Link"
          style={{
            color: copied ? '#10b981' : undefined,
            width: '32px',
            height: '32px',
            minWidth: '32px',
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
        </button>

        {/* Feedback Link */}
        <a
          href="https://forms.gle/zD9Rmqj4c3Dffpw39"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-icon"
          title="Send Feedback"
          aria-label="Send Feedback"
          style={{
            textDecoration: 'none',
            width: '32px',
            height: '32px',
            minWidth: '32px',
            flexShrink: 0,
          }}
        >
          <MessageSquareHeart size={16} />
        </a>

        {/* Connected Players */}
        <div
          className="topbar-players-list player-avatars"
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {players.map((p) => {
            const isSelf = p.id === localPlayer?.id;
            return (
              <div
                key={p.id}
                title={`${p.name}${isSelf ? ' (You)' : ''}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: p.color || '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: '#fff',
                  border: isSelf
                    ? '2px solid #fff'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
