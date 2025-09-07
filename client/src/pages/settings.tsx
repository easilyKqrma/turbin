import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ui/theme-provider";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { 
  Settings, 
  User, 
  Shield, 
  Palette, 
  Save, 
  Eye, 
  EyeOff, 
  LogOut, 
  Trash2,
  Sun,
  Moon,
  Monitor,
  Computer,
  Smartphone,
  AlertTriangle,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";

interface UserSettings {
  username: string;
  email: string;
  preferredTradeInput: 'modal' | 'carousel';
  defaultTradeVisibility: 'public' | 'private';
  preferredTheme: 'light' | 'dark' | 'system';
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<UserSettings>({
    username: '',
    email: '',
    preferredTradeInput: 'modal',
    defaultTradeVisibility: 'private',
    preferredTheme: 'system'
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Fetch user settings
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['/api/user/settings'],
    enabled: !!user
  });

  useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      setSettings({
        username: (userSettings as any).username || '',
        email: (userSettings as any).email || '',
        preferredTradeInput: (userSettings as any).preferredTradeInput || 'modal',
        defaultTradeVisibility: (userSettings as any).defaultTradeVisibility || 'private',
        preferredTheme: (userSettings as any).preferredTheme || 'system'
      });
    }
  }, [userSettings]);

  // Update general settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { settings: Partial<UserSettings>; password: string }) => {
      const response = await apiRequest('PUT', '/api/user/settings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      setRequiresPassword('');
      setVerificationPassword('');
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    },
  });

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      const response = await apiRequest('PUT', '/api/user/password', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not change password",
        variant: "destructive",
      });
    },
  });

  // Delete account
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('DELETE', '/api/user/account', { password });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      logout();
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete account",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    if (!verificationPassword) {
      setRequiresPassword('settings');
      return;
    }

    updateSettingsMutation.mutate({
      settings,
      password: verificationPassword
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    const newSettings = { ...settings, preferredTheme: newTheme };
    setSettings(newSettings);
    setTheme(newTheme);
    // Auto-save theme change
    savePreferencesAutomatic({ preferredTheme: newTheme });
  };

  const savePreferencesAutomatic = async (preferences: Partial<UserSettings>) => {
    try {
      const response = await apiRequest('PUT', '/api/user/preferences', preferences);
      const result = await response.json();
      toast({
        title: "Preferencia actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const handleDeleteAccount = () => {
    // Check if the confirmation phrase is correct (case insensitive)
    const correctPhrase = 'delete my account';
    const enteredPhrase = deleteConfirmationText.toLowerCase().trim();
    
    if (enteredPhrase !== correctPhrase) {
      toast({
        title: "Frase incorrecta",
        description: "Debes escribir exactamente: delete my account",
        variant: "destructive",
      });
      return;
    }

    if (!verificationPassword) {
      setRequiresPassword('delete');
      return;
    }

    deleteAccountMutation.mutate(verificationPassword);
    setShowDeleteConfirmation(false);
    setDeleteConfirmationText('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 mt-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Settings className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your account and customize your experience in gmetrics
            </p>
          </div>

          <div className="space-y-8">
            {/* Account Settings */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <span>Account information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-2"
                      data-testid="input-username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-2"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                {requiresPassword === 'settings' && (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <p>To save changes, enter your current password:</p>
                        <div className="flex space-x-3">
                          <Input
                            type="password"
                            placeholder="Current password"
                            value={verificationPassword}
                            onChange={(e) => setVerificationPassword(e.target.value)}
                            className="max-w-sm"
                            data-testid="input-verification-password"
                          />
                          <Button
                            onClick={handleSaveSettings}
                            disabled={updateSettingsMutation.isPending}
                            data-testid="button-confirm-save"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="w-full md:w-auto"
                  data-testid="button-save-account"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span>Cambiar contraseña</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="mt-2 pr-10"
                        data-testid="input-current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                        onClick={() => setShowPasswords(!showPasswords)}
                        data-testid="button-toggle-password-visibility"
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <Input
                        id="newPassword"
                        type={showPasswords ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="mt-2"
                        data-testid="input-new-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type={showPasswords ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="mt-2"
                        data-testid="input-confirm-password"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword}
                    className="w-full md:w-auto"
                    data-testid="button-change-password"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Cambiar contraseña
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-blue-400" />
                  <span>Preferencias</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <Label className="text-base font-semibold">Tema de la aplicación</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <Button
                      variant={settings.preferredTheme === 'light' ? "default" : "outline"}
                      onClick={() => handleThemeChange('light')}
                      className="justify-start h-12"
                      data-testid="button-theme-light"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Claro
                    </Button>
                    <Button
                      variant={settings.preferredTheme === 'dark' ? "default" : "outline"}
                      onClick={() => handleThemeChange('dark')}
                      className="justify-start h-12"
                      data-testid="button-theme-dark"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Oscuro
                    </Button>
                    <Button
                      variant={settings.preferredTheme === 'system' ? "default" : "outline"}
                      onClick={() => handleThemeChange('system')}
                      className="justify-start h-12"
                      data-testid="button-theme-system"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Automático
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Trade Input Method */}
                <div>
                  <Label className="text-base font-semibold">Método de entrada de trades</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <Button
                      variant={settings.preferredTradeInput === 'modal' ? "default" : "outline"}
                      onClick={() => {
                        const newSettings = { ...settings, preferredTradeInput: 'modal' as const };
                        setSettings(newSettings);
                        savePreferencesAutomatic({ preferredTradeInput: 'modal' });
                      }}
                      className="justify-start h-12"
                      data-testid="button-trade-input-modal"
                    >
                      <Computer className="h-4 w-4 mr-2" />
                      Formulario completo
                    </Button>
                    <Button
                      variant={settings.preferredTradeInput === 'carousel' ? "default" : "outline"}
                      onClick={() => {
                        const newSettings = { ...settings, preferredTradeInput: 'carousel' as const };
                        setSettings(newSettings);
                        savePreferencesAutomatic({ preferredTradeInput: 'carousel' });
                      }}
                      className="justify-start h-12"
                      data-testid="button-trade-input-carousel"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Paso a paso
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Default Trade Visibility */}
                <div>
                  <Label className="text-base font-semibold">Visibilidad por defecto de trades</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <Button
                      variant={settings.defaultTradeVisibility === 'private' ? "default" : "outline"}
                      onClick={() => {
                        const newSettings = { ...settings, defaultTradeVisibility: 'private' as const };
                        setSettings(newSettings);
                        savePreferencesAutomatic({ defaultTradeVisibility: 'private' });
                      }}
                      className="justify-start h-12"
                      data-testid="button-visibility-private"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Privado
                    </Button>
                    <Button
                      variant={settings.defaultTradeVisibility === 'public' ? "default" : "outline"}
                      onClick={() => {
                        const newSettings = { ...settings, defaultTradeVisibility: 'public' as const };
                        setSettings(newSettings);
                        savePreferencesAutomatic({ defaultTradeVisibility: 'public' });
                      }}
                      className="justify-start h-12"
                      data-testid="button-visibility-public"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Público
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Danger Zone</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="flex-1 border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                    data-testid="button-logout-settings"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10"
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete account
                  </Button>
                </div>

                {showDeleteConfirmation && (
                  <Alert className="border-red-500/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-4">
                        <p className="font-semibold text-red-400">
                          Are you sure you want to permanently delete your account?
                        </p>
                        <p className="text-sm">
                          This action cannot be undone. All your trades, data and settings will be deleted.
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-red-400">
                              To confirm, type exactly: <span className="font-mono bg-red-500/10 px-1 rounded">delete my account</span>
                            </Label>
                            <Input
                              type="text"
                              placeholder="delete my account"
                              value={deleteConfirmationText}
                              onChange={(e) => {
                                setDeleteConfirmationText(e.target.value);
                                // Auto-trigger password requirement when phrase is correct
                                const correctPhrase = 'delete my account';
                                const enteredPhrase = e.target.value.toLowerCase().trim();
                                if (enteredPhrase === correctPhrase && requiresPassword !== 'delete') {
                                  setRequiresPassword('delete');
                                }
                              }}
                              className="mt-2 border-red-500/20"
                              data-testid="input-delete-confirmation"
                            />
                          </div>
                          
                          {requiresPassword === 'delete' && deleteConfirmationText.toLowerCase().trim() === 'delete my account' && (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium text-red-400">
                                  Ingresa tu contraseña para finalizar:
                                </Label>
                                <Input
                                  type="password"
                                  placeholder="Tu contraseña actual"
                                  value={verificationPassword}
                                  onChange={(e) => {
                                    setVerificationPassword(e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && verificationPassword) {
                                      handleDeleteAccount();
                                    }
                                  }}
                                  className="mt-2 border-red-500/20"
                                  data-testid="input-delete-password"
                                />
                              </div>
                              {verificationPassword && (
                                <Button
                                  onClick={handleDeleteAccount}
                                  disabled={deleteAccountMutation.isPending}
                                  variant="destructive"
                                  className="w-full"
                                  data-testid="button-final-delete"
                                >
                                  {deleteAccountMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={() => {
                              setShowDeleteConfirmation(false);
                              setDeleteConfirmationText('');
                              setVerificationPassword('');
                              setRequiresPassword('');
                            }}
                            variant="outline"
                            data-testid="button-cancel-delete"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}