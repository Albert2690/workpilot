import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [userRole, setUserRole] = useState('admin');
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const getRole = async () => {
      const role = await AsyncStorage.getItem('userRole');
      if (role) setUserRole(role);
    };
    getRole();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const SettingItem = ({ icon, label, value, type = 'chevron', onPress, color = '#c495ff' }) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={type === 'switch'}
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        padding: 16, 
        borderRadius: 20, 
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={{ flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' }}>{label}</Text>
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onPress}
          trackColor={{ false: '#3e3e3e', true: '#8B5CF6' }}
          thumbColor={Platform.OS === 'ios' ? '#fff' : value ? '#c495ff' : '#f4f3f4'}
        />
      ) : (
        <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0220' }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0f0220', '#1a0533', '#0f0220']}
        style={{ position: 'absolute', inset: 0 }}
      />
      
      {/* Decorative Orbs */}
      <View style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#8B5CF6', opacity: 0.1 }} />
      <View style={{ position: 'absolute', bottom: 100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#6D28D9', opacity: 0.1 }} />

      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: 24, 
          paddingTop: insets.top + 24, 
          paddingBottom: 140 
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 }}>Settings</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 32 }}>Manage your workshop preferences</Text>

        {/* Profile Card */}
        <View style={{ 
          backgroundColor: 'rgba(139,92,246,0.1)', 
          borderRadius: 28, 
          padding: 24, 
          marginBottom: 32,
          borderWidth: 1,
          borderColor: 'rgba(139,92,246,0.2)',
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginRight: 20 }}>
            <Feather name="user" size={32} color="#fff" />
          </View>
          <View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Workshop Owner</Text>
            <Text style={{ color: '#c495ff', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Administrator</Text>
          </View>
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 }}>Preferences</Text>
        <SettingItem 
          icon="bell" 
          label="Push Notifications" 
          type="switch" 
          value={notifications} 
          onPress={() => setNotifications(!notifications)} 
        />
        <SettingItem 
          icon="moon" 
          label="Dark Mode" 
          type="switch" 
          value={darkMode} 
          onPress={() => setDarkMode(!darkMode)} 
        />
        <SettingItem icon="globe" label="Language" />

        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 24, marginBottom: 16, marginLeft: 4 }}>Workshop</Text>
        <SettingItem icon="tool" label="Service Categories" />
        <SettingItem icon="users" label="Team Management" />
        <SettingItem icon="file-text" label="Business Reports" />

        <TouchableOpacity 
          onPress={handleLogout}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: 'rgba(239,68,68,0.1)', 
            padding: 16, 
            borderRadius: 20, 
            marginTop: 40,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.2)'
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Feather name="log-out" size={20} color="#EF4444" />
          </View>
          <Text style={{ flex: 1, color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>WorkPilot v1.0.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}
