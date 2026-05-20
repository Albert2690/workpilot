import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0220', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (isAuthenticated) {
    if (user?.role === "admin") {
      return <Redirect href="/(admin)" />;
    } else {
      return <Redirect href="/(employee)" />;
    }
  }

  return <Redirect href="/(auth)/admin-login" />;
}
