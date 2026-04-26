import AsyncStorage from "@react-native-async-storage/async-storage";
import { SKIP_AUTO_RESUME_ONCE_KEY } from "@/constants/sessionRouting";
import { useConnection } from "@/contexts/ConnectionContext";
import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const { getStoredSession, resumeSession } = useConnection();
  const attemptedResumeRef = useRef(false);
  const [target, setTarget] = useState<"/onboarding" | "/auth" | "/workspace" | null>(null);

  useEffect(() => {
    let cancelled = false;

    const chooseInitialRoute = async () => {
      const onboardingDone = await AsyncStorage.getItem("@lunel_onboarding_done");
      if (cancelled) return;

      if (onboardingDone !== "true") {
        setTarget("/onboarding");
        return;
      }

      const skipAutoResume = await AsyncStorage.getItem(SKIP_AUTO_RESUME_ONCE_KEY);
      if (cancelled) return;

      if (skipAutoResume === "true") {
        await AsyncStorage.removeItem(SKIP_AUTO_RESUME_ONCE_KEY);
        if (!cancelled) setTarget("/auth");
        return;
      }

      const storedSession = await getStoredSession();
      if (cancelled) return;

      if (storedSession?.sessionPassword && !attemptedResumeRef.current) {
        attemptedResumeRef.current = true;
        setTarget("/workspace");
        void resumeSession(storedSession).catch(() => {
          // Workspace owns connection-error UI; avoid an unhandled rejection here.
        });
        return;
      }

      setTarget("/auth");
    };

    void chooseInitialRoute();

    return () => {
      cancelled = true;
    };
  }, [getStoredSession, resumeSession]);

  if (!target) return <View style={{ flex: 1 }} />;
  return <Redirect href={target} />;
}
