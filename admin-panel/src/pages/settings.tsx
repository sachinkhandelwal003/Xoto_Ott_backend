
import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Palette, Copy, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useDeleteAccount } from "@/lib/api-client";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const deleteAccountMutation = useDeleteAccount();

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      toast({ title: "Account deactivated successfully" });
      setLocation("/login");
    } catch (error) {
      toast({ title: "Failed to deactivate account", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Customize your admin panel experience</p>
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Settings</CardTitle>
          <CardDescription className="text-base mt-1">Configure your admin panel preferences</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-4">
          <Link href="/settings/branding">
            <Button className="h-12 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-lg shadow-primary/25 rounded-2xl transition-all duration-300">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </Button>
          </Link>
          <Link href="/settings/icons">
            <Button className="h-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-500/90 hover:to-indigo-500/90 shadow-lg shadow-purple-500/25 rounded-2xl transition-all duration-300">
              <Copy className="h-4 w-4 mr-2" />
              Icon Library
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-card/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-red-500">Danger Zone</CardTitle>
          <CardDescription className="text-base mt-1">Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-600/90 hover:to-red-700/90 shadow-lg shadow-red-500/25 rounded-2xl transition-all duration-300">
                <UserX className="h-4 w-4 mr-2" />
                Deactivate Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will deactivate your account and you will no longer have access.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? "Deactivating..." : "Yes, deactivate account"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
