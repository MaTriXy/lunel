import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';
import {
  AlertTriangle,
  X,
  Activity,
  HardDrive,
} from 'lucide-react-native';
import Header, { useHeaderHeight } from "@/components/Header";
import NotConnected from '@/components/NotConnected';
import Loading from '@/components/Loading';
import { useTheme } from '@/contexts/ThemeContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { PluginPanelProps } from '../../types';
import { useApi, SystemInfo, ApiError } from '@/hooks/useApi';

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

const AUTO_REFRESH_MS = 1000;
const CPU_HISTORY_SAMPLES = 40;
const CORE_HISTORY_SAMPLES = 20;
const MONITOR_PANEL_CACHE_STORAGE_KEY = '@lunel_monitor_panel_cache_v1';

type MonitorPanelCache = {
  systemInfo: SystemInfo | null;
  cpuHistory: number[];
  coreHistory: number[][];
  savedAt: number;
};

function AnimatedBar({
  percent,
  color,
  height = 5,
  trackColor,
}: {
  percent: number;
  color: string;
  height?: number;
  trackColor: string;
}) {
  const progress = useSharedValue(Math.min(percent, 100));

  useEffect(() => {
    progress.value = withTiming(Math.min(percent, 100), { duration: 300 });
  }, [percent, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={{ height, backgroundColor: trackColor, borderRadius: height, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: height }, fillStyle]} />
    </View>
  );
}

function pushCpuSample(history: number[], next: number, maxSamples: number): number[] {
  const normalized = Math.max(0, Math.min(next, 100));
  if (history.length >= maxSamples) {
    return [...history.slice(history.length - maxSamples + 1), normalized];
  }
  return [...history, normalized];
}

