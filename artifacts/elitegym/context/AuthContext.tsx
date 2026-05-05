import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const val = await AsyncStorage.getItem("elitegym_user");
        if (val) {
          setUser(JSON.parse(val));
        }
      } catch (error) {
        console.error("❌ Erreur chargement user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // ✅ Fonction de connexion (MANQUANTE - À AJOUTER)
  const login = async (data: any) => {
    const userData: User = {
      id: data.id,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      token: data.token,
      email: data.email,
      telephone: data.telephone,
      id_membre: data.id_membre,
      id_coach: data.id_coach,
    };
    await AsyncStorage.setItem("elitegym_user", JSON.stringify(userData));
    setUser(userData);
  };

  // Fonction de mise à jour du profil
  const updateUser = async (patch: Partial<User>) => {
    const updated = { ...user, ...patch } as User;
    await AsyncStorage.setItem("elitegym_user", JSON.stringify(updated));
    setUser(updated);
  };

  // Fonction de déconnexion
  const logout = async () => {
    console.log("🧹 [AuthContext] Début logout");
    try {
      await AsyncStorage.removeItem("elitegym_user");
      console.log("🗑️ [AuthContext] elitegym_user supprimé");
      setUser(null);
      console.log("👤 [AuthContext] user mis à null");
    } catch (error) {
      console.error("❌ [AuthContext] Erreur logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}