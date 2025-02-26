import React, { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext<{
  user: User | null;
  loginMutation: any;
  registerMutation: any;
  logoutMutation: any;
  isLoading: boolean;
  error: Error | null;
}>({ user: null, loginMutation: null, registerMutation: null, logoutMutation: null, isLoading: false, error: null });

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
    onError: (err) => {
      setError(err);
      setIsLoading(false);
    },
    onQueryError: (err) => {
      setError(err);
      setIsLoading(false);
    },
    onSettled: () => setIsLoading(false),
    enabled: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Login failed";
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setIsLoading(false),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Registration failed";
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setIsLoading(false),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      setError(null);
      await fetch("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setIsLoading(false),
  });


  return (
    <AuthContext.Provider value={{ user: user || null, loginMutation, registerMutation, logoutMutation, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}