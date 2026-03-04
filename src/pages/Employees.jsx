import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Upload, Filter } from "lucide-react";
import EmployeeTable from '@/components/payroll/EmployeeTable';
import EmployeeForm from '@/components/payroll/EmployeeForm';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';

const DEPARTMENTS = ["All", "Engineering", "Human Resources", "Finance", "Marketing", "Sales", "Operations", "IT Support", "Administration"];
const STATUSES = ["All", "Active", "Inactive", "On Leave", "Terminated"];

export default function Employees() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const empId = `EMP${String(employees.length + 1).padStart(4, '0')}`;
      return base44.entities.Employee.create({ ...data, emp_id: empId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
      toast.success('Employee added successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
      setEditingEmployee(null);
      toast.success('Employee updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteEmployee(null);
      toast.success('Employee deleted successfully');
    },
  });

  const handleSubmit = (data) => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = (employee) => {
    setDeleteEmployee(employee);
  };

  const handleView = (employee) => {
    setViewEmployee(employee);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchQuery || 
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.emp_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'All' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter || (!emp.status && statusFilter === 'Active');
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Emp ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Basic Salary', 'Joining Date', 'Status'];
    const rows = filteredEmployees.map(emp => [
      emp.emp_id,
      emp.name,
      emp.email,
      emp.phone,
      emp.department,
      emp.designation,
      emp.basic_salary,
      emp.joining_date,
      emp.status || 'Active'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Employee data exported');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
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
          <h1 className="text-2xl md:text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your organization's workforce</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { setEditingEmployee(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredEmployees.length} of {employees.length} employees
      </p>

      {/* Employee Table */}
      <EmployeeTable
        employees={filteredEmployees}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* Add/Edit Form */}
      <EmployeeForm
        open={showForm}
        onOpenChange={setShowForm}
        employee={editingEmployee}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEmployee} onOpenChange={() => setDeleteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteEmployee?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteEmployee.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Employee Details */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {viewEmployee.name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{viewEmployee.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewEmployee.designation}</p>
                  <Badge variant="outline" className="mt-1">{viewEmployee.emp_id}</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{viewEmployee.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewEmployee.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{viewEmployee.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline">{viewEmployee.status || 'Active'}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Basic Salary</p>
                  <p className="font-medium">${viewEmployee.basic_salary?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joining Date</p>
                  <p className="font-medium">
                    {viewEmployee.joining_date ? format(new Date(viewEmployee.joining_date), 'MMM dd, yyyy') : '-'}
                  </p>
                </div>
              </div>
              {viewEmployee.address && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm">Address</p>
                    <p className="font-medium text-sm">{viewEmployee.address}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}