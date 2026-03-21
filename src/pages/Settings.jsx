import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ExternalLink, Check } from 'lucide-react'
import { AI_PROVIDERS, loadSettings, saveSettings } from '../lib/settings'
import '../styles/settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(loadSettings)
  const [showKeys, setShowKeys] = useState({})
  const [saved, setSaved] = useState(false)

  const activeProvider = AI_PROVIDERS.find(p => p.id === settings.providerId) || AI_PROVIDERS[0]

  function handleProviderChange(providerId) {
    const provider = AI_PROVIDERS.find(p => p.id === providerId)
    setSettings(prev => ({
      ...prev,
      providerId,
      modelId: provider.models[0].id,
    }))
  }

  function handleModelChange(modelId) {
    setSettings(prev => ({ ...prev, modelId }))
  }

  function handleKeyChange(providerId, value) {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [providerId]: value },
    }))
  }

  function handleSave() {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <button className="btn-secondary settings-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">

        {/* AI Provider card */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <h2 className="settings-section-title">AI Line-Item Generation</h2>
            <p className="settings-section-desc">
              API keys are stored only in your browser. They are never sent to any server other than the selected AI provider.
            </p>
          </div>

          {/* Provider selector */}
          <div className="settings-field">
            <label className="field-label">AI Provider</label>
            <div className="settings-provider-grid">
              {AI_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  className={`settings-provider-btn ${settings.providerId === provider.id ? 'active' : ''}`}
                  onClick={() => handleProviderChange(provider.id)}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </div>

          {/* Model selector */}
          <div className="settings-field">
            <label className="field-label">Model</label>
            <select
              className="field-input"
              value={settings.modelId}
              onChange={e => handleModelChange(e.target.value)}
            >
              {activeProvider.models.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>

          {/* API key inputs — one per provider */}
          <div className="settings-field">
            <label className="field-label">API Keys</label>
            <p className="settings-keys-desc">
              Only the key for the active provider is used. You can save keys for multiple providers and switch between them.
            </p>
            <div className="settings-keys-list">
              {AI_PROVIDERS.map(provider => (
                <div key={provider.id} className={`settings-key-row ${settings.providerId === provider.id ? 'active-provider' : ''}`}>
                  <div className="settings-key-label-row">
                    <span className="settings-key-provider-name">{provider.name}</span>
                    {settings.providerId === provider.id && (
                      <span className="settings-active-badge">Active</span>
                    )}
                    <a
                      href={provider.apiKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="settings-key-link"
                    >
                      Get key <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="settings-key-input-row">
                    <input
                      type={showKeys[provider.id] ? 'text' : 'password'}
                      className="field-input settings-key-input"
                      placeholder={provider.apiKeyPlaceholder}
                      value={settings.apiKeys?.[provider.id] || ''}
                      onChange={e => handleKeyChange(provider.id, e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      className="settings-key-toggle"
                      onClick={() => setShowKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      title={showKeys[provider.id] ? 'Hide key' : 'Show key'}
                    >
                      {showKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="settings-save-row">
            <button className="btn-primary settings-save-btn" onClick={handleSave}>
              {saved ? <><Check size={16} /> Saved</> : 'Save Settings'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
