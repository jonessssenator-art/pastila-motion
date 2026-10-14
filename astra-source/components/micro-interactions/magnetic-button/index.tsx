import React, { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { MagneticButtonHandle, MagneticButtonProps } from "./types";

const PULL = { damping: 16, stiffness: 240, mass: 0.6, reduceMotion: ReduceMotion.System } as const;
const SNAP = { damping: 9, stiffness: 180, mass: 0.7, reduceMotion: ReduceMotion.System } as const;
const PRESS = { damping: 18, stiffness: 420, mass: 0.5, reduceMotion: ReduceMotion.System } as const;

export const MagneticButton = forwardRef<MagneticButtonHandle, MagneticButtonProps>(function MagneticButton(
  {
    label = "Нажми",
    children,
    onPress,
    width = 180,
    height = 60,
    radius = 20,
    range = 70,
    strength = 0.35,
    contentStrength = 0.18,
    pressScale = 0.93,
    haptics = true,
    color = "#f5f2ef",
    textColor = "#0a0a0a",
    disabled = false,
    style,
    textStyle,
  },
  ref,
) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const centerX = width / 2 + range;
  const centerY = height / 2 + range;

  const fire = useCallback(() => onPress?.(), [onPress]);

  const tick = useCallback(() => {
    if (haptics && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, [haptics]);

  useImperativeHandle(
    ref,
    () => ({
      attract: (px: number, py: number) => {
        x.value = withSpring(px * strength, PULL);
        y.value = withSpring(py * strength, PULL);
      },
      release: () => {
        x.value = withSpring(0, SNAP);
        y.value = withSpring(0, SNAP);
      },
    }),
    [strength, x, y],
  );

  const gesture = useMemo(() => {
    const pull = (px: number, py: number) => {
      "worklet";
      x.value = withSpring((px - centerX) * strength, PULL);
      y.value = withSpring((py - centerY) * strength, PULL);
    };
    const release = () => {
      "worklet";
      x.value = withSpring(0, SNAP);
      y.value = withSpring(0, SNAP);
    };
    const inside = (px: number, py: number) => {
      "worklet";
      return Math.abs(px - centerX) <= width / 2 + 8 && Math.abs(py - centerY) <= height / 2 + 8;
    };
    const hover = Gesture.Hover()
      .enabled(!disabled)
      .onBegin((event) => pull(event.x, event.y))
      .onUpdate((event) => pull(event.x, event.y))
      .onFinalize(release);
    const drag = Gesture.Pan()
      .enabled(!disabled)
      .minDistance(0)
      .onBegin((event) => pull(event.x, event.y))
      .onUpdate((event) => pull(event.x, event.y))
      .onFinalize(release);
    const tap = Gesture.Tap()
      .enabled(!disabled)
      .maxDistance(range)
      .onBegin((event) => {
        if (!inside(event.x, event.y)) return;
        scale.value = withSpring(pressScale, PRESS);
        scheduleOnRN(tick);
      })
      .onEnd((event) => {
        if (inside(event.x, event.y)) scheduleOnRN(fire);
      })
      .onFinalize(() => {
        scale.value = withSpring(1, SNAP);
      });
    return Gesture.Simultaneous(hover, drag, tap);
  }, [centerX, centerY, disabled, fire, height, pressScale, range, scale, strength, tick, width, x, y]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => {
    const k = strength > 0 ? contentStrength / strength : 0;
    return { transform: [{ translateX: x.value * k }, { translateY: y.value * k }] };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[{ padding: range }, style]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        <Animated.View style={[styles.button, { width, height, borderRadius: radius, backgroundColor: color, opacity: disabled ? 0.5 : 1 }, buttonStyle]}>
          <Animated.View style={[styles.content, contentStyle]}>
            {children ?? <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>}
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

export type { MagneticButtonHandle, MagneticButtonProps } from "./types";

const styles = StyleSheet.create({
  button: { alignItems: "center", justifyContent: "center" },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 16, fontWeight: "600", letterSpacing: -0.2 },
});

