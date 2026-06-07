import { 
  View, Text, TextInput, TouchableOpacity, 
  Platform, Animated, Alert
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSignIn = () => {
    if (!phone || !password) {
      Alert.alert("Error", "Please enter both phone number and password");
      return;
    }
    
    login({ phone, password });
  };

  useEffect(() => {
    if (loginError) {
      Alert.alert("Login Failed", loginError.response?.data?.message || "Invalid credentials");
    }
  }, [loginError]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0220' }}>
      <LinearGradient
        colors={['#0f0220', '#1a0533', '#0f0220']}
        style={{ position: 'absolute', inset: 0 }}
      />
      
      {/* Decorative Premium Orbs */}
      <View style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: '#8B5CF6', opacity: 0.15 }} />
      <View style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#6D28D9', opacity: 0.1 }} />

      <KeyboardAwareScrollView 
        contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            padding: 24,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20
          }} 
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.select({ ios: 20, android: 80 })}
          keyboardShouldPersistTaps="handled"
        >
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', marginBottom: 48 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#8B5CF6', shadowOpacity: 0.2, shadowRadius: 20 }}>
              <Feather name="shield" size={36} color="#c495ff" />
            </View>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 8 }}>Admin Portal</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '600' }}>Workshop Management</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 32, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30 }}>
              
              {/* Phone Field */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4, fontWeight: '700' }}>Admin Phone Number</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, paddingHorizontal: 18, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Feather name="phone" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 14, color: '#fff', fontSize: 16 }}
                    placeholder="Enter phone number"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4, fontWeight: '700' }}>Security Key</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, paddingHorizontal: 18, height: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Feather name="lock" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 14, color: '#fff', fontSize: 16 }}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity onPress={handleSignIn} disabled={isLoggingIn}>
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#8B5CF6', shadowOpacity: 0.3, shadowRadius: 15 }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 10 }}>
                    {isLoggingIn ? 'Authenticating...' : 'Access Dashboard'}
                  </Text>
                  {!isLoggingIn && <Feather name="chevron-right" size={20} color="#fff" />}
                </LinearGradient>
              </TouchableOpacity>
              
            </View>

            {/* Switch to Employee Login */}
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/employee-login')}
              style={{ marginTop: 32, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Are you an employee? </Text>
              <Text style={{ color: '#c495ff', fontSize: 14, fontWeight: '700' }}>Login here</Text>
            </TouchableOpacity>
          </Animated.View>

      </KeyboardAwareScrollView>
    </View>
  );
}
