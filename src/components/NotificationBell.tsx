"use client";

import { Fragment, useState } from "react";
import { Bell, Check, Trash2, Calendar, CheckCircle2, XCircle, Clock, Gift, Send, RefreshCw, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
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
  if (type.includes("confirmed") || type.includes("accepted") || type.includes("hired") || type.includes("offer_received")) {
    return { Icon: CheckCircle2, iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" };
  }
  if (type.includes("declined") || type.includes("cancel") || type.includes("withdrawn") || type.includes("reject")) {
    return { Icon: XCircle, iconBg: "bg-red-100 dark:bg-red-500/15", iconColor: "text-red-500 dark:text-red-400" };
  }
  if (type.includes("rescheduled")) {
    return { Icon: RefreshCw, iconBg: "bg-amber-100 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" };
  }
  if (type.includes("review") || type.includes("shortlist")) {
    return { Icon: Clock, iconBg: "bg-amber-100 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" };
  }
  if (type.includes("offer")) {
    return { Icon: Gift, iconBg: "bg-violet-100 dark:bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400" };
  }
  if (type.includes("scheduled") || type.includes("interview")) {
    return { Icon: Calendar, iconBg: "bg-blue-100 dark:bg-blue-500/15", iconColor: "text-blue-600 dark:text-blue-400" };
  }
  if (type.includes("application") || type.includes("submitted") || type.includes("applied")) {
    return { Icon: FileText, iconBg: "bg-sky-100 dark:bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400" };
  }
  if (type.includes("sent") || type.includes("received") || type.includes("invitation")) {
    return { Icon: Send, iconBg: "bg-sky-100 dark:bg-sky-500/15", iconColor: "text-sky-600 dark:text-sky-400" };
  }
  return { Icon: Clock, iconBg: "bg-muted", iconColor: "text-muted-foreground" };
}

/** Bucket a notification into a recency section label. */
function sectionLabel(createdAt: string): string {
  const d = new Date(createdAt);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return "Earlier";
}

export function NotificationBell({ role = "candidate" }: NotificationBellProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

    // Toggle the detail view for this notification (title-only until clicked).
    setExpandedId((prev) => (prev === notification.id ? null : notification.id));

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
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
              <Bell className="h-6 w-6 text-primary/50" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground">New updates about your interviews and applications will show up here.</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[420px]">
            <div className="pb-1">
              {(() => {
                let lastSection = "";
                return notifications.slice(0, 12).map((notification) => {
                  const { Icon, iconBg, iconColor } = getNotificationMeta(notification.type);
                  const unread = !notification.is_read;
                  const section = sectionLabel(notification.created_at);
                  const showHeader = section !== lastSection;
                  lastSection = section;

                  return (
                    <Fragment key={notification.id}>
                      {showHeader && (
                        <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {section}
                        </div>
                      )}
                      <div
                        className={cn(
                          "group relative flex items-start gap-3 pl-4 pr-3 py-2.5 cursor-pointer transition-colors duration-100",
                          unread ? "bg-primary/[0.04] hover:bg-primary/[0.07]" : "hover:bg-muted/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Unread accent bar */}
                        {unread && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-primary" />}

                        {/* Type icon */}
                        <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBg)}>
                          <Icon className={cn("h-4 w-4", iconColor)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <p className={cn("flex-1 text-[13px] leading-snug", unread ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                              {notification.title}
                            </p>
                            {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          </div>
                          {notification.body && expandedId === notification.id && (
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                              {notification.body}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Actions (on hover) */}
                        <div className="flex shrink-0 gap-0.5 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {unread && (
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </Fragment>
                  );
                });
              })()}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 12 && (
          <div className="border-t border-border px-4 py-2.5 text-center">
            <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              View all notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
