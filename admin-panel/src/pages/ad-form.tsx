import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useUpdateAd,
  useGetAds,
} from "@/lib/api-client";

export default function AdForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: adsData } = useGetAds({ admin: true });
  const updateMutation = useUpdateAd();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "banner" as "banner" | "interstitial" | "rewarded" | "native",
    imageUrl: "",
    videoUrl: "",
    linkUrl: "",
    isActive: true,
    priority: 0,
  });

  useEffect(() => {
    if (id && adsData?.data) {
      const ad = adsData.data.find((a: any) => a._id === id);
      if (ad) {
        setFormData({
          title: ad.title || "",
          description: ad.description || "",
          type: ad.type || "banner",
          imageUrl: ad.imageUrl || "",
          videoUrl: ad.videoUrl || "",
          linkUrl: ad.linkUrl || "",
          isActive: ad.isActive !== false,
          priority: ad.priority || 0,
        });
      }
    }
  }, [id, adsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      toast({ title: "Ad not found", variant: "destructive" });
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      toast({ title: "Ad updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setLocation("/ads");
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => setLocation("/ads")}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Ad</h1>
          <p className="text-muted-foreground mt-1">
            Edit "{formData.title}"
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>Ad Info</CardTitle>
            <CardDescription>Edit ad details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="w-full border rounded-md px-3 py-2"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as any,
                  }))
                }
              >
                <option value="banner">Banner</option>
                <option value="interstitial">Interstitial</option>
                <option value="rewarded">Rewarded</option>
                <option value="native">Native</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL</Label>
              <Input
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={() => setLocation("/ads")}>
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
