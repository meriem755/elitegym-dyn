import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, TextInput, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const data = await api.get(`/messages/${user.id}`);
      setNotifications(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    try {
      await api.post("/messages", {
        id_util: user.id,
        contenu: message,
        type_notif: "message",
      });
      setMessage("");
      Alert.alert("Succès", "Message envoyé");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
    finally { setSending(false); }
  };

  const typeColors: Record<string, string> = {
    message: colors.primary,
    reservation: "#10b981",
    paiement: "#f59e0b",
    notification: colors.secondary,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Platform.OS === "web" ? 90 : insets.top + 16, paddingBottom: 120 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Messages & Notifications</Text>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bell" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucun message</Text>
          </View>
        ) : (
          notifications.map((n: any) => {
            const clr = typeColors[n.type_notif] || colors.primary;
            return (
              <View key={n.id_notification} style={[styles.notifCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.notifDot, { backgroundColor: clr }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifContent, { color: colors.foreground }]}>{n.contenu}</Text>
                  <Text style={[styles.notifDate, { color: colors.mutedForeground }]}>
                    {new Date(n.date_envoi).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[
        styles.inputBar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === "web" ? 20 : insets.bottom + 8,
        }
      ]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.mutedForeground}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !message.trim()}
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: (sending || !message.trim()) ? 0.5 : 1 }]}
        >
          <Feather name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: "800" },
  empty: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyText: { fontSize: 15 },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  notifDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  notifContent: { fontSize: 14, lineHeight: 20 },
  notifDate: { fontSize: 12, marginTop: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
