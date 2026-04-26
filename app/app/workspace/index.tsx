import PluginBottomBar from "@/components/PluginBottomBar";
import PluginRenderer from "@/components/PluginRenderer";
import { useConnection } from "@/contexts/ConnectionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { logger } from "@/lib/logger";
import { usePlugins } from "@/plugins";
import { useFocusEffect, useRouter } from "expo-router";
import { useDrawerStatus } from "@react-navigation/drawer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  View,
} from "react-native";


export default function WorkspaceScreen() {
  const { colors } = useTheme();
  const { isLoading, openTab, setActiveTab } = usePlugins();
  const { status, sessionState, error, disconnect } = useConnection();
  const router = useRouter();
  const drawerStatus = useDrawerStatus();

  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const prevSessionStateRef = useRef(sessionState);

  const handleGoHome = useCallback(() => {
    logger.info("workspace", "navigating back to auth after disconnect");
    router.replace("/auth");
    disconnect();
  }, [disconnect, router]);

  useEffect(() => {
    const prev = prevSessionStateRef.current;
    prevSessionStateRef.current = sessionState;

    logger.info("workspace", "screen state updated", {
      prevSessionState: prev,
      status,
      sessionState,
      error,
      isLoading,
      drawerStatus,
    });

    if (prev !== sessionState && (sessionState === "ended" || sessionState === "expired")) {
      Alert.alert(
        'Connection Lost',
        'Your session was disconnected. Run npx lunel-cli again to reconnect.',
        [{ text: 'Home', style: 'destructive', onPress: handleGoHome }],
        { cancelable: false }
      );
    }
  }, [drawerStatus, error, handleGoHome, isLoading, sessionState, status]);

  useEffect(() => {
    if (isLoading) {
      logger.info("workspace", "rendering loading spinner", { status, error });
      return;
    }

    logger.info("workspace", "workspace shell ready", { status, error });
  }, [isLoading, status, error]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        // Keep users in workspace; let default behavior close the drawer if open.
        if (drawerStatus === "open") return false;
        return true;
      });

      return () => sub.remove();
    }, [drawerStatus])
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base }} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <PluginRenderer paddingBottom={0} bottomBarHeight={bottomBarHeight} />
      <View onLayout={(e) => setBottomBarHeight(e.nativeEvent.layout.height)}>
        <PluginBottomBar
          openTab={openTab}
          setActiveTab={setActiveTab}
        />
      </View>
    </View>
  );
}
