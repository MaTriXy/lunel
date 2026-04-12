import { useTheme } from "@/contexts/ThemeContext";
import Toast from "@/components/Toast";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { AlertCircle, ArrowLeft, ArrowRight, Info, LoaderCircle, QrCode, Terminal, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as NavigationBar from "expo-navigation-bar";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConnection } from "../contexts/ConnectionContext";
import ReAnimated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useKeyboardHandler } from "react-native-keyboard-controller";


const TABLET_BREAKPOINT = 768;
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function SwipeableSheet({ visible, onClose, styles, fonts, typography, children }: { visible: boolean; onClose: () => void; styles: any; fonts: any; typography: any; children: (animatedClose: () => void) => React.ReactNode }) {
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const animatedClose = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withTiming(0, { duration: 320 });
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={animatedClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={animatedClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <GestureDetector gesture={pan}>
                <ReAnimated.View style={[styles.modalSheet, animatedStyle]}>
                  <View style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 16 }} />
                  {children(animatedClose)}
                </ReAnimated.View>
              </GestureDetector>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </GestureHandlerRootView>
    </Modal>
  );
}

function CopyableCommand({ command, fonts, colors }: { command: string; fonts: ReturnType<typeof useTheme>["fonts"]; colors: ReturnType<typeof useTheme>["colors"] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const Clipboard = await import("expo-clipboard");
    await Clipboard.setStringAsync(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <View style={{ backgroundColor: colors.bg.raised, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Terminal size={14} color={colors.fg.muted} strokeWidth={2} />
      <Text style={{ fontFamily: fonts.mono.regular, fontSize: 12, color: colors.fg.default, flex: 1 }}>
        {command}
      </Text>
      <Pressable onPress={handleCopy} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
        {copied
          ? <Ionicons name="checkmark" size={14} color={colors.fg.muted} />
          : <Ionicons name="copy-outline" size={14} color={colors.fg.muted} />
        }
      </Pressable>
    </View>
  );
}

const LunelConnect = () => {
  const router = useRouter();
  const { colors, fonts, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    connect,
    status,
    capabilities,
  } = useConnection();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const keyboardHeight = useSharedValue(0);
  const bottomInset = insets.bottom;

  useKeyboardHandler(
    {
      onMove: e => {
        'worklet'
        keyboardHeight.value = e.height;
      },
      onEnd: e => {
        'worklet'
        keyboardHeight.value = e.height;
      },
    },
    [],
  );

  const lowerAnimatedStyle = useAnimatedStyle(() => ({
    bottom: Math.max(0, keyboardHeight.value - bottomInset),
  }));

  const hasActiveConnectAttemptRef = useRef(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const cornerBeat = useRef(new Animated.Value(0)).current;
  const loaderRotation = useRef(new Animated.Value(0)).current;

  const cornerOut = cornerBeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 7],
  });
  const cornerOutNeg = cornerBeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });
  const cornerScale = cornerBeat.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(BLACK);
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && !hasRequestedPermission) {
      requestPermission();
      setHasRequestedPermission(true);
    }
  }, [permission, requestPermission, hasRequestedPermission]);

  useEffect(() => {
    if (status === "connected" && capabilities) {
      router.replace("/workspace");
    }
  }, [status, capabilities, router]);

  useEffect(() => {
    const beatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerBeat, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cornerBeat, {
          toValue: 0,
          duration: 650,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    beatLoop.start();
    return () => beatLoop.stop();
  }, [cornerBeat]);

  useEffect(() => {
    if (isConnecting) {
      const loop = Animated.loop(
        Animated.timing(loaderRotation, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    } else {
      loaderRotation.setValue(0);
    }
  }, [isConnecting, loaderRotation]);

  const loaderSpin = loaderRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isConnecting || hasActiveConnectAttemptRef.current) return;
    setManualCode(data);
    handleConnectWithCode(data);
  };

  const handleConnectWithCode = async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setToastMessage("Please enter a connection code.");
      setToastVisible(true);
      return;
    }
    hasActiveConnectAttemptRef.current = true;
    setIsConnecting(true);
    setError(null);
    try {
      await connect(trimmedCode);
      hasActiveConnectAttemptRef.current = false;
    } catch (err) {
      hasActiveConnectAttemptRef.current = false;
      setError(err instanceof Error ? err.message : "Connection failed");
      setToastMessage("Something went wrong, please try again.");
      setToastVisible(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = () => {
    handleConnectWithCode(manualCode);
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: BLACK }} />;
  }

  const isButtonDisabled = !manualCode.trim() || isConnecting;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>

      {/* Upper — Camera */}
      <View style={styles.upper}>
        {permission.granted && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={
              isConnecting ? undefined : handleBarCodeScanned
            }
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={26} color={WHITE} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Learn how to connect button */}
        <View style={styles.cliHintRow}>
          <TouchableOpacity
            style={styles.learnButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowGuide(true);
            }}
            activeOpacity={0.8}
          >
            <Info size={16} color={WHITE} strokeWidth={2} />
            <Text style={[styles.learnButtonText, { fontSize: typography.body }]}>Learn how to connect</Text>
          </TouchableOpacity>
        </View>

        {/* Scan frame */}
        {(() => {
          const scanSize = isTablet ? Math.min(width * 0.35, 280) : width * 0.6;
          const scanOffset = scanSize / 2;
          return (
            <View style={[styles.scanFrame, { width: scanSize, height: scanSize, marginTop: -scanOffset, marginLeft: -scanOffset }]}>
              <Animated.View
                style={[
                  styles.corner,
                  styles.cornerTopLeft,
                  { transform: [{ translateX: cornerOutNeg }, { translateY: cornerOutNeg }, { scale: cornerScale }] },
                ]}
              >
                <Svg width="100%" height="100%" viewBox="0 0 50 50">
                  <Path d="M 47 3 H 23 Q 3 3 3 23 V 47" stroke={WHITE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </Animated.View>
              <Animated.View
                style={[
                  styles.corner,
                  styles.cornerTopRight,
                  { transform: [{ translateX: cornerOut }, { translateY: cornerOutNeg }, { scale: cornerScale }] },
                ]}
              >
                <Svg width="100%" height="100%" viewBox="0 0 50 50">
                  <Path d="M 3 3 H 27 Q 47 3 47 23 V 47" stroke={WHITE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </Animated.View>
              <Animated.View
                style={[
                  styles.corner,
                  styles.cornerBottomLeft,
                  { transform: [{ translateX: cornerOutNeg }, { translateY: cornerOut }, { scale: cornerScale }] },
                ]}
              >
                <Svg width="100%" height="100%" viewBox="0 0 50 50">
                  <Path d="M 47 47 H 23 Q 3 47 3 27 V 3" stroke={WHITE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </Animated.View>
              <Animated.View
                style={[
                  styles.corner,
                  styles.cornerBottomRight,
                  { transform: [{ translateX: cornerOut }, { translateY: cornerOut }, { scale: cornerScale }] },
                ]}
              >
                <Svg width="100%" height="100%" viewBox="0 0 50 50">
                  <Path d="M 3 47 H 27 Q 47 47 47 27 V 3" stroke={WHITE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </Animated.View>

              {!permission.granted && (
                <View style={styles.permissionOverlay}>
                  <View style={styles.permissionIconWrapper}>
                    <AlertCircle size={28} color={WHITE} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.permissionOverlayTitle}>
                    Camera Access Required
                  </Text>
                  <Text style={styles.permissionOverlayDesc}>
                    This app uses the camera to scan a QR code to securely connect
                    the app to your development environment or codebase. You can
                    also manually enter the code if you prefer not to use the
                    camera.
                  </Text>
                </View>
              )}

              {isConnecting && (
                <View style={styles.scanningOverlay}>
                  <Animated.View style={{ transform: [{ rotate: loaderSpin }] }}>
                    <LoaderCircle size={24} color={WHITE} strokeWidth={2} />
                  </Animated.View>
                  <Text style={styles.connectingText}>Connecting...</Text>
                </View>
              )}
            </View>
          );
        })()}
      </View>

      {/* Lower */}
      <ReAnimated.View style={[styles.lower, lowerAnimatedStyle, { backgroundColor: BLACK }]}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <QrCode size={18} color={BLACK} strokeWidth={2} />
            <TextInput
              style={[styles.input, { fontFamily: fonts.sans.regular }]}
              placeholder="Enter connection code"
              placeholderTextColor="rgba(0,0,0,0.9)"
              value={manualCode}
              onChangeText={(text) => { setManualCode(text); setError(null); }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isConnecting}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="go"
              onSubmitEditing={handleConnect}
            />
          </View>
          <TouchableOpacity
            onPress={handleConnect}
            style={[styles.arrowButton, {
              backgroundColor: manualCode.trim() ? "#4F46E5" : "rgba(255,255,255,0.15)",
              borderColor: manualCode.trim() ? "#4F46E5" : "transparent",
            }]}
            disabled={isButtonDisabled}
            activeOpacity={0.75}
          >
            {isConnecting ? (
              <Animated.View style={{ transform: [{ rotate: loaderSpin }] }}>
                <LoaderCircle size={18} color={manualCode.trim() ? WHITE : "#aaaaaa"} strokeWidth={2} />
              </Animated.View>
            ) : (
              <ArrowRight size={18} color={manualCode.trim() ? WHITE : "#aaaaaa"} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </View>
      </ReAnimated.View>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />

      {/* How to connect guide */}
      <SwipeableSheet visible={showGuide} onClose={() => setShowGuide(false)} styles={styles} fonts={fonts} typography={typography}>
        {(animatedClose) => (<>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { fontFamily: fonts.sans.semibold }]}>How to connect</Text>
                <Text style={[styles.modalSubtitle, { fontSize: 12, fontFamily: fonts.sans.regular }]}>Run one command, scan a QR, you're in</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  animatedClose();
                }}
                style={styles.modalClose}
              >
                <X size={18} color={WHITE} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

              {/* Steps */}
              <View>

                {/* Step 1 */}
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <View style={{ alignItems: "center", width: 22 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.bg.raised, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 11, fontFamily: fonts.sans.semibold, color: colors.fg.muted }}>1</Text>
                    </View>
                    <View style={{ width: 1, flex: 1, backgroundColor: colors.fg.default + "12", marginTop: 4, marginBottom: 4 }} />
                  </View>
                  <View style={{ flex: 1, paddingBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontFamily: fonts.sans.semibold, color: colors.fg.default, marginBottom: 4, lineHeight: 22 }}>
                      Open your terminal on your PC
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 20 }}>
                      Navigate to the repository where you want Lunel to work
                    </Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <View style={{ alignItems: "center", width: 22 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.bg.raised, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 11, fontFamily: fonts.sans.semibold, color: colors.fg.muted }}>2</Text>
                    </View>
                    <View style={{ width: 1, flex: 1, backgroundColor: colors.fg.default + "12", marginTop: 4, marginBottom: 4 }} />
                  </View>
                  <View style={{ flex: 1, paddingBottom: 20 }}>
                    <Text style={{ fontSize: 14, fontFamily: fonts.sans.semibold, color: colors.fg.default, marginBottom: 4, lineHeight: 22 }}>
                      Run the command
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 18, marginBottom: 8 }}>
                      First time in a repo it gives you a QR code to connect. Run it again and it just resumes the last session without a new QR. To reconnect, tap the previous session in the app
                    </Text>
                    <CopyableCommand command="npx lunel-cli" fonts={fonts} colors={colors} />
                    <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 18, marginTop: 8, marginBottom: 6 }}>
                      Need a fresh code?
                    </Text>
                    <CopyableCommand command="npx lunel-cli -n" fonts={fonts} colors={colors} />
                  </View>
                </View>

                {/* Step 3 */}
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <View style={{ alignItems: "center", width: 22 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.bg.raised, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 11, fontFamily: fonts.sans.semibold, color: colors.fg.muted }}>3</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: fonts.sans.semibold, color: colors.fg.default, marginBottom: 4, lineHeight: 22 }}>
                      Scan or type the code
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 20 }}>
                      A QR code and a short code appear in your terminal. Scan with your camera or type the code in the input field and you're in
                    </Text>
                  </View>
                </View>

              </View>

              {/* Done */}
              <View style={{ marginTop: 24 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 20 }}>
                  Once connected, your whole machine lives in your pocket. Ship from the couch, the toilet, anywhere
                </Text>
              </View>

              {/* YouTube */}
              <Pressable
                onPress={() => Linking.openURL("https://www.youtube.com/@uselunel")}
                style={({ pressed }) => ({
                  marginHorizontal: 0,
                  marginTop: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <FontAwesome name="youtube-play" size={15} color={colors.fg.muted} />
                <Text style={{ fontSize: 13, fontFamily: fonts.sans.regular, color: colors.fg.muted }}>
                  Watch the tutorial on YouTube
                </Text>
                <Ionicons name="chevron-forward" size={13} color={colors.fg.muted} style={{ marginLeft: -4 } as any} />
              </Pressable>

            </ScrollView>
        </>)}
      </SwipeableSheet>
    </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  upper: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 20,
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 80,
  },
  lower: {
    position: "absolute",
    bottom: 0,
    left: 6,
    right: 6,
    backgroundColor: BLACK,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingHorizontal: 18,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  cliHintRow: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  learnButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  learnButtonText: {
    fontSize: 13,
    color: WHITE,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 0,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WHITE,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 3,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  step: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
  },
  stepContent: {
    flex: 1,
    gap: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: WHITE,
  },
  stepDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 14,
    color: WHITE,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  securityNote: {
    backgroundColor: "rgba(79,70,229,0.15)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.4)",
    marginBottom: 8,
    gap: 6,
  },
  securityNoteText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },
  stepNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 20,
    fontStyle: "italic",
  },
  scanFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
  },
  corner: {
    position: "absolute",
    width: 50,
    height: 50,
    borderColor: WHITE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
  },
  permissionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 10,
  },
  permissionIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  permissionOverlayTitle: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  permissionOverlayDesc: {
    color: WHITE,
    fontSize: 12,
    textAlign: "center",
    opacity: 0.5,
    lineHeight: 18,
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  connectingText: {
    color: WHITE,
    fontSize: 14,
    marginTop: 12,
    opacity: 0.9,
  },
});

export default LunelConnect;
