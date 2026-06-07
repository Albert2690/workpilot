import { View, Text, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const employeeTheme = {
  bg: '#0f0220',
  panel: 'rgba(255,255,255,0.03)',
  panelStrong: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  text: '#fff',
  muted: 'rgba(255,255,255,0.5)',
  faint: 'rgba(255,255,255,0.28)',
  accent: '#c495ff',
  purple: '#8B5CF6',
  purpleDark: '#6D28D9',
  danger: '#EF4444',
  success: '#10b981',
  warning: '#f59e0b',
};

export function EmployeeShell({ children, scroll = true, contentStyle, topPadding = 24, onRefresh, refreshing = false }) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const body = (
    <Animated.View style={[{ opacity: fadeAnim, paddingHorizontal: 24, paddingTop: insets.top + topPadding, paddingBottom: 120 }, contentStyle]}>
      {children}
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: employeeTheme.bg }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0f0220', '#1a0533', '#0f0220']}
        style={{ position: 'absolute', inset: 0 }}
      />
      <View style={{ position: 'absolute', top: -70, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: employeeTheme.purple, opacity: 0.12 }} />
      <View style={{ position: 'absolute', bottom: 160, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: employeeTheme.purpleDark, opacity: 0.08 }} />

      {scroll ? (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={employeeTheme.accent}
                colors={[employeeTheme.accent]}
              />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : body}
    </View>
  );
}

export function ScreenHeader({ eyebrow, title, subtitle, action }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <View style={{ flex: 1, paddingRight: 14 }}>
        {eyebrow ? (
          <Text style={{ color: employeeTheme.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 5 }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={{ color: employeeTheme.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>{title}</Text>
        {subtitle ? <Text style={{ color: employeeTheme.muted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 8 }}>
      <Text style={{ color: employeeTheme.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: employeeTheme.accent, fontSize: 13, fontWeight: '700' }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SummaryCard({ icon, label, value, tone = 'accent' }) {
  const toneColor = tone === 'success' ? employeeTheme.success : tone === 'warning' ? employeeTheme.warning : employeeTheme.accent;
  return (
    <View style={{ flex: 1, minWidth: 145, padding: 18, borderRadius: 22, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border }}>
      <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(139,92,246,0.13)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Feather name={icon} size={19} color={toneColor} />
      </View>
      <Text style={{ color: employeeTheme.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: employeeTheme.text, fontSize: 25, fontWeight: '800', marginTop: 5 }}>{value}</Text>
    </View>
  );
}

export function StatusPill({ status, paymentStatus }) {
  const value = (paymentStatus || status || 'pending').replace('_', ' ');
  const normalized = value.toLowerCase();
  const config =
    normalized.includes('complete') || normalized.includes('paid')
      ? { color: employeeTheme.success, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)' }
      : normalized.includes('cancel')
        ? { color: employeeTheme.danger, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' }
        : normalized.includes('progress') || normalized.includes('assigned')
          ? { color: employeeTheme.accent, bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.24)' }
          : { color: employeeTheme.warning, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };

  return (
    <View style={{ backgroundColor: config.bg, borderWidth: 1, borderColor: config.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 }}>
      <Text style={{ color: config.color, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 }}>{value}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction }) {
  return (
    <View style={{ alignItems: 'center', padding: 30, borderRadius: 24, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border }}>
      <Feather name={icon} size={42} color="rgba(255,255,255,0.18)" />
      <Text style={{ color: employeeTheme.text, fontSize: 17, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>{title}</Text>
      {message ? <Text style={{ color: employeeTheme.muted, fontSize: 13, lineHeight: 19, marginTop: 7, textAlign: 'center' }}>{message}</Text> : null}
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} style={{ marginTop: 18, paddingHorizontal: 16, height: 42, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.16)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.28)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: employeeTheme.accent, fontWeight: '800', fontSize: 13 }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SkeletonBlock({ height = 80, width = '100%', radius = 18, style }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View 
      style={[{ height, width, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', opacity: anim }, style]} 
    />
  );
}

export function BookingCard({ booking, compact = false }) {
  const createdAt = booking?.createdAt ? new Date(booking.createdAt) : null;
  const dateLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not scheduled';
  const timeLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '--';
  const vehicleBrand = booking?.vehicleBrand?.brandName || booking?.vehicleBrand?.name || '';

  return (
    <View style={{ backgroundColor: employeeTheme.panel, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: employeeTheme.border, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: employeeTheme.text, fontSize: 16, fontWeight: '800' }}>{booking?.customerName || 'Customer'}</Text>
          <Text numberOfLines={1} style={{ color: employeeTheme.accent, fontSize: 13, fontWeight: '700', marginTop: 4 }}>{booking?.description || booking?.complaintType || 'Service booking'}</Text>
        </View>
        <StatusPill status={booking?.status} />
      </View>

      <View style={{ marginTop: 14, gap: 10 }}>
        <MetaRow icon="truck" label="Vehicle" value={`${vehicleBrand ? `${vehicleBrand} ` : ''}${booking?.vehicleName || 'Vehicle'}${booking?.vehicleNumber ? ` • ${booking.vehicleNumber}` : ''}`} />
        {!compact ? <MetaRow icon="calendar" label="Date & time" value={`${dateLabel} • ${timeLabel}`} /> : null}
        {!compact ? <MetaRow icon="credit-card" label="Payment" value={booking?.finalAmount ? `Paid • ₹${booking.finalAmount}` : `Estimate • ₹${booking?.estimateAmount || 0}`} /> : null}
      </View>
    </View>
  );
}

function MetaRow({ icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', marginRight: 10 }}>
        <Feather name={icon} size={14} color={employeeTheme.muted} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.76)', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}
