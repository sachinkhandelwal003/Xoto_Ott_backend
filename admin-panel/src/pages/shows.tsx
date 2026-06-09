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
  useGetContentList,
  useUpdateContent,
  useDeleteContent,
  getImageUrl
} from "@/lib/api-client";

type ContentRow = {
  _id: string;
  title: string;
  shortDescription?: string;
  thumbnail?: string;
  type: "movie" | "series";
  status: string;
  categories: Array<{ _id: string; name: string }>;
  views?: number;
  likes?: number;
  shares?: number;
  featured?: boolean;
  trending?: boolean;
};

export default function ShowsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: contentData, isLoading } = useGetContentList({});
  const deleteMutation = useDeleteContent();
  const updateMutation = useUpdateContent();

  const content: ContentRow[] = contentData?.data || [];
  const activeCount = content.filter((item) => item.status === "published").length;

  const handleToggleActive = async (item: ContentRow) => {
    try {
      const newStatus = item.status === "published" ? "draft" : "published";
      await updateMutation.mutateAsync({
        id: item._id,
        data: { status: newStatus }
      });
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      toast({ title: `Show ${newStatus === "published" ? "activated" : "deactivated"} successfully!` });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async (item: ContentRow) => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    try {
      setDeletingId(item._id);
      await deleteMutation.mutateAsync(item._id);
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      toast({ title: "Show deleted successfully!" });
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
          <h1 className="text-3xl font-bold tracking-tight">All Shows</h1>
          <p className="text-muted-foreground mt-1">
            {content.length} total · {activeCount} active
          </p>
        </div>
        <Button onClick={() => setLocation("/shows/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Show
        </Button>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Shows</CardTitle>
          <Badge variant="outline">{content.length} items</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading shows...</div>
          ) : content.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No shows yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Show</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Categories</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => {
                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-20 w-14 overflow-hidden rounded-md border border-border bg-muted">
                            {item.thumbnail ? (
                              <img
                                src={getImageUrl(item.thumbnail)}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{item.shortDescription}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {item.categories.map((cat) => (
                            <Badge key={cat._id} variant="secondary" className="text-xs">
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.views || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.likes || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.shares || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "published" || item.status === "active" ? "default" : "outline"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/shows/${item._id}`)}
                          >
                            <Eye className="mr-1 h-3 w-3" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/shows/${item._id}/edit`)}
                          >
                            <Edit className="mr-1 h-3 w-3" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(item)}
                            disabled={updateMutation.isPending}
                          >
                            {item.status === "published" ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item)}
                            disabled={deleteMutation.isPending || deletingId === item._id}
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
