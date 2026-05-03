import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WS_URL } from "./config";

export type Notif = {
  id: string;
  contenu: string;
  type_notif: string;
  at: number;
  read: boolean;
};

type NotifCtx = {
  notifs: Notif[];
  unread: number;
  markAllRead: () => void;
};

const NotifContext = createContext<NotifCtx>({
  notifs: [],
  unread: 0,
  markAllRead: () => {},
});

export function NotifProvider({ children }: { children: ReactNode }) {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    async function connect() {
      const token = await AsyncStorage.getItem("token");
      if (!token || !isMounted) return;

      const url = `${WS_URL}/api/ws?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "notification") {
            const n: Notif = {
              id: `${Date.now()}-${Math.random()}`,
              contenu: data.contenu ?? "",
              type_notif: data.type_notif ?? "message",
              at: Date.now(),
              read: false,
            };
            if (isMounted) setNotifs((prev) => [n, ...prev].slice(0, 50));
          }
        } catch {}
      };

      ws.onclose = () => {
        if (isMounted) {
          retryTimeout = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      wsRef.current?.close();
    };
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotifContext.Provider value={{ notifs, unread, markAllRead }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifs() {
  return useContext(NotifContext);
}
