import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useSettings } from '../stores/settings';

let dropPlayer: AudioPlayer | null = null;

export async function playDropSound() {
  const enabled = useSettings.getState().soundEnabled;
  if (!enabled) return;
  try {
    if (!dropPlayer) {
      dropPlayer = createAudioPlayer(require('../assets/sounds/drop.wav'));
    }
    dropPlayer.seekTo(0);
    dropPlayer.play();
  } catch {
    // silent fail — sound is non-critical
  }
}
