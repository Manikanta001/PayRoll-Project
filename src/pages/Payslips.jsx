import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Mail, FileText, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PayslipModal from '@/components/payroll/PayslipModal';
import { toast } from "sonner";
import { format, subMonths } from 'date-fns';

export default function Payslips() {
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [viewPayslip, setViewPayslip] = useState(null);

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: salaryRecords = [], isLoading: loadingSalaries } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => base44.entities.SalaryRecord.list(),
  });

  const isLoading = loadingEmployees || loadingSalaries;

  // Generate month options
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
    
    return matchesSearch && matchesMonth;
  });

  // Group by employee for employee view
  const employeePayslips = employees.map(emp => {
    const empSalaries = salaryRecords.filter(s => s.employee_id === emp.id);
    return {
      ...emp,
      salaries: empSalaries.sort((a, b) => b.month.localeCompare(a.month)),
      totalPaid: empSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0),
    };
  }).filter(emp => emp.salaries.length > 0);

  const handleDownloadPayslip = (salary) => {
    const content = `
PAYSLIP - ${format(new Date(salary.month + '-01'), 'MMMM yyyy')}
=====================================
Employee: ${salary.employee_name}
Department: ${salary.department}

EARNINGS:
Basic Salary: $${salary.basic_salary?.toLocaleString()}
HRA (20%): $${salary.hra?.toLocaleString()}
DA (10%): $${salary.da?.toLocaleString()}
Gross Salary: $${salary.gross_salary?.toLocaleString()}

DEDUCTIONS:
PF (12%): $${salary.pf_deduction?.toLocaleString()}
Tax (5%): $${salary.tax_deduction?.toLocaleString()}
Total Deductions: $${salary.total_deductions?.toLocaleString()}

NET SALARY: $${salary.net_salary?.toLocaleString()}
=====================================
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${salary.employee_name}-${salary.month}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Payslip downloaded');
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
- Basic Salary: $${salary.basic_salary?.toLocaleString()}
- HRA (20%): $${salary.hra?.toLocaleString()}
- DA (10%): $${salary.da?.toLocaleString()}
- Gross Salary: $${salary.gross_salary?.toLocaleString()}

DEDUCTIONS:
- PF (12%): $${salary.pf_deduction?.toLocaleString()}
- Tax (5%): $${salary.tax_deduction?.toLocaleString()}
- Total Deductions: $${salary.total_deductions?.toLocaleString()}

NET SALARY: $${salary.net_salary?.toLocaleString()}

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

  const handleBulkDownload = () => {
    filteredRecords.forEach(salary => {
      handleDownloadPayslip(salary);
    });
    toast.success(`Downloaded ${filteredRecords.length} payslips`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payslips</h1>
          <p className="text-muted-foreground">View and download employee payslips</p>
        </div>
        <Button variant="outline" onClick={handleBulkDownload} disabled={filteredRecords.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Download All ({filteredRecords.length})
        </Button>
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
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All months</SelectItem>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payslips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.map((salary) => (
          <Card key={salary.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{salary.employee_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{salary.department}</p>
                </div>
                <Badge variant="outline" className={
                  salary.status === 'Paid' ? 'bg-green-100 text-green-700' :
                  salary.status === 'Processed' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }>
                  {salary.status || 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(salary.month + '-01'), 'MMMM yyyy')}
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Gross</span>
                    <span className="font-medium">${salary.gross_salary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Deductions</span>
                    <span>-${salary.total_deductions?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-green-600 pt-1 border-t">
                    <span>Net</span>
                    <span>${salary.net_salary?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewPayslip(salary)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPayslip(salary)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEmailPayslip(salary)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payslips found</p>
            <p className="text-sm">Process payroll to generate payslips</p>
          </CardContent>
        </Card>
      )}

      {/* Payslip Modal */}
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