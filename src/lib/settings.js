const STORAGE_KEY = 'invoicekit_settings'

export const AI_PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Recommended)' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5 (Fast)' },
    ],
    apiKeyLabel: 'Anthropic API Key',
    apiKeyPlaceholder: 'sk-ant-api...',
    apiKeyUrl: 'https://console.anthropic.com/account/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Recommended)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
    ],
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
    ],
    apiKeyLabel: 'Google AI API Key',
    apiKeyPlaceholder: 'AIza...',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'groq',
    name: 'Groq',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Recommended)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
    ],
    apiKeyLabel: 'Groq API Key',
    apiKeyPlaceholder: 'gsk_...',
    apiKeyUrl: 'https://console.groq.com/keys',
  },
]

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {
      providerId: 'anthropic',
      modelId: 'claude-sonnet-4-20250514',
      apiKeys: {}, // { anthropic: 'sk-ant-...', openai: 'sk-...', ... }
    }
  } catch {
    return { providerId: 'anthropic', modelId: 'claude-sonnet-4-20250514', apiKeys: {} }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function getActiveApiKey() {
  const s = loadSettings()
  return s.apiKeys?.[s.providerId] || ''
}

export function getActiveProvider() {
  const s = loadSettings()
  return AI_PROVIDERS.find(p => p.id === s.providerId) || AI_PROVIDERS[0]
}

export function getActiveModel() {
  const s = loadSettings()
  return s.modelId || AI_PROVIDERS[0].models[0].id
}
