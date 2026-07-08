"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Clock,
  DollarSign,
  Save,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { apiFetch, ApiError } from "@/lib/api-client";

type Settings = Record<string, string>;

const DEFAULT_SETTINGS: Settings = {
  // General
  resort_name: "",
  resort_tagline: "",
  resort_email: "",
  resort_phone: "",
  resort_address: "",
  // Operations
  check_in_time: "15:00",
  check_out_time: "11:00",
  // Finance
  tax_rate: "12",
  service_charge: "10",
  currency: "PHP",
};

const FIELD_GROUPS = {
  general: [
    { key: "resort_name", label: "Resort name", placeholder: "Verdara Resort", type: "text" },
    { key: "resort_tagline", label: "Tagline", placeholder: "A Sanctuary Between Forest & Sea", type: "text" },
    { key: "resort_email", label: "Contact email", placeholder: "stay@verdararesort.com", type: "email" },
    { key: "resort_phone", label: "Contact phone", placeholder: "+63 (2) 8888 4400", type: "tel" },
    { key: "resort_address", label: "Address", placeholder: "Coastal Road, San Juan, Batangas", type: "text" },
  ],
  operations: [
    { key: "check_in_time", label: "Check-in time", placeholder: "15:00", type: "time" },
    { key: "check_out_time", label: "Check-out time", placeholder: "11:00", type: "time" },
  ],
  finance: [
    { key: "currency", label: "Currency", placeholder: "PHP", type: "text" },
    { key: "tax_rate", label: "Tax rate (%)", placeholder: "12", type: "number" },
    { key: "service_charge", label: "Service charge (%)", placeholder: "10", type: "number" },
  ],
} as const;

type GroupKey = keyof typeof FIELD_GROUPS;

const GROUP_META: Record<
  GroupKey,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  general: {
    label: "General",
    icon: Building2,
    description: "Resort identity and contact information",
  },
  operations: {
    label: "Operations",
    icon: Clock,
    description: "Check-in / check-out policies",
  },
  finance: {
    label: "Finance",
    icon: DollarSign,
    description: "Tax, service charge, and currency",
  },
};

export function SettingsAdmin() {
  const qc = useQueryClient();
  const [active, setActive] = useState<GroupKey>("general");
  const [local, setLocal] = useState<Settings>(DEFAULT_SETTINGS);

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: Settings }>("/api/settings"),
  });

  useEffect(() => {
    if (data?.settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocal({ ...DEFAULT_SETTINGS, ...data.settings });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settings: Settings) =>
      apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ settings }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to save settings");
    },
  });

  function handleSave(group: GroupKey) {
    const keys = FIELD_GROUPS[group].map((f) => f.key);
    const patch: Settings = {};
    for (const k of keys) patch[k] = local[k] ?? "";
    saveMutation.mutate(patch);
  }

  function update(key: string, value: string) {
    setLocal((l) => ({ ...l, [key]: value }));
  }

  return (
    <AdminLayout title="Settings" subtitle="Configure resort-wide preferences">
      <Tabs value={active} onValueChange={(v) => setActive(v as GroupKey)}>
        <TabsList className="h-auto w-full justify-start gap-1 bg-muted/60 p-1 sm:w-auto">
          {(Object.keys(GROUP_META) as GroupKey[]).map((g) => {
            const M = GROUP_META[g];
            return (
              <TabsTrigger key={g} value={g} className="gap-1.5 px-3 py-1.5 text-sm">
                <M.icon className="size-4" />
                {M.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(GROUP_META) as GroupKey[]).map((group) => {
          const meta = GROUP_META[group];
          return (
            <TabsContent key={group} value={group} className="mt-4">
              <Card className="rounded-2xl border-border/70 shadow-luxury">
                <CardHeader className="flex-row items-center justify-between border-b py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <meta.icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{meta.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleSave(group)}
                    disabled={saveMutation.isPending || isLoading}
                  >
                    <Save className="size-3.5" />
                    Save
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {FIELD_GROUPS[group].map((f) => (
                        <div key={f.key} className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-9 w-full max-w-md" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {FIELD_GROUPS[group].map((f) => (
                        <div
                          key={f.key}
                          className={
                            f.type === "text" && f.key === "resort_address"
                              ? "sm:col-span-2"
                              : ""
                          }
                        >
                          <div className="space-y-1.5">
                            <Label htmlFor={f.key}>{f.label}</Label>
                            <Input
                              id={f.key}
                              type={f.type}
                              value={local[f.key] ?? ""}
                              onChange={(e) => update(f.key, e.target.value)}
                              placeholder={f.placeholder}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card className="mt-6 rounded-2xl border-border/70 bg-muted/30 shadow-luxury">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <SettingsIcon className="size-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              Changes apply immediately across the website and admin
            </div>
            <div className="text-xs text-muted-foreground">
              Settings are stored in the database and cached locally. Refresh the
              public site to see updates.
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default SettingsAdmin;
