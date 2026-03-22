import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Repeat, Repeat1,
  ListMusic, Sparkles, Loader2, ChevronDown, Volume2, X
} from 'lucide-react';
import { fetchVoices, generateTTS, type ElevenVoice } from './utils/elevenlabs';

type RepeatMode = 'none' | 'all' | 'one';

interface QueueTrack {
  id: string;
  name: string;
  text: string;
  audioUrl: string;
}

export default function App() {
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');

  const [voices, setVoices] = useState<ElevenVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [verseText, setVerseText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchVoices()
      .then((v) => {
        setVoices(v);
        if (v.length > 0) setSelectedVoiceId(v[0].voice_id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (currentIndex !== null && queue[currentIndex]) {
      const track = queue[currentIndex];
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [currentIndex, queue]);

  async function handleGenerate() {
    if (!verseText.trim() || !selectedVoiceId) return;
    setGenerating(true);
    try {
      const blob = await generateTTS({ text: verseText, voiceId: selectedVoiceId });
      const url = URL.createObjectURL(blob);
      const track: QueueTrack = {
        id: `gen-${Date.now()}`,
        name: verseText.length > 80 ? verseText.slice(0, 80) + '…' : verseText,
        text: verseText,
        audioUrl: url,
      };
      const newQueue = [...queue, track];
      setQueue(newQueue);
      setCurrentIndex(newQueue.length - 1);
      setVerseText('');
    } catch (err) {
      console.error('TTS generation error', err);
      alert('Failed to generate audio. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function togglePlay() {
    if (!audioRef.current || currentIndex === null) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  }

  function playNext() {
    if (queue.length === 0 || currentIndex === null) return;
    if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1);
    else if (repeatMode === 'all') setCurrentIndex(0);
    else { setIsPlaying(false); setProgress(0); }
  }

  function playPrev() {
    if (queue.length === 0 || currentIndex === null) return;
    if (progress > 3 && audioRef.current) { audioRef.current.currentTime = 0; return; }
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else if (repeatMode === 'all') setCurrentIndex(queue.length - 1);
  }

  function toggleRepeat() {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    setRepeatMode(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
  }

  function removeFromQueue(index: number) {
    const updated = queue.filter((_, i) => i !== index);
    setQueue(updated);
    if (currentIndex === index) {
      if (updated.length === 0) {
        setCurrentIndex(null); setIsPlaying(false); setProgress(0); setDuration(0);
        if (audioRef.current) audioRef.current.pause();
      } else { setCurrentIndex(Math.min(index, updated.length - 1)); }
    } else if (currentIndex !== null && index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function onTimeUpdate() {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  }
  function onEnded() {
    if (repeatMode === 'one' && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
    else { playNext(); }
  }
  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setProgress(v);
    if (audioRef.current) audioRef.current.currentTime = v;
  }
  function formatTime(t: number) {
    if (isNaN(t)) return '0:00';
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  }

  const currentTrack = currentIndex !== null ? queue[currentIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0c1222] to-[#0a0f1e] text-slate-100 flex flex-col font-sans select-none">
      {/* Header */}
      <header className="px-5 pt-14 pb-5 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white leading-tight">Meditation Player</h1>
              <p className="text-[11px] text-slate-500 tracking-wide">Bible Verses · ElevenLabs v3</p>
            </div>
          </div>
          {queue.length > 0 && (
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                showQueue
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              {queue.length}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 pb-52 overflow-y-auto">
        {/* Queue Panel */}
        {showQueue && queue.length > 0 && (
          <div className="mt-5 mb-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Queue</h2>
            <div className="space-y-2">
              {queue.map((track, i) => {
                const isActive = i === currentIndex;
                return (
                  <div key={track.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      isActive ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                    }`}
                    onClick={() => setCurrentIndex(i)}>
                    <span className={`text-xs font-bold tabular-nums w-6 text-center ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className={`text-sm truncate flex-1 ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>{track.name}</p>
                    {isActive && isPlaying && (
                      <div className="flex gap-0.5 items-end h-3.5 mr-1">
                        <span className="w-0.5 bg-indigo-400 rounded-full animate-pulse" style={{ height: '40%' }} />
                        <span className="w-0.5 bg-indigo-400 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                        <span className="w-0.5 bg-indigo-400 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '300ms' }} />
                      </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                      className="p-1.5 text-slate-600 hover:text-red-400 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generate */}
        <div className="mt-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Generate Bible Verse
          </h2>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Voice</label>
            <div className="relative">
              <select value={selectedVoiceId} onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full appearance-none bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-10">
                {voices.length === 0 && <option value="">Loading voices...</option>}
                {voices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.category})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Bible Verse Text</label>
            <textarea value={verseText} onChange={(e) => setVerseText(e.target.value)}
              placeholder={"Enter a Bible verse for meditation...\n\ne.g. Psalm 23:1 — The Lord is my shepherd; I shall not want."}
              rows={6}
              className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 leading-relaxed" />
            <p className="text-[10px] text-slate-600 mt-1 text-right">{verseText.length} / 5,000</p>
          </div>

          <button onClick={handleGenerate}
            disabled={generating || !verseText.trim() || !selectedVoiceId}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Audio</>
            )}
          </button>
        </div>
      </main>

      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} onLoadedMetadata={onTimeUpdate} />

      {/* Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 sm:pb-4 pt-2">
          <div className="max-w-lg mx-auto bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
            <p className="text-center text-xs text-slate-300 font-medium truncate mb-3 px-2">{currentTrack.name}</p>
            <div className="relative w-full h-1.5 mb-1">
              <input type="range" min="0" max={duration || 100} value={progress} onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full" />
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[width] duration-200"
                  style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-4 px-0.5 tabular-nums">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="flex justify-center items-center gap-5">
              <button onClick={toggleRepeat}
                className={`p-2 rounded-full transition-colors ${repeatMode !== 'none' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}>
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
              <button onClick={playPrev} className="p-2.5 text-slate-300 hover:text-white transition-colors active:scale-90">
                <SkipBack className="w-6 h-6 fill-current" />
              </button>
              <button onClick={togglePlay}
                className="w-14 h-14 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 text-white rounded-full transition-transform hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(99,102,241,0.35)]">
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-0.5" />}
              </button>
              <button onClick={playNext} className="p-2.5 text-slate-300 hover:text-white transition-colors active:scale-90">
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
              <div className="w-9 h-9 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-800/80 rounded-full border border-slate-700/50 tabular-nums">
                {currentIndex !== null ? `${currentIndex + 1}/${queue.length}` : '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
