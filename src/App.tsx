import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EventProvider } from "@/context/EventContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import Contact from "./pages/Contact";
import EventDetail from "./pages/EventDetail";
import Auth from "./pages/Auth";
import CreateEvent from "./pages/CreateEvent";
import AgentDashboard from "./pages/AgentDashboard";
import MyBookings from "./pages/MyBookings";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <EventProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/events" element={<Events />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/create-event" element={<CreateEvent />} />
              <Route path="/dashboard" element={<AgentDashboard />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </EventProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
