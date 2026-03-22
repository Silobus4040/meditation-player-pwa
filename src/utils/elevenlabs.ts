// Direct client-side calls to ElevenLabs API
const API_BASE = 'https://api.elevenlabs.io';
const API_KEY = 'sk_e56c8b3576c15dbcc1fe9554166afdcf63cffd1b88a7187a';

function getHeaders(): Record<string, string> {
  return { 'xi-api-key': API_KEY };
}

function jsonHeaders(): Record<string, string> {
  return { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' };
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
