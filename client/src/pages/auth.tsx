import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type AuthMode = 'login' | 'register';
type RegisterStep = 1 | 2 | 3; // username -> email -> password
type LoginStep = 1 | 2; // email/username -> password

interface FormData {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [loginStep, setLoginStep] = useState<LoginStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setHasInitialized(true);
          return;
        }
        
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          setLocation('/dashboard');
        } else {
          // Invalid token, remove it
          localStorage.removeItem('auth_token');
          setHasInitialized(true);
        }
      } catch (error) {
        // User is not authenticated, stay on auth page
        localStorage.removeItem('auth_token');
        setHasInitialized(true);
      }
    };
    
    checkAuth();
  }, [setLocation]);

  // Reset form when switching modes
  useEffect(() => {
    reset();
    setFormData({});
    setError('');
    setRegisterStep(1);
    setLoginStep(1);
  }, [mode, reset]);

  const handleNext = async (data: any) => {
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (registerStep === 1) {
          // Check if username exists
          const response = await fetch('/api/auth/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: data.username })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.message || 'Username already exists');
            setIsLoading(false);
            return;
          }
          
          setFormData(prev => ({ ...prev, username: data.username }));
          // Smooth transition to next step
          setDirection('forward');
          setIsTransitioning(true);
          setTimeout(() => {
            setRegisterStep(2);
            setTimeout(() => setIsTransitioning(false), 100);
          }, 100);
          reset();
        } else if (registerStep === 2) {
          // Check if email exists
          const response = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.message || 'Email already exists');
            setIsLoading(false);
            return;
          }
          
          setFormData(prev => ({ ...prev, email: data.email }));
          // Smooth transition to next step
          setDirection('forward');
          setIsTransitioning(true);
          setTimeout(() => {
            setRegisterStep(3);
            setTimeout(() => setIsTransitioning(false), 100);
          }, 100);
          reset();
        } else if (registerStep === 3) {
          // Complete registration
          const finalData = {
            ...formData,
            password: data.password,
            confirmPassword: data.confirmPassword
          };
          
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
          });
          
          if (response.ok) {
            const data = await response.json();
            // Store token in localStorage
            localStorage.setItem('auth_token', data.token);
            setLocation('/dashboard');
            // Force redirect as backup
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          } else {
            const errorData = await response.json();
            setError(errorData.message || 'Registration failed');
          }
        }
      } else {
        // Login flow
        if (loginStep === 1) {
          // Check if email/username exists
          const response = await fetch('/api/auth/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: data.identifier })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.message || 'User not found');
            setIsLoading(false);
            return;
          }
          
          setFormData(prev => ({ ...prev, email: data.identifier }));
          // Smooth transition to next step
          setDirection('forward');
          setIsTransitioning(true);
          setTimeout(() => {
            setLoginStep(2);
            setTimeout(() => setIsTransitioning(false), 100);
          }, 100);
          reset();
        } else if (loginStep === 2) {
          // Complete login
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: formData.email,
              password: data.password
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            // Store token in localStorage
            localStorage.setItem('auth_token', data.token);
            setLocation('/dashboard');
            // Force redirect as backup
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          } else {
            const errorData = await response.json();
            setError(errorData.message || 'Invalid password');
          }
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleBack = () => {
    setError('');
    setDirection('backward');
    setIsTransitioning(true);
    if (mode === 'register' && registerStep > 1) {
      setTimeout(() => {
        setRegisterStep(prev => (prev - 1) as RegisterStep);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 100);
      reset();
    } else if (mode === 'login' && loginStep > 1) {
      setTimeout(() => {
        setLoginStep(prev => (prev - 1) as LoginStep);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 100);
      reset();
    }
  };

  const getCurrentStepTitle = () => {
    if (mode === 'register') {
      switch (registerStep) {
        case 1: return 'Choose your username';
        case 2: return 'Enter your email';
        case 3: return 'Set your password';
      }
    } else {
      switch (loginStep) {
        case 1: return 'Welcome back';
        case 2: return 'Enter your password';
      }
    }
  };

  const getCurrentStepSubtitle = () => {
    if (mode === 'register') {
      switch (registerStep) {
        case 1: return 'This will be your unique identifier';
        case 2: return 'We\'ll use this to keep your account secure';
        case 3: return 'Choose a strong password';
      }
    } else {
      switch (loginStep) {
        case 1: return 'Enter your email or username';
        case 2: return 'Please enter your password to continue';
      }
    }
  };

  const getTotalSteps = () => mode === 'register' ? 3 : 2;
  const getCurrentStep = () => mode === 'register' ? registerStep : loginStep;

  if (!hasInitialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-black text-white relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black" />
      
      {/* Subtle gradient overlay */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-blue-600/10 via-blue-800/5 to-transparent rounded-full filter blur-[100px]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Home button */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="absolute top-6 left-6 z-50 text-white hover:bg-white/10 rounded-full p-3 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700 transition-all"
          data-testid="button-back-home"
        >
          <Home className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Main content - Properly spaced to avoid overlaps */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4 md:p-8">
        <motion.div 
          className="w-full max-w-lg mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <form onSubmit={handleSubmit(handleNext)} className="space-y-8">
            {/* Progress dots - Positioned at top with proper spacing */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-3">
                {Array.from({ length: getTotalSteps() }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300 border-2",
                      index + 1 <= getCurrentStep() 
                        ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50" 
                        : "bg-transparent border-gray-500"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Title section with smooth transitions */}
            <div className="text-center space-y-4 mb-8 transition-all duration-150 ease-out">
              <h1 className="text-3xl md:text-4xl font-light text-white tracking-wide leading-tight transition-all duration-150 ease-out">
                {getCurrentStepTitle()}
              </h1>
              <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto transition-all duration-150 ease-out">
                {getCurrentStepSubtitle()}
              </p>
            </div>

            {/* Form fields with smooth transitions */}
            <div className="space-y-6 min-h-[160px] flex flex-col justify-center transition-all duration-150 ease-out">
              {mode === 'register' && (
                <>
                  <AnimatePresence mode="wait">
                    {registerStep === 1 && (
                      <motion.div 
                        key="register-step-1"
                        className="space-y-2"
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -30, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <Input
                          {...register('username', { 
                            required: 'Username is required',
                            minLength: { value: 3, message: 'Username must be at least 3 characters' }
                          })}
                          type="text"
                          placeholder="username"
                          className="w-full h-12 md:h-14 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-base md:text-lg focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-150 ease-out hover:border-gray-600"
                          data-testid="input-username"
                        />
                        {errors.username && (
                          <p className="text-red-400 text-sm">{errors.username.message as string}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {registerStep === 2 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-200">
                      <Input
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        placeholder="your@email.com"
                        className="w-full h-14 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-lg focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-150 ease-out hover:border-gray-600"
                        data-testid="input-email"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm">{errors.email.message as string}</p>
                      )}
                    </div>
                  )}

                  {registerStep === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            {...register('password', { 
                              required: 'Password is required',
                              minLength: { value: 6, message: 'Password must be at least 6 characters' }
                            })}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            className="w-full h-14 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-lg focus:border-blue-500 focus:ring-blue-500/20 rounded-lg pr-12"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-red-400 text-sm">{errors.password.message as string}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            {...register('confirmPassword', {
                              required: 'Please confirm your password',
                              validate: (value) => value === watch('password') || 'Passwords do not match'
                            })}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            className="w-full h-14 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-lg focus:border-blue-500 focus:ring-blue-500/20 rounded-lg pr-12"
                            data-testid="input-confirm-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-red-400 text-sm">{errors.confirmPassword.message as string}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {mode === 'login' && (
                <>
                  {loginStep === 1 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-200">
                      <Input
                        {...register('identifier', { required: 'Email or username is required' })}
                        type="text"
                        placeholder="your@email.com"
                        className="w-full h-14 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-lg focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all duration-150 ease-out hover:border-gray-600"
                        data-testid="input-identifier"
                      />
                      {errors.identifier && (
                        <p className="text-red-400 text-sm">{errors.identifier.message as string}</p>
                      )}
                    </div>
                  )}

                  {loginStep === 2 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-200">
                      <div className="relative">
                        <Input
                          {...register('password', { required: 'Password is required' })}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          className="w-full h-14 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-lg focus:border-blue-500 focus:ring-blue-500/20 rounded-lg pr-12"
                          data-testid="input-password-login"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-400 text-sm">{errors.password.message as string}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="text-red-400 text-center text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>

            {/* Action buttons with better spacing */}
            <div className="flex flex-col space-y-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-medium rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
                data-testid="button-next"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    {mode === 'register' && registerStep === 3 ? 'Create Account' : 
                     mode === 'login' && loginStep === 2 ? 'Sign In' : 'Next'}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              {((mode === 'register' && registerStep > 1) || (mode === 'login' && loginStep > 1)) && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="ghost"
                  className="w-full h-12 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 rounded-xl hover:scale-[1.01]"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>

            {/* Switch mode with better styling */}
            <div className="text-center pt-8 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-gray-400 hover:text-blue-400 transition-all duration-200 text-sm font-medium hover:scale-105"
                data-testid="button-switch-mode"
              >
                {mode === 'login' 
                  ? "Don't have an account? Create one" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}