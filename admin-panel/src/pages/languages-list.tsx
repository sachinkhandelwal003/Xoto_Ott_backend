import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreVertical, Pencil, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useGetLanguagesList, useCreateLanguage, useUpdateLanguage, useDeleteLanguage, getImageUrl } from "../lib/api-client";

export default function LanguagesList() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", image: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateLanguage();
  const updateMutation = useUpdateLanguage();
  const deleteMutation = useDeleteLanguage();

  const { data, isLoading } = useGetLanguagesList();

  const filteredLanguages = data?.data?.filter((lang) =>
    lang.name.toLowerCase().includes(search.toLowerCase()) ||
    lang.code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreate = () => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("code", formData.code);
    if (selectedFile) {
      formDataToSend.append("image", selectedFile);
    }

    createMutation.mutate(formDataToSend, {
      onSuccess: () => {
        toast({ title: "Language created successfully" });
        setIsCreateDialogOpen(false);
        setFormData({ name: "", code: "", image: "" });
        setSelectedFile(null);
      },
      onError: () => {
        toast({ title: "Failed to create language", variant: "destructive" });
      },
    });
  };

  const handleUpdate = () => {
    if (!editingLanguage) return;

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("code", formData.code);
    if (selectedFile) {
      formDataToSend.append("image", selectedFile);
    }

    updateMutation.mutate(
      { id: editingLanguage.id, data: formDataToSend },
      {
        onSuccess: () => {
          toast({ title: "Language updated successfully" });
          setEditingLanguage(null);
          setFormData({ name: "", code: "", image: "" });
          setSelectedFile(null);
        },
        onError: () => {
          toast({ title: "Failed to update language", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Language deleted successfully" });
      },
      onError: () => {
        toast({ title: "Failed to delete language", variant: "destructive" });
      },
    });
  };

  const openEditDialog = (lang) => {
    setEditingLanguage(lang);
    setFormData({ name: lang.name, code: lang.code, image: lang.image || "" });
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Languages</h1>
          <p className="text-muted-foreground mt-1">Manage your platform languages</p>
        </div>
        <Dialog open={isCreateDialogOpen || editingLanguage ? true : false} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingLanguage(null);
            setFormData({ name: "", code: "", image: "" });
            setSelectedFile(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Language
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLanguage ? "Edit Language" : "Add Language"}</DialogTitle>
              <DialogDescription>
                {editingLanguage ? "Update the language details below." : "Add a new language to your platform."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. English"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. en"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
                )}
                {!selectedFile && formData.image && (
                  <img src={getImageUrl(formData.image)} alt="Current" className="h-20 w-20 object-cover rounded" />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingLanguage(null);
                  setFormData({ name: "", code: "", image: "" });
                  setSelectedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingLanguage ? handleUpdate : handleCreate}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingLanguage ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search languages..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Language</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading languages...</TableCell>
              </TableRow>
            ) : filteredLanguages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No languages found.</TableCell>
              </TableRow>
            ) : (
              filteredLanguages.map((lang) => (
                <TableRow key={lang.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/50">
                        {lang.image ? (
                          <AvatarImage src={getImageUrl(lang.image)} alt={lang.name} />
                        ) : (
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            <Globe className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium text-foreground">{lang.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lang.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={lang.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                      {lang.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => openEditDialog(lang)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => handleDelete(lang.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
