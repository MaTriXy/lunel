import { useTheme } from "@/contexts/ThemeContext";
import Header, { useHeaderHeight } from "@/components/Header";
import { ExternalLink } from "lucide-react-native";
import { useRouter } from "expo-router";
import React from "react";
import * as WebBrowser from "expo-web-browser";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FaqItemProps {
  question: string;
  answer: string;
}

interface LinkRowProps {
  label: string;
  url: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
  const { colors, fonts, spacing, typography } = useTheme();

  return (
    <View style={[styles.faqCard, { backgroundColor: colors.bg.raised, borderColor: colors.bg.raised, borderRadius: 10, padding: spacing[3] }]}>
      <Text style={[styles.faqQuestion, { color: colors.fg.default, fontFamily: fonts.sans.medium, fontSize: typography.body }]}>
        {question}
      </Text>
      <Text style={[styles.faqAnswer, { color: colors.fg.muted, fontFamily: fonts.sans.regular, fontSize: typography.caption }]}>
        {answer}
      </Text>
    </View>
  );
}

function LinkRow({ label, url }: LinkRowProps) {
  const { colors, fonts, spacing, typography } = useTheme();

  const handleOpen = () => {
    void WebBrowser.openBrowserAsync(url);
  };

  return (
    <TouchableOpacity
      onPress={handleOpen}
      activeOpacity={0.7}
      style={[
        styles.linkRow,
        {
          backgroundColor: colors.bg.raised,
          borderColor: colors.bg.raised,
          borderRadius: 10,
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[3],
        },
      ]}
    >
      <Text style={[styles.linkLabel, { color: colors.fg.default, fontFamily: fonts.sans.medium, fontSize: typography.body }]}>
        {label}
      </Text>
      <ExternalLink size={16} color={colors.fg.subtle} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function HelpPage() {
  const { colors, fonts, spacing, typography } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <Header title="Help & Information" colors={colors} onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium, fontSize: typography.caption }]}>
          GETTING STARTED
        </Text>
        <View style={[styles.faqList, { marginHorizontal: 12 }]}>
          <FaqItem
            question="How do I connect to a session?"
            answer="Run `npx lunel-cli` on your machine, then scan the generated QR code from the app."
          />
          <FaqItem
            question="What if I get disconnected?"
            answer="Open Home and scan a fresh QR code from a new CLI session to reconnect."
          />
        </View>

        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium, fontSize: typography.caption }]}>
          TROUBLESHOOTING
        </Text>
        <View style={[styles.faqList, { marginHorizontal: 12 }]}>
          <FaqItem
            question="Why is the scanner not working?"
            answer="Enable camera permission in iOS Settings and make sure the QR code is fully visible."
          />
          <FaqItem
            question="Why am I not connecting?"
            answer="Verify your machine is online, rerun `npx lunel-cli`, and scan the newest QR code."
          />
        </View>

        <Text style={[styles.sectionHeader, { color: colors.fg.muted, fontFamily: fonts.sans.medium, fontSize: typography.caption }]}>
          LINKS
        </Text>
        <View style={[styles.linkList, { marginHorizontal: 12 }]}>
          <LinkRow label="Terms" url="https://app.lunel.dev/terms" />
          <LinkRow label="Policy" url="https://app.lunel.dev/policy" />
          <LinkRow label="Security" url="https://app.lunel.dev/security" />
          <LinkRow label="Discord" url="https://discord.gg/tdaywsP4HK" />
          <LinkRow label="GitHub" url="https://github.com/lunel-dev" />
          <LinkRow label="Twitter" url="https://twitter.com/uselunel" />
        </View>

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  faqList: {
    gap: 8,
  },
  faqCard: {
    borderWidth: 1,
  },
  faqQuestion: {
    marginBottom: 6,
  },
  faqAnswer: {
    lineHeight: 16,
  },
  linkList: {
    gap: 8,
  },
  linkRow: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkLabel: {},
});
