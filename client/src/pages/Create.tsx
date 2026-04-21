import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { CreatePost } from "@/components/CreatePost";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function Create() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  return (
    <Layout>
      <CreatePost fullPage />
    </Layout>
  );
}
