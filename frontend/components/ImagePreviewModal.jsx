import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView, PinchGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ImagePreviewModal({ visible, imageUrl, title, onClose }) {
  const pinchRef = useRef(null);
  const doubleTapRef = useRef(null);

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scaleValueRef = useRef(1);

  const hintOpacity = useRef(new Animated.Value(0)).current;
  const [layoutReady, setLayoutReady] = useState(false);

  const animatedScale = Animated.multiply(baseScale, pinchScale);

  const resetScale = useCallback(() => {
    scaleValueRef.current = 1;
    baseScale.setValue(1);
    pinchScale.setValue(1);
  }, [baseScale, pinchScale]);

  // const animateToScale = (nextScale) => {
  //   const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  //   scaleValueRef.current = clampedScale;
  //   Animated.spring(baseScale, {
  //     toValue: clampedScale,
  //     useNativeDriver: true,
  //     friction: 8,
  //     tension: 70,
  //   }).start(() => {
  //     pinchScale.setValue(1);
  //   });
  // };

  const animateToScale = (targetScale, currentTotalScale) => {
    const clampedScale = clamp(targetScale, MIN_SCALE, MAX_SCALE);
    if (currentTotalScale !== undefined) {
      baseScale.setValue(currentTotalScale);
    }
    pinchScale.setValue(1);
    scaleValueRef.current = clampedScale;

    Animated.spring(baseScale, {
      toValue: clampedScale,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  };

  useEffect(() => {
    if (visible) {
      resetScale();
      setLayoutReady(false);

      hintOpacity.setValue(1);
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 500,
        delay: 1800,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, imageUrl, hintOpacity, resetScale]);

  const handlePinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const handlePinchStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      const currentTotalScale = scaleValueRef.current * nativeEvent.scale;
      animateToScale(currentTotalScale, currentTotalScale);
    }
  };

  const handleDoubleTap = () => {
    const targetScale = scaleValueRef.current > 1 ? 1 : DOUBLE_TAP_SCALE;
    animateToScale(targetScale);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <View
          style={{
            paddingTop: 56,
            paddingHorizontal: 20,
            paddingBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '800',
              flex: 1,
              paddingRight: 12,
            }}
          >
            {title || 'Image preview'}
          </Text>

          <Pressable
            onPress={onClose}
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="x" size={21} color="#fff" />
          </Pressable>
        </View>

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 110,
            alignSelf: 'center',
            zIndex: 20,
            backgroundColor: 'rgba(0,0,0,0.45)',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            opacity: hintOpacity,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
            Pinch or double-tap to zoom
          </Text>
        </Animated.View>

        <View
          style={{ flex: 1, padding: 16 }}
          onLayout={() => setLayoutReady(true)}
        >
          <TapGestureHandler
            ref={doubleTapRef}
            numberOfTaps={2}
            maxDelayMs={250}
            onActivated={handleDoubleTap}
            waitFor={pinchRef}
          >
            <Animated.View style={{ flex: 1 }}>
              <PinchGestureHandler
                ref={pinchRef}
                onGestureEvent={handlePinchEvent}
                onHandlerStateChange={handlePinchStateChange}
                simultaneousHandlers={doubleTapRef}
              >
                <Animated.View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: layoutReady ? 1 : 0,
                  }}
                >
                  {imageUrl ? (
                    <Animated.View
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: [{ scale: animatedScale }],
                      }}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 18,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                        }}
                        contentFit="contain"
                        transition={150}
                      />
                    </Animated.View>
                  ) : null}
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
