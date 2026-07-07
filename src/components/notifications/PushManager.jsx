import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { qk } from "@/lib/query-hooks";
import {
  dismissPrompt,
  enablePush,
  initPushIfGranted,
  promptDismissed,
  pushPermission,
  pushSupported,
  routeForNotification,
} from "@/lib/push";

/**
 * Mounted once in AppShell. Wires foreground FCM messages to toasts and
 * shows a dismissible soft prompt instead of a browser prompt on load.
 */
export default function PushManager() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showBanner, setShowBanner] = useState(false);
  const [enabling, setEnabling] = useState(false);

  // Foreground messages → toast + fresh unread badge.
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    let unsubscribe = () => {};
    initPushIfGranted(({ title, body, type, data }) => {
      qc.invalidateQueries({ queryKey: qk.study.notificationsUnread });
      qc.invalidateQueries({ queryKey: qk.study.notifications, refetchType: "none" });
      toast(title, {
        description: body,
        action: {
          label: "View",
          onClick: () => navigate({ to: routeForNotification(type, data) }),
        },
      });
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user, qc, navigate]);

  // Soft prompt: only when logged in, supported, permission not decided yet.
  useEffect(() => {
    if (!user || promptDismissed() || pushPermission() !== "default") return undefined;
    let mounted = true;
    pushSupported().then((ok) => {
      if (mounted && ok) setShowBanner(true);
    });
    return () => {
      mounted = false;
    };
  }, [user]);

  const closeBanner = () => {
    dismissPrompt();
    setShowBanner(false);
  };

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const result = await enablePush();
      if (result === "granted") toast.success("Notifications enabled");
      else if (result === "denied") toast.error("Notifications are blocked in your browser settings");
    } catch {
      toast.error("Could not enable notifications. Please try again.");
    } finally {
      setEnabling(false);
      closeBanner();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-lg border bg-card p-4 text-card-foreground shadow-lg">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Bell className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Enable notifications</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            Get deadline, sprint and event reminders even when RAQIP is closed.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="h-8" onClick={handleEnable} disabled={enabling}>
              {enabling ? "Enabling..." : "Enable"}
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={closeBanner}>
              Later
            </Button>
          </div>
        </div>
        <button
          onClick={closeBanner}
          aria-label="Dismiss"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
