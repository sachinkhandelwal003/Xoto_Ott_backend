import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useGetCategoryById,
  useCreateCategory,
  useUpdateCategory,
} from "../lib/api-client";

type FormDataState = {
  name: string;
  description: string;
  active: boolean;
};

export default function CategoryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();

  const isEdit = !!id;

  const { data: categoryData } = useGetCategoryById(id || "");
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    description: "",
    active: true,
  });

  useEffect(() => {
    if (isEdit && categoryData) {
      setFormData({
        name: categoryData.name || "",
        description: categoryData.description || "",
        active: categoryData.active !== undefined ? categoryData.active : true,
      });
    }
  }, [isEdit, categoryData]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("isActive", formData.active.toString());

      if (isEdit) {
        await updateMutation.mutateAsync({ categoryId: id, data: formDataToSend });
        toast({ title: "Category updated successfully!" });
      } else {
        await createMutation.mutateAsync({ data: formDataToSend });
        toast({ title: "Category created successfully!" });
      }

      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      setLocation("/categories");
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => setLocation("/categories")}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Edit Category" : "New Category"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit
              ? "Update your category details"
              : "Create a new category"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
            <CardDescription>Name and description for the category.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A small description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="active">Active</Label>
                <p className="text-xs text-muted-foreground">Set category as active</p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={() => setLocation("/categories")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </div>
  );
}
