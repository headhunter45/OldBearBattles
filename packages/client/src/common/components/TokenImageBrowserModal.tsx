import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Sparkles, Trash2, Check, User } from 'lucide-react';
import { getAllAssets, StoredAsset } from '../storage/db.js';
import { PRESET_TOKENS, PresetTokenItem } from './TokenPickerModal.js';

interface TokenImageBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, options?: { name?: string; zoom?: number; panX?: number; panY?: number }) => void;
  onRemoveImage?: () => void;
  currentImageUrl?: string;
}

export const TokenImageBrowserModal: React.FC<TokenImageBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  onRemoveImage,
  currentImageUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'saved'>('presets');
  const [search, setSearch] = useState('');
  const [savedAssets, setSavedAssets] = useState<StoredAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getAllAssets()
      .then((assets) => {
        // Filter assets that have valid image dataUrls
        const imageAssets = assets.filter(
          (a) => a.dataUrl && (a.type === 'token' || a.type === 'prop' || a.type === 'tile' || !a.type)
        );
        setSavedAssets(imageAssets);
      })
      .catch((err) => console.warn('Failed to load saved assets:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const q = search.trim().toLowerCase();

  const filteredPresets = PRESET_TOKENS.filter((p) => !q || p.name.toLowerCase().includes(q));
  const filteredSaved = savedAssets.filter((a) => !q || a.name.toLowerCase().includes(q));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
          width: '680px',
          maxWidth: '96vw',
          maxHeight: '85vh',
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
            <ImageIcon size={20} color="#6366f1" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Choose Token Image
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

        {/* Tab & Search Navigation */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid #334155',
            backgroundColor: '#0f172a',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#1e293b', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              style={{
                background: activeTab === 'presets' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'presets' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Preset Tokens ({PRESET_TOKENS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              style={{
                background: activeTab === 'saved' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'saved' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Saved Library ({savedAssets.length})
            </button>
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#fff',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Gallery Content */}
        <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto', minHeight: '260px' }}>
          {activeTab === 'presets' ? (
            <div>
              {filteredPresets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  No preset tokens found matching "{search}".
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {filteredPresets.map((preset) => {
                    const isSelected = currentImageUrl === preset.url;
                    return (
                      <div
                        key={preset.name}
                        onClick={() => {
                          onSelectImage(preset.url, {
                            name: preset.name,
                            zoom: preset.zoom,
                            panX: preset.offsetX,
                            panY: preset.offsetY,
                          });
                          onClose();
                        }}
                        style={{
                          backgroundColor: '#0f172a',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid #334155',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          transition: 'transform 0.15s, border-color 0.15s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = isSelected ? 'var(--accent-primary)' : '#334155')
                        }
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundImage: `url("${preset.url}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                          }}
                        />
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            color: '#f8fafc',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                          }}
                          title={preset.name}
                        >
                          {preset.name}
                        </div>
                        {preset.author && (
                          <div
                            style={{
                              fontSize: '0.65rem',
                              color: '#64748b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              textAlign: 'center',
                            }}
                          >
                            by {preset.author.name}
                          </div>
                        )}
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              backgroundColor: 'var(--accent-primary)',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={12} color="#fff" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  Loading saved library...
                </div>
              ) : filteredSaved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                  {search ? `No saved assets found matching "${search}".` : 'No saved token or prop assets found in library.'}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {filteredSaved.map((asset) => {
                    const isSelected = currentImageUrl === asset.dataUrl;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => {
                          onSelectImage(asset.dataUrl, { name: asset.name });
                          onClose();
                        }}
                        style={{
                          backgroundColor: '#0f172a',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid #334155',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          transition: 'transform 0.15s, border-color 0.15s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = isSelected ? 'var(--accent-primary)' : '#334155')
                        }
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: asset.type === 'prop' ? '8px' : '50%',
                            backgroundImage: `url("${asset.dataUrl}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                          }}
                        />
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            color: '#f8fafc',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                          }}
                          title={asset.name}
                        >
                          {asset.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                          }}
                        >
                          {asset.type || 'token'}
                        </div>
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              backgroundColor: 'var(--accent-primary)',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={12} color="#fff" />
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

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #334155',
            backgroundColor: '#0f172a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {onRemoveImage ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onRemoveImage();
                onClose();
              }}
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ef4444',
              }}
            >
              <Trash2 size={14} /> Remove Image (Use Initials Avatar)
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
