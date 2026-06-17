"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "./use-toast";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface UseNotificationsReturn extends NotificationsState {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });

  const supabase = createClient();

  // Fetch notifications from the database
  const fetchNotifications = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "User not authenticated",
        }));
        return;
      }

      // Fetch notifications ordered by created_at DESC
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        return;
      }

      const notifications = (data || []) as Notification[];
      const unreadCount = notifications.filter((n) => !n.is_read).length;

      setState({
        notifications,
        unreadCount,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [supabase]);

  // Mark a single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notificationId);

        if (error) throw error;

        // Update local state
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(
            0,
            prev.unreadCount -
              (prev.notifications.find((n) => n.id === notificationId)
                ?.is_read
                ? 0
                : 1)
          ),
        }));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [supabase]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      // Update local state
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [supabase]);

  // Delete a notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId);

        if (error) throw error;

        // Update local state
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.filter((n) => n.id !== notificationId),
          unreadCount: Math.max(
            0,
            prev.unreadCount -
              (prev.notifications.find((n) => n.id === notificationId)
                ?.is_read
                ? 0
                : 1)
          ),
        }));
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [supabase]
  );

  // Setup Realtime subscription
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Create a channel for notifications
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;

            // Add to local state
            setState((prev) => ({
              ...prev,
              notifications: [newNotification, ...prev.notifications],
              unreadCount: prev.unreadCount + 1,
            }));

            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.body || undefined,
              duration: 5000,
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;

            // Update local state
            setState((prev) => ({
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              ),
              unreadCount: prev.notifications.filter(
                (n) =>
                  !n.is_read &&
                  (n.id !== updatedNotification.id || !updatedNotification.is_read)
              ).length,
            }));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const deletedId = payload.old.id as string;

            // Remove from local state
            setState((prev) => {
              const deletedNotification = prev.notifications.find(
                (n) => n.id === deletedId
              );
              return {
                ...prev,
                notifications: prev.notifications.filter(
                  (n) => n.id !== deletedId
                ),
                unreadCount: Math.max(
                  0,
                  prev.unreadCount -
                    (deletedNotification && !deletedNotification.is_read ? 1 : 0)
                ),
              };
            });
          }
        )
        .subscribe();
    };

    // Initial fetch
    fetchNotifications();

    // Setup realtime subscription
    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, fetchNotifications]);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
