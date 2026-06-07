import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from 'date-fns';
import { ClipboardCheck, FileText, Calendar, Plus, Check, X, Loader2, Trash2 } from "lucide-react";

export default function Leaves() {
  const { user } = useAuth();
  const isHROrAdmin = user?.role === 'admin' || user?.role === 'hr';
  
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(null); // { request, action: 'Approve' | 'Reject' }
  const [actionNotes, setActionNotes] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'Casual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const queryClient = useQueryClient();

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => base44.entities.LeaveRequest.list(),
  });

  const createLeaveMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowApplyDialog(false);
      setFormData({ type: 'Casual', start_date: '', end_date: '', reason: '' });
      toast.success('Leave request submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit leave request');
    }
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, status, notes }) => base44.entities.LeaveRequest.update(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowActionDialog(null);
      setActionNotes('');
      toast.success('Leave request status updated');
    },
    onError: () => {
      toast.error('Failed to update request');
    }
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaveRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request cancelled');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  });

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates');
      return;
    }

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    if (end < start) {
      toast.error('End date cannot be before start date');
      return;
    }

    const days = differenceInCalendarDays(end, start) + 1;

    createLeaveMutation.mutate({
      employee_id: user.id || user._id,
      employee_name: user.full_name,
      email: user.email,
      type: formData.type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      days,
      reason: formData.reason,
    });
  };

  const handleLeaveAction = (status) => {
    if (!showActionDialog) return;
    updateLeaveMutation.mutate({
      id: showActionDialog.request._id || showActionDialog.request.id,
      status,
      notes: actionNotes,
    });
  };

  // Compute stats for Employee
  const leaveBalances = useMemo(() => {
    const approved = leaves.filter(l => l.status === 'Approved');
    const casualUsed = approved.filter(l => l.type === 'Casual').reduce((sum, l) => sum + l.days, 0);
    const sickUsed = approved.filter(l => l.type === 'Sick').reduce((sum, l) => sum + l.days, 0);
    const earnedUsed = approved.filter(l => l.type === 'Earned').reduce((sum, l) => sum + l.days, 0);

    return {
      casual: { allocated: 12, used: casualUsed, remaining: 12 - casualUsed },
      sick: { allocated: 10, used: sickUsed, remaining: 10 - sickUsed },
      earned: { allocated: 15, used: earnedUsed, remaining: 15 - earnedUsed },
      unpaid: approved.filter(l => l.type === 'Unpaid').reduce((sum, l) => sum + l.days, 0),
    };
  }, [leaves]);

  // Compute stats for HR/Admin
  const pendingRequests = useMemo(() => leaves.filter(l => l.status === 'Pending'), [leaves]);
  const approvedCount = useMemo(() => leaves.filter(l => l.status === 'Approved').length, [leaves]);
  const rejectedCount = useMemo(() => leaves.filter(l => l.status === 'Rejected').length, [leaves]);

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Approved: 'bg-green-100 text-green-700 border-green-200',
    Rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">
            {isHROrAdmin 
              ? "Review employee leave requests and approvals" 
              : "Apply for leaves and track your approval status"}
          </p>
        </div>
        {!isHROrAdmin && (
          <Button onClick={() => setShowApplyDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Apply for Leave
          </Button>
        )}
      </div>

      {/* Stats Section */}
      {isHROrAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rejected Requests</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">Casual Leave</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">{leaveBalances.casual.remaining} / 12</p>
              <p className="text-xs text-muted-foreground mt-1">Days remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">Sick Leave</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{leaveBalances.sick.remaining} / 10</p>
              <p className="text-xs text-muted-foreground mt-1">Days remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">Earned Leave</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">{leaveBalances.earned.remaining} / 15</p>
              <p className="text-xs text-muted-foreground mt-1">Days remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground font-medium">Unpaid Leave</p>
              <p className="text-3xl font-bold mt-1 text-slate-600">{leaveBalances.unpaid}</p>
              <p className="text-xs text-muted-foreground mt-1">Days requested</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HR Pending Approvals Panel */}
      {isHROrAdmin && pendingRequests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-yellow-600" />
              Action Required: Pending Approvals
            </CardTitle>
            <CardDescription>Review and action the following pending leave requests.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(req => (
                  <TableRow key={req._id}>
                    <TableCell className="font-semibold">{req.employee_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(req.start_date), 'MMM dd')} - {format(new Date(req.end_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{req.days}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{req.reason || '-'}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200"
                        onClick={() => setShowActionDialog({ request: req, action: 'Approve' })}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border-red-200"
                        onClick={() => setShowActionDialog({ request: req, action: 'Reject' })}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Leaves History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave History</CardTitle>
          <CardDescription>
            {isHROrAdmin 
              ? "All submitted leave requests across the company" 
              : "Your leave requests history"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {isHROrAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Notes</TableHead>
                {!isHROrAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isHROrAdmin ? 8 : 8} className="text-center py-12 text-muted-foreground">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((req) => (
                  <TableRow key={req._id || req.id} className="hover:bg-muted/30">
                    {isHROrAdmin && <TableCell className="font-semibold">{req.employee_name}</TableCell>}
                    <TableCell>
                      <Badge variant="outline">{req.type}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(req.start_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(req.end_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{req.days}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{req.reason || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[req.status] || statusColors.Pending}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{req.notes || '-'}</TableCell>
                    {!isHROrAdmin && (
                      <TableCell className="text-right">
                        {req.status === 'Pending' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => deleteLeaveMutation.mutate(req._id || req.id)}
                            disabled={deleteLeaveMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : '-'}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Apply Leave Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApplySubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="type">Leave Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Earned">Earned Leave</SelectItem>
                  <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason / Remarks</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="Reason for requesting leave..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLeaveMutation.isPending}>
                {createLeaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Approve / Reject) */}
      <Dialog open={!!showActionDialog} onOpenChange={() => setShowActionDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showActionDialog?.action} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to <strong>{showActionDialog?.action?.toLowerCase()}</strong> the leave request for <strong>{showActionDialog?.request?.employee_name}</strong> ({showActionDialog?.request?.days} days)?
            </p>
            <div className="space-y-2">
              <Label htmlFor="notes">Add Notes / Comments (Optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Remarks for approval/rejection..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant={showActionDialog?.action === 'Approve' ? 'default' : 'destructive'}
              onClick={() => handleLeaveAction(showActionDialog?.action + 'd')}
              disabled={updateLeaveMutation.isPending}
            >
              {updateLeaveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {showActionDialog?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
