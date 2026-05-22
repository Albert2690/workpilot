import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { EmployeeShell, ScreenHeader, employeeTheme } from '../../components/employee/EmployeeUI';

export default function EmployeeProfile() {
  const { user, logout } = useAuth();
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const initials = useMemo(() => {
    const source = user?.name || 'Employee';
    return source.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    await logout('employee');
  };

  return (
    <EmployeeShell>
      <ScreenHeader title="Profile" subtitle="Your employee account details." />

      <View style={{ padding: 22, borderRadius: 26, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={['rgba(139,92,246,0.34)', 'rgba(109,40,217,0.18)']}
            style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' }}
          >
            <Text style={{ color: employeeTheme.accent, fontSize: 22, fontWeight: '900' }}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0, marginLeft: 16 }}>
            <Text numberOfLines={1} style={{ color: employeeTheme.text, fontSize: 20, fontWeight: '900' }}>{user?.name || 'Employee'}</Text>
            <Text style={{ color: employeeTheme.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>{user?.role || 'employee'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Feather name="phone" size={13} color={employeeTheme.muted} />
              <Text style={{ color: employeeTheme.muted, fontSize: 13, marginLeft: 7 }}>{user?.phone || 'No phone number'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ padding: 16, borderRadius: 20, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, marginBottom: 18, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Feather name="info" size={17} color={employeeTheme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: employeeTheme.text, fontSize: 14, fontWeight: '800' }}>App version</Text>
          <Text style={{ color: employeeTheme.muted, fontSize: 12, marginTop: 3 }}>v{appVersion}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }}
      >
        <Feather name="log-out" size={20} color={employeeTheme.danger} style={{ marginRight: 14 }} />
        <Text style={{ flex: 1, color: employeeTheme.danger, fontSize: 15, fontWeight: '900' }}>Logout</Text>
      </TouchableOpacity>
    </EmployeeShell>
  );
}
