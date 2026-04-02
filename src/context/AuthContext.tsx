import React, { createContext, useContext, useState } from "react";

interface LocalUser {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

interface AuthContextType {
  user: LocalUser | null;
  session: unknown;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);

  const signUp = async (email: string, _password: string, fullName: string) => {
    const newUser: LocalUser = {
      id: crypto.randomUUID(),
      email,
      user_metadata: { full_name: fullName },
    };
    setUser(newUser);
    return { error: null };
  };

  const signIn = async (email: string, _password: string) => {
    const loggedIn: LocalUser = {
      id: crypto.randomUUID(),
      email,
      user_metadata: { full_name: email.split("@")[0] },
    };
    setUser(loggedIn);
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session: user, loading: false, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
