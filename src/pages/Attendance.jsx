import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Attendance() {
  const { user } = useAuth();
  const canMarkAttendance = user?.role === 'admin' || user?.role === 'hr';
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: allAttendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const isLoading = loadingEmployees || loadingAttendance;

  const markAttendanceMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.markDay(selectedDate, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setAttendanceData({});
      toast.success('✅ Attendance marked successfully');
    },
    onError: () => {
      toast.error('❌ Failed to mark attendance');
    },
  });

  const activeEmployees = employees.filter(e => e.status === 'Active' || !e.status);

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(emp =>
      !searchQuery ||
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeEmployees, searchQuery]);

  const handleStatusChange = (empId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [empId]: status,
    }));
  };

  const handleMarkAttendance = () => {
    const records = Object.entries(attendanceData).map(([empId, status]) => {
      const emp = employees.find(e => e.id === empId);
      return {
        employee_id: empId,
        employee_name: emp?.name || 'Unknown',
        status: status || 'Present',
      };
    });

    if (records.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    markAttendanceMutation.mutate(records);
  };

  // Get today's attendance records
  const todayRecords = allAttendance.filter(record => {
    const recordDate = new Date(record.date).toLocaleDateString();
    const selectedDateObj = new Date(selectedDate).toLocaleDateString();
    return recordDate === selectedDateObj;
  });

  // Get recent attendance (last 20 records)
  const recentRecords = allAttendance.slice(0, 20);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
          <p className="text-muted-foreground">
            {canMarkAttendance ? "Mark attendance for all employees" : "View attendance records"}
          </p>
        </div>
      </div>

      {!canMarkAttendance && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-700">
            ℹ️ You can view attendance records below. Only HR and Admin can mark attendance.
          </p>
        </div>
      )}

      {canMarkAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance for {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date picker */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {todayRecords.length} employees marked
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Employee list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No employees found
                </p>
              ) : (
                filteredEmployees.map(emp => {
                  const status = attendanceData[emp.id] || '';
                  return (
                    <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-sm text-muted-foreground">{emp.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={status === 'Present' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(emp.id, 'Present')}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'Absent' ? 'destructive' : 'outline'}
                          onClick={() => handleStatusChange(emp.id, 'Absent')}
                          className="gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'Leave' ? 'secondary' : 'outline'}
                          onClick={() => handleStatusChange(emp.id, 'Leave')}
                          className="gap-1"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Leave
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Submit button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAttendanceData({});
                  setSearchQuery('');
                }}
              >
                Clear
              </Button>
              <Button
                onClick={handleMarkAttendance}
                disabled={markAttendanceMutation.isPending}
              >
                {markAttendanceMutation.isPending ? 'Marking...' : `Mark ${Object.keys(attendanceData).length} Employees`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent attendance records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No attendance records yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRecords.map(record => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">{record.employee_name}</TableCell>
                      <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'Present'
                              ? 'default'
                              : record.status === 'Absent'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
