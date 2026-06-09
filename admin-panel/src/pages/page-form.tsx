import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Eye, Edit3 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useUpdatePage,
  useGetPages,
} from "@/lib/api-client";

export default function PageForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: pagesData } = useGetPages();
  const updateMutation = useUpdatePage();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    status: "published" as "published" | "draft",
    order: 0,
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    if (id && pagesData?.data) {
      const page = pagesData.data.find((p: any) => p._id === id);
      if (page) {
        setFormData({
          title: page.title || "",
          slug: page.slug || "",
          content: page.content || "",
          status: page.status || "published",
          order: page.order || 0,
          metaTitle: page.metaTitle || "",
          metaDescription: page.metaDescription || "",
        });
      }
    }
  }, [id, pagesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      toast({ title: "Page not found", variant: "destructive" });
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      toast({ title: "Page updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setLocation("/pages");
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => setLocation("/pages")}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Page</h1>
          <p className="text-muted-foreground mt-1">
            Edit "{formData.title}"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>Page Info</CardTitle>
            <CardDescription>Edit page details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="status">Published</Label>
                <p className="text-xs text-muted-foreground">Show this page in the app</p>
              </div>
              <Switch
                id="status"
                checked={formData.status === "published"}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: checked ? "published" : "draft",
                  }))
                }
              />
            </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, order: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Tabs defaultValue="editor" className="w-full">
                <TabsList>
                  <TabsTrigger value="editor" className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="editor" className="mt-4">
                  <Textarea
                    id="content"
                    rows={15}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, content: e.target.value }))
                    }
                    required
                    placeholder="Enter HTML content here..."
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <div 
                    className="border rounded-md p-6 min-h-[300px] bg-white dark:bg-gray-900 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content || "No content yet" }}
                  />
                </TabsContent>
              </Tabs>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  rows={3}
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={() => setLocation("/pages")}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
