import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
// Define local user type with onboarding fields
type SafeUser = {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPublicProfile: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  plan: string;
  preferredTradeInput?: string;
  defaultTradeVisibility?: string;
  preferredTheme?: string;
  hasCompletedOnboarding?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

interface AuthContextData {
  user: SafeUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

export function useAuth(): AuthContextData {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const token = localStorage.getItem('auth_token');

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      
      return response.json();
    },
    retry: false,
    enabled: !!token,
  });

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    queryClient.clear();
    setLocation('/auth');
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente.',
    });
  };

  return {
    user: user || null,
    token,
    isLoading: !!token && isLoading,
    isAuthenticated: !!user && !!token,
    logout,
  };
}
