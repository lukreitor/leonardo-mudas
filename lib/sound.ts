import { useSettings } from '../stores/settings';

export async function playDropSound() {
  const enabled = useSettings.getState().soundEnabled;
  if (!enabled) return;
  // Som gota d'água desabilitado por enquanto — precisaria asset local.
  // Haptic medium já roda no onTap do FarmCard como confirmação tátil.
  // Future: ship .wav de gota em assets/sounds/ e usar expo-audio com require()
}
