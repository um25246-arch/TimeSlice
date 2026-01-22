import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DataProvider } from "@/contexts/DataContext";
import Dashboard from "@/pages/Dashboard";
import Subjects from "@/pages/Subjects";
import Schedule from "@/pages/Schedule";
import Timer from "@/pages/Timer";
import Quizzes from "@/pages/Quizzes";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <SidebarInset className="flex-1 w-full min-w-0">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/timer" element={<Timer />} />
                    <Route path="/quizzes" element={<Quizzes />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
