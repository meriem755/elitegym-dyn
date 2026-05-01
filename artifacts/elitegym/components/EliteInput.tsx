import React from "react";
import { TextInput, Text, View, StyleSheet, TextInputProps } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export default function EliteInput({ label, error, style, ...props }: Props) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.border, color: colors.foreground },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: { fontSize: 12 },
});
