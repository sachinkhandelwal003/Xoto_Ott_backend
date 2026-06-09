import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, EyeOff, Plus, Trash2, PlayCircle } from "lucide-react";
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
  getImageUrl,
  useDeleteBanner,
  useGetBannersList,
  useUpdateBanner,
} from "@/lib/api-client";

type BannerRow = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  imageUrl?: string;
  position: number;
  isActive: boolean;
  content?: {
    thumbnail?: string;
    episodeCount?: number;
    status?: string;
  };
};

export default function BannersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: bannersData, isLoading } = useGetBannersList({ admin: true });
  const deleteMutation = useDeleteBanner();
  const updateMutation = useUpdateBanner();

  const banners: BannerRow[] = bannersData?.data || [];
  const activeCount = banners.filter((banner) => banner.isActive).length;

  const getThumbnail = (banner: BannerRow) =>
    banner.content?.thumbnail || banner.thumbnail || banner.imageUrl || "";

  const handleToggleActive = async (banner: BannerRow) => {
    try {
      const formData = new FormData();
      formData.append("isActive", (!banner.isActive).toString());
      await updateMutation.mutateAsync({ bannerId: banner.id, data: formData });
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      toast({ title: `Banner ${!banner.isActive ? "activated" : "deactivated"} successfully!` });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async (banner: BannerRow) => {
    if (!window.confirm(`Delete "${banner.title}" and all associated episodes?`)) {
      return;
    }

    try {
      setDeletingId(banner.id);
      await deleteMutation.mutateAsync(banner.id);
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      toast({ title: "Banner deleted successfully!" });
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
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground mt-1">
            {banners.length} total · {activeCount} active
          </p>
        </div>
        <Button onClick={() => setLocation("/banners/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Banner Shows</CardTitle>
          <Badge variant="outline">{banners.length} items</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading banners...</div>
          ) : banners.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No banners yet</p>
              <Button onClick={() => setLocation("/banners/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Banner
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Show</TableHead>
                  <TableHead className="hidden md:table-cell">Episodes</TableHead>
                  <TableHead className="hidden sm:table-cell">Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => {
                  const thumbnail = getThumbnail(banner);

                  return (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-20 w-14 overflow-hidden rounded-md border border-border bg-muted">
                            {thumbnail ? (
                              <img
                                src={getImageUrl(thumbnail)}
                                alt={banner.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{banner.title}</p>
                            {banner.subtitle ? (
                              <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                            ) : null}
                            {banner.content?.status ? (
                              <p className="text-xs text-muted-foreground mt-1">{banner.content.status}</p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{banner.content?.episodeCount || 0}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{banner.position}</TableCell>
                      <TableCell>
                        <Badge variant={banner.isActive ? "default" : "outline"}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {banner.content?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/banners/shows/${banner.content.id}`)}
                              aria-label={`View ${banner.title} episodes`}
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/banners/${banner.id}`)}
                            aria-label={`Edit ${banner.title}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(banner)}
                            disabled={updateMutation.isPending}
                            aria-label={banner.isActive ? "Deactivate banner" : "Activate banner"}
                          >
                            {banner.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(banner)}
                            disabled={deleteMutation.isPending || deletingId === banner.id}
                            aria-label={`Delete ${banner.title}`}
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
