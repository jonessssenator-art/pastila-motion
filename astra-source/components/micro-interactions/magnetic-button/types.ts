import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export interface MagneticButtonProps {
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  width?: number;
  height?: number;
  radius?: number;
  range?: number;
  strength?: number;
  contentStrength?: number;
  pressScale?: number;
  haptics?: boolean;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface MagneticButtonHandle {
  attract: (x: number, y: number) => void;
  release: () => void;
}

