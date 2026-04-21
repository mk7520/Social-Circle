import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Redirect, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Search, MessageSquarePlus, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { displayName, userInitial } from "@/lib/user-utils";
import type { ConversationPreview, MessageWithUsers } from "@shared/schema";
import type { User } from "@shared/models/auth";

export default function Messages() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams<{ otherId?: string }>();
  const otherId = params.otherId;
  const [, navigate] = useLocation();

  const { data: convs, isLoading: convLoading } = useQuery<ConversationPreview[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    refetchInterval: 5000,
  });

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden grid md:grid-cols-[340px_1fr] h-[calc(100vh-7rem)]">
          {/* Sidebar */}
          <div className={`border-r border-border/50 flex flex-col ${otherId ? "hidden md:flex" : "flex"}`}>
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold" data-testid="text-conversations-title">Messages</h2>
                <Button asChild size="icon" variant="ghost" className="rounded-full" data-testid="button-new-message">
                  <Link href="/messages/new"><MessageSquarePlus className="w-5 h-5" /></Link>
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-9 rounded-full bg-secondary/50 border-transparent" data-testid="input-search-conversations" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />)}
                </div>
              ) : !convs || convs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  No conversations yet.
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => navigate("/messages/new")} data-testid="button-start-conversation">
                      Start a conversation
                    </Button>
                  </div>
                </div>
              ) : (
                <ul>
                  {convs.map(c => (
                    <li key={c.user.id}>
                      <button
                        onClick={() => navigate(`/messages/${c.user.id}`)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 hover-elevate active-elevate-2 transition-colors ${otherId === c.user.id ? "bg-primary/5" : ""}`}
                        data-testid={`conversation-${c.user.id}`}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={c.user.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">{userInitial(c.user)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <p className="font-semibold truncate">{displayName(c.user)}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(c.lastMessage.createdAt))}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {c.lastMessage.senderId === user.id ? "You: " : ""}{c.lastMessage.content}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Main */}
          <div className={`${otherId ? "flex" : "hidden md:flex"} flex-col`}>
            {otherId === "new" ? (
              <NewConversation currentUserId={user.id} />
            ) : otherId ? (
              <Chat currentUser={user} otherId={otherId} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <p className="font-medium text-lg">Your conversations</p>
                <p className="text-sm mt-1">Pick a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NewConversation({ currentUserId }: { currentUserId: string }) {
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const { data: users, isLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const filtered = (users ?? [])
    .filter(u => u.id !== currentUserId)
    .filter(u => !q || displayName(u).toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-5 border-b border-border/50">
        <h3 className="font-display font-bold text-lg mb-3">Start a new conversation</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people..." className="pl-9 rounded-full" data-testid="input-search-users" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
        ) : filtered.map(u => (
          <button
            key={u.id}
            onClick={() => navigate(`/messages/${u.id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover-elevate active-elevate-2 text-left"
            data-testid={`user-${u.id}`}
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={u.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">{userInitial(u)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName(u)}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Chat({ currentUser, otherId }: { currentUser: any; otherId: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: other } = useQuery<User | null>({ queryKey: ["/api/users", otherId] });
  const { data: messages, isLoading } = useQuery<MessageWithUsers[]>({
    queryKey: ["/api/messages", otherId],
    refetchInterval: 3000,
  });

  const send = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", { receiverId: otherId, content });
      return res.json();
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", otherId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <Link href="/messages">
          <Button variant="ghost" size="sm" className="md:hidden" data-testid="button-back-conversations">←</Button>
        </Link>
        <Link href={`/profile/${otherId}`}>
          <div className="flex items-center gap-3 hover:opacity-80 cursor-pointer">
            <Avatar className="w-10 h-10">
              <AvatarImage src={other?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">{userInitial(other)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold leading-tight" data-testid="text-chat-name">{displayName(other)}</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>
        </Link>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-background to-secondary/30">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">Say hi 👋</div>
        ) : messages.map(m => {
          const mine = m.senderId === currentUser.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={`message-${m.id}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border/50 rounded-bl-md"}`}>
                <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim()); }}
        className="p-4 border-t border-border/50 flex gap-2 bg-background"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          className="rounded-full bg-secondary/50 border-transparent"
          data-testid="input-message"
        />
        <Button type="submit" disabled={!text.trim() || send.isPending} className="rounded-full px-5" data-testid="button-send-message">
          {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </>
  );
}

function FullLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
