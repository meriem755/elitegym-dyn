import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";

type BannerType = "warning" | "info" | "success" | "danger";

interface BannerProps {
  message: string;
  type?: BannerType;
  onDismiss?: () => void;
  action?: { label: string; onPress: () => void };
}

const COLORS: Record<BannerType, { bg: string; border: string; text: string; icon: string }> = {
  warning: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", icon: "#f59e0b" },
  info:    { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "#3b82f6" },
  success: { bg: "#dcfce7", border: "#86efac", text: "#14532d", icon: "#10b981" },
  danger:  { bg: "#fef2f2", border: "#fca5a5", text: "#7f1d1d", icon: "#ef4444" },
};

const ICONS: Record<BannerType, string> = {
  warning: "alert-triangle",
  info: "info",
  success: "check-circle",
  danger: "alert-circle",
};

export default function NotifBanner({ message, type = "info", onDismiss, action }: BannerProps) {
  const c = COLORS[type];
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const dismiss = () => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onDismiss?.();
    });
  };

  return (
    <Animated.View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border, opacity }]}>
      <Feather name={ICONS[type] as any} size={16} color={c.icon} style={{ marginTop: 1 }} />
      <Text style={[styles.text, { color: c.text }]}>{message}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={[styles.actionBtn, { borderColor: c.border }]}>
          <Text style={[styles.actionText, { color: c.text }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
      {onDismiss && (
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
          <Feather name="x" size={14} color={c.icon} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "500" },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "center",
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  closeBtn: { padding: 2, alignSelf: "center" },
});
