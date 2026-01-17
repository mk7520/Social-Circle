import { useParams } from "wouter";
import { useUser } from "@/hooks/use-users";
import { usePosts } from "@/hooks/use-posts";
import { Navigation } from "@/components/Navigation";
import { PostCard } from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Link as LinkIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { id } = useParams();
  const { data: user, isLoading: userLoading } = useUser(id!);
  const { data: allPosts, isLoading: postsLoading } = usePosts();

  // Filter posts for this user (ideally this would be a separate API endpoint)
  const userPosts = allPosts?.filter(post => post.authorId === id);

  if (userLoading || postsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <Navigation />
      
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-primary to-accent h-48 md:h-64 w-full relative">
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative">
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg -mt-16 md:-mt-24 bg-background">
              <AvatarImage src={user.profileImageUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {user.firstName?.[0] || user.username[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold font-display">{user.firstName} {user.lastName}</h1>
                  <p className="text-muted-foreground font-medium">@{user.username}</p>
                </div>
                <div className="flex gap-3">
                  <Button className="rounded-full px-6 bg-primary hover:bg-primary/90">Follow</Button>
                  <Button variant="outline" className="rounded-full">Message</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {/* Bio would go here if schema supported it */}
            <p className="text-lg leading-relaxed max-w-2xl">
              Digital explorer and creative mind. Sharing thoughts on technology, design, and the future of social connection.
            </p>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                <a href="#" className="hover:text-primary hover:underline">portfolio.site</a>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {format(new Date(user.createdAt || Date.now()), 'MMMM yyyy')}</span>
              </div>
            </div>

            <div className="flex gap-8 border-t border-border pt-6">
              <div className="flex gap-2 items-baseline">
                <span className="font-bold text-lg text-foreground">{userPosts?.length || 0}</span>
                <span className="text-muted-foreground">Posts</span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="font-bold text-lg text-foreground">1,234</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="font-bold text-lg text-foreground">567</span>
                <span className="text-muted-foreground">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts Feed */}
        <div className="mt-10 space-y-6">
          <h2 className="text-xl font-bold px-2">Recent Activity</h2>
          {userPosts?.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center border border-dashed border-border">
              <p className="text-muted-foreground">No posts yet.</p>
            </div>
          ) : (
            userPosts?.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
