import { Link } from "react-router-dom";
import { CalendarDays, Menu } from "lucide-react";
import CreateEventDialog from "./CreateEventDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = ["Home", "About", "Features", "Contact"];

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            Eventful
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link}
              to="/"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <CreateEventDialog />
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
                    key={link}
                    to="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
