import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#c495ff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarShowLabel: true,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },

        tabBarStyle: {
          backgroundColor: 'rgba(15,2,32,0.95)',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 5,
          paddingTop: 6,
        },

        // ✅ Safe background (Blur only for mobile)
        tabBarBackground: () => (
          <View style={styles.background}>
            {Platform.OS !== 'web' && (
              <BlurView
                tint="dark"
                intensity={80}
                style={StyleSheet.absoluteFill}
              />
            )}

            {/* top border line */}
            <View style={styles.topBorder} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Feather name="grid" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => (
            <Feather name="calendar" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="employees"
        options={{
          title: 'Team',
          tabBarIcon: ({ color }) => (
            <Feather name="users" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(15,2,32,0.95)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});