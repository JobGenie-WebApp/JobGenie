"use client";

import { Bell, Check, Trash2, Calendar, CheckCircle2, XCircle, Clock, Gift, Send, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  role?: "employer" | "candidate";
}

function getNotificationMeta(type: string): {
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
} {
  if (type.includes("confirmed") || type.includes("accepted") || type.includes("offer_received")) {
    return { Icon: CheckCircle2, iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" };
  }
  if (type.includes("declined") || type.includes("cancelled") || type.includes("withdrawn")) {
    return { Icon: XCircle, iconBg: "bg-red-100 dark:bg-red-500/15", iconColor: "text-red-500 dark:text-red-400" };
  }
  if (type.includes("rescheduled")) {
    return { Icon: RefreshCw, iconBg: "bg-amber-100 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" };
  }
  if (type.includes("offer")) {
    return { Icon: Gift, iconBg: "bg-violet-100 dark:bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400" };
  }
  if (type.includes("scheduled") || type.includes("interview")) {
    return { Icon: Calendar, iconBg: "bg-blue-100 dark:bg-blue-500/15", iconColor: "text-blue-600 dark:text-blue-400" };
  }
  if (type.includes("sent") || type.includes("received") || type.includes("invitation")) {
    return { Icon: Send, iconBg: "bg-sky-100 dark:bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400" };
  }
  return { Icon: Clock, iconBg: "bg-muted", iconColor: "text-muted-foreground" };
}

export function NotificationBell({ role = "candidate" }: NotificationBellProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const data = notification.data;
    if (!data) return;

    const goToInvitation = (id: string) => {
      if (role === "employer") {
        router.push(`/employer/invitations?id=${id}`);
      } else {
        router.push(`/candidate/invitations/${id}`);
      }
    };

    try {
      switch (notification.type) {
        case "invitation_received":
        case "invitation_cancelled":
        case "invitation_accepted":
        case "invitation_declined":
        case "invitation_sent":
        case "interview_scheduled":
        case "interview_confirmed":
        case "interview_cancelled":
        case "interview_rescheduled":
        case "interview_completed":
        case "offer_received":
        case "offer_withdrawn":
        case "offer_accepted":
        case "offer_declined":
          if (data.invitation_id) {
            goToInvitation(data.invitation_id as string);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error navigating:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <Bell className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[420px]">
            <div className="py-1">
              {notifications.slice(0, 10).map((notification) => {
                const { Icon, iconBg, iconColor } = getNotificationMeta(notification.type);
                const unread = !notification.is_read;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative flex items-start gap-3 px-4 py-3 cursor-pointer",
                      "hover:bg-accent/60 transition-colors duration-100",
                      unread && "bg-accent/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Type icon */}
                    <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", iconBg)}>
                      <Icon className={cn("h-4 w-4", iconColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-[13px] leading-snug", unread ? "font-semibold" : "font-medium")}>
                          {notification.title}
                        </p>
                        {unread && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {notification.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Actions (on hover) */}
                    <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {unread && (
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-red-500 transition-colors"
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 10 && (
          <div className="border-t border-border px-4 py-2.5 text-center">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
