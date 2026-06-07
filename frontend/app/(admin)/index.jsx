import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRef, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CalendarProvider, WeekCalendar } from 'react-native-calendars';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/api';
import apiRoutes from '../../src/apiRoutes';

const toDateKey = (date = new Date()) => date.toISOString().split('T')[0];

const fetchDashboard = async (date) => {
  const res = await apiClient.get(apiRoutes.ADMIN.DASHBOARD, {
    params: { date },
  });
  return res.data;
};

export default function DashboardScreen() {
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard', selectedDate],
    queryFn: () => fetchDashboard(selectedDate),
  });

  const stats = data?.stats || {};
  const selectedDateBookings = data?.selectedDateBookings || [];
  const recentBookings = data?.recentBookings || [];

  const markedDates = useMemo(() => ({
    ...(data?.markedDates || {}),
    [selectedDate]: {
      ...(data?.markedDates?.[selectedDate] || {}),
      selected: true,
      selectedColor: '#8B5CF6',
      selectedTextColor: '#fff',
      dotColor: '#fff',
    },
  }), [data?.markedDates, selectedDate]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0220' }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0f0220', '#1a0533', '#0f0220']}
        style={{ position: 'absolute', inset: 0 }}
      />

      <View style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#8B5CF6', opacity: 0.15 }} />
      <View style={{ position: 'absolute', top: 300, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#6D28D9', opacity: 0.1 }} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Workshop Master</Text>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>Dashboard</Text>
            </View>
            <TouchableOpacity
              onPress={refetch}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="refresh-cw" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {isError ? (
            <View style={{ marginHorizontal: 24, marginBottom: 14, padding: 14, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
              <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Unable to load dashboard data. Pull to retry or tap refresh.</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 12 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Calendar</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{selectedDateBookings.length} bookings</Text>
            </View>

            <View style={{ marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <CalendarProvider
                date={selectedDate}
                onDateChanged={(date) => setSelectedDate(date)}
                showTodayButton={false}
              >
                <WeekCalendar
                  firstDay={1}
                  markedDates={markedDates}
                  allowShadow={false}
                  theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: 'rgba(255,255,255,0.45)',
                    dayTextColor: '#fff',
                    todayTextColor: '#c495ff',
                    selectedDayBackgroundColor: '#8B5CF6',
                    selectedDayTextColor: '#fff',
                    monthTextColor: '#fff',
                    textDayFontWeight: '700',
                    textMonthFontWeight: '800',
                    textDayHeaderFontWeight: '700',
                    arrowColor: '#c495ff',
                    dotColor: '#c495ff',
                    selectedDotColor: '#fff',
                  }}
                  style={{ backgroundColor: 'transparent', minHeight: 104 }}
                />
              </CalendarProvider>
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Overview</Text>
            {isLoading ? (
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4].map((item) => <SkeletonCard key={item} />)}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <StatCard icon="calendar" label="Total bookings" value={stats.totalBookings || 0} />
                <StatCard icon="dollar-sign" label="Total collection" value={`₹${Number(stats.totalCollection || 0).toLocaleString('en-IN')}`} tone="#10b981" />
                <StatCard icon="calendar" label="Today's bookings" value={stats.todayBookings || 0} tone="#3b82f6" />
                <StatCard icon="clock" label="Total pending" value={stats.totalPending || 0} tone="#f59e0b" />
                <StatCard icon="credit-card" label="Today's collection" value={`₹${Number(stats.todayCollection || 0).toLocaleString('en-IN')}`} tone="#c495ff" />
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Selected Day</Text>
            {isLoading ? (
              <SkeletonList />
            ) : selectedDateBookings.length ? (
              selectedDateBookings.map((booking) => <BookingRow key={booking._id} booking={booking} />)
            ) : (
              <EmptyPanel icon="calendar" text="No bookings on this date." />
            )}
          </View>

          <View style={{ paddingHorizontal: 24, marginTop: 20, paddingBottom: 120 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Recent Activity</Text>
            {isLoading ? (
              <SkeletonList />
            ) : recentBookings.length ? (
              recentBookings.map((booking) => <BookingRow key={booking._id} booking={booking} />)
            ) : (
              <EmptyPanel icon="inbox" text="No recent bookings found." />
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, tone = '#c495ff' }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: '47%', padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' }}>
        <Feather name={icon} size={20} color={tone} />
      </View> */}
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function BookingRow({ booking }) {
  const statusConfig = getStatusConfig(booking.status);
  const createdAt = booking.createdAt ? new Date(booking.createdAt) : null;
  const time = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '--';

  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 48, height: 48, backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <Feather name="tool" size={20} color="#c495ff" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 3 }}>{booking.vehicleName || 'Vehicle service'}</Text>
        <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{booking.description || booking.complaintType || 'Service'} • {booking.customerName}</Text>
        <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 3 }}>{booking.assignedTo?.name || 'Unassigned'} • ₹{booking.finalAmount || booking.estimateAmount || 0}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{time}</Text>
        <View style={{ marginTop: 6, backgroundColor: statusConfig.bg, borderWidth: 1, borderColor: statusConfig.border, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ color: statusConfig.color, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{booking.status}</Text>
        </View>
      </View>
    </View>
  );
}

function EmptyPanel({ icon, text }) {
  return (
    <View style={{ alignItems: 'center', padding: 26, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
      <Feather name={icon} size={34} color="rgba(255,255,255,0.18)" />
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 12 }}>{text}</Text>
    </View>
  );
}

function SkeletonCard() {
  return <View style={{ flexGrow: 1, flexBasis: '47%', height: 132, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} />;
}

function SkeletonList() {
  return (
    <View>
      {[1, 2].map((item) => (
        <View key={item} style={{ height: 84, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />
      ))}
    </View>
  );
}

function getStatusConfig(status) {
  switch (status) {
    case 'completed':
      return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
    case 'in_progress':
      return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.24)' };
    case 'assigned':
      return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' };
    default:
      return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
  }
}
