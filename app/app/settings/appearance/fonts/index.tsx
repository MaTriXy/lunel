import { useTheme } from "@/contexts/ThemeContext";
import Header, { useHeaderHeight } from "@/components/Header";
import {
  displayFamilies,
  monoFamilies,
  normalFamilies,
} from "@/constants/themes";
import { ChevronRight } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";

import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FontRowProps {
  label: string;
  currentFont: string;
  onPress: () => void;
}

function FontRow({ label, currentFont, onPress }: FontRowProps) {
  const { colors, fonts, spacing, typography } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.fontRow, { paddingVertical: spacing[2], paddingHorizontal: spacing[3] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: colors.fg.default, fontFamily: fonts.sans.regular, fontSize: typography.body }]}>
          {label}
        </Text>
        <Text style={[styles.currentFont, { color: colors.fg.muted, fontFamily: fonts.sans.regular, fontSize: typography.caption }]}>
          {currentFont}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.fg.subtle} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function FontsPage() {
  const {
    colors,
    fonts,
    spacing,
    fontSelection,
  } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const currentNormalName = normalFamilies[fontSelection.normal]?.name ?? "Default";
  const currentMonoName = monoFamilies[fontSelection.mono]?.name ?? "Default";
  const currentDisplayName = displayFamilies[fontSelection.display]?.name ?? "Default";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Fonts" colors={colors} onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: spacing[3] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.bg.raised, borderRadius: 10, marginHorizontal: spacing[3] }]}>
          <FontRow
            label="Normal Font"
            currentFont={currentNormalName}
            onPress={() => router.push("/settings/appearance/fonts/normal")}
          />
          <View style={[styles.divider, { backgroundColor: colors.border.tertiary }]} />
          <FontRow
            label="Code Font"
            currentFont={currentMonoName}
            onPress={() => router.push("/settings/appearance/fonts/code")}
          />
          <View style={[styles.divider, { backgroundColor: colors.border.tertiary }]} />
          <FontRow
            label="Display Font"
            currentFont={currentDisplayName}
            onPress={() => router.push("/settings/appearance/fonts/display")}
          />
        </View>

        {/* Bottom padding */}
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    overflow: "hidden",
  },
  fontRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "column",
    gap: 2,
  },
  rowLabel: {},
  currentFont: {},
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
});
