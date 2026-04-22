import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import Videos from "@/pages/Videos";
import Create from "@/pages/Create";
import Explore from "@/pages/Explore";
import Saved from "@/pages/Saved";
import Settings from "@/pages/Settings";
import Tag from "@/pages/Tag";
import FollowList from "@/pages/FollowList";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/explore" component={Explore} />
      <Route path="/create" component={Create} />
      <Route path="/saved" component={Saved} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/profile" component={Settings} />
      <Route path="/tag/:tag" component={Tag} />
      <Route path="/profile/:id/followers">{() => <FollowList kind="followers" />}</Route>
      <Route path="/profile/:id/following">{() => <FollowList kind="following" />}</Route>
      <Route path="/profile/:id" component={Profile} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:otherId" component={Messages} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/videos" component={Videos} />
      <Route component={NotFound} />
    </Switch>
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
