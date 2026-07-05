import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import { useState } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";


function Router({ showDashboard, setShowDashboard }: { showDashboard: boolean; setShowDashboard: (show: boolean) => void }) {
  return (
    <Switch>
      <Route path={"/"}>
        {showDashboard ? (
          <Dashboard onBackToLanding={() => setShowDashboard(false)} />
        ) : (
          <LandingPage onEnterDashboard={() => setShowDashboard(true)} />
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}


function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router showDashboard={showDashboard} setShowDashboard={setShowDashboard} />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
