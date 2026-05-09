// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: number;
  nom: string;
  prenom: string;
  role: "administrateur" | "coach" | "membre" | "gerant" | "receptionniste";
  token: string;
  email?: string;
  telephone?: string;
  id_membre?: number;
  id_coach?: number;
}

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const val = await AsyncStorage.getItem("elitegym_user");
        if (val) {
          const parsed = JSON.parse(val);
          setUser(parsed);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (data: any) => {
    const userData: User = {
      id: data.id, nom: data.nom, prenom: data.prenom, role: data.role,
      token: data.token, email: data.email, telephone: data.telephone,
      id_membre: data.id_membre, id_coach: data.id_coach,
    };
    await AsyncStorage.setItem("elitegym_user", JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = async (patch: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...patch } as User;
    await AsyncStorage.setItem("elitegym_user", JSON.stringify(updated));
    setUser(updated);
  };

  const logout = useCallback(async () => {
    console.log("🔐 Logout triggered");
    try {
      await AsyncStorage.multiRemove(["elitegym_user", "token", "elitegym_token"]);
      console.log("🗑️ Storage cleared");
    } catch (e) {
      console.error("❌ Logout storage error:", e);
    } finally {
      setUser(null);
      console.log("✅ User state set to null");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}