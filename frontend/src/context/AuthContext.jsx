import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      profilePhoto: userData.profilePhoto || userData.profile_photo || null,
    };
  };

  const setSession = ({ user: userData }) => {
    setUser(normalizeUser(userData));
  };

  const clearSession = () => {
    setUser(null);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const data = await api.auth.getMe();
        setSession({ user: data?.user || null });
      } catch (_error) {
        localStorage.removeItem("vidyamitra_token");
        clearSession();
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    if (data?.token) {
      localStorage.setItem("vidyamitra_token", data.token);
    }
    setSession({ user: data?.user });
    return data;
  };

  const register = async ({ name, email, password }) => {
    return api.auth.register({ name, email, password });
  };

  const verifyOtp = async ({ email, otp }) => {
    return api.auth.verifyOtp({ email, otp });
  };

  const forgotPassword = async ({ email }) => {
    return api.auth.forgotPassword({ email });
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    return api.auth.resetPassword({ email, otp, newPassword });
  };

  const updateProfile = async (newData) => {
    const payload = {};

    if (newData.name !== undefined) payload.name = newData.name;
    if (newData.profilePhoto !== undefined) payload.profilePhoto = newData.profilePhoto;

    const data = await api.auth.updateMe(payload);
    setSession({ user: data?.user });
    return data;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (_error) {
      // Even if backend logout fails, clear local auth state.
    }
    localStorage.removeItem("vidyamitra_token");
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      authLoading,
      login,
      register,
      verifyOtp,
      forgotPassword,
      resetPassword,
      logout,
      updateProfile,
    }),
    [user, authLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

