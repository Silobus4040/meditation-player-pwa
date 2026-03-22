import { set, get } from 'idb-keyval';

export interface AudioTrack {
  id: string; // The file name can act as the ID
  name: string;
  file: File;
  duration?: number;
}

const STORAGE_KEY = 'meditation_tracks';

// Load all tracks
export async function loadTracks(): Promise<AudioTrack[]> {
  try {
    const data = await get<AudioTrack[]>(STORAGE_KEY);
    return data || [];
  } catch (err) {
    console.error('Failed to load tracks from IDB', err);
    return [];
  }
}

// Save all tracks (overwrites existing)
export async function saveTracks(tracks: AudioTrack[]): Promise<void> {
  try {
    await set(STORAGE_KEY, tracks);
  } catch (err) {
    console.error('Failed to save tracks to IDB', err);
  }
}

// Add a single track or multiple tracks
export async function addTracksToDB(newTracks: AudioTrack[]): Promise<AudioTrack[]> {
  const existing = await loadTracks();
  // Filter out duplicates based on id/name
  const map = new Map(existing.map(t => [t.id, t]));
  for (const track of newTracks) {
    map.set(track.id, track);
  }
  const updated = Array.from(map.values());
  await saveTracks(updated);
  return updated;
}

// Delete a single track
export async function removeTrack(id: string): Promise<AudioTrack[]> {
  const existing = await loadTracks();
  const updated = existing.filter(t => t.id !== id);
  await saveTracks(updated);
  return updated;
}
