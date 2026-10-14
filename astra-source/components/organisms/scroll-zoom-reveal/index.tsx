import React, { memo, useState, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { ScrollZoomRevealProps } from "./types";

const PARALLAX_SPRING = { stiffness: 160, damping: 20, mass: 0.7 };
const REDUCED_SPRING = { stiffness: 2000, damping: 200, mass: 1 };

const useZoomRevealScroll = () => {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  return { scrollY, onScroll };
};

const renderText = (node: ReactNode, style: StyleProp<TextStyle>): ReactNode =>
  typeof node === "string" || typeof node === "number" ? (
    <Text style={style} numberOfLines={1}>
      {node}
    </Text>
  ) : (
    node
  );

const ScrollZoomRevealBase: React.FC<ScrollZoomRevealProps> = ({
  scrollY,
  children,
  leading,
  trailing,
  pillWidth = 72,
  pillHeight = 72,
  radius = 24,
  height,
  stageHeight,
  viewportHeight,
  style,
  frameStyle,
  textStyle,
  leadingStyle,
  trailingStyle,
}) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const reduced = useReducedMotion();
  const stage = stageHeight ?? windowHeight;
  const total = height ?? stage * 3;
  const viewport = viewportHeight ?? stage;
  const range = Math.max(0, total - viewport);
  const travel = Math.max(0, total - stage);
  const offset = useSharedValue(0);
  const [stageWidth, setStageWidth] = useState(windowWidth);
  const spring = reduced ? REDUCED_SPRING : PARALLAX_SPRING;

  const mapped = useDerivedValue(() => {
    const p =
      range > 0
        ? Math.min(1, Math.max(0, (scrollY.value - offset.value) / range))
        : 0;
    return interpolate(p, [0, 0.85], [0, 1], Extrapolation.CLAMP);
  }, [range]);

  const progress = useDerivedValue(
    () => withSpring(mapped.value, spring),
    [spring],
  );

  const pinned = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: Math.min(
            travel,
            Math.max(0, scrollY.value - offset.value),
          ),
        },
      ],
    }),
    [travel],
  );

  const frame = useAnimatedStyle(
    () => ({
      width: pillWidth + progress.value * (stageWidth - pillWidth),
      height: pillHeight + progress.value * (stage - pillHeight),
    }),
    [pillWidth, pillHeight, stageWidth, stage],
  );

  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
  }));

  const onRootLayout = (event: LayoutChangeEvent) => {
    offset.value = event.nativeEvent.layout.y;
  };

  const onStageLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setStageWidth((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
  };

  const text = [styles.text, textStyle];

  return (
    <View
      onLayout={onRootLayout}
      style={[styles.root, { height: total }, style]}
    >
      <Animated.View
        onLayout={onStageLayout}
        style={[styles.stage, { height: stage }, pinned]}
      >
        {leading != null ? (
          <Animated.View style={[styles.side, fade]}>
            <View style={[styles.line, styles.lineEnd]}>
              {renderText(leading, [text, styles.alignRight, leadingStyle])}
            </View>
          </Animated.View>
        ) : null}
        <Animated.View
          style={[styles.frame, { borderRadius: radius }, frameStyle, frame]}
        >
          {children}
        </Animated.View>
        {trailing != null ? (
          <Animated.View style={[styles.side, fade]}>
            <View style={[styles.line, styles.lineStart]}>
              {renderText(trailing, [text, styles.alignLeft, trailingStyle])}
            </View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
  },
  stage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    overflow: "hidden",
  },
  side: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 36,
  },
  line: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1200,
    justifyContent: "center",
  },
  lineEnd: {
    right: 0,
    alignItems: "flex-end",
  },
  lineStart: {
    left: 0,
    alignItems: "flex-start",
  },
  frame: {
    flexShrink: 0,
    overflow: "hidden",
  },
  text: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "600",
    letterSpacing: -1.2,
    color: "#f4f4f5",
  },
  alignRight: {
    textAlign: "right",
  },
  alignLeft: {
    textAlign: "left",
  },
});

const ScrollZoomReveal: React.NamedExoticComponent<ScrollZoomRevealProps> =
  memo<ScrollZoomRevealProps>(ScrollZoomRevealBase);

export { ScrollZoomReveal, ScrollZoomRevealBase, useZoomRevealScroll };
export type { ScrollZoomRevealProps } from "./types";
export default ScrollZoomReveal;

