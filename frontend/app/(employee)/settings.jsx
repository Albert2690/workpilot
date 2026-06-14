import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import apiClient from '../../src/api';
import apiRoutes from '../../src/apiRoutes';
import { useAuth } from '../../context/AuthContext';
import { EmployeeShell, ScreenHeader, employeeTheme } from '../../components/employee/EmployeeUI';
import ToastComponent from '../../components/ToastComponent';

export default function EmployeeProfile() {
  const { user, logout, updateStoredUser } = useAuth();
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user?.name, user?.phone]);

  const initials = useMemo(() => {
    const source = user?.name || 'Employee';
    return source.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    await logout('employee');
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.patch(apiRoutes.AUTH.UPDATE_PROFILE, payload);
      return res.data;
    },
    onSuccess: async (data) => {
      await updateStoredUser(data.user);
      ToastComponent('Success', data.message);
    },
    onError: (error) => {
      ToastComponent('Error', error?.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleUpdateProfile = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      ToastComponent('Error', 'Please enter full name.');
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      ToastComponent('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    updateProfileMutation.mutate({ name: trimmedName, phone: trimmedPhone });
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

      <View style={{ padding: 18, borderRadius: 24, backgroundColor: employeeTheme.panel, borderWidth: 1, borderColor: employeeTheme.border, gap: 14, marginBottom: 18 }}>
        {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Feather name="edit-3" size={17} color={employeeTheme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: employeeTheme.text, fontSize: 15, fontWeight: '900' }}>Update profile</Text>
            <Text style={{ color: employeeTheme.muted, fontSize: 12, marginTop: 3 }}>Changing mobile resets your password to the new mobile number.</Text>
          </View>
        </View> */}

        <ProfileInput icon="user" label="Name" value={name} onChangeText={setName} placeholder="Full name" />
        <ProfileInput icon="phone" label="Mobile" value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" keyboardType="phone-pad" />

        {/* <TouchableOpacity onPress={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
          >
            <Text style={{ color: employeeTheme.text, fontSize: 15, fontWeight: '900', marginRight: 8 }}>
              {updateProfileMutation.isPending ? 'Updating...' : 'Update profile'}
            </Text>
            {!updateProfileMutation.isPending && <Feather name="check" size={18} color={employeeTheme.text} />}
          </LinearGradient>
        </TouchableOpacity> */}
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

function ProfileInput({ icon, label, ...props }) {
  return (
    <View>
      <Text editable={false} style={{ color: employeeTheme.faint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 16, backgroundColor: employeeTheme.panelStrong, borderWidth: 1, borderColor: employeeTheme.border, paddingHorizontal: 15 }}>
        <Feather name={icon} size={17} color={employeeTheme.muted} />
        <TextInput
          {...props}
          editable={false}
          placeholderTextColor="rgba(255,255,255,0.26)"
          style={{ flex: 1, color: employeeTheme.text, fontSize: 15, marginLeft: 12 }}
        />
      </View>
    </View>
  );
}
