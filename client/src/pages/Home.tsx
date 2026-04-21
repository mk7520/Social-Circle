import { useAuth } from "@/hooks/use-auth";
import { usePosts } from "@/hooks/use-posts";
import { Navigation } from "@/components/Navigation";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import { Redirect } from "wouter";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: posts, isLoading: postsLoading, isError } = usePosts();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Non-authenticated users -> dedicated login page
  if (!user) {
    return <Redirect to="/login" />;
  }

  // (legacy marketing block kept below for reference, unreachable)
  if (false) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navigation />
        
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-16 pb-32">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.1]">
                  Connect deeper with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">your circle.</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Socially is a premium space for meaningful connections. Share moments, spark conversations, and build your community in style.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="rounded-full text-lg h-14 px-8 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
                    <a href="/api/login">Get Started Free</a>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full text-lg h-14 px-8 border-2 hover:bg-secondary/50">
                    Explore Features
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground pt-8">
                  <div className="flex -space-x-3">
                    {/* Placeholder avatars for social proof */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-background" />
                    <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-background" />
                    <div className="w-10 h-10 rounded-full bg-slate-400 border-2 border-background" />
                  </div>
                  <p>Join 10,000+ creators today</p>
                </div>
              </div>

              <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                {/* Visual Representation / 3D Mockup */}
                <div className="relative z-10 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  {/* Mock Post */}
                  <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-secondary rounded" />
                        <div className="h-3 w-20 bg-secondary/50 rounded" />
                      </div>
                    </div>
                    <div className="h-32 bg-accent/10 rounded-lg mb-3" />
                    <div className="flex gap-4">
                      <div className="h-8 w-16 bg-secondary rounded-full" />
                      <div className="h-8 w-16 bg-secondary rounded-full" />
                    </div>
                  </div>
                  
                  {/* Mock Post 2 */}
                  <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 opacity-60">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-40 bg-secondary rounded" />
                        <div className="h-3 w-24 bg-secondary/50 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-secondary/50 rounded mb-2" />
                    <div className="h-4 w-2/3 bg-secondary/50 rounded" />
                  </div>
                </div>

                {/* Decorative floating elements */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-pulse" />
                <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-pulse delay-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className="py-24 bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">Why choose Socially?</h2>
              <p className="text-muted-foreground">We've stripped away the noise to focus on what matters: authentic connection and beautiful content.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Meaningful Interactions", desc: "No algorithm chasing. Just chronological feeds and genuine engagement." },
                { title: "Beautiful by Design", desc: "Every pixel is crafted to make your content look stunning automatically." },
                { title: "Privacy First", desc: "Your data belongs to you. No tracking, no selling, just connecting." }
              ].map((feature, i) => (
                <div key={i} className="bg-background p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Logged In Feed
  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Navigation/Profile Summary (Desktop) */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 sticky top-24">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-4 border-background shadow-md">
                    {/* Dynamic image from user profile or fallback */}
                    <img 
                      src={user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userHandle(user)}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <h3 className="mt-4 font-bold text-lg">{displayName(user)}</h3>
                <p className="text-sm text-muted-foreground">@{userHandle(user)}</p>
                
                <div className="mt-6 pt-6 border-t border-border flex justify-between text-sm">
                  <div className="text-center flex-1">
                    <div className="font-bold text-lg">124</div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wider">Posts</div>
                  </div>
                  <div className="w-px bg-border"></div>
                  <div className="text-center flex-1">
                    <div className="font-bold text-lg">1.4k</div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wider">Followers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <CreatePost />

            {postsLoading ? (
              <div className="flex flex-col gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 h-64 animate-pulse shadow-sm border border-border/50" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
                <p className="text-destructive font-medium">Failed to load posts.</p>
                <Button variant="link" onClick={() => window.location.reload()}>Try again</Button>
              </div>
            ) : posts?.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed text-muted-foreground">
                <p className="text-lg">No posts yet.</p>
                <p className="text-sm">Be the first to share something!</p>
              </div>
            ) : (
              posts?.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
