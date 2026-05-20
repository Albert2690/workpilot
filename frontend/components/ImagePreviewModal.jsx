import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

export default function ImagePreviewModal({ visible, imageUrl, title, onClose }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (visible) setZoom(1);
  }, [visible, imageUrl]);

  const zoomIn = () => setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))));
  const zoomOut = () => setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))));
  const resetZoom = () => setZoom(1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16, fontWeight: '800', flex: 1, paddingRight: 12 }}>
            {title || 'Image preview'}
          </Text>
          <Pressable
            onPress={onClose}
            style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Feather name="x" size={21} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bouncesZoom
        >
          <View style={{ width: '100%', height: 640, maxHeight: '100%', alignItems: 'center', justifyContent: 'center' }}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 18,
                  transform: [{ scale: zoom }],
                }}
                contentFit="contain"
                transition={150}
              />
            ) : null}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <ZoomButton icon="minus" onPress={zoomOut} disabled={zoom <= 1} />
          <Pressable
            onPress={resetZoom}
            style={{ minWidth: 74, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{Math.round(zoom * 100)}%</Text>
          </Pressable>
          <ZoomButton icon="plus" onPress={zoomIn} disabled={zoom >= 3} />
        </View>
      </View>
    </Modal>
  );
}

function ZoomButton({ icon, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: disabled ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.28)',
        borderWidth: 1,
        borderColor: disabled ? 'rgba(255,255,255,0.08)' : 'rgba(196,149,255,0.36)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name={icon} size={18} color={disabled ? 'rgba(255,255,255,0.35)' : '#fff'} />
    </Pressable>
  );
}
