import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../../src/api';
import apiRoutes from '../../src/apiRoutes';
import { useAuth } from '../../context/AuthContext';
import ToastComponent from '../../components/ToastComponent';

export default function SettingsScreen() {
  const { user, logout, updateStoredUser } = useAuth();
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user?.name, user?.phone]);

  const initials = useMemo(() => {
    const source = user?.name || 'Admin';
    return source.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    await logout('admin');
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
    <View style={{ flex: 1, backgroundColor: '#0f0220' }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0f0220', '#1a0533', '#0f0220']}
        style={{ position: 'absolute', inset: 0 }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0, marginBottom: 4 }}>Profile</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28 }}>Your administrator account details.</Text>

        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 28,
            padding: 22,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient
              colors={['rgba(139,92,246,0.95)', 'rgba(109,40,217,0.8)']}
              style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 18 }}
            >
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{initials}</Text>
            </LinearGradient>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: '#fff', fontSize: 21, fontWeight: '900' }}>{user?.name || 'Administrator'}</Text>
              <Text style={{ color: '#c495ff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 5 }}>{user?.role || 'admin'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 9 }}>
                <Feather name="phone" size={13} color="rgba(255,255,255,0.48)" />
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginLeft: 7 }}>{user?.phone || 'No phone number'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: 18, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 14, marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Feather name="edit-3" size={17} color="#c495ff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>Update profile</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>Update your administrator name and mobile number.</Text>
            </View>
          </View>

          <ProfileInput icon="user" label="Name" value={name} onChangeText={setName} placeholder="Full name" />
          <ProfileInput icon="phone" label="Mobile" value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" keyboardType="phone-pad" />

          <TouchableOpacity onPress={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', marginRight: 8 }}>
                {updateProfileMutation.isPending ? 'Updating...' : 'Update profile'}
              </Text>
              {!updateProfileMutation.isPending && <Feather name="check" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <InfoRow icon="info" title="App version" value={`v${appVersion}`} />

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 58,
            backgroundColor: 'rgba(239,68,68,0.1)',
            paddingHorizontal: 16,
            borderRadius: 20,
            marginTop: 18,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.22)',
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Feather name="log-out" size={20} color="#EF4444" />
          </View>
          <Text style={{ flex: 1, color: '#EF4444', fontSize: 15, fontWeight: '900' }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ProfileInput({ icon, label, ...props }) {
  return (
    <View>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 15 }}>
        <Feather name={icon} size={17} color="rgba(255,255,255,0.48)" />
        <TextInput
          {...props}
          placeholderTextColor="rgba(255,255,255,0.26)"
          style={{ flex: 1, color: '#fff', fontSize: 15, marginLeft: 12 }}
        />
      </View>
    </View>
  );
}

function InfoRow({ icon, title, value }) {
  return (
    <View style={{ padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Feather name={icon} size={17} color="#c495ff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>{value}</Text>
      </View>
    </View>
  );
}
