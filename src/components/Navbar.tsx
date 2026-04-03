import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Menu, LogIn, LogOut, User, Plus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Venues", to: "/events" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAgent, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email;

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            Eventful Rentals
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

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {displayName}
                {isAgent && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Agent</Badge>
                )}
              </span>
              {isAgent && (
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="font-body gap-1.5 text-xs">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
              )}
              <Button size="sm" onClick={() => navigate("/create-event")} className="font-body gap-1.5 text-xs">
                <Plus className="h-4 w-4" /> List a Venue
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="font-body gap-1.5 text-xs">
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
                {user && isAgent && (
                  <Link to="/dashboard" className="text-sm text-primary font-medium py-2 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
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
