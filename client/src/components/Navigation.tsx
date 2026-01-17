import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  User, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-lg font-display">S</span>
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                  Socially
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <a className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Home className="w-4 h-4" />
                Home
              </a>
            </Link>
            
            {/* Search Bar Placeholder */}
            <div className="relative w-64">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Bell className="w-5 h-5" />
                </Button>
                
                <div className="h-6 w-px bg-border/60 mx-1" />
                
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${user?.id}`}>
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <span className="text-sm font-medium hidden lg:block">{user?.firstName}</span>
                      <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-border/20">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user?.firstName?.[0] || user?.username?.[0]}
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
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <Button asChild className="rounded-full font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full mt-6 space-y-6">
                  {isAuthenticated && (
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">@{user?.username}</p>
                      </div>
                    </div>
                  )}

                  <nav className="flex flex-col space-y-4">
                    <Link href="/">
                      <a onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-lg font-medium text-foreground hover:text-primary">
                        <Home className="w-5 h-5" />
                        Home
                      </a>
                    </Link>
                    {isAuthenticated && user && (
                      <Link href={`/profile/${user.id}`}>
                        <a onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-lg font-medium text-foreground hover:text-primary">
                          <User className="w-5 h-5" />
                          Profile
                        </a>
                      </Link>
                    )}
                  </nav>

                  <div className="mt-auto pt-6 border-t">
                    {isAuthenticated ? (
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <a href="/api/login">Sign In</a>
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
