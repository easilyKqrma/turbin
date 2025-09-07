import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie } from "recharts";
import { 
  Users, TrendingUp, DollarSign, AlertTriangle, Activity, Edit, Trash2, Plus, 
  Ban, CheckCircle, Search, Filter, Download, BarChart3, PieChart, LineChart, 
  RefreshCw, Settings, Calendar, Clock, Eye, Shield, UserCheck, Database, 
  Globe, Zap, Bell, BellRing, FileText, Cog, Server, HardDrive, MessageSquare,
  AlertCircle, Info, CheckCircle2, X, Monitor, Cpu, MemoryStick
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Check if user is admin
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");

  // Fetch admin stats
  const { data: stats = {
    totalUsers: 0,
    totalTrades: 0,
    totalPnl: 0,
    suspendedUsers: 0,
    activeTrades: 0
  }, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    totalTrades: number;
    totalPnl: number;
    suspendedUsers: number;
    activeTrades: number;
  }>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch all trades
  const { data: trades = [], isLoading: tradesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/trades"],
    refetchInterval: 30000,
  });

  // Fetch system notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/notifications"],
    refetchInterval: 15000, // Check every 15 seconds
  });

  // Fetch system logs
  const { data: logs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/logs"],
    refetchInterval: 30000,
  });

  // Fetch system configuration
  const { data: systemConfig = {} } = useQuery<any>({
    queryKey: ["/api/admin/config"],
  });

  // Fetch advanced analytics
  const { data: analytics = {} } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch backup information
  const { data: backupInfo = {} } = useQuery<any>({
    queryKey: ["/api/admin/backup"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Suspend/unsuspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, isSuspended, reason }: { userId: string; isSuspended: boolean; reason?: string }) => {
      await apiRequest(`/api/admin/users/${userId}/suspend`, "PUT", {
        isSuspended,
        suspensionReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
  });

  // Change user plan mutation
  const changeUserPlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      await apiRequest(`/api/admin/users/${userId}/plan`, "PUT", { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User plan updated successfully",
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: any }) => {
      await apiRequest(`/api/admin/users/${userId}`, "PUT", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
  });

  // Update trade mutation
  const updateTradeMutation = useMutation({
    mutationFn: async ({ tradeId, updates }: { tradeId: string; updates: any }) => {
      await apiRequest(`/api/admin/trades/${tradeId}`, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "Trade updated successfully",
      });
    },
  });

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      await apiRequest(`/api/admin/trades/${tradeId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "Trade deleted successfully",
      });
    },
  });

  // Filter users based on search and filter
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === "all" || 
                         (userFilter === "suspended" && user.isSuspended) ||
                         (userFilter === "active" && !user.isSuspended) ||
                         (userFilter === user.plan);
    return matchesSearch && matchesFilter;
  });

  // Filter trades based on search and filter
  const filteredTrades = trades.filter((trade: any) => {
    const matchesSearch = trade.instrument?.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.customInstrument?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.account?.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = tradeFilter === "all" || 
                         trade.status === tradeFilter ||
                         trade.direction === tradeFilter;
    return matchesSearch && matchesFilter;
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/analytics", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      return response.json();
    }
  });

  const chartData = analyticsData?.chartData || [
    { name: 'Jan', users: 0, trades: 0, pnl: 0 },
    { name: 'Feb', users: 0, trades: 0, pnl: 0 },
    { name: 'Mar', users: 0, trades: 0, pnl: 0 },
    { name: 'Apr', users: 0, trades: 0, pnl: 0 },
    { name: 'May', users: 0, trades: 0, pnl: 0 },
    { name: 'Jun', users: 0, trades: 0, pnl: 0 },
  ];

  const pieData = analyticsData?.pieData || [
    { name: 'Free', value: 0, color: '#8884d8' },
    { name: 'Plus', value: 0, color: '#82ca9d' },
    { name: 'Pro', value: 0, color: '#ffc658' },
  ];

  // Fetch system metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/admin/system/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/system/metrics", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/system/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    toast({
      title: "Data Refreshed",
      description: "All dashboard data has been updated",
    });
  };

  const exportData = () => {
    const data = {
      stats,
      users: filteredUsers,
      trades: filteredTrades,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-dashboard-export-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Dashboard data exported successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-6" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent" data-testid="admin-dashboard-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">Monitor and manage your platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportData}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Badge className="bg-gradient-to-r from-primary to-blue-400 text-primary-foreground px-4 py-2 text-sm font-medium">
              <Shield className="h-4 w-4 mr-2" />
              Administrator
            </Badge>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300" data-testid="stats-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">Total Users</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-400">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300" data-testid="stats-total-trades">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">Total Trades</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalTrades || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-400">+8%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300" data-testid="stats-total-pnl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-400">Total P&L</CardTitle>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${(stats.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${(stats.totalPnl || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats.totalPnl || 0) >= 0 ? 
                  <span className="text-green-400">Profitable</span> :
                  <span className="text-red-400">Loss</span>
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300" data-testid="stats-suspended-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Suspended</CardTitle>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats.suspendedUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300" data-testid="stats-active-trades">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">Active Trades</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.activeTrades || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-purple-400 animate-pulse">●</span> Live trading
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Platform Growth
              </CardTitle>
              <CardDescription>User and trade growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="trades" stroke="#10b981" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                User Plans Distribution
              </CardTitle>
              <CardDescription>Breakdown of user subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users, trades, emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="free">Free Plan</SelectItem>
                  <SelectItem value="plus">Plus Plan</SelectItem>
                  <SelectItem value="pro">Pro Plan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tradeFilter} onValueChange={setTradeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter trades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Live Notifications Bar */}
        {notifications.filter((n: any) => !n.read).length > 0 && (
          <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-yellow-400 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400">
                    {notifications.filter((n: any) => !n.read).length} unread notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Latest: {notifications.find((n: any) => !n.read)?.title}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-yellow-400 border-yellow-400/20">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" data-testid="users-tab">Users</TabsTrigger>
            <TabsTrigger value="trades" data-testid="trades-tab">Trades</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="notifications-tab">Notifications</TabsTrigger>
            <TabsTrigger value="system" data-testid="system-tab">System</TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, suspensions, and plan changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.plan === 'pro' ? 'default' : user.plan === 'plus' ? 'secondary' : 'outline'}
                          >
                            {user.plan.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isSuspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Suspend/Unsuspend Button */}
                            <SuspendUserDialog
                              user={user}
                              onSuspend={(reason) => 
                                suspendUserMutation.mutate({
                                  userId: user.id,
                                  isSuspended: !user.isSuspended,
                                  reason
                                })
                              }
                            />
                            
                            {/* Change Plan Dialog */}
                            <ChangePlanDialog
                              user={user}
                              onChangePlan={(plan) =>
                                changeUserPlanMutation.mutate({
                                  userId: user.id,
                                  plan
                                })
                              }
                            />
                            
                            {/* Edit User Dialog */}
                            <EditUserDialog
                              user={user}
                              onEditUser={(userData) =>
                                editUserMutation.mutate({
                                  userId: user.id,
                                  userData
                                })
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade Management</CardTitle>
                <CardDescription>
                  View and manage all trades across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade: any) => (
                      <TableRow key={trade.id} data-testid={`trade-row-${trade.id}`}>
                        <TableCell className="font-medium">{trade.account?.userId}</TableCell>
                        <TableCell>{trade.instrument?.symbol || trade.customInstrument}</TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === 'long' ? 'default' : 'secondary'}>
                            {trade.direction?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.entryPrice}</TableCell>
                        <TableCell>{trade.exitPrice ? `$${trade.exitPrice}` : '-'}</TableCell>
                        <TableCell className={`font-medium ${parseFloat(trade.pnl || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.pnl ? `$${parseFloat(trade.pnl).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.status === 'open' ? 'default' : 'outline'}>
                            {trade.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.visibility === 'public' ? 'default' : 'secondary'}>
                            {trade.visibility?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Edit Trade */}
                            <EditTradeDialog
                              trade={trade}
                              onEditTrade={(tradeData) =>
                                updateTradeMutation.mutate({
                                  tradeId: trade.id,
                                  updates: tradeData
                                })
                              }
                            />
                            
                            {/* Toggle Visibility */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTradeMutation.mutate({
                                tradeId: trade.id,
                                updates: { visibility: trade.visibility === 'public' ? 'private' : 'public' }
                              })}
                              data-testid={`toggle-visibility-${trade.id}`}
                            >
                              {trade.visibility === 'public' ? 'Make Private' : 'Make Public'}
                            </Button>

                            {/* Delete Trade */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" data-testid={`delete-trade-${trade.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this trade? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTradeMutation.mutate(trade.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>Revenue from subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="pnl" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Activity</CardTitle>
                  <CardDescription>Daily active users and trades</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="trades" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Global Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Server Uptime</span>
                    <span className="text-green-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.serverUptime || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Response Time</span>
                    <span className="text-blue-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.apiResponseTime || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database Size</span>
                    <span className="text-yellow-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.databaseSize || 'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page Load Time</span>
                    <span className="text-green-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.pageLoadTime || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Error Rate</span>
                    <span className="text-green-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.errorRate || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cache Hit Rate</span>
                    <span className="text-blue-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.cacheHitRate || 'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="text-yellow-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.cpuUsage || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="text-green-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.memoryUsage || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disk Usage</span>
                    <span className="text-blue-400 font-medium">
                      {metricsLoading ? 'Loading...' : systemMetrics?.diskUsage || 'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    System Notifications
                  </CardTitle>
                  <CardDescription>Real-time system alerts and updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notifications.map((notification: any) => (
                    <div key={notification.id} className={`p-4 rounded-lg border ${
                      notification.type === 'error' ? 'border-red-500/20 bg-red-500/5' :
                      notification.type === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' :
                      'border-blue-500/20 bg-blue-500/5'
                    }`}>
                      <div className="flex items-start gap-3">
                        {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />}
                        {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />}
                        {notification.type === 'info' && <Info className="h-5 w-5 text-blue-400 mt-0.5" />}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp ? format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a') : 'N/A'}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button variant="ghost" size="sm">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    System Logs
                  </CardTitle>
                  <CardDescription>Recent system activity and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log: any) => (
                      <div key={log.id} className="p-3 rounded border border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'secondary' : 'outline'}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-muted-foreground">{log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : 'N/A'}</span>
                        </div>
                        <p className="text-sm mt-1">{log.message}</p>
                        {log.userId && <p className="text-xs text-muted-foreground">User: {log.userId}</p>}
                        {log.ip && <p className="text-xs text-muted-foreground">IP: {log.ip}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    System Status
                  </CardTitle>
                  <CardDescription>Real-time system health monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <p className="text-lg font-bold text-green-400 mt-1">Online</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">CPU</span>
                      </div>
                      <p className="text-lg font-bold text-blue-400 mt-1">34%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">Memory</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-400 mt-1">68%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">Disk</span>
                      </div>
                      <p className="text-lg font-bold text-purple-400 mt-1">45%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="text-green-400 font-medium">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="text-blue-400 font-medium">45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Connections</span>
                      <span className="text-purple-400 font-medium">234</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backup Status
                  </CardTitle>
                  <CardDescription>Database backup and recovery information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-400">Last Backup</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {backupInfo.lastBackup ? format(new Date(backupInfo.lastBackup), 'MMM d, yyyy h:mm a') : 'Never'}
                        </p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="default">{backupInfo.status || 'Unknown'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{backupInfo.backupSize || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schedule</span>
                      <span className="font-medium">{backupInfo.schedule || 'Manual'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retention</span>
                      <span className="font-medium">{backupInfo.retention || '30 days'}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Trigger Backup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>Manage system-wide settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">General Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Maintenance Mode</p>
                          <p className="text-xs text-muted-foreground">Temporarily disable user access</p>
                        </div>
                        <Switch defaultChecked={systemConfig.systemSettings?.maintenanceMode} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Allow Registrations</p>
                          <p className="text-xs text-muted-foreground">Allow new user signups</p>
                        </div>
                        <Switch defaultChecked={systemConfig.systemSettings?.allowRegistrations} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Security Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Require Two-Factor Auth</p>
                          <p className="text-xs text-muted-foreground">Mandatory 2FA for all users</p>
                        </div>
                        <Switch defaultChecked={systemConfig.securitySettings?.requireTwoFactor} />
                      </div>
                      <div className="space-y-2">
                        <Label>Session Timeout (hours)</Label>
                        <Input 
                          type="number" 
                          defaultValue={systemConfig.securitySettings?.sessionTimeout || 24}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Login Attempts</Label>
                        <Input 
                          type="number" 
                          defaultValue={systemConfig.securitySettings?.maxLoginAttempts || 5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Suspend User Dialog Component
function SuspendUserDialog({ user, onSuspend }: { user: any; onSuspend: (reason?: string) => void }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const handleSuspend = () => {
    if (user.isSuspended) {
      onSuspend();
    } else {
      onSuspend(reason);
    }
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={user.isSuspended ? "default" : "destructive"}
          size="sm"
          data-testid={`suspend-user-${user.id}`}
        >
          {user.isSuspended ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Restore
            </>
          ) : (
            <>
              <Ban className="h-4 w-4 mr-1" />
              Suspend
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user.isSuspended ? "Restore User Account" : "Suspend User Account"}
          </DialogTitle>
          <DialogDescription>
            {user.isSuspended 
              ? "This will restore the user's access to their account."
              : "This will prevent the user from accessing their account and show them a suspension message."
            }
          </DialogDescription>
        </DialogHeader>
        {!user.isSuspended && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Suspension Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for suspension..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="suspension-reason-input"
              />
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSuspend}
            variant={user.isSuspended ? "default" : "destructive"}
            data-testid="confirm-suspend-action"
          >
            {user.isSuspended ? "Restore Account" : "Suspend Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Change Plan Dialog Component
function ChangePlanDialog({ user, onChangePlan }: { user: any; onChangePlan: (plan: string) => void }) {
  const [selectedPlan, setSelectedPlan] = useState(user.plan);
  const [open, setOpen] = useState(false);

  const handleChangePlan = () => {
    if (selectedPlan !== user.plan) {
      onChangePlan(selectedPlan);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`change-plan-${user.id}`}>
          <Edit className="h-4 w-4 mr-1" />
          Change Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Plan</DialogTitle>
          <DialogDescription>
            Change the subscription plan for {user.username}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="plan">Select Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger data-testid="plan-select">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleChangePlan} data-testid="confirm-plan-change">
            Change Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Dialog Component
function EditUserDialog({ user, onEditUser }: { user: any; onEditUser: (userData: any) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    profileImageUrl: user.profileImageUrl || '',
    isPublicProfile: user.isPublicProfile || false,
    isAdmin: user.isAdmin || false,
    isSuspended: user.isSuspended || false,
    suspensionReason: user.suspensionReason || '',
    plan: user.plan || 'free',
    password: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditUser = () => {
    // Don't send password if it's empty
    const userData = { ...formData };
    if (!userData.password) {
      delete (userData as any).password;
    }
    onEditUser(userData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`edit-user-${user.id}`}>
          <Edit className="h-4 w-4 mr-1" />
          Edit User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
          <DialogDescription>
            Edit all user information and settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                data-testid="edit-username"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                data-testid="edit-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                data-testid="edit-firstName"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                data-testid="edit-lastName"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="profileImageUrl">Profile Image URL</Label>
            <Input
              id="profileImageUrl"
              value={formData.profileImageUrl}
              onChange={(e) => handleInputChange('profileImageUrl', e.target.value)}
              data-testid="edit-profileImageUrl"
            />
          </div>

          <div>
            <Label htmlFor="plan">Plan</Label>
            <Select value={formData.plan} onValueChange={(value) => handleInputChange('plan', value)}>
              <SelectTrigger data-testid="edit-plan-select">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="password">New Password (leave empty to keep current)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              data-testid="edit-password"
              placeholder="Enter new password or leave empty"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublicProfile"
                checked={formData.isPublicProfile}
                onCheckedChange={(checked) => handleInputChange('isPublicProfile', checked)}
                data-testid="edit-isPublicProfile"
              />
              <Label htmlFor="isPublicProfile">Public Profile</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={(checked) => handleInputChange('isAdmin', checked)}
                data-testid="edit-isAdmin"
              />
              <Label htmlFor="isAdmin">Admin Privileges</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isSuspended"
                checked={formData.isSuspended}
                onCheckedChange={(checked) => handleInputChange('isSuspended', checked)}
                data-testid="edit-isSuspended"
              />
              <Label htmlFor="isSuspended">Suspended</Label>
            </div>
          </div>

          {formData.isSuspended && (
            <div>
              <Label htmlFor="suspensionReason">Suspension Reason</Label>
              <Textarea
                id="suspensionReason"
                value={formData.suspensionReason}
                onChange={(e) => handleInputChange('suspensionReason', e.target.value)}
                data-testid="edit-suspensionReason"
                placeholder="Enter suspension reason..."
              />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditUser} data-testid="confirm-edit-user">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Trade Dialog Component
function EditTradeDialog({ trade, onEditTrade }: { trade: any; onEditTrade: (tradeData: any) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    instrumentId: trade.instrumentId || '',
    customInstrument: trade.customInstrument || '',
    direction: trade.direction || 'long',
    entryPrice: trade.entryPrice || '',
    exitPrice: trade.exitPrice || '',
    lotSize: trade.lotSize || 1,
    pnl: trade.pnl || '',
    customPnl: trade.customPnl || '',
    status: trade.status || 'open',
    result: trade.result || '',
    visibility: trade.visibility || 'private',
    notes: trade.notes || '',
    imageUrl: trade.imageUrl || '',
    entryTime: trade.entryTime ? new Date(trade.entryTime).toISOString().slice(0, 16) : '',
    exitTime: trade.exitTime ? new Date(trade.exitTime).toISOString().slice(0, 16) : ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditTrade = () => {
    // Convert datetime-local values back to proper format
    const tradeData = {
      ...formData,
      entryTime: formData.entryTime ? new Date(formData.entryTime).toISOString() : null,
      exitTime: formData.exitTime ? new Date(formData.exitTime).toISOString() : null,
      entryPrice: formData.entryPrice ? parseFloat(formData.entryPrice) : null,
      exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
      lotSize: parseInt(formData.lotSize.toString()),
      pnl: formData.pnl ? parseFloat(formData.pnl) : null,
      customPnl: formData.customPnl ? parseFloat(formData.customPnl) : null
    };
    
    // Remove empty values
    Object.keys(tradeData).forEach(key => {
      if ((tradeData as any)[key] === '' || (tradeData as any)[key] === null) {
        delete (tradeData as any)[key];
      }
    });
    
    onEditTrade(tradeData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`edit-trade-${trade.id}`}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade</DialogTitle>
          <DialogDescription>
            Edit all trade information and settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customInstrument">Instrument Symbol</Label>
              <Input
                id="customInstrument"
                value={formData.customInstrument}
                onChange={(e) => handleInputChange('customInstrument', e.target.value)}
                data-testid="edit-customInstrument"
                placeholder="e.g., EURUSD, BTC/USD"
              />
            </div>
            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select value={formData.direction} onValueChange={(value) => handleInputChange('direction', value)}>
                <SelectTrigger data-testid="edit-direction-select">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.0001"
                value={formData.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                data-testid="edit-entryPrice"
              />
            </div>
            <div>
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.0001"
                value={formData.exitPrice}
                onChange={(e) => handleInputChange('exitPrice', e.target.value)}
                data-testid="edit-exitPrice"
              />
            </div>
            <div>
              <Label htmlFor="lotSize">Lot Size</Label>
              <Input
                id="lotSize"
                type="number"
                min="1"
                value={formData.lotSize}
                onChange={(e) => handleInputChange('lotSize', e.target.value)}
                data-testid="edit-lotSize"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pnl">P&L (calculated)</Label>
              <Input
                id="pnl"
                type="number"
                step="0.01"
                value={formData.pnl}
                onChange={(e) => handleInputChange('pnl', e.target.value)}
                data-testid="edit-pnl"
              />
            </div>
            <div>
              <Label htmlFor="customPnl">Custom P&L</Label>
              <Input
                id="customPnl"
                type="number"
                step="0.01"
                value={formData.customPnl}
                onChange={(e) => handleInputChange('customPnl', e.target.value)}
                data-testid="edit-customPnl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger data-testid="edit-status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="result">Result</Label>
              <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)}>
                <SelectTrigger data-testid="edit-result-select">
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Profit</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="breakeven">Breakeven</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
                <SelectTrigger data-testid="edit-visibility-select">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entryTime">Entry Time</Label>
              <Input
                id="entryTime"
                type="datetime-local"
                value={formData.entryTime}
                onChange={(e) => handleInputChange('entryTime', e.target.value)}
                data-testid="edit-entryTime"
              />
            </div>
            <div>
              <Label htmlFor="exitTime">Exit Time</Label>
              <Input
                id="exitTime"
                type="datetime-local"
                value={formData.exitTime}
                onChange={(e) => handleInputChange('exitTime', e.target.value)}
                data-testid="edit-exitTime"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Trade Screenshot URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              data-testid="edit-imageUrl"
              placeholder="URL to trade screenshot"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              data-testid="edit-notes"
              placeholder="Trade notes and analysis..."
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditTrade} data-testid="confirm-edit-trade">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}