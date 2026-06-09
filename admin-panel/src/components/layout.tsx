
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "../lib/api-client";
import {
  Home,
  Users,
  Settings,
  LogOut,
  Menu,
  Film,
  Moon,
  Sun,
  Globe,
  X,
  FileText,
  ChevronRight,
  ChevronLeft,
  Bell,
  PlaySquare,
  PlusSquare,
  Megaphone,
  Layers,
  Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItemsConfig = [
  { href: "/", labelKey: "nav.dashboard", label: "Dashboard", icon: Home },
  { href: "/users", labelKey: "nav.users", label: "Users", icon: Users },
  { href: "/languages", labelKey: "nav.languages", label: "Languages", icon: Languages },
  { href: "/categories", labelKey: "nav.categories", label: "Categories", icon: Layers },
  { href: "/shows", label: "Shows", icon: PlaySquare },
  { href: "/ads", label: "Ads", icon: PlusSquare },
  { href: "/pages", label: "Pages", icon: FileText },
  { href: "/promotions", labelKey: "nav.promotions", label: "Promotions", icon: Megaphone },
  { href: "/banners", labelKey: "nav.banners", label: "Banners", icon: Layers },
  { href: "/settings", labelKey: "nav.settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: user, isLoading } = useGetMe();
  const { language, setLanguage, t } = useLanguage();
  const { settings } = useSettings();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && user === null) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/login");
    }
  };

  const getLogoUrl = () => {
    if (resolvedTheme === 'dark' && settings.darkLogoUrl) {
      return settings.darkLogoUrl;
    } else if (resolvedTheme === 'light' && settings.lightLogoUrl) {
      return settings.lightLogoUrl;
    }
    return settings.logoUrl;
  };

  const NavLinks = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {navItemsConfig.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        const Icon = item.icon;
        
        const navItem = (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-gradient-to-r from-red-900/40 to-red-800/20 text-red-400 border border-red-700/30 shadow-lg shadow-red-500/10' : 'text-gray-400 hover:bg-zinc-800 hover:text-gray-200 hover:border hover:border-zinc-700'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon className={`h-6 w-6 ${collapsed ? 'h-7 w-7' : ''}`} />
            {!collapsed && (item.label)}
          </Link>
        );

        if (collapsed) {
          return (
            <TooltipProvider key={item.href} disableHoverableContent>
              <Tooltip>
                <TooltipTrigger asChild>
                  {navItem}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="bg-zinc-800 text-white border-zinc-700">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return navItem;
      })}
    </>
  );

  const LogoComponent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex items-center gap-3">
      {getLogoUrl() ? (
        <img src={getLogoUrl()} alt="Logo" className={collapsed ? 'h-10 w-10 object-contain' : 'h-10 w-auto object-contain'} />
      ) : (
        <Film className={`text-red-500 ${collapsed ? 'h-8 w-8' : 'h-10 w-10'}`} />
      )}
      {!collapsed && (
        <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
          {settings.platformName}
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      {/* Mobile Header with Navbar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-50">
        <LogoComponent />
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={(value: string) => setLanguage(value as any)}>
            <SelectTrigger className="w-28 bg-zinc-800 border-zinc-700 text-white h-9 rounded-lg">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
              {Object.entries(languages).map(([code, name]) => (
                <SelectItem key={code} value={code} className="text-white">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800">
            <Bell className="h-4 w-4" />
          </Button>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-400">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-zinc-900 border-r border-zinc-800">
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <LogoComponent />
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 rounded-lg h-9 w-9">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <nav className="p-6 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                <NavLinks />
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-zinc-800">
                {isLoading ? (
                  <div className="h-14 bg-zinc-800 animate-pulse rounded-2xl" />
                ) : user ? (
                  <div className="flex items-center gap-4 mb-6 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                    <Avatar className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700">
                      <AvatarFallback className="text-white font-bold text-xl">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                  </div>
                ) : null}
                <Button variant="destructive" className="w-full justify-start gap-2 h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-600/90 hover:to-red-700/90" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar (Fixed) */}
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-zinc-900 border-r border-zinc-800 z-40 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <LogoComponent collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800"
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
          {!sidebarCollapsed && (
            <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3 px-4 pt-2">MAIN MENU</div>
          )}
          <nav className="flex flex-col gap-2 px-2">
            <NavLinks collapsed={sidebarCollapsed} />
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800">
          {isLoading ? (
            <div className="h-14 bg-zinc-800 animate-pulse rounded-xl" />
          ) : user ? (
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} mb-4 p-3 bg-zinc-800 rounded-xl border border-zinc-700 hover:bg-zinc-700/70 transition-colors`}>
              <Avatar className={`${sidebarCollapsed ? 'h-10 w-10' : 'h-10 w-10'} rounded-xl bg-gradient-to-br from-red-600 to-red-700`}>
                <AvatarFallback className="text-white font-bold text-lg">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
              )}
            </div>
          ) : null}
          {!sidebarCollapsed && (
            <Button variant="destructive" className="w-full justify-start gap-2 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-600/90 hover:to-red-700/90" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )}
          {sidebarCollapsed && (
            <TooltipProvider disableHoverableContent>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="icon" className="w-full h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-600/90 hover:to-red-700/90" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="bg-zinc-800 text-white border-zinc-700">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Footer Copyright */}
          {!sidebarCollapsed && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-gray-500 text-center">
                © {new Date().getFullYear()} {settings.platformName}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} transition-all duration-300`}>
        {/* Top Navbar (Desktop) */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg border border-zinc-700 bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={language} onValueChange={(value: string) => setLanguage(value as any)}>
              <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-white h-9 rounded-lg">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code} className="text-white">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <Avatar className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700">
              <AvatarFallback className="text-white font-bold">
                {user?.name.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content with Padding */}
        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
}
