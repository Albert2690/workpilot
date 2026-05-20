import { View, Text, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { EmployeeShell, ScreenHeader, SectionHeader, employeeTheme } from '../../components/employee/EmployeeUI';
import ToastComponent from '../../components/ToastComponent';

export default function EmployeeProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [compactCards, setCompactCards] = useState(false);

  const initials = useMemo(() => {
    const source = user?.name || name || 'Employee';
    return source.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }, [name, user?.name]);

  const handleMockSaveProfile = () => {
    ToastComponent('Info', 'Profile update API is not available yet.');
  };

  const handleMockChangePassword = () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Missing Fields', 'Enter current and new password.');
      return;
    }
    ToastComponent('Info', 'Change password API is not available yet.');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <EmployeeShell>
      <ScreenHeader title="Profile" subtitle="Manage your employee account, preferences, and access." />

      <View style={{ padding: 20, borderRadius: 26, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, marginBottom: 22 }}>
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

      <SectionHeader title="Edit profile" />
      <View style={{ padding: 18, borderRadius: 22, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, gap: 14, marginBottom: 22 }}>
        <ProfileInput icon="user" label="Name" value={name} onChangeText={setName} placeholder="Full name" />
        <ProfileInput icon="phone" label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
        <TouchableOpacity onPress={handleMockSaveProfile}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          >
            <Text style={{ color: employeeTheme.text, fontSize: 15, fontWeight: '900' }}>Save profile</Text>
            <Feather name="check" size={18} color={employeeTheme.text} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <SectionHeader title="Change password" />
      <View style={{ padding: 18, borderRadius: 22, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, gap: 14, marginBottom: 22 }}>
        <ProfileInput icon="lock" label="Current password" value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" secureTextEntry />
        <ProfileInput icon="shield" label="New password" value={newPassword} onChangeText={setNewPassword} placeholder="New password" secureTextEntry />
        <TouchableOpacity
          onPress={handleMockChangePassword}
          style={{ height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.28)', backgroundColor: 'rgba(139,92,246,0.1)' }}
        >
          <Text style={{ color: employeeTheme.accent, fontSize: 14, fontWeight: '900' }}>Update password</Text>
        </TouchableOpacity>
      </View>

      <SectionHeader title="Preferences" />
      <View style={{ borderRadius: 22, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, overflow: 'hidden', marginBottom: 22 }}>
        <PreferenceRow icon="bell" title="Job notifications" subtitle="Notify when admin assigns work" value={pushEnabled} onValueChange={setPushEnabled} />
        <PreferenceRow icon="layout" title="Compact booking cards" subtitle="Use denser cards in booking lists" value={compactCards} onValueChange={setCompactCards} />
      </View>

      <View style={{ padding: 14, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)', marginBottom: 18 }}>
        <Text style={{ color: employeeTheme.warning, fontSize: 12, fontWeight: '700', lineHeight: 18 }}>
          Missing APIs: employee profile update and change password endpoints are not present in the backend. These controls are wired as mock UI until those routes exist.
        </Text>
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

function ProfileInput({ icon, label, ...props }) {
  return (
    <View>
      <Text style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 16, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border, paddingHorizontal: 15 }}>
        <Feather name={icon} size={17} color={employeeTheme.muted} />
        <TextInput
          {...props}
          placeholderTextColor="rgba(255,255,255,0.26)"
          style={{ flex: 1, color: employeeTheme.text, fontSize: 15, marginLeft: 12 }}
        />
      </View>
    </View>
  );
}

function PreferenceRow({ icon, title, subtitle, value, onValueChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
        <Feather name={icon} size={18} color={employeeTheme.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
        <Text style={{ color: employeeTheme.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
        <Text numberOfLines={1} style={{ color: employeeTheme.muted, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(139,92,246,0.45)' }}
        thumbColor={value ? employeeTheme.accent : 'rgba(255,255,255,0.55)'}
      />
    </View>
  );
}