function UsageStream({
  samples,
  color,
  trackColor,
  gradientId,
  columns,
  height,
  strokeWidth = 2,
  gap = 3,
}: {
  samples: number[];
  color: string;
  trackColor: string;
  gradientId: string;
  columns: number;
  height: number;
  strokeWidth?: number;
  gap?: number;
}) {
  const points = samples.slice(-columns);
  const paddedPoints = points.length < columns
    ? [...Array(columns - points.length).fill(0), ...points]
    : points;
  const chartWidth = Math.max(0, columns * strokeWidth + (columns - 1) * gap);
  const polylinePoints = paddedPoints
    .map((sample, index) => {
      const x = index * (strokeWidth + gap) + strokeWidth / 2;
      const y = height - Math.max(2, (sample / 100) * (height - 2));
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `0,${height} ${polylinePoints} ${chartWidth},${height}`;

  return (
    <View style={{ flex: 1, height, justifyContent: 'center' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2={height}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Polygon
          points={areaPoints}
          fill={`url(#${gradientId})`}
        />
        <Line
          x1="0"
          y1={height - 1}
          x2={chartWidth}
          y2={height - 1}
          stroke={trackColor}
          strokeWidth="1"
        />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function MonitorPanel({ instanceId, isActive }: PluginPanelProps) {
  const { colors, fonts, spacing, radius } = useTheme();
  const headerHeight = useHeaderHeight();
  const { monitor: monitorApi, isConnected } = useApi();
  const { cacheNamespace } = useConnection();

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [coreHistory, setCoreHistory] = useState<number[][]>([]);
  const monitorCacheLoadedRef = useRef(false);
  const monitorCacheSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const systemInfoRef = useRef<SystemInfo | null>(null);
  const systemInfoRequestIdRef = useRef(0);

  const getUsageColor = useCallback((percent: number): string => {
    if (percent < 50) return colors.terminal.green;
    if (percent < 80) return colors.terminal.yellow;
    return colors.terminal.red;
  }, [colors.terminal.green, colors.terminal.red, colors.terminal.yellow]);
  const loadSystemInfo = useCallback(async () => {
    if (!isConnected) { if (!systemInfoRef.current) setLoading(false); return; }
    const requestId = systemInfoRequestIdRef.current + 1;
    systemInfoRequestIdRef.current = requestId;
    try {
      setError(null);
      setLoading(!systemInfoRef.current);
      const result = await monitorApi.system();
      if (systemInfoRequestIdRef.current !== requestId) return;
      setSystemInfo(result);
    } catch (err) {
      if (systemInfoRequestIdRef.current !== requestId) return;
      if (!systemInfoRef.current) setError(err instanceof ApiError ? err.message : 'Failed to load system info');
    } finally {
      if (systemInfoRequestIdRef.current !== requestId) return;
      setLoading(false);
    }
  }, [isConnected, monitorApi]);

  useEffect(() => {
    systemInfoRef.current = systemInfo;
  }, [systemInfo]);

  useEffect(() => {
    const cacheKey = cacheNamespace ? `${MONITOR_PANEL_CACHE_STORAGE_KEY}:${cacheNamespace}` : null;
    monitorCacheLoadedRef.current = false;
    setSystemInfo(null);
    setCpuHistory([]);
    setCoreHistory([]);
    systemInfoRef.current = null;
    if (!cacheKey) {
      monitorCacheLoadedRef.current = true;
      return;
    }

    let cancelled = false;

    AsyncStorage.getItem(cacheKey)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as Partial<MonitorPanelCache>;
        const cachedSystemInfo = parsed.systemInfo ?? null;
        setSystemInfo(cachedSystemInfo);
        setCpuHistory(Array.isArray(parsed.cpuHistory) ? parsed.cpuHistory : []);
        setCoreHistory(Array.isArray(parsed.coreHistory) ? parsed.coreHistory : []);
        systemInfoRef.current = cachedSystemInfo;
        if (cachedSystemInfo) setLoading(false);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) monitorCacheLoadedRef.current = true;
      });

    return () => {
      cancelled = true;
      if (monitorCacheSaveTimerRef.current) clearTimeout(monitorCacheSaveTimerRef.current);
    };
  }, [cacheNamespace]);

  useEffect(() => {
    const cacheKey = cacheNamespace ? `${MONITOR_PANEL_CACHE_STORAGE_KEY}:${cacheNamespace}` : null;
    if (!cacheKey || !monitorCacheLoadedRef.current) return;

    if (monitorCacheSaveTimerRef.current) clearTimeout(monitorCacheSaveTimerRef.current);
    monitorCacheSaveTimerRef.current = setTimeout(() => {
      const cache: MonitorPanelCache = {
        systemInfo,
        cpuHistory,
        coreHistory,
        savedAt: Date.now(),
      };
      AsyncStorage.setItem(cacheKey, JSON.stringify(cache)).catch(() => {});
    }, 400);
  }, [cacheNamespace, coreHistory, cpuHistory, systemInfo]);

  useEffect(() => {
    if (isActive && isConnected) loadSystemInfo();
  }, [isActive, isConnected, loadSystemInfo]);

  useEffect(() => {
    if (!isActive || !isConnected) return;
    const interval = setInterval(loadSystemInfo, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [isActive, isConnected, loadSystemInfo]);

  useEffect(() => {
    if (!systemInfo) return;

    setCpuHistory((prev) => pushCpuSample(prev, systemInfo.cpu.usage, CPU_HISTORY_SAMPLES));
    setCoreHistory((prev) => {
      const nextHistory = systemInfo.cpu.cores.map((usage, index) =>
        pushCpuSample(prev[index] ?? [], usage, CORE_HISTORY_SAMPLES)
      );
      return nextHistory;
    });
  }, [systemInfo]);

  // Not connected
  if (!isConnected && !systemInfo) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.terminal.bg }}>
        <Header title="Monitor" colors={colors} />
        <NotConnected colors={colors} fonts={fonts} />
      </View>
    );
  }

  const pad = spacing[3];
  const monitorCardBg = `${colors.fg.muted}12`;

  // Section card
  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={{
      marginBottom: spacing[4],
      borderRadius: 14,
      borderWidth: 0.5,
      borderColor: colors.border.secondary,
      backgroundColor: monitorCardBg,
      overflow: 'hidden',
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
    }}>
      {children}
    </View>
  );

  // Section label row
  const SectionHeader = ({
    icon,
    label,
    right,
  }: {
    icon: React.ReactNode;
    label: string;
    right?: React.ReactNode;
  }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
      {icon}
      <Text style={{
        fontSize: 13,
        fontFamily: fonts.mono.regular,
        color: colors.fg.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginLeft: icon ? 6 : 0,
        flex: 1,
      }}>
        {label}
      </Text>
      {right && (
        <View>
          {right}
        </View>
      )}
    </View>
  );

  const StatTable = ({ rows }: { rows: { label: string; value: string; valueColor?: string }[] }) => (
    <View style={{
      backgroundColor: colors.terminal.bg,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: colors.border.secondary,
      overflow: 'hidden',
    }}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[2],
            borderBottomWidth: index < rows.length - 1 ? 0.5 : 0,
            borderBottomColor: colors.border.secondary,
          }}
        >
          <Text style={{
            flex: 1,
            fontSize: 10,
            fontFamily: fonts.mono.regular,
            color: colors.fg.subtle,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {row.label}
          </Text>
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.mono.regular,
            color: row.valueColor ?? colors.terminal.fg,
          }}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.terminal.bg }}>
      <Header title="Monitor" colors={colors} />

      {error && (
        <View style={{
          marginHorizontal: pad,
          marginTop: spacing[2],
          padding: spacing[2],
          backgroundColor: `${colors.terminal.red}20`,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <AlertTriangle size={14} color={colors.terminal.red} />
          <Text style={{ flex: 1, marginLeft: spacing[2], fontSize: 12, fontFamily: fonts.sans.regular, color: colors.terminal.red }}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => setError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color={colors.terminal.red} />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <Loading />
      ) : !systemInfo ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}>
          <Activity size={40} color={colors.fg.subtle} />
          <Text style={{ fontSize: 13, fontFamily: fonts.sans.medium, color: colors.fg.muted, marginTop: spacing[3] }}>
            No data available
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: pad }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── CPU ─── */}
          <View style={{
            marginBottom: spacing[4],
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: colors.border.secondary,
            backgroundColor: monitorCardBg,
            overflow: 'hidden',
            padding: spacing[3],
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
              <Text style={{
                fontSize: 13,
                fontFamily: fonts.mono.regular,
                color: colors.fg.muted,
              }}>
                {systemInfo.cpu.model
                  ? systemInfo.cpu.model.replace(/\(.*\)/g, '').trim().slice(0, 24)
                  : 'CPU'}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 22, fontFamily: fonts.mono.regular, color: getUsageColor(systemInfo.cpu.usage) }}>
                {systemInfo.cpu.usage.toFixed(0)}%
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginBottom: spacing[3],
              paddingBottom: spacing[3],
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border.secondary,
            }}>
              <Text style={{
                width: 34,
                fontSize: 11,
                fontFamily: fonts.mono.regular,
                color: colors.fg.muted,
              }}>
                CPU
              </Text>
              <UsageStream
                samples={cpuHistory}
                color={getUsageColor(systemInfo.cpu.usage)}
                trackColor={colors.terminal.selection}
                gradientId="cpu-stream-fill"
                columns={CPU_HISTORY_SAMPLES}
                height={42}
                strokeWidth={2.25}
                gap={4}
              />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing[3], rowGap: spacing[2] }}>
              {systemInfo.cpu.cores.map((usage, i) => (
                <View
                  key={i}
                  style={{
                    width: systemInfo.cpu.cores.length > 1 ? '47%' : '100%',
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  <Text style={{
                    width: 28,
                    fontSize: 10,
                    fontFamily: fonts.mono.regular,
                    color: colors.fg.muted,
                  }}>
                    C{i}
                  </Text>
                  <UsageStream
                    samples={coreHistory[i] ?? [usage]}
                    color={getUsageColor(usage)}
                    trackColor={colors.terminal.selection}
                    gradientId={`cpu-core-stream-fill-${i}`}
                    columns={CORE_HISTORY_SAMPLES}
                    height={22}
                    strokeWidth={1.75}
                    gap={3}
                  />
                  <Text style={{
                    width: 34,
                    marginLeft: spacing[2],
                    fontSize: 10,
                    fontFamily: fonts.mono.regular,
                    color: getUsageColor(usage),
                    textAlign: 'right',
                  }}>
                    {usage.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ─── MEMORY ─── */}
          <Card>
            <SectionHeader
              icon={null}
              label="Memory"
              right={
                <Text style={{ fontSize: 22, fontFamily: fonts.mono.regular, color: getUsageColor(systemInfo.memory.usedPercent) }}>
                  {systemInfo.memory.usedPercent.toFixed(0)}%
                </Text>
              }
            />
            <View style={{ marginBottom: spacing[3] }}>
              <AnimatedBar
                percent={systemInfo.memory.usedPercent}
                color={getUsageColor(systemInfo.memory.usedPercent)}
                height={5}
                trackColor={colors.terminal.selection}
              />
            </View>
            <StatTable
              rows={[
                { label: 'Used', value: formatBytes(systemInfo.memory.used), valueColor: getUsageColor(systemInfo.memory.usedPercent) },
                { label: 'Free', value: formatBytes(systemInfo.memory.free), valueColor: colors.terminal.green },
                { label: 'Total', value: formatBytes(systemInfo.memory.total) },
              ]}
            />
          </Card>

          {/* ─── DISK ─── */}
          {systemInfo.disk && systemInfo.disk.length > 0 && (
            <Card>
              <SectionHeader
                icon={<HardDrive size={12} color={colors.fg.subtle} />}
                label="Disk"
              />
              {systemInfo.disk.map((d, i) => {
                const color = getUsageColor(d.usedPercent);
                return (
                  <View key={i} style={{ marginBottom: i < systemInfo.disk.length - 1 ? spacing[3] : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ flex: 1, fontSize: 11, fontFamily: fonts.mono.regular, color: colors.terminal.fg }} numberOfLines={1}>
                        {d.mount}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: fonts.mono.regular, color }}>
                        {d.usedPercent.toFixed(0)}%
                      </Text>
                    </View>
                    <AnimatedBar percent={d.usedPercent} color={color} height={4} trackColor={colors.terminal.selection} />
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <Text style={{ flex: 1, fontSize: 9, fontFamily: fonts.mono.regular, color: colors.fg.subtle }}>
                        {d.filesystem}
                      </Text>
                      <Text style={{ fontSize: 9, fontFamily: fonts.mono.regular, color: colors.fg.subtle }}>
                        {formatBytes(d.used)} / {formatBytes(d.size)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {/* ─── BATTERY ─── */}
          {systemInfo.battery.hasBattery && (() => {
            const pct = systemInfo.battery.percent;
            const charging = systemInfo.battery.charging;
            const color = charging ? colors.terminal.green : getUsageColor(pct);

            return (
              <Card>
                <SectionHeader
                  icon={null}
                  label="Battery"
                  right={
                    <Text style={{ fontSize: 22, fontFamily: fonts.mono.regular, color }}>
                      {pct.toFixed(0)}%
                    </Text>
                  }
                />
                <View style={{ marginBottom: spacing[3] }}>
                  <AnimatedBar
                    percent={pct}
                    color={color}
                    height={5}
                    trackColor={colors.terminal.selection}
                  />
                </View>
                <StatTable
                  rows={[
                    { label: 'Status', value: charging ? 'Charging' : 'Discharging', valueColor: color },
                    ...(systemInfo.battery.timeRemaining != null
                      ? [{
                          label: charging ? 'Full in' : 'Remaining',
                          value: `${Math.floor(systemInfo.battery.timeRemaining / 60)}h ${systemInfo.battery.timeRemaining % 60}m`,
                        }]
                      : []),
                  ]}
                />
              </Card>
            );
          })()}

        </Animated.ScrollView>
      )}
    </View>
  );
}

export default memo(MonitorPanel);
