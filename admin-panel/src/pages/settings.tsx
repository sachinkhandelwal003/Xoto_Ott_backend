import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetSettings, useUpdateSettings, useDeleteAccount } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2, Mail, HardDrive, Palette, Code2, Layers,
  Bell, Globe, DollarSign, Search, AlertTriangle, Loader2,
  Save, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "business",       label: "Business Settings",       icon: Building2 },
  { id: "mail",           label: "Mail Settings",           icon: Mail },
  { id: "storage",        label: "Storage Settings",        icon: HardDrive },
  { id: "customization",  label: "Customization",           icon: Palette },
  { id: "custom-code",    label: "Custom Code",             icon: Code2 },
  { id: "modules",        label: "Module Settings",         icon: Layers },
  { id: "notifications",  label: "Notification Settings",   icon: Bell },
  { id: "currency",       label: "Currency Settings",       icon: DollarSign },
  { id: "seo",            label: "SEO Settings",            icon: Search },
  { id: "danger",         label: "Danger Zone",             icon: AlertTriangle },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-foreground border-b border-border pb-3 mb-5">{children}</h3>
  );
}

function SaveBtn({ loading }: { loading: boolean }) {
  return (
    <div className="flex justify-end pt-6 border-t border-border mt-6">
      <Button
        type="submit"
        disabled={loading}
        className="h-11 px-8 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-600/20 transition-all"
      >
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
      </Button>
    </div>
  );
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────

function BusinessTab({ data, onChange, onSave, saving }: any) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      <SectionTitle>Business Information</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Platform Name" required>
          <Input value={data.platformName || ''} onChange={e => onChange('platformName', e.target.value)} placeholder="StreamVault" className="rounded-xl" />
        </Field>
        <Field label="Contact No" required>
          <Input value={data.contactNo || ''} onChange={e => onChange('contactNo', e.target.value)} placeholder="+1 234 567 8900" className="rounded-xl" />
        </Field>
        <Field label="Inquiry Email" required>
          <Input type="email" value={data.inquiryEmail || ''} onChange={e => onChange('inquiryEmail', e.target.value)} placeholder="hello@streamvault.com" className="rounded-xl" />
        </Field>
        <Field label="Copyright Text" required>
          <Input value={data.copyrightText || ''} onChange={e => onChange('copyrightText', e.target.value)} placeholder="© 2026 StreamVault" className="rounded-xl" />
        </Field>
      </div>
      <Field label="Site Description" required>
        <Textarea value={data.siteDescription || ''} onChange={e => onChange('siteDescription', e.target.value)} placeholder="Your platform description..." rows={3} className="rounded-xl resize-none" />
      </Field>
      <SectionTitle>Social Media URLs</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Facebook URL">
          <Input value={data.facebookUrl || ''} onChange={e => onChange('facebookUrl', e.target.value)} placeholder="https://facebook.com/..." className="rounded-xl" />
        </Field>
        <Field label="X (Twitter) URL">
          <Input value={data.twitterUrl || ''} onChange={e => onChange('twitterUrl', e.target.value)} placeholder="https://twitter.com/..." className="rounded-xl" />
        </Field>
        <Field label="Instagram URL">
          <Input value={data.instagramUrl || ''} onChange={e => onChange('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." className="rounded-xl" />
        </Field>
        <Field label="YouTube URL">
          <Input value={data.youtubeUrl || ''} onChange={e => onChange('youtubeUrl', e.target.value)} placeholder="https://youtube.com/..." className="rounded-xl" />
        </Field>
      </div>
      <SaveBtn loading={saving} />
    </form>
  );
}

function MailTab({ data, onChange, onSave, saving }: any) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      <SectionTitle>Mail Configuration</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Email" required>
          <Input type="email" value={data.mailEmail || ''} onChange={e => onChange('mailEmail', e.target.value)} placeholder="info@example.com" className="rounded-xl" />
        </Field>
        <Field label="Mail Driver" required>
          <Input value={data.mailDriver || 'smtp'} onChange={e => onChange('mailDriver', e.target.value)} placeholder="smtp" className="rounded-xl" />
        </Field>
        <Field label="Mail Host" required>
          <Input value={data.mailHost || ''} onChange={e => onChange('mailHost', e.target.value)} placeholder="smtp.gmail.com" className="rounded-xl" />
        </Field>
        <Field label="Mail Port" required>
          <Input value={data.mailPort || '587'} onChange={e => onChange('mailPort', e.target.value)} placeholder="587" className="rounded-xl" />
        </Field>
        <Field label="Mail Encryption" required>
          <Input value={data.mailEncryption || 'tls'} onChange={e => onChange('mailEncryption', e.target.value)} placeholder="tls" className="rounded-xl" />
        </Field>
        <Field label="Mail Username" required>
          <Input value={data.mailUsername || ''} onChange={e => onChange('mailUsername', e.target.value)} placeholder="youremail@gmail.com" className="rounded-xl" />
        </Field>
        <Field label="Password" required>
          <Input type="password" value={data.mailPassword || ''} onChange={e => onChange('mailPassword', e.target.value)} placeholder="••••••••" className="rounded-xl" />
        </Field>
        <Field label="Mail From" required>
          <Input value={data.mailFrom || ''} onChange={e => onChange('mailFrom', e.target.value)} placeholder="youremail@gmail.com" className="rounded-xl" />
        </Field>
        <Field label="From Name" required>
          <Input value={data.mailFromName || ''} onChange={e => onChange('mailFromName', e.target.value)} placeholder="StreamVault" className="rounded-xl" />
        </Field>
      </div>
      <SaveBtn loading={saving} />
    </form>
  );
}

