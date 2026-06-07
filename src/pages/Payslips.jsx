import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { generatePayslipPDF } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Mail, FileText, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PayslipModal from '@/components/payroll/PayslipModal';
import { toast } from "sonner";
import { format, subMonths } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Payslips() {
  const { user } = useAuth();
  const canManagePayslips = user?.role === 'admin' || user?.role === 'hr';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [viewPayslip, setViewPayslip] = useState(null);
  const [deletePayslip, setDeletePayslip] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    enabled: canManagePayslips,
  });

  const { data: payslips = [], isLoading: loadingPayslips, error: payslipsError } = useQuery({
    queryKey: ['payslips'],
    queryFn: () => base44.entities.Payslip.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const isLoading = (canManagePayslips && loadingEmployees) || loadingPayslips;

  const deletePayslipMutation = useMutation({
    mutationFn: ({ id, password }) => base44.entities.Payslip.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setDeletePayslip(null);
      setDeletePassword('');
      setDeleteError('');
      toast.success('Payslip deleted successfully');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to delete payslip';
      setDeleteError(msg);
    },
  });

  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    });
  }

  const filteredRecords = payslips.filter(record => {
    const matchesSearch = !searchQuery || 
      record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMonth = monthFilter === 'all' || record.month === monthFilter;
    
    return matchesSearch && matchesMonth;
  });

  const handleDownloadPayslip = (payslip) => {
    generatePayslipPDF(payslip);
  };

  const handleEmailPayslip = async (payslip) => {
    if (!payslip?.email) {
      toast.error('❌ Employee email not found');
      return;
    }

    const emailBody = `
Dear ${payslip.employee_name},

Please find below your salary details for ${format(new Date(payslip.month + '-01'), 'MMMM yyyy')}:

EARNINGS:
- Basic Salary: ₹${payslip.basic_salary?.toLocaleString()}
- Allowances: ₹${payslip.allowances?.toLocaleString()}

DEDUCTIONS:
- Deductions: ₹${payslip.deductions?.toLocaleString()}

NET SALARY: ₹${payslip.net_salary?.toLocaleString()}

ATTENDANCE:
- Present Days: ${payslip.present_days}
- Total Days: ${payslip.total_days}

If you have any questions, please contact HR.

Best regards,
PayRoll Pro Team
    `;

    await base44.integrations.Core.SendEmail({
      to: payslip.email,
      subject: `Payslip for ${format(new Date(payslip.month + '-01'), 'MMMM yyyy')}`,
      body: emailBody,
    });

    toast.success('✅ Payslip sent to ' + payslip.email);
  };

  const handleBulkDownload = () => {
    filteredRecords.forEach(payslip => {
      handleDownloadPayslip(payslip);
    });
    toast.success(`✅ Downloaded ${filteredRecords.length} payslips`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (payslipsError || (canManagePayslips && employeesError)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payslips</h1>
        </div>
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-600" />
            <p className="font-semibold text-red-600">Error loading data</p>
            {payslipsError && <p className="text-sm mt-2 text-red-500">Payslips Error: {payslipsError?.message || 'Failed to fetch payslips'}</p>}
            {employeesError && <p className="text-sm mt-2 text-red-500">Employees Error: {employeesError?.message || 'Failed to fetch employees'}</p>}
            <p className="text-xs mt-4 text-muted-foreground">Check the browser console for more details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payslips</h1>
          <p className="text-muted-foreground">View and download employee payslips from MongoDB</p>
        </div>
        <Button variant="outline" onClick={handleBulkDownload} disabled={filteredRecords.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Download All ({filteredRecords.length})
        </Button>
      </div>

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
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.map((payslip) => (
          <Card key={payslip._id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{payslip.employee_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{payslip.email}</p>
                </div>
                <Badge variant="default">Processed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(payslip.month + '-01'), 'MMMM yyyy')}
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Basic Salary</span>
                    <span className="font-medium">₹{payslip.basic_salary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Allowances</span>
                    <span className="font-medium">₹{payslip.allowances?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Deductions</span>
                    <span>-₹{payslip.deductions?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-green-600 pt-1 border-t">
                    <span>Net Salary</span>
                    <span>₹{payslip.net_salary?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewPayslip(payslip)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPayslip(payslip)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEmailPayslip(payslip)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  {canManagePayslips && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeletePayslip(payslip)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && !isLoading && (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold">No payslips found</p>
            <p className="text-sm">
              {payslips.length === 0 
                ? "No payslips have been generated yet. Go to the Payroll page and click 'Process Payroll' to generate payslips for employees."
                : "No payslips match your filters. Try adjusting the search or month filter."}
            </p>
          </CardContent>
        </Card>
      )}

      <PayslipModal
        open={!!viewPayslip}
        onOpenChange={() => setViewPayslip(null)}
        salary={viewPayslip}
        employee={employees.find(e => e.id === viewPayslip?.employee_id)}
        onDownload={handleDownloadPayslip}
        onEmail={handleEmailPayslip}
      />

      <AlertDialog open={!!deletePayslip} onOpenChange={(open) => { if (!open) { setDeletePayslip(null); setDeletePassword(''); setDeleteError(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payslip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the payslip for {deletePayslip?.employee_name} ({deletePayslip?.month ? format(new Date(deletePayslip.month + '-01'), 'MMMM yyyy') : ''})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-payslip-password">Enter your password to confirm</Label>
            <Input
              id="delete-payslip-password"
              type="password"
              placeholder="Your password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
            />
            {deleteError && (
              <p className="text-sm text-red-500">{deleteError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeletePassword(''); setDeleteError(''); }}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deletePassword) {
                  setDeleteError('Password is required');
                  return;
                }
                deletePayslipMutation.mutate({ id: deletePayslip._id, password: deletePassword });
              }}
              disabled={deletePayslipMutation.isPending}
            >
              {deletePayslipMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}