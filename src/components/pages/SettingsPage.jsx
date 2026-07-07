import { useState, useMemo, useEffect } from "react";
import { Globe, Lock, Hourglass, RefreshCcw, ChevronRight, Loader2, Check, Pencil, ArrowLeft, Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfile } from "@/lib/query-hooks";
import { userApi, socialApi } from "@/lib/api";
import { qk } from "@/lib/query-hooks";
import { Link } from "@tanstack/react-router";
import { disablePush, enablePush, pushEnabled, pushPermission, pushSupported } from "@/lib/push";

const COMMON_TZ = [
  "UTC","Asia/Karachi","Asia/Dubai","Asia/Kolkata","Asia/Riyadh","Asia/Singapore",
  "Asia/Tokyo","Europe/London","Europe/Berlin","Europe/Istanbul",
  "America/New_York","America/Chicago","America/Los_Angeles","Australia/Sydney",
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();

  // ── Platform usage ───────────────────────────────────────────────────────
  const { data: usages = [], isLoading: loadingUsages } = useQuery({
    queryKey: qk.social.platforms({}),
    queryFn: () => socialApi.platforms.usage({}),
    retry: 1,
  });
  const { data: daySettings } = useQuery({
    queryKey: ["social", "day-settings"],
    queryFn: socialApi.platforms.daySettings,
    retry: 1,
  });

  const globalLimit = usages[0]?.daily_limit_minutes ?? usages[0]?.dailyLimitMinutes ?? 60;
  const resetHour = daySettings?.day_reset_hour ?? daySettings?.dayResetHour ?? 0;

  // ── Mutations ────────────────────────────────────────────────────────────
  const tzMut = useMutation({
    mutationFn: (timezone) => userApi.updateProfile({ timezone }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.user.profile }); toast.success("Timezone updated"); },
    onError: (e) => toast.error(e?.message || "Could not update timezone"),
  });
  const privMut = useMutation({
    mutationFn: (body) => userApi.updatePrivacy(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.user.profile }); },
    onError: (e) => toast.error(e?.message || "Could not update privacy"),
  });
  const limitMut = useMutation({
    // The server stores the limit per-platform (PATCH settings/{platform}); the
    // "one global limit" is applied by writing the same value to every platform,
    // mirroring the Flutter app. The usage query always returns all platforms.
    mutationFn: (minutes) => {
      if (!usages.length) throw new Error("Platforms not loaded yet — try again");
      return Promise.all(
        usages.map((u) =>
          socialApi.platforms.updateSetting(u.platform, { daily_limit_minutes: minutes })
        )
      );
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.social.platforms({}) }); toast.success("Social media daily limit updated"); },
    onError: (e) => toast.error(e?.message || "Could not update limit"),
  });
  const resetMut = useMutation({
    mutationFn: (hour) => socialApi.platforms.updateDaySettings({ day_reset_hour: hour }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["social", "day-settings"] }); toast.success("Daily reset time updated"); },
    onError: (e) => toast.error(e?.message || "Could not update reset time"),
  });

  // ── Push notifications ───────────────────────────────────────────────────
  // Read after mount only: Notification/localStorage don't exist during SSR.
  const [pushOn, setPushOn] = useState(false);
  const [pushOk, setPushOk] = useState(false);
  const [pushPerm, setPushPerm] = useState("default");
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    setPushOn(pushEnabled());
    setPushPerm(pushPermission());
    pushSupported().then(setPushOk);
  }, []);

  const togglePush = async (on) => {
    setPushBusy(true);
    try {
      if (on) {
        const result = await enablePush();
        setPushPerm(result);
        if (result === "granted") {
          setPushOn(true);
          toast.success("Notifications enabled");
        } else if (result === "denied") {
          toast.error("Notifications are blocked in your browser settings");
        }
      } else {
        disablePush();
        setPushOn(false);
        toast.success("Notifications turned off on this device");
      }
    } catch {
      toast.error("Could not enable notifications. Please try again.");
    } finally {
      setPushBusy(false);
    }
  };

  // ── Local state ──────────────────────────────────────────────────────────
  const [tzOpen, setTzOpen] = useState(false);
  const [tzQuery, setTzQuery] = useState("");
  const [limitOpen, setLimitOpen] = useState(false);
  const [limitVal, setLimitVal] = useState(60);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetVal, setResetVal] = useState(0);

  const timezone = profile?.timezone ?? "UTC";
  const isPrivate = !(profile?.profile_visibility ?? profile?.profileVisibility ?? true);

  const filteredTz = useMemo(
    () => COMMON_TZ.filter((t) => t.toLowerCase().includes(tzQuery.toLowerCase())),
    [tzQuery],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Timezone, privacy, and social limits</p>
        </div>
      </div>

      {/* ── Profile shortcut ── */}
      <div>
        <SectionLabel>Profile</SectionLabel>
        <Card>
          <Link to="/profile/edit" className="flex w-full items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors">
            <Pencil className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Edit profile</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Name, bio, university, avatar</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        </Card>
      </div>

      {/* ── Timezone ── */}
      <div>
        <SectionLabel>Timezone</SectionLabel>
        <Card>
          <SettingRow
            icon={Globe}
            title="Timezone"
            subtitle="Pomodoro days, streaks, deadlines and limits use this zone"
            value={tzMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : timezone}
            onClick={() => { setTzQuery(""); setTzOpen(true); }}
            disabled={tzMut.isPending}
          />
        </Card>
      </div>

      {/* ── Notifications ── */}
      <div>
        <SectionLabel>Notifications</SectionLabel>
        <Card>
          <div className="flex items-start gap-3 px-4 py-4">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Push notifications</div>
              <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {!pushOk
                  ? "Not supported in this browser"
                  : pushPerm === "denied"
                    ? "Blocked in your browser settings — allow notifications for this site to turn them on"
                    : "Deadline, sprint and event reminders on this device"}
              </div>
            </div>
            {pushBusy ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
            ) : (
              <Switch
                checked={pushOn}
                disabled={!pushOk || pushPerm === "denied"}
                onCheckedChange={togglePush}
              />
            )}
          </div>
        </Card>
      </div>

      {/* ── Privacy ── */}
      <div>
        <SectionLabel>Privacy</SectionLabel>
        <Card>
          <div className="flex items-start gap-3 px-4 py-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Private account</div>
              <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                When on, your profile, study status and posts are hidden from everyone except your friends
              </div>
            </div>
            {privMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
            ) : (
              <Switch
                checked={isPrivate}
                onCheckedChange={(v) => privMut.mutate({ profile_visibility: !v, status_visible: !v })}
              />
            )}
          </div>
        </Card>
      </div>

      {/* ── Social media usage limit ── */}
      <div>
        <SectionLabel>Social media usage limit</SectionLabel>
        <Card>
          {loadingUsages ? (
            <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <>
              <SettingRow
                icon={Hourglass}
                title="Daily limit"
                subtitle="One limit applied to every built-in social platform"
                value={globalLimit === 0 ? "No limit" : `${globalLimit} min`}
                onClick={() => { setLimitVal(globalLimit); setLimitOpen(true); }}
              />
              <div className="mx-4 h-px bg-border" />
              <SettingRow
                icon={RefreshCcw}
                title="Daily reset time"
                subtitle="When limits reset each day (your timezone)"
                value={resetHour === 0 ? "Midnight" : `${resetHour}:00`}
                onClick={() => { setResetVal(resetHour); setResetOpen(true); }}
              />
            </>
          )}
        </Card>
      </div>

      {/* ── Timezone picker dialog ── */}
      <Dialog open={tzOpen} onOpenChange={setTzOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Select timezone</DialogTitle></DialogHeader>
          <Input
            autoFocus
            placeholder="Search timezone…"
            value={tzQuery}
            onChange={(e) => setTzQuery(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-72 overflow-y-auto -mx-1">
            {filteredTz.map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => { tzMut.mutate(tz); setTzOpen(false); }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{tz}</span>
                {tz === timezone && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Daily limit dialog ── */}
      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Social media daily limit</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Applies to every built-in social platform.</p>
          <div className="mt-3 space-y-3">
            <div className="text-sm font-semibold">{limitVal === 0 ? "No limit" : `${limitVal} minutes per day`}</div>
            <Slider min={0} max={240} step={5} value={[limitVal]} onValueChange={([v]) => setLimitVal(v)} />
            <p className="text-xs text-muted-foreground">0 = No limit · Max 240 min</p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLimitOpen(false)}>Cancel</Button>
            <Button onClick={() => { limitMut.mutate(limitVal); setLimitOpen(false); }} disabled={limitMut.isPending}>
              {limitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reset hour dialog ── */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Daily reset time</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">
            Social media limits reset at {resetVal === 0 ? "midnight" : `${resetVal}:00`} each day, in your selected timezone.
          </p>
          <div className="mt-3 space-y-3">
            <div className="text-sm font-semibold">{resetVal === 0 ? "12:01 AM (midnight)" : `${resetVal}:00`}</div>
            <Slider min={0} max={23} step={1} value={[resetVal]} onValueChange={([v]) => setResetVal(v)} />
            <p className="text-xs text-muted-foreground">0 = midnight · 4 = 4:00 AM · 23 = 11:00 PM</p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={() => { resetMut.mutate(resetVal); setResetOpen(false); }} disabled={resetMut.isPending}>
              {resetMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{children}</div>
  );
}

function Card({ children }) {
  return <div className="rounded-xl border bg-card overflow-hidden">{children}</div>;
}

function SettingRow({ icon: Icon, title, subtitle, value, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-muted/50 disabled:opacity-50 transition-colors"
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="flex items-center gap-1 text-sm font-medium shrink-0">
        {value}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}
