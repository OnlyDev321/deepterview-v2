import { createContext } from "react";
import type { User } from "../types";

interface AuthContextType {
  isLogged: boolean;
  user: User | null;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  setIsLogged: (isLogged: boolean) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  loginSocial: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLogged: false,
  user: null,
  setIsLogged: () => {},
  accessToken: null,
  setAccessToken: () => {},
  login: () => {},
  loginSocial: async () => {},
  logout: () => {},
});
