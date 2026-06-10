import { useState, type ReactNode } from "react";
import { AuthContext } from "../services/AuthContext";
import { authService } from "../services/authService";
import type { User } from "../types";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accesstoken"),
  );
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLogged, setIsLogged] = useState<boolean>(!!accessToken);

  // Normal login (ID/PW)
  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem("accesstoken", accessToken);
    localStorage.setItem("refreshtoken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setAccessToken(accessToken);
    setUser(userData);
    setIsLogged(true);
  };

  // Social login logic (fetch profile after getting tokens)
  const loginSocial = async (accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem("accesstoken", accessToken);
      localStorage.setItem("refreshtoken", refreshToken);

      const userData = await authService.getProfile();
      localStorage.setItem("user", JSON.stringify(userData));

      setAccessToken(accessToken);
      setUser(userData);
      setIsLogged(true);
    } catch (error) {
      console.error("Social login failed:", error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("refreshtoken");
    localStorage.removeItem("user");
    setAccessToken(null);
    setUser(null);
    setIsLogged(false);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isLogged,
        setIsLogged,
        setAccessToken,
        login,
        loginSocial,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
