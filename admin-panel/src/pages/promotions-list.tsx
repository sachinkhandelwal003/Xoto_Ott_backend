
import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useGetPromotionsList, useDeletePromotion } from "../lib/api-client";

export default function PromotionsList() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPromotionsList({ page, limit: 20 });
  const deleteMutation = useDeletePromotion();

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast({ title: "Promotion deleted successfully" });
        },
        onError: () => {
          toast({ title: "Failed to delete promotion", variant: "destructive" });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription promotions</p>
        </div>
        <Button onClick={() => setLocation("/promotions/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Promotion
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading promotions...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No promotions found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((promotion: any) => (
                <TableRow key={promotion.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{promotion.title}</TableCell>
                  <TableCell>
                    <Badge className={promotion.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                      {promotion.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{promotion.order}</TableCell>
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
                          onClick={() => setLocation(`/promotions/${promotion.id}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => handleDelete(promotion.id)}
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
