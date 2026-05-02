import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getUserAgent } from "@/lib/deviceId";

interface Ctx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  deviceUntrusted: boolean;
  clearUntrusted: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Ctx | undefined>(undefined);

const SESSION_DAYS = 30;

export const trustCurrentDevice = async (userId: string) => {
  const deviceId = getDeviceId();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await supabase.from("trusted_devices").upsert(
    {
      user_id: userId,
      device_id: deviceId,
      user_agent: getUserAgent(),
      last_seen_at: new Date().toISOString(),
      expires_at: expires,
    },
    { onConflict: "user_id,device_id" }
  );
};

const isDeviceTrusted = async (userId: string): Promise<boolean> => {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("trusted_devices")
    .select("id, expires_at")
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error || !data) return false;
  if (new Date(data.expires_at).getTime() <= Date.now()) return false;
  await supabase
    .from("trusted_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id);
  return true;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceUntrusted, setDeviceUntrusted] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (!s?.user) return;
      const userId = s.user.id;

      // Defer DB calls to avoid deadlocks inside the auth callback
      setTimeout(async () => {
        if (event === "SIGNED_IN") {
          // Fresh sign-in (password or OAuth) → mark device as trusted
          await trustCurrentDevice(userId);
          setDeviceUntrusted(false);
        } else if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
          // Restored session → must validate device
          const ok = await isDeviceTrusted(userId);
          if (!ok) {
            setDeviceUntrusted(true);
            await supabase.auth.signOut();
          }
        }
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const userId = session?.user?.id;
    const deviceId = getDeviceId();
    if (userId) {
      await supabase
        .from("trusted_devices")
        .delete()
        .eq("user_id", userId)
        .eq("device_id", deviceId);
    }
    await supabase.auth.signOut();
  };

  const clearUntrusted = () => setDeviceUntrusted(false);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, deviceUntrusted, clearUntrusted, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
