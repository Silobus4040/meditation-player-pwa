// Direct client-side calls to ElevenLabs API
// No proxy needed — ElevenLabs supports CORS

const API_BASE = 'https://api.elevenlabs.io';

// API key is stored in localStorage so it persists on your phone
export function getApiKey(): string {
  return localStorage.getItem('elevenlabs_api_key') || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem('elevenlabs_api_key', key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

function getHeaders(): Record<string, string> {
  return { 'xi-api-key': getApiKey() };
}

function jsonHeaders(): Record<string, string> {
  return { 'xi-api-key': getApiKey(), 'Content-Type': 'application/json' };
}

// ── Voices ──
export interface ElevenVoice {
  voice_id: string;
  name: string;
  category: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

export async function fetchVoices(): Promise<ElevenVoice[]> {
  const res = await fetch(`${API_BASE}/v1/voices`, { headers: getHeaders() });
  if (!res.ok) {
    console.error('fetchVoices error:', res.status);
    return [];
  }
  const data = await res.json();
  return data.voices || [];
}

// ── Text-to-Speech ──
export interface TTSOptions {
  text: string;
  voiceId: string;
  modelId?: string;
}

export async function generateTTS(options: TTSOptions): Promise<Blob> {
  const { text, voiceId, modelId = 'eleven_v3' } = options;

  const res = await fetch(
    `${API_BASE}/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ text, model_id: modelId }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TTS failed (${res.status}): ${errText}`);
  }
  return res.blob();
}