function StorageTab({ data, onChange, onSave, saving }: any) {
  const driver = data.storageDriver || 'local';
  return (
    <form onSubmit={onSave} className="space-y-5">
      <SectionTitle>Storage Driver</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        {['local', 's3', 'bunny'].map(d => (
          <button key={d} type="button" onClick={() => onChange('storageDriver', d)}
            className={cn(
              "p-4 rounded-xl border-2 font-medium text-sm transition-all",
              driver === d
                ? "border-red-500 bg-red-500/10 text-red-500"
                : "border-border bg-card text-muted-foreground hover:border-red-500/50"
            )}>
            {d === 'local' ? 'Local Storage' : d === 's3' ? 'S3 Storage' : 'Bunny CDN'}
          </button>
        ))}
      </div>

      {driver === 's3' && (
        <>
          <SectionTitle>AWS S3 Configuration</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="AWS Access Key ID" required><Input value={data.awsAccessKeyId || ''} onChange={e => onChange('awsAccessKeyId', e.target.value)} placeholder="AKIA..." className="rounded-xl" /></Field>
            <Field label="AWS Secret Access Key" required><Input type="password" value={data.awsSecretAccessKey || ''} onChange={e => onChange('awsSecretAccessKey', e.target.value)} placeholder="••••••••" className="rounded-xl" /></Field>
            <Field label="AWS Default Region" required><Input value={data.awsRegion || ''} onChange={e => onChange('awsRegion', e.target.value)} placeholder="us-east-1" className="rounded-xl" /></Field>
            <Field label="AWS Bucket" required><Input value={data.awsBucket || ''} onChange={e => onChange('awsBucket', e.target.value)} placeholder="my-bucket" className="rounded-xl" /></Field>
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <Label className="text-sm font-medium">Use Path Style Endpoint</Label>
              <Switch checked={!!data.awsPathStyleEndpoint} onCheckedChange={v => onChange('awsPathStyleEndpoint', v)} />
            </div>
          </div>
        </>
      )}

      {driver === 'bunny' && (
        <>
          <SectionTitle>Bunny CDN Configuration</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Storage Zone" required><Input value={data.bunnyStorageZone || ''} onChange={e => onChange('bunnyStorageZone', e.target.value)} placeholder="my-zone" className="rounded-xl" /></Field>
            <Field label="Access Key" required><Input type="password" value={data.bunnyAccessKey || ''} onChange={e => onChange('bunnyAccessKey', e.target.value)} placeholder="••••••••" className="rounded-xl" /></Field>
            <Field label="CDN URL" required><Input value={data.bunnyCdnUrl || ''} onChange={e => onChange('bunnyCdnUrl', e.target.value)} placeholder="https://myzone.b-cdn.net" className="rounded-xl" /></Field>
          </div>
        </>
      )}
      <SaveBtn loading={saving} />
    </form>
  );
}

