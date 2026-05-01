import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Accueil</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="planning">
        <Icon sf={{ default: "calendar", selected: "calendar.fill" }} />
        <Label>Planning</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="abonnements">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Abonnements</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="coachs">
        <Icon sf={{ default: "person.3", selected: "person.3.fill" }} />
        <Label>Équipe</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="boutique">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>Boutique</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="contact">
        <Icon sf={{ default: "phone", selected: "phone.fill" }} />
        <Label>Contact</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="house" tintColor={color} size={22} />
            : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: "Planning",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="calendar" tintColor={color} size={22} />
            : <Feather name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="abonnements"
        options={{
          title: "Abonnements",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="creditcard" tintColor={color} size={22} />
            : <Feather name="credit-card" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="coachs"
        options={{
          title: "Équipe",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="person.3" tintColor={color} size={22} />
            : <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="boutique"
        options={{
          title: "Boutique",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="bag" tintColor={color} size={22} />
            : <Feather name="shopping-bag" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: "Contact",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="phone" tintColor={color} size={22} />
            : <Feather name="phone" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="message" tintColor={color} size={22} />
            : <Feather name="message-square" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => isIOS
            ? <SymbolView name="person.circle" tintColor={color} size={22} />
            : <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
