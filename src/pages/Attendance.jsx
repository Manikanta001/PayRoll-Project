import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Calendar } from "lucide-react";
import AttendanceTable from '@/components/payroll/AttendanceTable';
import AttendanceForm from '@/components/payroll/AttendanceForm';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, subMonths } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";

export default function Attendance() {
  const [showForm, setShowForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const isLoading = loadingEmployees || loadingAttendance;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setShowForm(false);
      toast.success('Attendance recorded successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attendance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setShowForm(false);
      setEditingAttendance(null);
      toast.success('Attendance updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Attendance.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setDeleteRecord(null);
      toast.success('Attendance record deleted');
    },
  });

  const handleSubmit = (data) => {
    if (editingAttendance) {
      updateMutation.mutate({ id: editingAttendance.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record) => {
    setEditingAttendance(record);
    setShowForm(true);
  };

  const handleDelete = (record) => {
    setDeleteRecord(record);
  };

  // Generate month options (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    });
  }

  const filteredRecords = attendance.filter(record => {
    const matchesSearch = !searchQuery || 
      record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMonth = !monthFilter || record.month === monthFilter;
    
    return matchesSearch && matchesMonth;
  });

  // Stats for selected month
  const monthRecords = attendance.filter(r => r.month === monthFilter);
  const totalPresent = monthRecords.reduce((sum, r) => sum + (r.present_days || 0), 0);
  const totalAbsent = monthRecords.reduce((sum, r) => sum + (r.absent_days || 0), 0);
  const totalLeave = monthRecords.reduce((sum, r) => sum + (r.leave_days || 0), 0);
  const avgAttendance = monthRecords.length > 0
    ? Math.round(monthRecords.reduce((sum, r) => {
        return sum + (r.working_days > 0 ? (r.present_days / r.working_days) * 100 : 100);
      }, 0) / monthRecords.length)
    : 0;

  const activeEmployees = employees.filter(e => e.status === 'Active' || !e.status);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track employee attendance records</p>
        </div>
        <Button onClick={() => { setEditingAttendance(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Record Attendance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Records</p>
            <p className="text-2xl font-bold">{monthRecords.length}</p>
            <p className="text-xs text-muted-foreground">of {activeEmployees.length} employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Present</p>
            <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Absent</p>
            <p className="text-2xl font-bold text-red-500">{totalAbsent}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Attendance</p>
            <p className="text-2xl font-bold text-primary">{avgAttendance}%</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredRecords.length} records for {format(new Date(monthFilter + '-01'), 'MMMM yyyy')}
      </p>

      {/* Attendance Table */}
      <AttendanceTable
        records={filteredRecords}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Form */}
      <AttendanceForm
        open={showForm}
        onOpenChange={setShowForm}
        attendance={editingAttendance}
        employees={activeEmployees}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record for {deleteRecord?.employee_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteRecord.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}