function CustomizationTab({ data, onChange, onSave, saving }: any) {
  const navbarStyles = ['glass', 'sticky', 'transparent', 'default'];
  const cardStyles = ['default', 'glass', 'transparent'];
  const menuStyles = ['mini', 'hover', 'boxed', 'soft'];
  const activeMenuStyles = ['rounded-one-side', 'rounded-all', 'pill-one-side', 'pill-all', 'left-bordered', 'full-width'];

  function StyleGrid({ options, value, field }: { options: string[]; value: string; field: string }) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(field, opt)}
            className={cn(
              "h-11 rounded-xl border-2 capitalize text-sm font-medium transition-all",
              value === opt
                ? "border-red-500 bg-red-500/10 text-red-500"
                : "border-border bg-card text-muted-foreground hover:border-red-500/50"
            )}>
            {opt.replace(/-/g, ' ')}
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div>
        <SectionTitle>Primary Color</SectionTitle>
        <div className="flex items-center gap-4">
          <input type="color" value={data.primaryColor || '#e50914'} onChange={e => onChange('primaryColor', e.target.value)}
            className="w-14 h-14 rounded-xl border border-border cursor-pointer bg-transparent p-1" />
          <Input value={data.primaryColor || '#e50914'} onChange={e => onChange('primaryColor', e.target.value)} placeholder="#e50914" className="rounded-xl w-40 font-mono" />
        </div>
      </div>
      <div>
        <SectionTitle>Navbar Style</SectionTitle>
        <StyleGrid options={navbarStyles} value={data.navbarStyle || 'default'} field="navbarStyle" />
      </div>
      <div>
        <SectionTitle>Card Style</SectionTitle>
        <StyleGrid options={cardStyles} value={data.cardStyle || 'default'} field="cardStyle" />
      </div>
      <div>
        <SectionTitle>Menu Style</SectionTitle>
        <StyleGrid options={menuStyles} value={data.menuStyle || 'hover'} field="menuStyle" />
      </div>
      <div>
        <SectionTitle>Active Menu Style</SectionTitle>
        <StyleGrid options={activeMenuStyles} value={data.activeMenuStyle || 'left-bordered'} field="activeMenuStyle" />
      </div>
      <SaveBtn loading={saving} />
    </form>
  );
}

function CustomCodeTab({ data, onChange, onSave, saving }: any) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      <SectionTitle>Custom Code Injection</SectionTitle>
      <Field label="Header Code">
        <Textarea value={data.headerCode || ''} onChange={e => onChange('headerCode', e.target.value)}
          placeholder="<!-- Add custom HTML/JS/CSS to <head> -->" rows={8}
          className="rounded-xl resize-none font-mono text-sm" />
      </Field>
      <Field label="Footer Code">
        <Textarea value={data.footerCode || ''} onChange={e => onChange('footerCode', e.target.value)}
          placeholder="<!-- Add custom HTML/JS before </body> -->" rows={8}
          className="rounded-xl resize-none font-mono text-sm" />
      </Field>
      <SaveBtn loading={saving} />
    </form>
  );
}

function ModulesTab({ data, onChange, onSave, saving }: any) {
  const modules = [
    { key: 'moduleUsers', label: 'Users Module', desc: 'User management & profiles' },
    { key: 'moduleLanguages', label: 'Languages Module', desc: 'Multi-language support' },
    { key: 'moduleAds', label: 'Ads Module', desc: 'Advertisement management' },
    { key: 'modulePromotions', label: 'Promotions Module', desc: 'Promotional banners & offers' },
    { key: 'moduleBanners', label: 'Banners Module', desc: 'Banner & hero management' },
    { key: 'modulePages', label: 'Pages Module', desc: 'Static page builder' },
  ];
  return (
    <form onSubmit={onSave} className="space-y-4">
      <SectionTitle>Enable / Disable Modules</SectionTitle>
      {modules.map(m => (
        <div key={m.key} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-red-500/30 transition-all">
          <div>
            <p className="font-medium text-sm text-foreground">{m.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
          </div>
          <Switch checked={!!data[m.key]} onCheckedChange={v => onChange(m.key, v)} />
        </div>
      ))}
      <SaveBtn loading={saving} />
    </form>
  );
}

function NotificationsTab({ data, onChange, onSave, saving }: any) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      <SectionTitle>Firebase Cloud Messaging (FCM)</SectionTitle>
      <div className="grid grid-cols-1 gap-5">
        <Field label="FCM Server Key">
          <Input value={data.fcmServerKey || ''} onChange={e => onChange('fcmServerKey', e.target.value)} placeholder="AAAAxxxxx..." className="rounded-xl" />
        </Field>
        <Field label="FCM Sender ID">
          <Input value={data.fcmSenderId || ''} onChange={e => onChange('fcmSenderId', e.target.value)} placeholder="1234567890" className="rounded-xl" />
        </Field>
      </div>
      <SaveBtn loading={saving} />
    </form>
  );
}

