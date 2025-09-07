import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Moon, User, LogOut, BarChart3, Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import defaultAvatar from "../assets/default-avatar.png";

export default function Navigation() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const desktopNavigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/trades", label: "Trades", icon: User },
    { href: "/stats", label: "Stats", icon: BarChart3 }
  ];

  const mobileNavigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/trades", label: "Trades", icon: User },
    { href: "/stats", label: "Stats", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 glass-nav rounded-full px-8 py-3 shadow-2xl shadow-blue-500/20 hidden md:block">
        <div className="flex items-center justify-between min-w-[700px]">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">
                G<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text ml-1">metrics</span>
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {desktopNavigationItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`text-sm transition-colors ${
                  isActive(item.href) || (item.href === "/dashboard" && location === "/") 
                    ? "text-white" 
                    : "text-gray-300 hover:text-white"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-gray-300 hover:text-white"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Link href="/settings">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-300 hover:text-white"
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="text-gray-300 hover:text-white"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Enhanced with glass effect and proper hamburger menu */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 glass-nav rounded-full px-6 py-3 shadow-2xl shadow-blue-500/20 md:hidden">
        <div className="flex items-center justify-between min-w-[280px]">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-white">
              G<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text ml-1">metrics</span>
            </span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-gray-300 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
              data-testid="button-theme-toggle-mobile"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-300 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] bg-background/95 backdrop-blur-xl border-l border-border/50">
                <div className="flex flex-col h-full">
                  {/* Header with user info - NO PROFILE PICTURE */}
                  <div className="pb-6 border-b border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">
                        {user?.firstName || user?.email?.split('@')[0] || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <nav className="flex-1 py-6">
                    <div className="space-y-2">
                      {mobileNavigationItems.map((item) => {
                        const Icon = item.icon;
                        const isItemActive = isActive(item.href) || (item.href === "/dashboard" && location === "/");
                        return (
                          <Link 
                            key={item.href} 
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Button 
                              variant="ghost"
                              className={`w-full justify-start h-12 px-4 transition-all duration-200 ${
                                isItemActive 
                                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-blue-400 border border-blue-500/20" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              }`}
                              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                            >
                              <Icon className="h-5 w-5 mr-3" />
                              <span className="font-medium">{item.label}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </nav>

                  {/* Footer with logout */}
                  <div className="border-t border-border/50 pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12 px-4 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      data-testid="button-logout-mobile"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      <span className="font-medium">Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
