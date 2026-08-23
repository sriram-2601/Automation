import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore.js';
import api from '../../services/api.js';
import { subscribeToUserNotifications } from '../../services/socket.js';
import { 
  LayoutDashboard, 
  Workflow, 
  Activity, 
  Link2, 
  Settings, 
  LogOut, 
  Bell, 
  User, 
  Menu, 
  X 
} from 'lucide-react';

export default function AppShell({ children }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userId = user._id || user.id;
    const unsubscribe = subscribeToUserNotifications(userId, (notif) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
    });
    return () => {
      unsubscribe();
    };
  }, [user]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workflows', path: '/workflows', icon: Workflow },
    { name: 'Executions', path: '/executions', icon: Activity },
    { name: 'Integrations', path: '/integrations', icon: Link2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleNotification = () => setIsNotificationOpen(!isNotificationOpen);
  
  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}`);
      setNotifications(notifications.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-violet-500/30">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md shrink-0">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/40">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Workflow className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Agentflow_AI
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = router.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 font-medium border border-violet-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Log out */}
        <div className="p-4 border-t border-slate-800/40 bg-slate-900/20">
          <div className="flex items-center space-x-3 p-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="w-5 h-5 text-violet-400" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold truncate">{user?.name || 'Operator'}</h4>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{user?.role || 'User'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-850 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-250 cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Agentflow_AI
              </span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = router.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-violet-600/10 text-violet-400 font-medium border border-violet-500/20' 
                        : 'text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span className="text-sm">Disconnect</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="md:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:block">
            {/* Dynamic Breadcrumbs */}
            <span className="text-sm font-medium text-slate-400 capitalize">
              Console / {router.pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button 
              onClick={toggleNotification}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all hover:bg-slate-850 cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full animate-ping-slow"></span>
              )}
            </button>

            {/* Profile pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800/80 text-xs text-slate-300">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="font-medium truncate max-w-[120px]">{user?.name || 'Operator'}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Notifications Drawer */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <h3 className="font-semibold text-slate-100 flex items-center space-x-2">
                <Bell className="w-4.5 h-4.5 text-violet-400" />
                <span>Alert timeline</span>
              </h3>
              <button onClick={() => setIsNotificationOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No active alerts.
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n._id} 
                    onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      n.isRead 
                        ? 'bg-slate-955/20 border-slate-850/60 text-slate-500' 
                        : 'bg-violet-950/10 border-violet-500/20 text-slate-200 hover:border-violet-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-1 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-slate-550 block mt-2">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-between space-x-3 bg-slate-950/20">
              <button 
                onClick={handleMarkAllAsRead}
                className="flex-1 text-xs font-semibold text-violet-400 hover:text-violet-300 text-center py-2 cursor-pointer"
              >
                Mark all read
              </button>
              <button 
                onClick={() => setNotifications([])}
                className="flex-1 text-xs font-semibold text-slate-500 hover:text-slate-400 text-center py-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
