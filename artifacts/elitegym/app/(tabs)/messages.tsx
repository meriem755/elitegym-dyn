import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNotifs } from "@/lib/notifications";
import { Feather } from "@expo/vector-icons";

const ROLE_LABELS: Record<string, string> = {
  membre: "Membre",
  coach: "Coach",
  administrateur: "Admin",
  gerant: "Gérant",
};

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { markAllRead } = useNotifs();

  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useFocusEffect(
    React.useCallback(() => {
      markAllRead();
      loadContacts();
    }, [])
  );

  useEffect(() => {
    if (selectedContact) loadMessages(selectedContact.id_util);
  }, [selectedContact]);

  const loadContacts = async () => {
    if (!user) return;
    try {
      const data = await api.get(`/chat/contacts/${user.id}`);
      setContacts(data);
    } catch {}
  };

  const loadMessages = async (otherId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.get(`/chat/${user.id}/${otherId}`);
      setMessages(data);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {}
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim() || !user || !selectedContact || sending) return;
    setSending(true);
    try {
      await api.post("/chat", {
        from_id: user.id,
        from_name: `${user.prenom} ${user.nom}`,
        to_id: selectedContact.id_util,
        text: text.trim(),
      });
      setText("");
      await loadMessages(selectedContact.id_util);
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
    setSending(false);
  };

  if (!selectedContact) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 80 : insets.top + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="message-circle" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucun contact disponible</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(c) => String(c.id_util)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedContact(item)}
                style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {item.prenom?.[0]}{item.nom?.[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: colors.foreground }]}>
                    {item.prenom} {item.nom}
                  </Text>
                  <Text style={[styles.contactRole, { color: colors.mutedForeground }]}>
                    {ROLE_LABELS[item.role] || item.role}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.chatHeader, {
        paddingTop: Platform.OS === "web" ? 80 : insets.top + 12,
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
      }]}>
        <TouchableOpacity onPress={() => setSelectedContact(null)} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {selectedContact.prenom?.[0]}{selectedContact.nom?.[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.chatName, { color: colors.foreground }]}>
            {selectedContact.prenom} {selectedContact.nom}
          </Text>
          <Text style={[styles.chatRole, { color: colors.mutedForeground }]}>
            {ROLE_LABELS[selectedContact.role] || selectedContact.role}
          </Text>
        </View>
        <TouchableOpacity onPress={() => loadMessages(selectedContact.id_util)}>
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Commencez la conversation
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.from_id === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                {!mine && (
                  <Text style={[styles.bubbleSender, { color: colors.primary }]}>
                    {item.from_name}
                  </Text>
                )}
                <Text style={[styles.bubbleText, { color: mine ? "#fff" : colors.foreground }]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, { color: mine ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                  {new Date(item.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.inputBar, {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        paddingBottom: Platform.OS === "web" ? 12 : insets.bottom + 8,
      }]}>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.foreground,
          }]}
          placeholder="Message..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={[styles.sendBtn, {
            backgroundColor: colors.primary,
            opacity: (sending || !text.trim()) ? 0.5 : 1,
          }]}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Feather name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800" },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  chatName: { fontSize: 15, fontWeight: "700" },
  chatRole: { fontSize: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  emptyText: { fontSize: 15 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800" },
  contactName: { fontSize: 15, fontWeight: "700" },
  contactRole: { fontSize: 12, marginTop: 2 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    gap: 2,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#E63946",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    borderBottomLeftRadius: 4,
  },
  bubbleSender: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 11, alignSelf: "flex-end", marginTop: 2 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
});
