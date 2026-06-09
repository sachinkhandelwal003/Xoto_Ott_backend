
import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Link2,
  ChevronLeft,
  X,
  Film,
  ImageIcon,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useGetBannerById,
  useCreateBannerShow,
  useUpdateBanner,
  useGetBannerShowByContentId,
  useAppendBannerShowVideo,
  useUpdateEpisodeLock,
  getImageUrl,
} from "../lib/api-client";

type UploadProgress = {
  loaded: number;
  total: number;
};

type Episode = {
  id: string;
  episode: number;
  title?: string;
  isLocked: boolean;
  processingStatus?: string;
};

type FormDataState = {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  position: number;
  isActive: boolean;
  genres: string;
  languages: string;
  reelDurationMinutes: number;
  totalDurationMinutes: string;
  freeEpisodeCount: number;
  lockEpisodes: boolean;
  thumbnail: string;
  videoUrl: string;
};

export default function BannerForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();

  const isEdit = !!id;

  const { data: bannerData } = useGetBannerById(id || "");
  const { data: bannerShowData } = useGetBannerShowByContentId(
    bannerData?.content?.id || "",
    undefined
  );
  const createMutation = useCreateBannerShow();
  const updateMutation = useUpdateBanner();
  const appendMutation = useAppendBannerShowVideo();
  const lockMutation = useUpdateEpisodeLock();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const uploadStartRef = useRef<number | null>(null);

  const [formData, setFormData] = useState<FormDataState>({
    title: "",
    subtitle: "",
    description: "",
    ctaText: "Watch Now",
    ctaLink: "",
    position: 0,
    isActive: true,
    genres: "",
    languages: "",
    reelDurationMinutes: 3,
    totalDurationMinutes: "",
    freeEpisodeCount: 1,
    lockEpisodes: true,
    thumbnail: "",
    videoUrl: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [appendVideoFile, setAppendVideoFile] = useState<File | null>(null);

  const [thumbnailMode, setThumbnailMode] = useState("upload");
  const [videoMode, setVideoMode] = useState("upload");

  const episodes: Episode[] = bannerShowData?.episodes || [];

  useEffect(() => {
    if (isEdit && bannerData) {
      setFormData({
        title: bannerData.title || "",
        subtitle: bannerData.subtitle || "",
        description: bannerData.description || "",
        ctaText: bannerData.ctaText || "Watch Now",
        ctaLink: bannerData.ctaLink || "",
        position: bannerData.position ?? 0,
        isActive: bannerData.isActive ?? true,
        genres: "",
        languages: "",
        reelDurationMinutes: 3,
        totalDurationMinutes: "",
        freeEpisodeCount: 1,
        lockEpisodes: true,
        thumbnail: bannerData.content?.thumbnail || bannerData.thumbnail || bannerData.imageUrl || "",
        videoUrl: "",
      });
      const thumbnail = bannerData.content?.thumbnail || bannerData.thumbnail || bannerData.imageUrl || "";
      setThumbnailMode(thumbnail && !thumbnail.startsWith("/uploads/") ? "url" : "upload");
    }
  }, [isEdit, bannerData]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 MB";
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadSpeed("");
      uploadStartRef.current = null;
      
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("subtitle", formData.subtitle);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("ctaText", formData.ctaText);
      if (formData.ctaLink) {
        formDataToSend.append("ctaLink", formData.ctaLink);
      }
      formDataToSend.append("position", formData.position.toString());
      formDataToSend.append("isActive", formData.isActive.toString());

      if (!isEdit) {
        formDataToSend.append("genres", formData.genres);
        formDataToSend.append("languages", formData.languages);
        formDataToSend.append("reelDurationMinutes", formData.reelDurationMinutes.toString());
        if (formData.totalDurationMinutes) {
          formDataToSend.append("totalDurationMinutes", formData.totalDurationMinutes.toString());
        }
        formDataToSend.append("freeEpisodeCount", formData.freeEpisodeCount.toString());
        formDataToSend.append("lockEpisodes", formData.lockEpisodes.toString());
      }

      if (thumbnailMode === "url") {
        if (formData.thumbnail) {
          formDataToSend.append("thumbnail", formData.thumbnail);
        }
      } else if (thumbnailFile) {
        formDataToSend.append("thumbnailFile", thumbnailFile);
      }

      if (!isEdit) {
        if (videoMode === "url") {
          formDataToSend.append("videoUrl", formData.videoUrl);
        } else if (videoFile) {
          formDataToSend.append("videoFile", videoFile);
        }
      }

      const onUploadProgress = (progress: UploadProgress) => {
        if (!uploadStartRef.current) {
          uploadStartRef.current = Date.now();
        }

        const percentage = progress.total
          ? Math.round((progress.loaded / progress.total) * 100)
          : 0;
        const elapsedSeconds = (Date.now() - uploadStartRef.current) / 1000;
        const bytesPerSecond = elapsedSeconds > 0 ? progress.loaded / elapsedSeconds : 0;

        setUploadProgress(percentage);
        setUploadSpeed(formatUploadSpeed(bytesPerSecond));
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ bannerId: id, data: formDataToSend, onUploadProgress });
        toast({ title: "Banner updated successfully!" });
      } else {
        await createMutation.mutateAsync({ data: formDataToSend, onUploadProgress });
        toast({ title: "Banner created successfully!" });
      }

      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      setLocation("/banners");
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed("");
      uploadStartRef.current = null;
    }
  };

  const handleAppendVideo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bannerData?.content?.id || !appendVideoFile) return;

    try {
      setIsUploading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("videoFile", appendVideoFile);
      formDataToSend.append("reelDurationMinutes", formData.reelDurationMinutes.toString());
      if (formData.totalDurationMinutes) {
        formDataToSend.append("totalDurationMinutes", formData.totalDurationMinutes.toString());
      }
      formDataToSend.append("freeEpisodeCount", formData.freeEpisodeCount.toString());
      formDataToSend.append("lockEpisodes", formData.lockEpisodes.toString());

      await appendMutation.mutateAsync({ 
        contentId: bannerData.content.id, 
        data: formDataToSend 
      });

      toast({ title: "Episodes added successfully!" });
      setAppendVideoFile(null);
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show", bannerData.content.id] });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEpisodeLockToggle = (episode: Episode) => {
    lockMutation.mutate(
      { episodeId: episode.id, isLocked: !episode.isLocked },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["banner-show", bannerData?.content?.id] });
        },
        onError: () => {
          toast({ title: "Update failed", variant: "destructive" });
        },
      }
    );
  };

  const formatUploadSpeed = (bytesPerSecond: number) => {
    if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "";
    const megabytesPerSecond = bytesPerSecond / (1024 * 1024);
    if (megabytesPerSecond >= 1) {
      return `${megabytesPerSecond.toFixed(1)} MB/s`;
    }
    return `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => setLocation("/banners")}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Edit Banner" : "New Banner"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit
              ? "Update your banner details"
              : "Create a new banner for your app"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>Show Details</CardTitle>
            <CardDescription>Core metadata used in the app banner and show page.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Ameerzade ka Badla"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  placeholder="A STORY TV ORIGINAL"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Short story description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {!isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="genres">Genres</Label>
                  <Input
                    id="genres"
                    placeholder="Drama, Romance"
                    value={formData.genres}
                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languages">Languages</Label>
                  <Input
                    id="languages"
                    placeholder="Hindi, English"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Artwork</CardTitle>
            </div>
            <CardDescription>Only one thumbnail is required for the banner API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs value={thumbnailMode} onValueChange={setThumbnailMode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">
                  <Link2 className="w-4 h-4 mr-2" /> URL
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-2" /> Upload File
                </TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-4 space-y-4">
                <Input
                  placeholder="https://example.com/thumbnail.jpg"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  required={!isEdit && thumbnailMode === "url"}
                />
                {formData.thumbnail && (
                  <img
                    src={getImageUrl(formData.thumbnail)}
                    alt="Thumbnail preview"
                    className="h-40 w-28 rounded-md object-cover border border-border"
                  />
                )}
              </TabsContent>
              <TabsContent value="upload" className="mt-4 space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  required={!isEdit && thumbnailMode === "upload"}
                />
                {thumbnailFile && (
                  <div className="flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(thumbnailFile)}
                      alt="Thumbnail preview"
                      className="h-40 w-28 rounded-md object-cover border border-border"
                    />
                    <Button variant="ghost" size="icon" type="button" onClick={() => setThumbnailFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {isEdit && (bannerData?.content?.thumbnail || bannerData?.thumbnail || bannerData?.imageUrl) && !thumbnailFile && (
                  <img
                    src={getImageUrl(bannerData.content?.thumbnail || bannerData.thumbnail || bannerData.imageUrl)}
                    alt="Current thumbnail"
                    className="h-40 w-28 rounded-md object-cover border border-border"
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {!isEdit && (
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Episode Source</CardTitle>
              </div>
              <CardDescription>Upload the source video and choose how episodes are sliced.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Tabs value={videoMode} onValueChange={setVideoMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">
                    <Link2 className="w-4 h-4 mr-2" /> URL
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" /> Upload File
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-4">
                  <Input
                    placeholder="https://example.com/video.mp4"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    required={!isEdit && videoMode === "url"}
                  />
                </TabsContent>
                <TabsContent value="upload" className="mt-4 space-y-4">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    required={!isEdit && videoMode === "upload"}
                  />
                  {videoFile && (
                    <div className="flex items-center gap-3">
                      <video src={URL.createObjectURL(videoFile)} controls className="max-h-44 rounded-md border border-border" />
                      <Button variant="ghost" size="icon" type="button" onClick={() => setVideoFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="reelDurationMinutes">Reel Minutes</Label>
                  <Input
                    type="number"
                    id="reelDurationMinutes"
                    min="1"
                    value={formData.reelDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, reelDurationMinutes: parseInt(e.target.value, 10) || 3 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalDurationMinutes">Total Minutes</Label>
                  <Input
                    type="number"
                    id="totalDurationMinutes"
                    min="1"
                    value={formData.totalDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, totalDurationMinutes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeEpisodeCount">Free Episodes</Label>
                  <Input
                    type="number"
                    id="freeEpisodeCount"
                    min="0"
                    value={formData.freeEpisodeCount}
                    onChange={(e) => setFormData({ ...formData, freeEpisodeCount: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <Label htmlFor="lockEpisodes">Lock Episodes</Label>
                    <p className="text-xs text-muted-foreground">After free count</p>
                  </div>
                  <Switch id="lockEpisodes" checked={formData.lockEpisodes} onCheckedChange={(checked) => setFormData({ ...formData, lockEpisodes: checked })} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Control placement, status, and app navigation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="ctaText">CTA Text</Label>
                <Input
                  id="ctaText"
                  placeholder="Watch Now"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaLink">CTA Link</Label>
                <Input
                  id="ctaLink"
                  placeholder="/shows/ameerzade-ka-badla"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  type="number"
                  id="position"
                  min="0"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground">Show this banner in the app</p>
                </div>
                <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadSpeed ? `${uploadProgress}% · ${uploadSpeed}` : `${uploadProgress}%`}</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-linear"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={() => setLocation("/banners")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending || isUploading}
          >
            {isEdit ? "Update Banner" : "Create Banner"}
          </Button>
        </div>
      </form>

      {isEdit && bannerData?.content && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Episodes</h2>
          
          <form onSubmit={handleAppendVideo} className="mb-8 p-4 border border-border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="appendVideo">Add More Episodes</Label>
                <Input
                  id="appendVideo"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setAppendVideoFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">{formatBytes(appendVideoFile?.size || 0)}</p>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={!appendVideoFile || appendMutation.isPending} className="w-full">
                  Append Episodes
                </Button>
              </div>
            </div>
          </form>

          {episodes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {episodes.map((episode) => (
                <div key={episode.id} className="p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Episode {episode.episode}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-8 w-8"
                      disabled={lockMutation.isPending}
                      onClick={() => handleEpisodeLockToggle(episode)}
                    >
                      {episode.isLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    episode.processingStatus === "ready" ? "bg-green-500/15 text-green-500" :
                    episode.processingStatus === "failed" ? "bg-red-500/15 text-red-500" :
                    "bg-yellow-500/15 text-yellow-500"
                  }`}>
                    {episode.processingStatus}
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground truncate">{episode.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No episodes yet</p>
          )}
        </div>
      )}
    </div>
  );
}
