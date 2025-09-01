import { Link, useLocation } from "react-router-dom";
import { Search, TrendingUp, Bookmark, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "Search Patents",
    href: "/search",
    icon: Search,
  },
  {
    name: "Trends",
    href: "/trends", 
    icon: TrendingUp,
  },
  {
    name: "Watchlist",
    href: "/watchlist",
    icon: Bookmark,
  },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Search className="h-4 w-4 text-white" />
              </div>
              <span className="text-brand text-xl font-bold">Patent Scout</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === "/search" && location.pathname === "/");
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t md:hidden">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === "/search" && location.pathname === "/");
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}