function CurrencyTab({ data, onChange, onSave, saving }: any) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      <SectionTitle>Currency Configuration</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Currency Code" required>
          <Input value={data.currencyCode || 'USD'} onChange={e => onChange('currencyCode', e.target.value)} placeholder="USD" className="rounded-xl" />
        </Field>
        <Field label="Currency Symbol" required>
          <Input value={data.currencySymbol || '$'} onChange={e => onChange('currencySymbol', e.target.value)} placeholder="$" className="rounded-xl" />
        </Field>
      </div>
      <SectionTitle>Symbol Position</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        {['before', 'after'].map(pos => (
          <button key={pos} type="button" onClick={() => onChange('currencyPosition', pos)}
            className={cn(
              "h-14 rounded-xl border-2 font-medium text-sm transition-all",
              data.currencyPosition === pos
                ? "border-red-500 bg-red-500/10 text-red-500"
                : "border-border bg-card text-muted-foreground hover:border-red-500/50"
            )}>
            {pos === 'before' ? '$ 99.00 (Before)' : '99.00 $ (After)'}
          </button>
        ))}
      </div>
      <SaveBtn loading={saving} />
    </form>
  );
}

function SeoTab({ data, onChange, onSave, saving }: any) {
  return (
    <form onSubmit={onSave} className="space-y-5">
      <SectionTitle>SEO Configuration</SectionTitle>
      <Field label="Meta Title">
        <Input value={data.metaTitle || ''} onChange={e => onChange('metaTitle', e.target.value)} placeholder="StreamVault - Watch Movies & Shows" className="rounded-xl" />
      </Field>
      <Field label="Meta Description">
        <Textarea value={data.metaDescription || ''} onChange={e => onChange('metaDescription', e.target.value)} placeholder="Stream thousands of movies and shows..." rows={3} className="rounded-xl resize-none" />
      </Field>
      <Field label="Meta Keywords">
        <Input value={data.metaKeywords || ''} onChange={e => onChange('metaKeywords', e.target.value)} placeholder="streaming, movies, shows, OTT" className="rounded-xl" />
      </Field>
      <Field label="Google Analytics ID">
        <Input value={data.googleAnalyticsId || ''} onChange={e => onChange('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" className="rounded-xl" />
      </Field>
      <SaveBtn loading={saving} />
    </form>
  );
}

function DangerTab() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const deleteAccountMutation = useDeleteAccount();

  const handleDelete = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      toast({ title: "Account deactivated successfully" });
      setLocation("/login");
    } catch {
      toast({ title: "Failed to deactivate account", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle>Danger Zone</SectionTitle>
      <div className="p-5 rounded-xl border-2 border-red-500/30 bg-red-500/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">Deactivate Account</p>
            <p className="text-sm text-muted-foreground mt-1">This action cannot be undone. Your account will be permanently deactivated.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="shrink-0 rounded-xl">Deactivate</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This will deactivate your account permanently. You will lose all access.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteAccountMutation.isPending}>
                    {deleteAccountMutation.isPending ? "Deactivating..." : "Yes, deactivate"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState("business");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const { data: serverSettings, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();

  useEffect(() => {
    if (serverSettings) setFormData(serverSettings);
  }, [serverSettings]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync(formData);
      toast({ title: "Settings saved successfully" });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const tabProps = { data: formData, onChange: handleChange, onSave: handleSave, saving: updateMutation.isPending };

  const activeTabMeta = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your platform configuration</p>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-1 sticky top-6">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDanger = tab.id === 'danger';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    isActive && !isDanger && "bg-red-500/10 text-red-500 border border-red-500/20",
                    isActive && isDanger && "bg-red-500/10 text-red-500 border border-red-500/20",
                    !isActive && !isDanger && "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !isActive && isDanger && "text-red-400/70 hover:bg-red-500/10 hover:text-red-500",
                  )}>
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-red-500" : isDanger ? "text-red-400/70" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-red-500" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-2xl p-6">
            {/* Tab Header */}
            <div className="flex items-center gap-3 mb-6">
              {activeTabMeta && <activeTabMeta.icon className={cn("h-5 w-5", activeTab === 'danger' ? "text-red-500" : "text-red-500")} />}
              <h2 className="text-xl font-bold text-foreground">{activeTabMeta?.label}</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              </div>
            ) : (
              <>
                {activeTab === "business"      && <BusinessTab {...tabProps} />}
                {activeTab === "mail"          && <MailTab {...tabProps} />}
                {activeTab === "storage"       && <StorageTab {...tabProps} />}
                {activeTab === "customization" && <CustomizationTab {...tabProps} />}
                {activeTab === "custom-code"   && <CustomCodeTab {...tabProps} />}
                {activeTab === "modules"       && <ModulesTab {...tabProps} />}
                {activeTab === "notifications" && <NotificationsTab {...tabProps} />}
                {activeTab === "currency"      && <CurrencyTab {...tabProps} />}
                {activeTab === "seo"           && <SeoTab {...tabProps} />}
                {activeTab === "danger"        && <DangerTab />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
