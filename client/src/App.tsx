import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { AnimatePresence } from "framer-motion";

// Pages
import Home from "@/pages/Home";
import Journey from "@/pages/Journey";
import Events from "@/pages/Events";
import Community from "@/pages/Community";
import Darshan from "@/pages/Darshan";
import Seva from "@/pages/Seva";
import PlayIndex from "@/pages/PlayIndex";
import PlayQuiz from "@/pages/PlayQuiz";
import PlayCrossword from "@/pages/PlayCrossword";
import PlayWordle from "@/pages/PlayWordle";
import PlaySpellingBee from "@/pages/PlaySpellingBee";
import Legacy from "@/pages/Legacy";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/" component={Home} />
          <Route path="/journey" component={Journey} />
          <Route path="/events" component={Events} />
          <Route path="/community" component={Community} />
          <Route path="/darshan" component={Darshan} />
          <Route path="/seva" component={Seva} />
          <Route path="/play" component={PlayIndex} />
          <Route path="/play/quiz" component={PlayQuiz} />
          <Route path="/play/crossword" component={PlayCrossword} />
          <Route path="/play/wordle" component={PlayWordle} />
          <Route path="/play/spelling-bee" component={PlaySpellingBee} />
          <Route path="/legacy" component={Legacy} />
          <Route component={NotFound} />
        </Switch>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
