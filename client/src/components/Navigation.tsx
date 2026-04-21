import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Home, User, LogOut, Bell, Search, Menu, MessageCircle, Video,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import type { NotificationWithActor } from "@shared/schema";

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifications } = useQuery<NotificationWithActor[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  const isActive = (path: string) => location === path || (path !== "/" && location.startsWith(path));

  const navItems = [
    { path: "/", label: "Home", Icon: Home, testId: "link-nav-home" },
    { path: "/videos", label: "Shorts", Icon: Video, testId: "link-nav-videos" },
    { path: "/messages", label: "Messages", Icon: MessageCircle, testId: "link-nav-messages" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group" data-testid="link-logo">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-lg font-display">S</span>
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                  Socially
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && navItems.map(item => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  data-testid={item.testId}
                >
                  <item.Icon className="w-4 h-4" />
                  {item.label}
                </a>
              </Link>
            ))}
            {isAuthenticated && (
              <div className="relative w-56 ml-4">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none"
                  data-testid="input-nav-search"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`relative rounded-full ${isActive("/notifications") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                    data-testid="link-nav-notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center" data-testid="badge-unread">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <div className="h-6 w-px bg-border/60 mx-1" />

                <div className="flex items-center gap-2">
                  <Link href={`/profile/${user?.id}`}>
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-nav-profile">
                      <span className="text-sm font-medium hidden lg:block">{user && displayName(user)}</span>
                      <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-border/20">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {userInitial(user)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Sign out"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <Button asChild className="rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" data-testid="button-signin">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px]">
                <div className="flex flex-col h-full mt-6 space-y-6">
                  {isAuthenticated && user && (
                    <Link href={`/profile/${user.id}`}>
                      <div onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 mb-2 pb-4 border-b cursor-pointer">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>{userInitial(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{displayName(user)}</p>
                          <p className="text-xs text-muted-foreground">@{userHandle(user)}</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  <nav className="flex flex-col space-y-1">
                    {isAuthenticated && [
                      ...navItems,
                      { path: "/notifications", label: "Notifications", Icon: Bell, testId: "link-mobile-notifications" },
                      ...(user ? [{ path: `/profile/${user.id}`, label: "Profile", Icon: User, testId: "link-mobile-profile" }] : []),
                    ].map(item => (
                      <Link key={item.path} href={item.path}>
                        <a
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 text-base font-medium px-3 py-3 rounded-xl transition-colors ${
                            isActive(item.path) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                          }`}
                          data-testid={item.testId}
                        >
                          <item.Icon className="w-5 h-5" />
                          {item.label}
                        </a>
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto pt-6 border-t">
                    {isAuthenticated ? (
                      <Button
                        variant="destructive"
                        className="w-full justify-start gap-3"
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        data-testid="button-mobile-logout"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button asChild className="w-full" data-testid="button-mobile-signin">
                        <Link href="/login">Sign In</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
