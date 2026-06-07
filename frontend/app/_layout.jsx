import '../global.css';
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inEmployeeGroup = segments[0] === '(employee)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace(inEmployeeGroup ? '/(auth)/employee-login' : '/(auth)/admin-login');
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(employee)');
      }
    }
  }, [isAuthenticated, isLoading, router, segments, user?.role]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(employee)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <RootLayoutNav />
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
