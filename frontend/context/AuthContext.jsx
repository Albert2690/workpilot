import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient, { setUnauthorizedHandler } from "../src/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadStoredAuth();
    setUnauthorizedHandler(handleLogout);
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("userData");
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load auth state", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const role = user?.role;
      await AsyncStorage.multiRemove(["authToken", "userData", "userRole"]);
      setToken(null);
      setUser(null);
      queryClient.clear();
      
      if (role === "employee") {
        router.replace("/(auth)/employee-login");
      } else {
        router.replace("/(auth)/admin-login");
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }) => {
      const response = await apiClient.post("/common/login", { phone, password });
      return response.data;
    },
    onSuccess: async (data) => {
      const { token, user } = data;
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      await AsyncStorage.setItem("userRole", user.role);
      setToken(token);
      setUser(user);
      
      // Redirect based on role
      if (user.role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(employee)");
      }
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
