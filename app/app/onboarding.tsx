import { useTheme } from "@/contexts/ThemeContext";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Activity,
  Code2,
  Cpu,
  FolderGit2,
  FolderSearch,
  GitBranch,
  Globe,
  Network,
  QrCode,
  Smartphone,
  SquareTerminal,
  Terminal,
  Type,
  Shield,
  Sparkles,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type LucideIcon = React.ComponentType<{
  size: number;
  color: string;
  strokeWidth?: number;
}>;

type Page = {
  id: string;
  Icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  color: string;
};

const PAGES: Page[] = [
  {
    id: "1",
    Icon: Smartphone as LucideIcon,
    label: "Your Mobile IDE",
    title: "Welcome to Lunel",
    description: "Ship from anywhere.",
    color: "#6366f1",
  },
  {
    id: "2",
    Icon: Smartphone as LucideIcon,
    label: "Choose Your Path",
    title: "Two Ways to Use Lunel",
    description: "",
    color: "#6366f1",
  },
  {
    id: "3",
    Icon: Sparkles as LucideIcon,
    label: "Everything You Need",
    title: "Packed with Tools",
    description: "",
    color: "#8b5cf6",
  },
  {
    id: "4",
    Icon: SquareTerminal as LucideIcon,
    label: "Full Shell Access",
    title: "Real Terminal",
    description:
      "A complete terminal emulator with SSH access to your machine, or spin up secure cloud sandboxes instantly.",
    color: "#06b6d4",
  },
  {
    id: "5",
    Icon: FolderGit2 as LucideIcon,
    label: "Complete Workflow",
    title: "Files, Editor & Git",
    description:
      "Browse your file system, edit code with syntax highlighting across 11+ languages, and commit with built-in Git.",
    color: "#10b981",
  },
  {
    id: "6",
    Icon: QrCode as LucideIcon,
    label: "Secure Connection",
    title: "Pair in Seconds",
    description:
      "Scan a QR code to securely connect to your machine. Your code, your environment — always with you.",
    color: "#f59e0b",
  },
];

const midW = Math.round(SCREEN_WIDTH * 0.52);
const midH = Math.round(midW * 16 / 9);
const sideW = Math.round(SCREEN_WIDTH * 0.42);
const sideH = Math.round(sideW * 16 / 9);
const sideOffset = Math.round(SCREEN_WIDTH * 0.20);

function WelcomePage() {
  const { colors, fonts, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const giftShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phone slide animation
    Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(anim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Gift shake: still 2.5s → rapid wiggle → repeat
    Animated.loop(
      Animated.sequence([
        Animated.delay(2500),
        Animated.timing(giftShake, { toValue: 1,  duration: 70, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(giftShake, { toValue: -1, duration: 70, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(giftShake, { toValue: 0,  duration: 70, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const giftRotate = giftShake.interpolate({ inputRange: [-1, 1], outputRange: ["-18deg", "18deg"] });

  const leftRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "0deg"] });
  const rightRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["8deg", "0deg"] });
  const leftX = anim.interpolate({ inputRange: [0, 1], outputRange: [-sideOffset, 0] });
  const rightX = anim.interpolate({ inputRange: [0, 1], outputRange: [sideOffset, 0] });

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Pressable
        onPress={() => Linking.openURL("https://github.com/lunel-dev/lunel")}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.bg.raised, marginBottom: 32, opacity: pressed ? 0.6 : 1, borderWidth: 0.5, borderColor: colors.border.main })}
      >
        <FontAwesome name="github" size={14} color={colors.fg.default} />
        <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.default }}>Open Source</Text>
      </Pressable>

      <View style={{ width: SCREEN_WIDTH, height: midH, alignItems: "center", justifyContent: "center", overflow: "visible" }}>
        <Animated.Image
          source={isDark ? require("@/assets/images/onboarding/1/right-dark.png") : require("@/assets/images/onboarding/1/right.png")}
          style={{ position: "absolute", width: sideW, height: sideH, transform: [{ translateX: leftX }, { translateY: 16 }, { rotate: leftRotate }] }}
          resizeMode="contain"
        />
        <Animated.Image
          source={isDark ? require("@/assets/images/onboarding/1/left-dark.png") : require("@/assets/images/onboarding/1/left.png")}
          style={{ position: "absolute", width: sideW, height: sideH, transform: [{ translateX: rightX }, { translateY: 16 }, { rotate: rightRotate }] }}
          resizeMode="contain"
        />
        <Image
          source={isDark ? require("@/assets/images/onboarding/1/middle-dark.png") : require("@/assets/images/onboarding/1/middle.png")}
          style={{ position: "absolute", width: midW, height: midH }}
          resizeMode="contain"
        />
      </View>

      <View style={{ alignItems: "center", paddingHorizontal: 32, gap: 10, marginTop: 24 }}>
        <Text style={{ fontSize: 25, fontFamily: fonts.sans.semibold, color: colors.fg.default, textAlign: "center", lineHeight: 32 }}>
          Lunel
        </Text>
        <Text style={{ fontSize: 14, fontFamily: fonts.sans.regular, color: colors.fg.muted, textAlign: "center", lineHeight: 22, maxWidth: 280, marginTop: -3 }}>
          lunel brings your whole dev environment in your pocket
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.bg.raised }}>
            <MaterialCommunityIcons name="shield-lock" size={14} color={colors.fg.default} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.default }}>End-to-end encryption</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.bg.raised, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Animated.View style={{ transform: [{ rotate: giftRotate }] }}>
              <Ionicons name="gift" size={14} color={colors.fg.default} />
            </Animated.View>
            <Text style={{ fontSize: 12, fontFamily: fonts.sans.semibold, color: colors.fg.default }}>Free</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const CONNECT_POINTS = [
  "Run one command, scan a QR code, and you're in",
  "Full terminal with real shell access",
  "Edit code with syntax highlighting & git built in",
  "Everything runs on your own machine",
  "End-to-end encrypted, nothing leaves your device",
];

