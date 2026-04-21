import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[935px] flex items-center justify-center gap-8">
        {/* Phone mockup (desktop only) */}
        <div className="hidden lg:block relative w-[380px] h-[580px]">
          <div className="absolute inset-0 ig-gradient rounded-[3rem] blur-3xl opacity-20" />
          <div className="relative w-full h-full bg-foreground/5 rounded-[3rem] border-8 border-foreground/10 overflow-hidden shadow-2xl">
            {/* Mock IG screen */}
            <div className="absolute inset-0 bg-background p-4 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold ig-gradient-text" style={{ fontFamily: "'Plus Jakarta Sans', cursive" }}>Socially</span>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary" />
                  <div className="w-6 h-6 rounded-full bg-secondary" />
                </div>
              </div>
              {/* Stories */}
              <div className="flex gap-2 mt-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="ig-ring shrink-0">
                    <div className="bg-background rounded-full p-[2px]">
                      <div className="w-12 h-12 rounded-full bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Post */}
              <div className="mt-3 bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-3">
                  <div className="w-8 h-8 rounded-full ig-gradient" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 w-20 bg-secondary rounded" />
                    <div className="h-2 w-12 bg-secondary/60 rounded" />
                  </div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200" />
                <div className="p-3 space-y-2">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-secondary" />
                    <div className="w-6 h-6 rounded bg-secondary" />
                    <div className="w-6 h-6 rounded bg-secondary" />
                  </div>
                  <div className="h-2.5 w-24 bg-secondary rounded" />
                  <div className="h-2.5 w-3/4 bg-secondary/60 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm space-y-3">
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h1 className="text-center text-5xl font-bold ig-gradient-text pt-2 pb-4" style={{ fontFamily: "'Plus Jakarta Sans', cursive" }} data-testid="text-brand-heading">
              Socially
            </h1>

            <div className="space-y-2">
              <Input placeholder="Phone number, username, or email" className="rounded-md bg-secondary/40 border-border h-11 text-sm" disabled data-testid="input-username-mock" />
              <Input placeholder="Password" type="password" className="rounded-md bg-secondary/40 border-border h-11 text-sm" disabled data-testid="input-password-mock" />
            </div>

            <Button asChild className="w-full h-10 rounded-lg font-semibold text-sm" data-testid="button-login">
              <a href="/api/login">Log in</a>
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold uppercase">
              <div className="flex-1 h-px bg-border" />
              <span>OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <a
              href="/api/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-foreground transition-colors py-2"
              data-testid="button-replit-login"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/></svg>
              Continue with Replit
            </a>

            <p className="text-center text-xs text-muted-foreground">
              <a href="#" className="hover:underline">Forgot password?</a>
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center text-sm">
            Don't have an account? <a href="/api/login" className="text-primary font-semibold" data-testid="link-signup">Sign up</a>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            By continuing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
