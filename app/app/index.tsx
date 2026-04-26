import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConnection } from "@/contexts/ConnectionContext";
import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const [target, setTarget] = useState<"/onboarding" | "/auth" | "/workspace" | null>(null);
  const { getStoredSession, resumeSession, clearStoredSession, status } = useConnection();
  const attemptedResumeRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const chooseInitialRoute = async () => {
      const onboardingDone = await AsyncStorage.getItem("@lunel_onboarding_done");
      if (cancelled) return;

      if (onboardingDone !== "true") {
        setTarget("/onboarding");
        return;
      }

      const storedSession = await getStoredSession();
      if (cancelled) return;

      if (!storedSession) {
        setTarget("/auth");
        return;
      }

      setTarget("/workspace");
      if (attemptedResumeRef.current || status === "connected") return;

      attemptedResumeRef.current = true;
      resumeSession(storedSession).catch(() => {
        void clearStoredSession();
      });
    };

    void chooseInitialRoute();

    return () => {
      cancelled = true;
    };
  }, [clearStoredSession, getStoredSession, resumeSession, status]);

  if (!target) return <View style={{ flex: 1 }} />;
  return <Redirect href={target} />;
}