const CLOUD_POINTS = [
  "Spin up a full dev environment in seconds",
  "No machine, no setup, no installs",
  "Persistent sandboxes that survive across sessions",
  "Code from any device, anywhere in the world",
  "Isolated and secure: each sandbox is yours alone",
];

function ProductModePage() {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 28 }}>

      {/* Header */}
      <View style={{ paddingTop: 35, marginBottom: 36 }}>
        <Text style={{ fontSize: 25, fontFamily: fonts.sans.semibold, color: colors.fg.default, lineHeight: 32, marginBottom: 6 }}>
          Two ways to ship
        </Text>
        <Text style={{ fontSize: 14, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 22, marginBottom: 16 }}>
          Connect your machine or code straight from the cloud
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.bg.raised }}>
            <Ionicons name="scan-outline" size={13} color={colors.fg.default} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.default }}>Scan to connect</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.bg.raised }}>
            <Entypo name="cloud" size={13} color={colors.fg.default} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.default }}>Cloud sandbox</Text>
          </View>
        </View>
      </View>

      {/* Lunel Connect */}
      <View style={{ marginBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.bg.raised, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="scan-outline" size={18} color={colors.fg.default} />
          </View>
          <Text style={{ fontSize: 17, fontFamily: fonts.sans.semibold, color: colors.fg.default }}>
            Lunel Connect
          </Text>
        </View>

        <View style={{ gap: 7, marginBottom: 14 }}>
          {CONNECT_POINTS.map((point) => (
            <View key={point} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.fg.muted }} />
              <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: colors.fg.muted, flex: 1 }}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.bg.raised }}>
          <Ionicons name="gift" size={14} color={colors.fg.default} />
          <Text style={{ fontFamily: fonts.sans.medium, fontSize: 12, color: colors.fg.default }}>Lifetime free</Text>
        </View>
      </View>

      {/* Lunel Cloud */}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.bg.raised, alignItems: "center", justifyContent: "center" }}>
            <Entypo name="cloud" size={18} color={colors.fg.default} />
          </View>
          <Text style={{ fontSize: 17, fontFamily: fonts.sans.semibold, color: colors.fg.default }}>
            Lunel Cloud
          </Text>
          <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: "#22c55e18" }}>
            <Text style={{ fontSize: 9, fontFamily: fonts.sans.semibold, color: "#22c55e", letterSpacing: 0.6 }}>COMING SOON</Text>
          </View>
        </View>

        <View style={{ gap: 7, marginBottom: 14 }}>
          {CLOUD_POINTS.map((point) => (
            <View key={point} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.fg.muted }} />
              <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: colors.fg.muted, flex: 1 }}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.bg.raised }}>
          <FontAwesome name="tag" size={14} color={colors.fg.muted} />
          <Text style={{ fontFamily: fonts.sans.medium, fontSize: 12, color: colors.fg.default }}>Competitively priced</Text>
        </View>
      </View>

    </View>
  );
}

