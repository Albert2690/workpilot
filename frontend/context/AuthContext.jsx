import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient, { setUnauthorizedHandler } from "../src/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastKnownRoleRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadStoredAuth();
    setUnauthorizedHandler(handleLogout);
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("userData");
      const storedLastRole = await AsyncStorage.getItem("lastUserRole");
      
      if (storedLastRole) {
        lastKnownRoleRef.current = storedLastRole;
      }
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (!storedLastRole) {
          lastKnownRoleRef.current = parsedUser?.role || (await AsyncStorage.getItem("userRole"));
        }
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Failed to load auth state", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (redirectRole) => {
    try {
      let role = redirectRole || user?.role || lastKnownRoleRef.current;
      if (!role) {
        const storedRole = await AsyncStorage.getItem("userRole");
        const storedUser = await AsyncStorage.getItem("userData");
        role = storedRole || (storedUser ? JSON.parse(storedUser)?.role : null);
      }
      lastKnownRoleRef.current = role;

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

  const updateStoredUser = async (updatedUser) => {
    if (!updatedUser) return;
    await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
    await AsyncStorage.setItem("userRole", updatedUser.role);
    lastKnownRoleRef.current = updatedUser.role;
    setUser(updatedUser);
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
      await AsyncStorage.setItem("lastUserRole", user.role);
      lastKnownRoleRef.current = user.role;
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
        updateStoredUser,
        lastRole: lastKnownRoleRef.current,
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
