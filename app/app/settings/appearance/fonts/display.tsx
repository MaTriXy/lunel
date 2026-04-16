import { useTheme } from "@/contexts/ThemeContext";
import Header, { useHeaderHeight } from "@/components/Header";
import {
  DisplayFamilyId,
  displayFamilies,
} from "@/constants/themes";
import { Check, Info } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FontOptionProps {
  name: string;
  sampleText: string;
  fontFamily: string;
  isSelected: boolean;
  onSelect: () => void;
}

function FontOption({ name, sampleText, fontFamily, isSelected, onSelect }: FontOptionProps) {
  const { colors, fonts, spacing, radius, typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.fontOption,
        {
          backgroundColor: isSelected ? colors.accent.default + '20' : colors.bg.raised,
          borderRadius: 10,
          padding: spacing[3],
          marginBottom: spacing[2],
        },
      ]}
    >
      <View style={styles.fontOptionHeader}>
        <Text
          style={{
            fontSize: typography.body,
            fontFamily: fonts.sans.medium,
            color: isSelected ? colors.accent.default : colors.fg.default,
          }}
        >
          {name}
        </Text>
        {isSelected && (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: radius.full,
              backgroundColor: colors.accent.default,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={16} color={'#ffffff'} strokeWidth={3} />
          </View>
        )}
      </View>
      <Text
        style={{
          fontSize: typography.caption,
          fontFamily: fontFamily,
          color: colors.fg.muted,
          marginTop: spacing[2],
        }}
      >
        {sampleText}
      </Text>
    </TouchableOpacity>
  );
}

export default function DisplayFontPage() {
  const {
    colors,
    fonts,
    spacing,
    radius,
    fontSelection,
    setDisplayFont,
  } = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const displayFontIds = Object.keys(displayFamilies) as DisplayFamilyId[];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.base }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Display Font"
        colors={colors}
        onBack={() => router.back()}
        rightAccessory={(
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                "Display Font",
                "Used for headings and branding elements.\n\nBest for titles and visual emphasis, not long paragraphs.\nA stronger style here changes the app's personality quickly."
              );
            }}
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <Info size={18} color={colors.fg.muted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: spacing[3] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing[3] }}>
          {displayFontIds.map((id) => {
            const family = displayFamilies[id];
            return (
              <FontOption
                key={id}
                name={family.name}
                sampleText="LUNEL"
                fontFamily={family.font}
                isSelected={fontSelection.display === id}
                onSelect={() => setDisplayFont(id)}
              />
            );
          })}
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
  fontOption: {
    flexDirection: "column",
  },
  fontOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
