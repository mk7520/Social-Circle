import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { displayName, userInitial } from "@/lib/user-utils";
import type { User } from "@shared/models/auth";

export function Stories() {
  const { user } = useAuth();
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const others = (users ?? []).filter(u => u.id !== user?.id).slice(0, 12);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6 overflow-hidden">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {/* Your story */}
        {user && (
          <button className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]" data-testid="button-your-story">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-background">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary">{userInitial(user)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-xs truncate max-w-full">Your story</span>
          </button>
        )}

        {/* Other users as stories */}
        {others.map(u => (
          <button key={u.id} className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]" data-testid={`story-${u.id}`}>
            <div className="ig-ring">
              <div className="bg-background rounded-full p-[2px]">
                <Avatar className="w-[60px] h-[60px]">
                  <AvatarImage src={u.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-secondary">{userInitial(u)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs truncate max-w-full text-foreground/80">{displayName(u)}</span>
          </button>
        ))}

        {others.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 px-2">
            Stories from people you follow will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
