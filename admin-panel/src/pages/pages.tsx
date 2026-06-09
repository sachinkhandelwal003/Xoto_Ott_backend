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
  useGetPages,
  useUpdatePage,
  useDeletePage,
} from "@/lib/api-client";

type PageRow = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export default function PagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: pagesData, isLoading } = useGetPages();
  const deleteMutation = useDeletePage();
  const updateMutation = useUpdatePage();

  const pages: PageRow[] = pagesData?.data || [];
  const activeCount = pages.filter((page) => page.status === "published").length;

  const handleToggleActive = async (page: PageRow) => {
    try {
      const newStatus = page.status === "published" ? "draft" : "published";
      await updateMutation.mutateAsync({ id: page._id, data: { status: newStatus } });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({ title: `Page ${newStatus === "published" ? "activated" : "deactivated"} successfully!` });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleDelete = async (page: PageRow) => {
    if (!window.confirm(`Delete "${page.title}"?`)) {
      return;
    }

    try {
      setDeletingId(page._id);
      await deleteMutation.mutateAsync(page._id);
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({ title: "Page deleted successfully!" });
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
          <h1 className="text-3xl font-bold tracking-tight">Static Pages</h1>
          <p className="text-muted-foreground mt-1">
            {pages.length} total · {activeCount} active
          </p>
        </div>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Pages</CardTitle>
          <Badge variant="outline">{pages.length} items</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading pages...</div>
          ) : pages.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No pages yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="hidden md:table-cell">Slug</TableHead>
                  <TableHead className="hidden sm:table-cell">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => {
                  return (
                    <TableRow key={page._id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{page.title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {page.slug}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{page.order}</TableCell>
                      <TableCell>
                        <Badge variant={page.status === "published" ? "default" : "outline"}>
                          {page.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/pages/${page._id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(page)}
                            disabled={updateMutation.isPending}
                          >
                            {page.status === "published" ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(page)}
                            disabled={deleteMutation.isPending || deletingId === page._id}
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
