import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Trades from "@/pages/trades";
import TradeDetail from "@/pages/trade-detail";
import SharedTrade from "@/pages/shared-trade";
import StatsPage from "@/pages/stats";
import CheckoutPage from "@/pages/checkout";
import AdminDashboard from "@/pages/admin-dashboard";
import SettingsPage from "@/pages/settings";
import DocsPage from "@/pages/docs";
import HelpPage from "@/pages/help";
import ContactPage from "@/pages/contact";
import SuspendedUserModal from "@/components/suspended-user-modal";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/docs" component={DocsPage} />
        <Route path="/help" component={HelpPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/shared/:username/:id">
          {(params) => <SharedTrade username={params.username} tradeId={params.id} />}
        </Route>
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/trades" component={Trades} />
            <Route path="/stats" component={StatsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/trade/:id">
              {(params) => <TradeDetail tradeId={params.id} />}
            </Route>
          </>
        ) : (
          <>
            <Route path="/dashboard" component={AuthPage} />
            <Route path="/trades" component={AuthPage} />
            <Route path="/stats" component={AuthPage} />
            <Route path="/settings" component={AuthPage} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {/* Show suspension modal for suspended users */}
      {isAuthenticated && user?.isSuspended && <SuspendedUserModal />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
