import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Redirect, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Search, MessageSquarePlus, MessageCircle, ArrowLeft, Smile, Heart, Image as ImageIcon, Phone, Video as VideoIcon, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
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
    <Layout noRightRail>
      <div className="h-[calc(100vh-3.5rem)] md:h-screen flex bg-background">
        {/* Sidebar */}
        <div className={`w-full md:w-[350px] xl:w-[400px] border-r border-border flex flex-col ${otherId ? "hidden md:flex" : "flex"}`}>
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" data-testid="text-conversations-title">{userHandle(user)}</h2>
              <Button asChild size="icon" variant="ghost" className="rounded-full" data-testid="button-new-message">
                <Link href="/messages/new"><MessageSquarePlus className="w-6 h-6" strokeWidth={1.5} /></Link>
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-9 rounded-lg bg-secondary/50 border-transparent h-9" data-testid="input-search-conversations" />
            </div>
            <div className="flex justify-between mt-4 px-1">
              <h3 className="text-sm font-semibold">Messages</h3>
              <button className="text-xs text-muted-foreground font-semibold hover:text-foreground">Requests</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="p-3 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />)}
              </div>
            ) : !convs || convs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <div className="w-16 h-16 rounded-full border-2 border-foreground/30 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <p className="font-semibold text-foreground">Your messages</p>
                <p className="mt-1 mb-4">Send a message to start a chat.</p>
                <Button size="sm" onClick={() => navigate("/messages/new")} className="rounded-lg" data-testid="button-start-conversation">
                  Send message
                </Button>
              </div>
            ) : (
              <ul>
                {convs.map(c => {
                  const isMine = c.lastMessage.senderId === user.id;
                  const active = otherId === c.user.id;
                  return (
                    <li key={c.user.id}>
                      <button
                        onClick={() => navigate(`/messages/${c.user.id}`)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors ${active ? "bg-secondary" : ""}`}
                        data-testid={`conversation-${c.user.id}`}
                      >
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={c.user.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-secondary">{userInitial(c.user)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{userHandle(c.user)}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {isMine ? "You: " : ""}{c.lastMessage.content} · {formatDistanceToNow(new Date(c.lastMessage.createdAt))}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 ${otherId ? "flex" : "hidden md:flex"} flex-col bg-background`}>
          {otherId === "new" ? (
            <NewConversation currentUserId={user.id} />
          ) : otherId ? (
            <Chat currentUser={user} otherId={otherId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
                <Send className="w-12 h-12" strokeWidth={1.2} />
              </div>
              <h2 className="text-2xl font-light mb-2">Your messages</h2>
              <p className="text-muted-foreground text-sm mb-4">Send a photo or message to start a conversation.</p>
              <Button onClick={() => navigate("/messages/new")} className="rounded-lg" data-testid="button-empty-send">Send message</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
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
      <div className="p-5 border-b border-border flex items-center gap-3">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="rounded-full md:hidden" data-testid="button-back-new"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h3 className="font-semibold text-lg flex-1 text-center md:text-left">New message</h3>
      </div>
      <div className="px-5 py-3 border-b border-border flex items-center gap-3">
        <span className="font-semibold text-sm">To:</span>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="border-none focus-visible:ring-0 px-0" data-testid="input-search-users" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No accounts found.</div>
        ) : filtered.map(u => (
          <button
            key={u.id}
            onClick={() => navigate(`/messages/${u.id}`)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/60 text-left"
            data-testid={`user-${u.id}`}
          >
            <Avatar className="w-11 h-11">
              <AvatarImage src={u.profileImageUrl || undefined} />
              <AvatarFallback className="bg-secondary">{userInitial(u)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{userHandle(u)}</p>
              <p className="text-xs text-muted-foreground">{displayName(u)}</p>
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
      <div className="px-5 py-3 border-b border-border flex items-center gap-3">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="md:hidden rounded-full" data-testid="button-back-conversations"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <Link href={`/profile/${otherId}`}>
          <div className="flex items-center gap-3 hover:opacity-80 cursor-pointer flex-1">
            <Avatar className="w-10 h-10">
              <AvatarImage src={other?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-secondary">{userInitial(other)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm" data-testid="text-chat-name">{userHandle(other)}</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-1 text-foreground">
          <Button variant="ghost" size="icon" className="rounded-full"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><VideoIcon className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><Info className="w-5 h-5" /></Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={other?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-secondary text-2xl">{userInitial(other)}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-lg">{displayName(other)}</p>
            <p className="text-sm text-muted-foreground">Socially · {userHandle(other)}</p>
            <Link href={`/profile/${otherId}`}>
              <Button variant="secondary" size="sm" className="rounded-lg mt-4">View profile</Button>
            </Link>
          </div>
        ) : messages.map((m, i) => {
          const mine = m.senderId === currentUser.id;
          const prev = messages[i - 1];
          const showAvatar = !mine && (!prev || prev.senderId !== m.senderId);
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`} data-testid={`message-${m.id}`}>
              {!mine && (
                <div className="w-7">
                  {showAvatar && (
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={m.sender.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-secondary text-[10px]">{userInitial(m.sender)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
              <div className={`max-w-[60%] rounded-3xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim()); }}
        className="p-4 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center gap-2 border border-border rounded-full px-4 py-1.5">
          <Smile className="w-5 h-5 text-foreground/70 shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-transparent outline-none text-sm py-1.5"
            data-testid="input-message"
          />
          {text ? (
            <button type="submit" disabled={send.isPending} className="text-sm font-semibold text-primary disabled:opacity-50" data-testid="button-send-message">
              {send.isPending ? "..." : "Send"}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-foreground/70">
              <ImageIcon className="w-5 h-5" />
              <Heart className="w-5 h-5" />
            </div>
          )}
        </div>
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
