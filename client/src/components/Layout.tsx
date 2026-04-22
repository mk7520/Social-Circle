import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Home, Search, Film, MessageCircle, Heart, PlusSquare, Bookmark,
  User as UserIcon, Menu, LogOut, Settings, Moon, Sun, Languages,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { userInitial } from "@/lib/user-utils";
import type { NotificationWithActor, ConversationPreview } from "@shared/schema";
import { ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface LayoutProps {
  children: ReactNode;
  noRightRail?: boolean;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { resolvedTheme, toggle, setTheme } = useTheme();

  const { data: notifications } = useQuery<NotificationWithActor[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 15000,
  });
  const { data: conversations } = useQuery<ConversationPreview[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    refetchInterval: 15000,
  });
  const unreadNotifs = notifications?.filter(n => !n.read).length ?? 0;
  const unreadMsgs = conversations?.reduce((s, c) => s + (c.unreadCount ?? 0), 0) ?? 0;

  const isActive = (path: string) =>
    location === path || (path !== "/" && location.startsWith(path));

  const items = [
    { path: "/", label: "Home", Icon: Home, testId: "link-nav-home" },
    { path: "/explore", label: "Search", Icon: Search, testId: "link-nav-search" },
    { path: "/videos", label: "Reels", Icon: Film, testId: "link-nav-videos" },
    { path: "/messages", label: "Messages", Icon: MessageCircle, testId: "link-nav-messages", badge: unreadMsgs },
    { path: "/notifications", label: "Notifications", Icon: Heart, testId: "link-nav-notifications", badge: unreadNotifs },
    { path: "/create", label: "Create", Icon: PlusSquare, testId: "link-nav-create" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* === Desktop Sidebar === */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-[72px] xl:w-[245px] border-r border-border bg-background flex-col py-6 px-3 z-40">
        <Link href="/">
          <div className="px-2 mb-8 cursor-pointer" data-testid="link-logo">
            <span className="hidden xl:block text-3xl font-bold ig-gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', cursive" }}>
              Socially
            </span>
            <div className="xl:hidden w-8 h-8 rounded-lg ig-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </div>
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          {items.map(item => (
            <Link key={item.path} href={item.path}>
              <a
                className={`group flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-secondary transition-all relative ${
                  isActive(item.path) ? "font-bold" : "font-normal"
                }`}
                data-testid={item.testId}
              >
                <div className="relative">
                  <item.Icon
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                      isActive(item.path) ? "stroke-[2.5]" : ""
                    }`}
                    fill={isActive(item.path) && (item.Icon === Home || item.Icon === Heart) ? "currentColor" : "none"}
                  />
                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-base">{item.label}</span>
              </a>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-border space-y-1">
          {user && (
            <Link href={`/profile/${user.id}`}>
              <a
                className={`flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-secondary transition-all ${
                  location.startsWith("/profile") ? "font-bold" : ""
                }`}
                data-testid="link-nav-profile"
              >
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs bg-secondary">{userInitial(user)}</AvatarFallback>
                </Avatar>
                <span className="hidden xl:inline text-base">Profile</span>
              </a>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-secondary transition-all"
                data-testid="button-more-menu"
              >
                <Menu className="w-6 h-6" />
                <span className="hidden xl:inline text-base">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-60 rounded-2xl shadow-xl">
              <DropdownMenuItem asChild>
                <Link href="/settings"><a className="cursor-pointer flex items-center gap-3" data-testid="menu-settings"><Settings className="w-4 h-4" /> Settings</a></Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/saved"><a className="cursor-pointer flex items-center gap-3" data-testid="menu-saved"><Bookmark className="w-4 h-4" /> Saved</a></Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggle} className="cursor-pointer" data-testid="menu-toggle-theme">
                {resolvedTheme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                Switch appearance
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive" data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* === Mobile Top Bar === */}
      <header className="md:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-xl">
        <Link href="/">
          <span className="text-2xl font-bold ig-gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', cursive" }} data-testid="link-mobile-logo">
            Socially
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggle} data-testid="button-mobile-theme">
            {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="rounded-full relative" data-testid="link-mobile-notifications">
              <Heart className="w-6 h-6" fill={isActive("/notifications") ? "currentColor" : "none"} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="rounded-full relative" data-testid="link-mobile-messages">
              <MessageCircle className="w-6 h-6" />
              {unreadMsgs > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMsgs > 9 ? "9+" : unreadMsgs}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* === Mobile Bottom Tab Bar === */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-background/95 backdrop-blur-xl border-t border-border flex items-center justify-around">
        {[
          { path: "/", Icon: Home, testId: "link-tab-home" },
          { path: "/explore", Icon: Search, testId: "link-tab-search" },
          { path: "/create", Icon: PlusSquare, testId: "link-tab-create" },
          { path: "/videos", Icon: Film, testId: "link-tab-videos" },
          { path: user ? `/profile/${user.id}` : "/login", Icon: null, testId: "link-tab-profile", isProfile: true },
        ].map((item, i) => (
          <Link key={i} href={item.path}>
            <a className="flex-1 flex items-center justify-center h-full" data-testid={item.testId}>
              {item.isProfile ? (
                <Avatar className={`w-7 h-7 ${isActive("/profile") ? "ring-2 ring-foreground" : ""}`}>
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-[10px] bg-secondary">{userInitial(user)}</AvatarFallback>
                </Avatar>
              ) : item.Icon ? (
                <item.Icon
                  className={`w-7 h-7 ${isActive(item.path) ? "stroke-[2.5]" : ""}`}
                  fill={isActive(item.path) && item.Icon === Home ? "currentColor" : "none"}
                />
              ) : null}
            </a>
          </Link>
        ))}
      </nav>

      {/* === Main Content === */}
      <main className="md:ml-[72px] xl:ml-[245px] pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
