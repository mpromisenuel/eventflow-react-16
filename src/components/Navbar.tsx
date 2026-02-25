import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import CreateEventDialog from "./CreateEventDialog";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            Eventful
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            Events
          </Link>
          <CreateEventDialog />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
