import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

interface ScrollZoomRevealProps {
  readonly scrollY: SharedValue<number>;
  readonly children: ReactNode;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
  readonly pillWidth?: number;
  readonly pillHeight?: number;
  readonly radius?: number;
  readonly height?: number;
  readonly stageHeight?: number;
  readonly viewportHeight?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly frameStyle?: StyleProp<ViewStyle>;
  readonly textStyle?: StyleProp<TextStyle>;
  readonly leadingStyle?: StyleProp<TextStyle>;
  readonly trailingStyle?: StyleProp<TextStyle>;
}

export type { ScrollZoomRevealProps };

