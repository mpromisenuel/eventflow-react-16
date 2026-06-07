import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Menu, LogIn, LogOut, User, Plus, LayoutDashboard, Bookmark, Shield, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Venues", to: "/events" },
  { label: "Get Quote", to: "/quote" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAgent, isAdmin, isSuperAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (e: any) {
      console.error(e);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email;

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            JEP Event Service
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={cn(
                "text-sm font-body transition-colors",
                pathname === link.to
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          {user && <NotificationBell />}
          {user ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate("/profile")} className="hidden lg:flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {displayName}
                {isSuperAdmin && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">Super</Badge>
                )}
                {!isSuperAdmin && isAgent && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Agent</Badge>
                )}
              </Button>
              {isSuperAdmin && (
                <Button size="sm" variant="default" onClick={() => navigate("/superadmin")} className="hidden md:flex font-body gap-1.5 text-xs">
                  <Shield className="h-4 w-4" /> Superadmin
                </Button>
              )}
              {(isAgent || isAdmin) && (
                <>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="hidden md:flex font-body gap-1.5 text-xs">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/admin/pipeline")} className="hidden lg:flex font-body gap-1.5 text-xs">
                    Pipeline
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/admin/vendors")} className="hidden lg:flex font-body gap-1.5 text-xs">
                    Vendors
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate("/favorites")} className="hidden md:flex font-body gap-1.5 text-xs">
                <Bookmark className="h-4 w-4" /> Wishlist
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/my-bookings")} className="hidden md:flex font-body gap-1.5 text-xs">
                <CalendarDays className="h-4 w-4" /> My Bookings
              </Button>
              <Button size="sm" onClick={() => navigate("/plan-my-event")} className="hidden sm:flex font-body gap-1.5 text-xs">
                <Plus className="h-4 w-4" /> Plan New Event
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden sm:flex font-body gap-1.5 text-xs">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")} className="font-body gap-1.5 text-xs">
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
          )}
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8 font-body">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={cn(
                      "text-sm transition-colors py-2",
                      pathname === link.to
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {user && (
                  <>
                    <Link to="/profile" className="text-sm py-2 flex items-center gap-2"><User className="h-4 w-4" /> Profile</Link>
                    <Link to="/favorites" className="text-sm py-2 flex items-center gap-2"><Heart className="h-4 w-4" /> Wishlist</Link>
                    <Link to="/my-bookings" className="text-sm py-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> My Bookings</Link>
                    <Link to="/plan-my-event" className="text-sm py-2 flex items-center gap-2"><Plus className="h-4 w-4" /> Plan New Event</Link>
                    {(isAgent || isAdmin) && (
                      <>
                        <Link to="/dashboard" className="text-sm text-primary font-medium py-2 flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                        <Link to="/admin/pipeline" className="text-sm py-2">Pipeline</Link>
                        <Link to="/admin/vendors" className="text-sm py-2">Vendors</Link>
                      </>
                    )}
                    {isSuperAdmin && (
                      <Link to="/superadmin" className="text-sm text-primary font-medium py-2 flex items-center gap-2"><Shield className="h-4 w-4" /> Superadmin</Link>
                    )}
                  </>
                )}
                {user ? (
                  <button onClick={handleSignOut} className="text-sm text-destructive py-2 text-left">
                    Sign Out
                  </button>
                ) : (
                  <Link to="/auth" className="text-sm text-primary font-medium py-2">
                    Sign In / Sign Up
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
