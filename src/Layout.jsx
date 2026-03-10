import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";

const createPageUrl = (pageName) => '/' + pageName.replace(/ /g, '-');
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  IndianRupee, 
  FileText, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
  Bell,
  Search,
  LogIn,
  UserPlus,
  CreditCard,
  ClipboardCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Employees', href: 'Employees', icon: Users },
  { name: 'Attendance', href: 'Attendance', icon: Calendar },
  { name: 'Payroll', href: 'Payroll', icon: IndianRupee },
  { name: 'Payslips', href: 'Payslips', icon: FileText },
  { name: 'Reports', href: 'Reports', icon: BarChart3 },
  { name: 'Sign In', href: 'SignIn', icon: LogIn },
];

const adminNavigation = [
  { name: 'User Management', href: 'UserManagement', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const loadNotifications = async () => {
    try {
      const isHROrAdmin = user?.role === 'admin' || user?.role === 'hr';
      const items = [];

      const payslips = await base44.entities.Payslip.list();
      if (payslips.length > 0) {
        const recent = payslips.slice(0, 3);
        recent.forEach(p => {
          items.push({
            id: p._id || p.id,
            icon: CreditCard,
            title: isHROrAdmin ? `Payslip generated for ${p.employee_name}` : 'Your payslip is ready',
            subtitle: p.month ? `${p.month}` : '',
            time: p.created_date ? new Date(p.created_date).toLocaleDateString() : 'Recently',
            read: false,
          });
        });
      }

      if (isHROrAdmin) {
        const employees = await base44.entities.Employee.list();
        if (employees.length > 0) {
          const recent = employees.slice(0, 2);
          recent.forEach(e => {
            items.push({
              id: 'emp-' + (e.id || e._id),
              icon: UserPlus,
              title: `${e.name} added as employee`,
              subtitle: e.department || '',
              time: e.created_date ? new Date(e.created_date).toLocaleDateString() : 'Recently',
              read: false,
            });
          });
        }
      }

      setNotifications(items);
      setUnreadCount(items.length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr' || user?.role === 'admin';

  const navItems = isAdmin ? [...navigation, ...adminNavigation] : navigation;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className="p-2 rounded-xl bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">PayrollPro</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Employee'}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="w-64 pl-9 bg-muted/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                              !n.read && "bg-primary/5"
                            )}
                          >
                            <div className="p-2 rounded-full bg-primary/10 mt-0.5">
                              <n.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                              {n.subtitle && <p className="text-xs text-muted-foreground">{n.subtitle}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">{user?.full_name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      navigate("/Profile");
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}