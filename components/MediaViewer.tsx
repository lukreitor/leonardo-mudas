import { Modal, View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  type: 'photo' | 'video' | null;
  uri: string | null;
  onDelete?: () => void;
};

function VideoContent({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return (
    <VideoView
      style={styles.media}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      contentFit="contain"
      nativeControls
    />
  );
}

export function MediaViewer({ visible, onDismiss, type, uri, onDelete }: Props) {
  if (!visible || !uri || !type) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <View style={styles.topBar}>
          <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color="white" />
          </Pressable>
          {onDelete ? (
            <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text style={styles.deleteText}>Apagar</Text>
            </Pressable>
          ) : null}
        </View>

        {type === 'photo' ? (
          <Image source={{ uri }} style={styles.media} resizeMode="contain" />
        ) : (
          <VideoContent uri={uri} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220,53,69,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  deleteText: { color: 'white', fontFamily: fonts.uiSemibold, fontSize: 13 },
  media: { width: '100%', height: '100%' },
});
