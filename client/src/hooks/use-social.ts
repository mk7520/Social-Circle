import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserProfile } from "@shared/schema";
import type { User } from "@shared/models/auth";

export function useProfile(id: string | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: ["/api/profile", id],
    queryFn: async () => {
      if (!id) return null;
      const r = await fetch(`/api/profile/${id}`, { credentials: "include" });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Failed to load profile");
      return r.json();
    },
    enabled: !!id,
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const r = await apiRequest("POST", `/api/users/${userId}/follow`);
      return r.json();
    },
    onSuccess: (_d, userId) => {
      qc.invalidateQueries({ queryKey: ["/api/profile", userId] });
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const r = await apiRequest("POST", `/api/posts/${postId}/bookmark`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/posts/saved"] });
    },
  });
}

export function useToggleCommentLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      const r = await apiRequest("POST", `/api/comments/${commentId}/like`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const r = await apiRequest("DELETE", `/api/posts/${postId}`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const r = await apiRequest("POST", `/api/posts/${postId}/pin`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("PATCH", "/api/profile", data);
      return r.json();
    },
    onSuccess: (data: User) => {
      qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
      qc.invalidateQueries({ queryKey: ["/api/profile", data.id] });
      qc.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useToggleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const r = await apiRequest("POST", `/api/users/${userId}/block`);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/blocks"] });
      qc.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}
