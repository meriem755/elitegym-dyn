import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: number;
  nom: string;
  prenom: string;
  role: "administrateur" | "coach" | "membre" | "gerant" | "receptionniste";
  token: string;
  id_membre?: number;
  id_coach?: number;
}

interface AuthContextType {
  user: User | null;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("elitegym_user").then((val) => {
      if (val) setUser(JSON.parse(val));
      setIsLoading(false);
    });
  }, []);

  const login = async (data: any) => {
    const userData: User = {
      id: data.id,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
      token: data.token,
      id_membre: data.id_membre,
      id_coach: data.id_coach,
    };
    await AsyncStorage.setItem("elitegym_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("elitegym_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
