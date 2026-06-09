import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAds,
  useUpdateAd,
  useDeleteAd,
} from "@/lib/api-client";

type AdRow = {
  _id: string;
  title: string;
  description?: string;
  type: string;
  isActive: boolean;
  views: number;
  clicks: number;
  priority: number;
};

export default function AdsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: adsData, isLoading } = useGetAds({ admin: true });
  const deleteMutation = useDeleteAd();
  const updateMutation = useUpdateAd();

  const ads: AdRow[] = adsData?.data || [];
  const activeCount = ads.filter((ad) => ad.isActive).length;

  const handleToggleActive = async (ad: AdRow) => {
    try {
      await updateMutation.mutateAsync({ id: ad._id, data: { isActive: !ad.isActive } });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: `Ad ${!ad.isActive ? "activated" : "deactivated"} successfully!` });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async (ad: AdRow) => {
    if (!window.confirm(`Delete "${ad.title}"?`)) {
      return;
    }

    try {
      setDeletingId(ad._id);
      await deleteMutation.mutateAsync(ad._id);
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast({ title: "Ad deleted successfully!" });
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ads</h1>
          <p className="text-muted-foreground mt-1">
            {ads.length} total · {activeCount} active
          </p>
        </div>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Ads</CardTitle>
          <Badge variant="outline">{ads.length} items</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading ads...</div>
          ) : ads.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No ads yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Views / Clicks</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => {
                  return (
                    <TableRow key={ad._id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{ad.title}</p>
                          {ad.description && (
                            <p className="text-sm text-muted-foreground truncate">{ad.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{ad.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {ad.views} / {ad.clicks}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {ad.priority}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ad.isActive ? "default" : "outline"}>
                          {ad.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/ads/${ad._id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(ad)}
                            disabled={updateMutation.isPending}
                          >
                            {ad.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(ad)}
                            disabled={deleteMutation.isPending || deletingId === ad._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
