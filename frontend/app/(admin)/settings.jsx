import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const initials = useMemo(() => {
    const source = user?.name || 'Admin';
    return source.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    await logout('admin');
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