type Feature = {
  name: string;
  description: string;
  points: string[];
  Icon: LucideIcon;
  color: string;
};

const FEATURES: Feature[] = [
  {
    name: "AI Agents",
    description: "Your AI coding partner, built into the workspace",
    points: [
      "Run Codex and OpenCode inside your workspace",
      "50+ models including Claude, GPT-4o, Gemini, and more",
      "Switch between Plan, Build, and other agent modes",
      "Record voice, transcribed instantly into a prompt",
      "Attach files and images, review diffs before applying",
    ],
    Icon: Sparkles,
    color: "#8b5cf6",
  },
  {
    name: "Browser",
    description: "A full browser with dev tools baked in",
    points: [
      "Debug your web app as if you were on desktop",
      "Watch every network request fly by in real time",
      "Tweak elements and styles live without reloading",
      "Catch errors and console logs as they happen",
      "Intercept and modify traffic with proxy support",
    ],
    Icon: Globe,
    color: "#06b6d4",
  },
  {
    name: "Code Editor",
    description: "A proper editor built for mobile",
    points: [
      "Syntax highlighting across 20+ languages",
      "Edit multiple files without losing your place",
      "Smart indentation keeps your code clean",
      "Tap a symbol to jump, swipe between open files",
      "Keyboard designed for writing real code on mobile",
    ],
    Icon: Code2,
    color: "#6366f1",
  },
  {
    name: "File Explorer",
    description: "Browse and manage your entire project tree",
    points: [
      "Navigate any project, no matter how large",
      "Find files fast with search and smart filters",
      "Create, rename, move, and delete anything",
      "Jump straight into editing with a single tap",
      "Copy paths and open files across tools instantly",
    ],
    Icon: FolderSearch,
    color: "#f59e0b",
  },
  {
    name: "Terminal",
    description: "A real shell, not a wrapper",
    points: [
      "Run anything you can run on your desktop",
      "Sessions stay alive even when you disconnect",
      "Install packages, run builds, and deploy remotely",
      "SSH into any server directly from the app",
      "Full color support so your terminal looks right",
    ],
    Icon: SquareTerminal,
    color: "#10b981",
  },
  {
    name: "Version Control",
    description: "Full Git workflow without leaving the app",
    points: [
      "Stage files or individual hunks with precision",
      "Commit, push, and ship code from anywhere",
      "Browse the full commit history at a glance",
      "Create and switch branches on the fly",
      "Pull, merge, and stay in sync with your team",
    ],
    Icon: GitBranch,
    color: "#ef4444",
  },
  {
    name: "Process Manager",
    description: "See and control every process on your machine",
    points: [
      "See everything running on your machine at once",
      "Find any process instantly with live search",
      "Kill stuck or runaway processes with one tap",
      "Start new processes directly from the app",
      "Stream live output without opening a terminal",
    ],
    Icon: Cpu,
    color: "#f97316",
  },
  {
    name: "Port Manager",
    description: "Know what's listening and shut it down fast",
    points: [
      "See every active port and exactly what owns it",
      "Kill a port listener with one tap, no terminal needed",
      "Free up blocked ports before they slow you down",
      "Search by port number or process name",
      "Spot port conflicts before they break your server",
    ],
    Icon: Network,
    color: "#3b82f6",
  },
  {
    name: "API Testing",
    description: "Test endpoints without leaving your phone",
    points: [
      "Fire requests with any HTTP method in seconds",
      "Set headers, auth tokens, and a request body",
      "Read the full response: status, headers, and body",
      "History keeps every request so you never lose work",
      "Route requests through your machine to hit local APIs",
    ],
    Icon: Shield,
    color: "#a855f7",
  },
  {
    name: "Text Tools",
    description: "A developer's Swiss Army knife",
    points: [
      "Format messy JSON or XML in one tap",
      "Encode and decode Base64 and URLs on the fly",
      "Generate MD5, SHA-1, and SHA-256 hashes instantly",
      "Convert Unix timestamps to readable dates",
      "Every dev utility you need, no browser tab required",
    ],
    Icon: Type,
    color: "#14b8a6",
  },
  {
    name: "Resource Monitor",
    description: "Live system stats with real-time graphs",
    points: [
      "Watch CPU and memory use as it happens",
      "See which cores are under load at any moment",
      "Track disk reads and writes in real time",
      "Monitor network usage in and out",
      "Spot bottlenecks before they crash your build",
    ],
    Icon: Activity,
    color: "#ec4899",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ backgroundColor: colors.bg.raised, borderRadius: 14, padding: 12 }}>
      {/* Icon + name row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: feature.color + "18",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <feature.Icon size={18} color={feature.color} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.sans.semibold, color: colors.fg.default, lineHeight: 19 }}>
            {feature.name}
          </Text>
          <Text style={{ fontSize: 11.5, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 15, marginTop: 1 }}>
            {feature.description}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 0.5, backgroundColor: colors.fg.default + "10", marginVertical: 8 }} />

      {/* Bullet points */}
      <View style={{ gap: 5 }}>
        {feature.points.map((point) => (
          <View key={point} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: feature.color + "bb", marginTop: 5, flexShrink: 0 }} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 17, flex: 1 }}>
              {point}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FeaturesPage() {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header */}
        <View style={{ paddingTop: 35, paddingHorizontal: 24, marginBottom: 20 }}>
          <Text style={{ fontSize: 25, fontFamily: fonts.sans.semibold, color: colors.fg.default, lineHeight: 32, marginBottom: 6 }}>
            What's inside
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.sans.regular, color: colors.fg.muted, lineHeight: 22, marginBottom: 16 }}>
            A complete dev environment in your pocket
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.bg.raised }}>
              <FontAwesome name="github" size={13} color={colors.fg.default} />
              <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.default }}>Open Source</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.bg.raised }}>
              <MaterialCommunityIcons name="shield-lock" size={13} color={colors.fg.default} />
              <Text style={{ fontSize: 12, fontFamily: fonts.sans.medium, color: colors.fg.default }}>End-to-end encrypted</Text>
            </View>
          </View>
        </View>

        {/* Feature cards */}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.name} feature={f} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom fade mask */}
      <LinearGradient
        colors={[colors.bg.base + "00", colors.bg.base]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, pointerEvents: "none" }}
      />
    </View>
  );
}

