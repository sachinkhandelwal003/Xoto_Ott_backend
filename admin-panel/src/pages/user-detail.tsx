import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetUserById, 
  useUpdateUser, 
  useBanUser,
  useUnbanUser
} from "../lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Clock, 
  History, 
  Mail, 
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

export default function UserDetail() {
  const [, params] = useRoute<{ id: string }>("/users/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetUserById(id);

  const updateMutation = useUpdateUser();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");

  const [formData, setFormData] = useState({
    subscriptionPlan: "free",
    subscriptionStatus: "inactive"
  });

  useEffect(() => {
    if (user) {
      setFormData({
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: (user.subscriptionStatus || "inactive")
      });
    }
  }, [user]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full min-h-[50vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id,
      data: {
        subscriptionPlan: formData.subscriptionPlan,
        subscriptionStatus: formData.subscriptionStatus
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["user", id] });
        queryClient.invalidateQueries({ queryKey: ["users-list"] });
        toast({ title: "User updated successfully" });
      },
      onError: () => {
        toast({ title: "Failed to update user", variant: "destructive" });
      }
    });
  };

  const handleBan = () => {
    banMutation.mutate(
      { id, reason: banReason },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user", id] });
          queryClient.invalidateQueries({ queryKey: ["users-list"] });
          toast({ title: "User has been banned" });
          setIsBanDialogOpen(false);
          setBanReason("");
        },
        onError: () => {
          toast({ title: "Failed to ban user", variant: "destructive" });
        }
      }
    );
  };

  const handleUnban = () => {
    if (confirm("Are you sure you want to unban this user?")) {
      unbanMutation.mutate(id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user", id] });
          queryClient.invalidateQueries({ queryKey: ["users-list"] });
          toast({ title: "User has been unbanned" });
        },
        onError: () => {
          toast({ title: "Failed to unban user", variant: "destructive" });
        }
      });
    }
  };

  const isBanned = (user as any).status === 'banned';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {isBanned && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-bold text-sm">THIS USER IS BANNED</p>
              <p className="text-xs opacity-80">{(user as any).banReason || "No reason provided"}</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleUnban} disabled={unbanMutation.isPending}>
            {unbanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unban User
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/users")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          {isBanned && <Badge variant="destructive">BANNED</Badge>}
        </div>
        {!isBanned && (
          <Button variant="destructive" onClick={() => setIsBanDialogOpen(true)}>
            <ShieldAlert className="mr-2 h-4 w-4" /> Ban User
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card border-border/50 text-center overflow-hidden">
            <div className="h-24 bg-secondary w-full" />
            <CardContent className="pt-0 relative px-4 pb-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 border-4 border-card -mt-12 mb-4 bg-background">
                {user.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Mail className="h-3 w-3 mr-1" /> {user.email}
              </div>
              <div className="w-full flex items-center justify-between text-sm mt-6 pt-4 border-t border-border">
                <div className="flex flex-col items-center">
                  <span className="font-bold">{user.watchlistCount || 0}</span>
                  <span className="text-xs text-muted-foreground">Watchlist</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold">{Math.round((user.totalWatchTime || 0) / 60)}h</span>
                  <span className="text-xs text-muted-foreground">Watched</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Joined</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Last Login</span>
                  <span className="text-xs text-muted-foreground">
                    {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Subscription Management</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Select value={formData.subscriptionPlan} onValueChange={(v: string) => setFormData({...formData, subscriptionPlan: v})}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.subscriptionStatus} onValueChange={(v: string) => setFormData({...formData, subscriptionStatus: v})}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Update Subscription
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Watch History (Mock)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-md text-muted-foreground text-sm">
                Watch history data visualization would appear here
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {user.name}? They will lose access to the platform immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="ban-reason">Reason for banning</Label>
            <Textarea 
              id="ban-reason" 
              placeholder="e.g. Terms of service violation, payment fraud..." 
              className="mt-2"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleBan}
              disabled={banMutation.isPending || !banReason.trim()}
            >
              {banMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
