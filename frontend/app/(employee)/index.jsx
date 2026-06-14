import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import apiClient from '../../src/api';
import apiRoutes from '../../src/apiRoutes';
import { useAuth } from '../../context/AuthContext';
import {
  BookingCard,
  EmployeeShell,
  EmptyState,
  ScreenHeader,
  SectionHeader,
  SkeletonBlock,
  SummaryCard,
  employeeTheme,
} from '../../components/employee/EmployeeUI';

const fetchAssignedBookings = async () => {
  const res = await apiClient.get(apiRoutes.EMPLOYEE.GET_ASSIGNED_BOOKINGS);
  return res.data.bookings || [];
};

const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['employee-bookings'],
    queryFn: fetchAssignedBookings,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const bookings = data || [];
  const total = bookings.length;
  const completed = bookings.filter((item) => item.status === 'completed').length;
  const pending = bookings.filter((item) => ['pending', 'assigned', 'in_progress'].includes(item.status)).length;
  const earnings = bookings.reduce((sum, item) => sum + Number(item.finalAmount || item.estimateAmount || 0), 0);
  const recentBookings = bookings.slice(0, 3);
  const completionPercent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <EmployeeShell onRefresh={onRefresh} refreshing={refreshing}>
      <ScreenHeader
        eyebrow="Employee Panel"
        title={`Hi, ${user?.name || 'Employee'}`}
        subtitle="Track assigned workshop jobs, pending work, and recent service activity."
        action={
          <TouchableOpacity
            onPress={() => router.push('/(employee)/settings')}
            style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Feather name="user" size={20} color={employeeTheme.accent} />
          </TouchableOpacity>
        }
      />

      {isError ? (
        <View style={{ marginBottom: 16, padding: 14, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' }}>
          <Text style={{ color: employeeTheme.danger, fontSize: 12, fontWeight: '700' }}>
            Unable to load assigned bookings. Please refresh.
          </Text>
        </View>
      ) : null}

      {isLoading || isFetching ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map((item) => <SkeletonBlock key={item} height={128} width="47%" />)}
          </View>
          <SkeletonBlock height={150} />
          <SkeletonBlock height={92} />
          <SkeletonBlock height={92} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
            <SummaryCard icon="calendar" label="Total bookings" value={total} />
            <SummaryCard icon="check-circle" label="Completed" value={completed} tone="success" />
            <SummaryCard icon="clock" label="Pending" value={pending} tone="warning" />
            {/* <SummaryCard icon="credit-card" label="Earnings" value={currency(earnings)} /> */}
          </View>

          <SectionHeader title="Status overview" />
          <View style={{ padding: 18, borderRadius: 22, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: employeeTheme.text, fontSize: 16, fontWeight: '800' }}>Completion rate</Text>
              <Text style={{ color: employeeTheme.accent, fontSize: 18, fontWeight: '800' }}>{completionPercent}%</Text>
            </View>
            <View style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <View style={{ width: `${completionPercent}%`, height: '100%', borderRadius: 999, backgroundColor: employeeTheme.accent }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <SmallMetric label="Active" value={pending} />
              <SmallMetric label="Closed" value={completed} />
            </View>
          </View>

          <SectionHeader title="Quick actions" />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
            <QuickAction icon="search" label="Find booking" onPress={() => router.push('/(employee)/bookings')} />
            <QuickAction icon="refresh-cw" label="Refresh" onPress={refetch} />
          </View>

          <SectionHeader title="Recent bookings" actionLabel="View all" onAction={() => router.push('/(employee)/bookings')} />
          {recentBookings.length ? (
            recentBookings.map((booking) => <BookingCard key={booking._id} booking={booking} compact />)
          ) : (
            <EmptyState
              icon="calendar"
              title="No assigned bookings"
              message="New jobs assigned by the admin will appear here."
              actionLabel="Refresh"
              onAction={refetch}
            />
          )}
        </>
      )}
    </EmployeeShell>
  );
}

function SmallMetric({ label, value }) {
  return (
    <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
      <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
      <Text style={{ color: employeeTheme.text, fontSize: 20, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, minHeight: 58, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
    >
      <Feather name={icon} size={17} color={employeeTheme.accent} />
      <Text style={{ color: employeeTheme.accent, fontSize: 13, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  );
}