function OnboardingPage({ page }: { page: Page }) {
  const { colors, fonts } = useTheme();
  const { Icon } = page;

  if (page.id === "1") {
    return <WelcomePage />;
  }

  if (page.id === "2") {
    return <ProductModePage />;
  }

  if (page.id === "3") {
    return <FeaturesPage />;
  }

  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <View
          style={{
            width: 176,
            height: 176,
            borderRadius: 88,
            backgroundColor: page.color + "14",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 52,
          }}
        >
          <View
            style={{
              width: 116,
              height: 116,
              borderRadius: 58,
              backgroundColor: page.color + "22",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={50} color={page.color} strokeWidth={1.5} />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 36, paddingBottom: 28, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: fonts.sans.semibold,
            color: page.color,
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 14,
            textAlign: "center",
          }}
        >
          {page.label}
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontFamily: fonts.sans.semibold,
            color: colors.fg.default,
            textAlign: "center",
            marginBottom: 16,
            lineHeight: 36,
          }}
        >
          {page.title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: fonts.sans.regular,
            color: colors.fg.muted,
            textAlign: "center",
            lineHeight: 24,
            maxWidth: 296,
          }}
        >
          {page.description}
        </Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLastPage = currentIndex === PAGES.length - 1;

  const handleComplete = () => {
    router.replace("/auth");
  };

  const handleNext = () => {
    if (!isLastPage) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={({ item }) => <OnboardingPage page={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
      />

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 24),
          paddingTop: 8,
          gap: 16,
        }}
      >
        {/* Dot indicators */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, height: 8, marginBottom: 8 }}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 22 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === currentIndex ? colors.accent.default : colors.fg.default + "1a",
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => ({
            backgroundColor: colors.accent.default,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontFamily: fonts.sans.semibold, color: "#ffffff", letterSpacing: 0.3 }}>
            {isLastPage ? "Get Started" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
