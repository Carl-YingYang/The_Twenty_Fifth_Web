"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { apiFetch, ApiError } from "@/lib/api-client";
import { RESORT_INFO } from "@/lib/constants";

type SettingsMap = Record<string, string>;

export function SettingsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiFetch<{ settings: SettingsMap }>("/api/settings"),
  });

  const settings = data?.settings ?? {};

  const mutation = useMutation({
    mutationFn: (patch: SettingsMap) =>
      apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ settings: patch }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Settings saved.");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Couldn't save settings.";
      toast.error(message);
    },
  });

  return (
    <AdminLayout title="Settings" subtitle="Configure the villa's details and policies">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div className="pb-6">
          <Tabs defaultValue="general">
            <TabsList className="mb-5 h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 sm:w-auto">
              <TabsTrigger
                value="general"
                className="min-h-[36px] shrink-0 rounded-lg px-4 text-sm"
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="operations"
                className="min-h-[36px] shrink-0 rounded-lg px-4 text-sm"
              >
                Operations
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="min-h-[36px] shrink-0 rounded-lg px-4 text-sm"
              >
                Finance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralTab
                settings={settings}
                saving={mutation.isPending}
                onSave={(patch) => mutation.mutate(patch)}
              />
            </TabsContent>
            <TabsContent value="operations">
              <OperationsTab
                settings={settings}
                saving={mutation.isPending}
                onSave={(patch) => mutation.mutate(patch)}
              />
            </TabsContent>
            <TabsContent value="finance">
              <FinanceTab
                settings={settings}
                saving={mutation.isPending}
                onSave={(patch) => mutation.mutate(patch)}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AdminLayout>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl border border-border p-4 shadow-card sm:p-6">
      <div className="mb-5">
        <h3 className="font-display text-lg font-medium tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </Card>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

function GeneralTab({
  settings,
  saving,
  onSave,
}: {
  settings: SettingsMap;
  saving: boolean;
  onSave: (patch: SettingsMap) => void;
}) {
  const [form, setForm] = useState<SettingsMap>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      resort_name: settings.resort_name ?? RESORT_INFO.name,
      resort_tagline: settings.resort_tagline ?? RESORT_INFO.tagline,
      resort_email: settings.resort_email ?? RESORT_INFO.email,
      resort_phone: settings.resort_phone ?? RESORT_INFO.phone,
      resort_address: settings.resort_address ?? RESORT_INFO.address,
      social_instagram: settings.social_instagram ?? RESORT_INFO.social.instagram,
      social_facebook: settings.social_facebook ?? RESORT_INFO.social.facebook,
      social_website: settings.social_website ?? RESORT_INFO.social.website,
    });
  }, [settings]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <SettingsCard
      title="General information"
      description="Shown across the public website and guest emails"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Resort name">
          <Input
            value={form.resort_name ?? ""}
            onChange={(e) => update("resort_name", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Tagline">
          <Input
            value={form.resort_tagline ?? ""}
            onChange={(e) => update("resort_tagline", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Contact email">
          <Input
            type="email"
            value={form.resort_email ?? ""}
            onChange={(e) => update("resort_email", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Contact phone">
          <Input
            value={form.resort_phone ?? ""}
            onChange={(e) => update("resort_phone", e.target.value)}
            className="h-10"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <Textarea
              value={form.resort_address ?? ""}
              onChange={(e) => update("resort_address", e.target.value)}
              rows={2}
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 mb-3 border-t border-border pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Social links
        </h4>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Instagram URL">
          <Input
            value={form.social_instagram ?? ""}
            onChange={(e) => update("social_instagram", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Facebook URL">
          <Input
            value={form.social_facebook ?? ""}
            onChange={(e) => update("social_facebook", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Website URL">
          <Input
            value={form.social_website ?? ""}
            onChange={(e) => update("social_website", e.target.value)}
            className="h-10"
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          className="w-full bg-primary text-white hover:bg-primary/90 sm:w-auto"
          disabled={saving}
          onClick={() => onSave(form)}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </SettingsCard>
  );
}

function OperationsTab({
  settings,
  saving,
  onSave,
}: {
  settings: SettingsMap;
  saving: boolean;
  onSave: (patch: SettingsMap) => void;
}) {
  const [form, setForm] = useState<SettingsMap>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      check_in_time: settings.check_in_time ?? RESORT_INFO.checkInTime,
      check_out_time: settings.check_out_time ?? RESORT_INFO.checkOutTime,
      max_guests: settings.max_guests ?? String(RESORT_INFO.maxGuests),
    });
  }, [settings]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <SettingsCard
      title="Operations"
      description="Check-in/out times and capacity limits"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Check-in time" hint="Guests can arrive from this time">
          <Input
            type="time"
            value={form.check_in_time ?? ""}
            onChange={(e) => update("check_in_time", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Check-out time" hint="Guests must leave by this time">
          <Input
            type="time"
            value={form.check_out_time ?? ""}
            onChange={(e) => update("check_out_time", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Maximum guests" hint="Whole-villa capacity">
          <Input
            type="number"
            min={1}
            value={form.max_guests ?? ""}
            onChange={(e) => update("max_guests", e.target.value)}
            className="h-10"
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          className="w-full bg-primary text-white hover:bg-primary/90 sm:w-auto"
          disabled={saving}
          onClick={() => onSave(form)}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </SettingsCard>
  );
}

function FinanceTab({
  settings,
  saving,
  onSave,
}: {
  settings: SettingsMap;
  saving: boolean;
  onSave: (patch: SettingsMap) => void;
}) {
  const [form, setForm] = useState<SettingsMap>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      currency: settings.currency ?? "PHP",
      tax_rate: settings.tax_rate ?? "0",
      service_charge: settings.service_charge ?? "0",
    });
  }, [settings]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <SettingsCard
      title="Finance"
      description="Currency and tax settings for invoices"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Currency code">
          <Input
            value={form.currency ?? ""}
            onChange={(e) => update("currency", e.target.value.toUpperCase())}
            maxLength={3}
            className="h-10"
          />
        </Field>
        <Field label="Tax rate (%)" hint="e.g. 12 for VAT">
          <Input
            type="number"
            min={0}
            step={0.1}
            value={form.tax_rate ?? ""}
            onChange={(e) => update("tax_rate", e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="Service charge (%)" hint="Optional service fee">
          <Input
            type="number"
            min={0}
            step={0.1}
            value={form.service_charge ?? ""}
            onChange={(e) => update("service_charge", e.target.value)}
            className="h-10"
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          className="w-full bg-primary text-white hover:bg-primary/90 sm:w-auto"
          disabled={saving}
          onClick={() => onSave(form)}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </SettingsCard>
  );
}

export default SettingsAdmin;
