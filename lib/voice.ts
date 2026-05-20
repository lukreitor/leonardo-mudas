import * as Speech from 'expo-speech';
import { useSettings } from '../stores/settings';

export async function speakWeekSummary(visited: number, total: number, overdueCount: number): Promise<void> {
  const lines: string[] = [];
  if (total === 0) {
    lines.push('Você ainda não tem fazendas cadastradas');
  } else if (visited === 0) {
    lines.push(`Você tem ${total} fazendas para visitar essa semana`);
  } else if (visited === total) {
    lines.push(`Parabéns! Você visitou todas as ${total} fazendas essa semana`);
  } else {
    lines.push(`Você visitou ${visited} de ${total} fazendas essa semana`);
    const missing = total - visited;
    lines.push(`Faltam ${missing} ${missing === 1 ? 'fazenda' : 'fazendas'}`);
  }
  if (overdueCount > 0) {
    lines.push(`${overdueCount} ${overdueCount === 1 ? 'pagamento atrasado' : 'pagamentos atrasados'}`);
  }

  Speech.stop();
  await Speech.speak(lines.join('. ') + '.', {
    language: 'pt-BR',
    rate: 1,
    pitch: 1,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
