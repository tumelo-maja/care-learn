import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useGetMyTeam, useGetTeamCandidates, useInviteTeamMember, useRemoveTeamMember } from "../api/index.js";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { Avatar, AvatarFallback } from "../components/ui/avatar.jsx";
import { Button } from "../components/ui/button.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.jsx";
import { useToast } from "../hooks/use-toast.js";
import { useQueryClient } from "@tanstack/react-query";
import { useConfirmation } from "../contexts/ConfirmationContext.jsx";
export default function ManagerDashboard() {
    const confirm = useConfirmation();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data, isLoading, refetch } = useGetMyTeam();
    const { data: candidatesData } = useGetTeamCandidates();
    const inviteMutation = useInviteTeamMember({
        mutation: {
            onSuccess: () => {
                toast({ title: "Staff member added to your team" });
                setIsInviteOpen(false);
                setSelectedUserId("");
                refetch();
                queryClient.invalidateQueries({ queryKey: ["getMyTeam"] });
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to add team member", variant: "destructive" });
            },
        },
    });
    const removeMutation = useRemoveTeamMember({
        mutation: {
            onSuccess: () => {
                toast({ title: "Staff member removed from team" });
                refetch();
                queryClient.invalidateQueries({ queryKey: ["getMyTeam"] });
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to remove team member", variant: "destructive" });
            },
        },
    });
    const members = data?.members || [];
    const totalEnrolments = members.reduce((sum, m) => sum + m.totalEnrolments, 0);
    const totalCompletions = members.reduce((sum, m) => sum + m.completedCourses, 0);
    const existingMemberIds = new Set(members.map((m) => m.id));
    const availableUsers = (candidatesData?.users || []).filter((u) => !existingMemberIds.has(u.id));
    function handleInvite() {
        if (!selectedUserId)
            return;
        inviteMutation.mutate({ data: { userId: selectedUserId } });
    }
    async function handleRemove(memberId, name) {
        if (!await confirm({
            title: "Remove team member?",
            description: `Remove ${name} from your team? Their account and learning records will be kept.`,
            confirmLabel: "Remove member", destructive: true,
        }))
            return;
        removeMutation.mutate({ memberId });
    }
    return (<AppLayout>
      <div className="bg-primary/5 border-b py-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Team Dashboard</h1>
            <p className="text-muted-foreground mt-2">Monitor your care team's training progress and compliance.</p>
          </div>
          <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
            Add Staff Member
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{members.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Enrolments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEnrolments}</div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Courses Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCompletions}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-border/60 overflow-hidden">
          <CardHeader className="bg-muted/20 border-b">
            <CardTitle>Team Progress</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-muted/10">
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-right">Completion Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-[200px]"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-[100px]"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-10 mx-auto"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-10 mx-auto"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 ml-auto"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-8 ml-auto"/></TableCell>
                    </TableRow>))) : members.length === 0 ? (<TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No team members yet. Add staff using the button above.
                    </TableCell>
                  </TableRow>) : (members.map((member) => {
            const rate = member.totalEnrolments > 0
                ? Math.round((member.completedCourses / member.totalEnrolments) * 100)
                : 0;
            const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "Staff Member";
            return (<TableRow key={member.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {member.firstName?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{name}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize font-normal text-xs">
                            {member.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium text-muted-foreground">{member.totalEnrolments}</TableCell>
                        <TableCell className="text-center font-medium text-green-600">{member.completedCourses}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-medium">{rate}%</span>
                            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${rate}%` }}/>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemove(member.id, name)} disabled={removeMutation.isPending}>
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </TableCell>
                      </TableRow>);
        }))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select an existing platform user to add to your team. They will be able to complete training and you will see their progress here.
            </p>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..."/>
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (<SelectItem value="_none" disabled>No available users</SelectItem>) : (availableUsers.map((u) => (<SelectItem key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id}
                    </SelectItem>)))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!selectedUserId || inviteMutation.isPending}>
              {inviteMutation.isPending ? "Adding..." : "Add to Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>);
}
