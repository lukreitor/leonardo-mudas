import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { NoteWithMedia } from '@/services/notes';
import type { Media } from '@/db/schema';

const KIND_META: Record<string, { color: string; icon: string }> = {
  growth: { color: colors.broto, icon: 'leaf-outline' },
  water: { color: '#5C8C7D', icon: 'water-outline' },
  soil: { color: '#8B6F47', icon: 'flower-outline' },
  talk: { color: colors.manga, icon: 'mic-outline' },
  other: { color: colors.broto, icon: 'ellipse-outline' },
};

function AudioRow({ media }: { media: Media }) {
  const player = useAudioPlayer(media.filePath);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;

  const onToggle = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (status?.didJustFinish || (status?.currentTime ?? 0) >= (status?.duration ?? 0)) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const total = status?.duration ?? media.durationSec ?? 0;
  const current = status?.currentTime ?? 0;
  const progress = total > 0 ? current / total : 0;

  return (
    <Pressable onPress={onToggle} style={styles.audioRow}>
      <View style={styles.audioPlay}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={11} color="white" />
      </View>
      <View style={styles.miniWave}>
        {Array.from({ length: 24 }).map((_, i) => {
          const played = i / 24 < progress;
          return (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: 6 + Math.sin(i * 0.7) * 4 + Math.abs(Math.sin(i * 1.3)) * 6,
                  backgroundColor: played ? colors.mata : colors.mangaDeep,
                  opacity: played ? 1 : 0.5,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.audioTime}>
        {formatDuration(current)} / {formatDuration(total)}
      </Text>
    </Pressable>
  );
}

export function NoteBlock({
  note,
  onPress,
  onAddPhoto,
  onAddAudio,
  onAddVideo,
  onAddText,
  onOpenMedia,
  onDeleteMedia,
  onEditText,
}: {
  note: NoteWithMedia;
  onPress?: () => void;
  onAddPhoto?: () => void;
  onAddAudio?: () => void;
  onAddVideo?: () => void;
  onAddText?: () => void;
  onOpenMedia?: (m: Media) => void;
  onDeleteMedia?: (m: Media) => void;
  onEditText?: () => void;
}) {
  const meta = KIND_META[note.kind ?? 'other'];
  const time = note.createdAt ? format(parseISO(note.createdAt), 'HH:mm') : '';

  const photos = note.media.filter((m) => m.type === 'photo');
  const videos = note.media.filter((m) => m.type === 'video');
  const audios = note.media.filter((m) => m.type === 'audio');

  const chips: { label: string; icon: string; onPress?: () => void }[] = [];
  if (onAddPhoto && photos.length === 0) chips.push({ label: 'foto', icon: 'image-outline', onPress: onAddPhoto });
  if (onAddVideo && videos.length === 0) chips.push({ label: 'vídeo', icon: 'videocam-outline', onPress: onAddVideo });
  if (onAddAudio && audios.length === 0) chips.push({ label: 'áudio', icon: 'mic-outline', onPress: onAddAudio });
  if (onAddText && !note.noteText) chips.push({ label: 'texto', icon: 'create-outline', onPress: onAddText });

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
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
          {[...photos, ...videos].map((m) => (
            <Pressable
              key={m.id}
              onPress={() => onOpenMedia?.(m)}
              onLongPress={() => onDeleteMedia?.(m)}
              delayLongPress={500}
              style={styles.thumb}>
              {m.type === 'photo' ? (
                <Image source={{ uri: m.filePath }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, styles.videoBg]}>
                  <View style={styles.playOverlay}>
                    <Ionicons name="play" size={14} color={colors.mata} />
                  </View>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {audios.map((a) => (
        <AudioRow key={a.id} media={a} />
      ))}

      {note.noteText ? (
        <Pressable onPress={onEditText} style={styles.textWrap}>
          <Text style={styles.body}>"{note.noteText}"</Text>
          {onEditText ? (
            <View style={styles.editIcon}>
              <Ionicons name="create-outline" size={11} color={colors.ink3} />
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {chips.length > 0 ? (
        <View style={styles.chipsRow}>
          {chips.map((c) => (
            <Pressable key={c.label} onPress={c.onPress} style={styles.addChip}>
              <Ionicons name={c.icon as any} size={11} color={colors.ink2} />
              <Text style={styles.addChipText}>+ {c.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
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
  waveBar: { width: 2, borderRadius: 1 },
  audioTime: { fontFamily: fonts.uiSemibold, fontSize: 11, color: colors.ink2, fontVariant: ['tabular-nums'] },
  textWrap: { position: 'relative', paddingRight: 24 },
  body: {
    fontFamily: fonts.displayItalic, fontStyle: 'italic',
    fontSize: 14, color: colors.ink1, lineHeight: 22,
  },
  editIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(26,58,46,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(26,58,46,0.1)',
  },
  addChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(26,58,46,0.05)',
    borderRadius: 999,
  },
  addChipText: {
    fontFamily: fonts.uiSemibold, fontSize: 10, color: colors.ink2,
    letterSpacing: 0.2,
  },
});
