import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  disabled?: boolean;
  small?: boolean;
}

export default function EliteButton({ title, onPress, loading, variant = "primary", disabled, small }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bgColor =
    variant === "primary" ? colors.primary :
    variant === "secondary" ? colors.secondary :
    variant === "danger" ? colors.destructive :
    "transparent";

  const borderColor = variant === "outline" ? colors.primary : "transparent";
  const textColor =
    variant === "outline" ? colors.primary :
    variant === "primary" || variant === "secondary" || variant === "danger" ? "#fff" :
    colors.foreground;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        small && styles.small,
        { backgroundColor: bgColor, borderColor, borderWidth: variant === "outline" ? 1.5 : 0 },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, small && styles.smallText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  small: { paddingVertical: 8, paddingHorizontal: 16 },
  text: { fontSize: 16, fontWeight: "700" },
  smallText: { fontSize: 13 },
});
