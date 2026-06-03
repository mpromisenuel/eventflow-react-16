import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { EventProvider } from "@/context/EventContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import Contact from "./pages/Contact";
import EventDetail from "./pages/EventDetail";
import Auth from "./pages/Auth";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import AgentDashboard from "./pages/AgentDashboard";
import MyBookings from "./pages/MyBookings";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Quote from "./pages/Quote";
import PlanMyEvent from "./pages/PlanMyEvent";
import Availability from "./pages/Availability";
import AdminKanban from "./pages/AdminKanban";
import Vendors from "./pages/Vendors";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
                <Route path="/edit-event/:id" element={<EditEvent />} />
                <Route path="/dashboard" element={<AgentDashboard />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/quote" element={<Quote />} />
                <Route path="/plan-my-event" element={<PlanMyEvent />} />
                <Route path="/availability" element={<Availability />} />
                <Route path="/admin/pipeline" element={<AdminKanban />} />
                <Route path="/admin/vendors" element={<Vendors />} />
                <Route path="/superadmin" element={<SuperAdmin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </EventProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
