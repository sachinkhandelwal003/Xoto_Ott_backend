import { useState } from "react";
import { Link } from "wouter";
import { useGetUsersList, useBanUser, useUnbanUser } from "../lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, MoreVertical, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

export default function UsersList() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const params: any = { page };
  if (search) params.search = search;
  if (plan !== "all") params.plan = plan;

  const { data, isLoading } = useGetUsersList(params);

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'premium': return <Badge className="bg-primary/20 text-primary border-primary/30">Premium</Badge>;
      case 'standard': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Standard</Badge>;
      case 'basic': return <Badge className="bg-zinc-500/20 text-zinc-300 border-zinc-500/30">Basic</Badge>;
      case 'free': return <Badge variant="outline" className="text-muted-foreground">Free</Badge>;
      default: return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const getStatusIndicator = (status: string) => {
    const isActive = status === 'active';
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="capitalize text-sm text-muted-foreground">{status}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("users.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("users.title")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("content.search")}
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="w-[180px] bg-background">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t("content.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>{t("users.userName")}</TableHead>
              <TableHead>{t("users.userStatus")}</TableHead>
              <TableHead>{t("users.userRole")}</TableHead>
              <TableHead>Watch Time</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
              </TableRow>
            ) : (
              data?.data?.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/50">
                        {user.avatar && <AvatarImage src={user.avatar} />}
                        <AvatarFallback className="bg-secondary text-secondary-foreground">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusIndicator(user.status || 'active')}</TableCell>
                  <TableCell>{getPlanBadge(user.subscriptionPlan)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.totalWatchTime ? `${Math.round(user.totalWatchTime / 60)} hrs` : '0 hrs'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/users/${user.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        {user.status === 'banned' ? (
                          <DropdownMenuItem 
                            className="text-green-500 focus:text-green-500 cursor-pointer"
                            onClick={() => unbanMutation.mutate(user.id, {
                              onSuccess: () => {
                                queryClient.invalidateQueries({ queryKey: ["users-list"] });
                                toast({ title: "User unbanned successfully" });
                              },
                              onError: () => {
                                toast({ title: "Failed to unban user", variant: "destructive" });
                              }
                            })}
                            disabled={unbanMutation.isPending}
                          >
                            Unsuspend Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => banMutation.mutate(user.id, {
                              onSuccess: () => {
                                queryClient.invalidateQueries({ queryKey: ["users-list"] });
                                toast({ title: "User banned successfully" });
                              },
                              onError: () => {
                                toast({ title: "Failed to ban user", variant: "destructive" });
                              }
                            })}
                            disabled={banMutation.isPending}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" /> Suspend Account
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border/50">
          <div className="text-sm text-muted-foreground">
            Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{" "}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage(Math.max(1, data.pagination.page - 1))}
              disabled={data.pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">{data.pagination.page} / {data.pagination.pages}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage(Math.min(data.pagination.pages, data.pagination.page + 1))}
              disabled={data.pagination.page >= data.pagination.pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
