import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generatePayslipPDF } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Search, Download, Calendar, IndianRupee, TrendingUp } from "lucide-react";
import SalaryTable from '@/components/payroll/SalaryTable';
import PayslipModal from '@/components/payroll/PayslipModal';
import ProcessPayrollModal from '@/components/payroll/ProcessPayrollModal';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, subMonths } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";

export default function Payroll() {
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [viewPayslip, setViewPayslip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [statusFilter, setStatusFilter] = useState('All');

  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: salaryRecords = [], isLoading: loadingSalaries } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => base44.entities.SalaryRecord.list(),
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const isLoading = loadingEmployees || loadingSalaries || loadingAttendance;

  const createSalariesMutation = useMutation({
    mutationFn: async (records) => {
      if (!records || records.length === 0) {
        throw new Error('No employees to process. All may already be processed for this month.');
      }
      const payslips = await base44.entities.Payslip.bulkCreate(records);
      return payslips;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      setShowProcessModal(false);
      toast.success('Payroll processed successfully');
    },
    onError: (error) => {
      console.error('Payroll processing error:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to process payroll';
      toast.error(msg);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.SalaryRecord.update(id, { 
      status, 
      payment_date: status === 'Paid' ? format(new Date(), 'yyyy-MM-dd') : null 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Status updated');
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

  const filteredRecords = salaryRecords.filter(record => {
    const matchesSearch = !searchQuery || 
      record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMonth = !monthFilter || record.month === monthFilter;
    const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
    
    return matchesSearch && matchesMonth && matchesStatus;
  });

  const monthRecords = salaryRecords.filter(r => r.month === monthFilter);
  const totalGross = monthRecords.reduce((sum, r) => sum + (r.gross_salary || 0), 0);
  const totalDeductions = monthRecords.reduce((sum, r) => sum + (r.total_deductions || 0), 0);
  const totalNet = monthRecords.reduce((sum, r) => sum + (r.net_salary || 0), 0);
  const paidCount = monthRecords.filter(r => r.status === 'Paid').length;

  const handleDownloadPayslip = (salary) => {
    generatePayslipPDF(salary);
  };

  const handleEmailPayslip = async (salary) => {
    const employee = employees.find(e => e.id === salary.employee_id);
    if (!employee?.email) {
      toast.error('Employee email not found');
      return;
    }

    const emailBody = `
Dear ${salary.employee_name},

Please find below your salary details for ${format(new Date(salary.month + '-01'), 'MMMM yyyy')}:

EARNINGS:
- Basic Salary: ₹${salary.basic_salary?.toLocaleString()}
- HRA (20%): ₹${salary.hra?.toLocaleString()}
- DA (10%): ₹${salary.da?.toLocaleString()}
- Gross Salary: ₹${salary.gross_salary?.toLocaleString()}

DEDUCTIONS:
- PF (12%): ₹${salary.pf_deduction?.toLocaleString()}
- Tax (5%): ₹${salary.tax_deduction?.toLocaleString()}
- Total Deductions: ₹${salary.total_deductions?.toLocaleString()}

NET SALARY: ₹${salary.net_salary?.toLocaleString()}

If you have any questions, please contact HR.

Best regards,
Payroll Team
    `;

    await base44.integrations.Core.SendEmail({
      to: employee.email,
      subject: `Payslip for ${format(new Date(salary.month + '-01'), 'MMMM yyyy')}`,
      body: emailBody,
    });

    toast.success('Payslip sent to ' + employee.email);
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Department', 'Month', 'Basic', 'HRA', 'DA', 'Gross', 'PF', 'Tax', 'Deductions', 'Net', 'Status'];
    const rows = filteredRecords.map(r => [
      r.employee_name,
      r.department,
      r.month,
      r.basic_salary,
      r.hra,
      r.da,
      r.gross_salary,
      r.pf_deduction,
      r.tax_deduction,
      r.total_deductions,
      r.net_salary,
      r.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${monthFilter}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Salary report exported');
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Process and manage employee salaries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowProcessModal(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Gross</p>
            </div>
            <p className="text-2xl font-bold">₹{totalGross.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Deductions</p>
            </div>
            <p className="text-2xl font-bold text-red-500">₹{totalDeductions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Net Payable</p>
            <p className="text-2xl font-bold text-green-600">₹{totalNet.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Paid</p>
            <p className="text-2xl font-bold text-primary">{paidCount}/{monthRecords.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name..."
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processed">Processed</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredRecords.length} salary records
      </p>

      <SalaryTable
        records={filteredRecords}
        onViewPayslip={setViewPayslip}
        onDownload={handleDownloadPayslip}
        onEmail={handleEmailPayslip}
        onStatusChange={(record, status) => updateStatusMutation.mutate({ id: record.id, status })}
      />

      <ProcessPayrollModal
        open={showProcessModal}
        onOpenChange={setShowProcessModal}
        employees={employees.filter(e => e.status === 'Active' || !e.status)}
        attendanceRecords={attendance}
        existingSalaries={salaryRecords}
        onProcess={(records) => createSalariesMutation.mutate(records)}
        isLoading={createSalariesMutation.isPending}
      />

      <PayslipModal
        open={!!viewPayslip}
        onOpenChange={() => setViewPayslip(null)}
        salary={viewPayslip}
        employee={employees.find(e => e.id === viewPayslip?.employee_id)}
        onDownload={handleDownloadPayslip}
        onEmail={handleEmailPayslip}
      />
    </div>
  );
}