import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Redirect, Link, useLocation, useRoute } from "wouter";
import { Loader2, Sun, Moon, Lock, Eye, Languages, Ban, LogOut, User as UserIcon, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/ThemeProvider";
import { useUpdateProfile, useToggleBlock } from "@/hooks/use-social";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { displayName, userHandle, userInitial } from "@/lib/user-utils";
import type { User } from "@shared/models/auth";

const SECTIONS = [
  { key: "profile", label: "Edit profile", Icon: UserIcon },
  { key: "privacy", label: "Privacy", Icon: Lock },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "appearance", label: "Appearance", Icon: Palette },
  { key: "blocked", label: "Blocked accounts", Icon: Ban },
];

export default function Settings() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [matchProfile] = useRoute("/settings/profile");
  const [activeSection, setActiveSection] = useState<string>(matchProfile ? "profile" : "profile");

  if (authLoading) return <FullLoader />;
  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-6 md:py-10 px-4">
        <h1 className="text-xl font-bold mb-6" data-testid="text-settings-title">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
                }`}
                data-testid={`settings-tab-${s.key}`}
              >
                <s.Icon className="w-4 h-4" /> {s.label}
              </button>
            ))}
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 mt-3"
              data-testid="button-logout-settings"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </aside>

          <section>
            {activeSection === "profile" && <ProfileSettings user={user} />}
            {activeSection === "privacy" && <PrivacySettings user={user} />}
            {activeSection === "notifications" && <NotificationSettings />}
            {activeSection === "appearance" && <AppearanceSettings user={user} />}
            {activeSection === "blocked" && <BlockedSettings />}
          </section>
        </div>
      </div>
    </Layout>
  );
}

function ProfileSettings({ user }: { user: User }) {
  const { toast } = useToast();
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    username: user.username || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    website: user.website || "",
    location: user.location || "",
    profileImageUrl: user.profileImageUrl || "",
  });

  useEffect(() => {
    setForm({
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      bio: user.bio || "",
      website: user.website || "",
      location: user.location || "",
      profileImageUrl: user.profileImageUrl || "",
    });
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(form, {
      onSuccess: () => toast({ title: "Saved", description: "Your profile has been updated." }),
      onError: (err: any) => toast({ title: "Error", description: err?.message || "Failed", variant: "destructive" }),
    });
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
      <h2 className="text-lg font-semibold">Edit profile</h2>

      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={form.profileImageUrl || undefined} />
          <AvatarFallback className="bg-secondary">{userInitial(user)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm">{userHandle(user)}</p>
          <Label className="text-xs text-muted-foreground">Profile photo URL</Label>
          <Input value={form.profileImageUrl} onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })} placeholder="https://..." className="mt-1 h-9 text-sm" data-testid="input-photo-url" />
        </div>
      </div>

      <Field label="Username">
        <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" data-testid="input-username" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="First name">
          <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} data-testid="input-first-name" />
        </Field>
        <Field label="Last name">
          <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} data-testid="input-last-name" />
        </Field>
      </div>

      <Field label="Bio" hint={`${form.bio.length}/150`}>
        <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 150) })} rows={3} placeholder="Tell people about yourself" data-testid="input-bio" />
      </Field>

      <Field label="Website">
        <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yoursite.com" data-testid="input-website" />
      </Field>

      <Field label="Location">
        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" data-testid="input-location" />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending} className="rounded-lg" data-testid="button-save-profile">
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-sm font-semibold">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PrivacySettings({ user }: { user: User }) {
  const update = useUpdateProfile();
  const { toast } = useToast();
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
      <h2 className="text-lg font-semibold">Privacy</h2>

      <Toggle
        title="Private account"
        description="When your account is private, only people you approve can see your posts."
        checked={user.isPrivate}
        Icon={Lock}
        onChange={(v) => update.mutate({ isPrivate: v }, { onSuccess: () => toast({ title: v ? "Account is private" : "Account is public" }) })}
        testId="switch-private"
      />

      <Toggle
        title="Hide like counts"
        description="Hide the total number of likes on your posts. You can still see them yourself."
        checked={user.hideLikes}
        Icon={Eye}
        onChange={(v) => update.mutate({ hideLikes: v }, { onSuccess: () => toast({ title: v ? "Likes hidden" : "Likes visible" }) })}
        testId="switch-hide-likes"
      />
    </div>
  );
}

function NotificationSettings() {
  const [push, setPush] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [likes, setLikes] = useState(true);
  const [comments, setComments] = useState(true);
  const [follows, setFollows] = useState(true);
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <Toggle title="In-app notifications" description="Receive notifications inside the app." checked={push} onChange={setPush} Icon={Bell} testId="switch-push" />
      <Toggle title="Email digest" description="A weekly summary of your activity." checked={emailDigest} onChange={setEmailDigest} Icon={Bell} testId="switch-email" />
      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-semibold mb-4">From people</h3>
        <Toggle title="Likes" description="" checked={likes} onChange={setLikes} testId="switch-likes" />
        <Toggle title="Comments" description="" checked={comments} onChange={setComments} testId="switch-comments" />
        <Toggle title="New followers" description="" checked={follows} onChange={setFollows} testId="switch-follows" />
      </div>
      <p className="text-xs text-muted-foreground">Preferences are saved on this device.</p>
    </div>
  );
}

function AppearanceSettings({ user }: { user: User }) {
  const { theme, setTheme } = useTheme();
  const update = useUpdateProfile();
  const lang = user.language || "en";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
      <h2 className="text-lg font-semibold">Appearance & Language</h2>

      <div>
        <Label className="text-sm font-semibold mb-2 block">Theme</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                theme === t ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/40"
              }`}
              data-testid={`theme-${t}`}
            >
              {t === "light" ? <Sun className="w-4 h-4" /> : t === "dark" ? <Moon className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block flex items-center gap-2"><Languages className="w-4 h-4" /> Language</Label>
        <div className="grid grid-cols-2 gap-2">
          {[{k:"en",l:"English"},{k:"ar",l:"العربية"}].map(o => (
            <button
              key={o.k}
              onClick={() => update.mutate({ language: o.k as any })}
              className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                lang === o.k ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/40"
              }`}
              data-testid={`lang-${o.k}`}
            >
              {o.l}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">RTL preview applies on next reload.</p>
      </div>
    </div>
  );
}

function BlockedSettings() {
  const { data, isLoading } = useQuery<User[]>({ queryKey: ["/api/blocks"] });
  const block = useToggleBlock();
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4">
      <h2 className="text-lg font-semibold">Blocked accounts</h2>
      {isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center" data-testid="empty-blocked">You haven't blocked anyone.</p>
      ) : data.map(u => (
        <div key={u.id} className="flex items-center justify-between" data-testid={`blocked-${u.id}`}>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={u.profileImageUrl || undefined} />
              <AvatarFallback className="bg-secondary">{userInitial(u)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{userHandle(u)}</p>
              <p className="text-xs text-muted-foreground">{displayName(u)}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => block.mutate(u.id)} className="rounded-lg" data-testid={`button-unblock-${u.id}`}>Unblock</Button>
        </div>
      ))}
    </div>
  );
}

function Toggle({ title, description, checked, onChange, Icon, testId }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; Icon?: any; testId?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex items-start gap-3">
        {Icon && <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />}
        <div>
          <p className="font-medium text-sm">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testId} />
    </div>
  );
}

function FullLoader() {
  return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
}
