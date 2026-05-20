import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { NoteWithMedia } from '@/services/notes';

const KIND_META: Record<string, { color: string; icon: string }> = {
  growth: { color: colors.broto, icon: 'leaf-outline' },
  water: { color: '#5C8C7D', icon: 'water-outline' },
  soil: { color: '#8B6F47', icon: 'flower-outline' },
  talk: { color: colors.manga, icon: 'mic-outline' },
  other: { color: colors.broto, icon: 'ellipse-outline' },
};

export function NoteBlock({ note, onPress }: { note: NoteWithMedia; onPress?: () => void }) {
  const meta = KIND_META[note.kind ?? 'other'];
  const time = note.createdAt ? format(parseISO(note.createdAt), 'HH:mm') : '';

  const photos = note.media.filter((m) => m.type === 'photo');
  const videos = note.media.filter((m) => m.type === 'video');
  const audios = note.media.filter((m) => m.type === 'audio');

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderLeftColor: meta.color }]}>
      <View style={styles.head}>
        <View style={styles.titleWrap}>
          <View style={[styles.iconPill, { backgroundColor: hexAlpha(meta.color, 0.15) }]}>
            <Ionicons name={meta.icon as any} size={13} color={meta.color} />
          </View>
          <Text style={styles.title}>{note.title ?? 'Anotação'}</Text>
        </View>
        <Text style={styles.time}>{time}</Text>
      </View>

      {photos.length + videos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaRow}>
          {[...photos, ...videos].slice(0, 8).map((m, i) => (
            <View key={m.id} style={styles.thumb}>
              {m.type === 'photo' ? (
                <Image source={{ uri: m.filePath }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, styles.videoBg]}>
                  <View style={styles.playOverlay}>
                    <Ionicons name="play" size={14} color={colors.mata} />
                  </View>
                </View>
              )}
              {i === 7 && note.media.length > 8 ? (
                <View style={styles.moreBadge}>
                  <Text style={styles.moreText}>+{note.media.length - 8}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      {audios.map((a) => (
        <View key={a.id} style={styles.audioRow}>
          <View style={styles.audioPlay}>
            <Ionicons name="play" size={10} color="white" />
          </View>
          <View style={styles.miniWave}>
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: 6 + Math.sin(i * 0.7) * 4 + Math.abs(Math.sin(i * 1.3)) * 6 },
                ]}
              />
            ))}
          </View>
          <Text style={styles.audioTime}>
            {a.durationSec ? formatDuration(a.durationSec) : '0:00'}
          </Text>
        </View>
      ))}

      {note.noteText ? <Text style={styles.body}>“{note.noteText}”</Text> : null}
    </Pressable>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neblina,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(26,58,46,0.04)',
    borderLeftWidth: 3,
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconPill: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink1, letterSpacing: -0.2 },
  time: { fontFamily: fonts.uiSemibold, fontSize: 11, color: colors.ink3 },
  mediaRow: { gap: 6, marginBottom: 10 },
  thumb: { width: 74, height: 74, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.papelWarm },
  videoBg: { backgroundColor: '#5C8C7D', alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreBadge: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreText: { color: 'white', fontFamily: fonts.displayBold, fontSize: 18 },
  audioRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: 'rgba(232,160,76,0.1)',
    borderRadius: 12,
    marginBottom: 10,
  },
  audioPlay: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.manga,
    alignItems: 'center', justifyContent: 'center',
  },
  miniWave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 1.5, height: 22 },
  waveBar: { width: 2, backgroundColor: colors.mangaDeep, opacity: 0.6, borderRadius: 1 },
  audioTime: { fontFamily: fonts.uiSemibold, fontSize: 11, color: colors.ink2 },
  body: {
    fontFamily: fonts.displayItalic, fontStyle: 'italic',
    fontSize: 14, color: colors.ink1, lineHeight: 22,
  },
});
