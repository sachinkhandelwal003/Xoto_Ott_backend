import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2, Film } from "lucide-react";
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
  useDeleteCategory,
  useGetCategoriesList,
} from "@/lib/api-client";

type CategoryRow = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categoriesData, isLoading } = useGetCategoriesList();
  const deleteMutation = useDeleteCategory();

  const categories: CategoryRow[] = categoriesData?.data || [];

  const handleDelete = async (category: CategoryRow) => {
    if (!window.confirm(`Delete "${category.name}"?`)) {
      return;
    }

    try {
      setDeletingId(category.id);
      await deleteMutation.mutateAsync(category.id);
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      toast({ title: "Category deleted successfully!" });
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
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">
            {categories.length} total
          </p>
        </div>
        <Button onClick={() => setLocation("/categories/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Categories</CardTitle>
          <Badge variant="outline">{categories.length} items</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No categories yet</p>
              <Button onClick={() => setLocation("/categories/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Content Count</TableHead>
                  <TableHead className="w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium">{category.name}</p>
                          {category.description ? (
                            <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.active ? "default" : "outline"}>
                          {category.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{category.contentCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/categories/${category.id}/shows`)}
                            aria-label={`View shows in ${category.name}`}
                          >
                            <Film className="h-4 w-4 mr-1" />
                            Shows
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/categories/${category.id}`)}
                            aria-label={`Edit ${category.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(category)}
                            disabled={deleteMutation.isPending || deletingId === category.id}
                            aria-label={`Delete ${category.name}`}
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
