import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, Heart, Video, Bell, ShieldCheck } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left: Brand / Hero */}
      <div className="relative lg:w-1/2 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent text-white p-10 lg:p-16 flex flex-col justify-between">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-[500px] h-[500px] bg-accent/40 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3" data-testid="brand-logo">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
            <span className="font-bold text-xl font-display">S</span>
          </div>
          <span className="font-display font-bold text-2xl">Socially</span>
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="w-4 h-4" /> Welcome to your circle
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold leading-tight">
            Share moments. <br /> Spark conversations. <br /> Build your community.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Sign in with one click and start posting, chatting, watching short videos and connecting with friends.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { Icon: Heart, label: "Likes & posts" },
              { Icon: MessageCircle, label: "Direct messages" },
              { Icon: Video, label: "Short videos" },
              { Icon: Bell, label: "Live notifications" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-3">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/70 text-sm">© Socially — Connect deeper.</p>
      </div>

      {/* Right: Auth Card */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold tracking-tight" data-testid="text-login-heading">
              Sign in or create your account
            </h2>
            <p className="text-muted-foreground">
              Continue securely with your Replit account. New here? An account will be created for you automatically.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              asChild
              size="lg"
              className="w-full h-14 rounded-2xl text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
              data-testid="button-login"
            >
              <a href="/api/login">Continue with Replit</a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-14 rounded-2xl text-base border-2"
              data-testid="button-signup"
            >
              <a href="/api/login">Create new account</a>
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <span>Your sign-in is handled securely. We never see your password.</span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
