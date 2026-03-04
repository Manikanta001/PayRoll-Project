import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calendar, TrendingUp, Users, DollarSign, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, subMonths, startOfYear, endOfYear } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 84%, 60%)', 'hsl(180, 70%, 45%)', 'hsl(320, 70%, 50%)', 'hsl(45, 90%, 55%)'];

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
  const [selectedEmployee, setSelectedEmployee] = useState('all');

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

  // Year options
  const yearOptions = [];
  for (let i = 0; i < 3; i++) {
    const year = new Date().getFullYear() - i;
    yearOptions.push({ value: String(year), label: String(year) });
  }

  // Filter data by year
  const yearSalaries = salaryRecords.filter(s => s.month?.startsWith(selectedYear));
  const yearAttendance = attendance.filter(a => a.month?.startsWith(selectedYear));

  // Monthly payroll data
  const monthlyPayrollData = [];
  for (let i = 0; i < 12; i++) {
    const month = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
    const monthName = format(new Date(selectedYear, i, 1), 'MMM');
    const monthSalaries = yearSalaries.filter(s => s.month === month);
    
    let data = {
      month: monthName,
      gross: 0,
      net: 0,
      deductions: 0,
      employees: 0,
    };

    if (selectedEmployee === 'all') {
      data.gross = monthSalaries.reduce((sum, s) => sum + (s.gross_salary || 0), 0);
      data.net = monthSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
      data.deductions = monthSalaries.reduce((sum, s) => sum + (s.total_deductions || 0), 0);
      data.employees = monthSalaries.length;
    } else {
      const empSalary = monthSalaries.find(s => s.employee_id === selectedEmployee);
      if (empSalary) {
        data.gross = empSalary.gross_salary || 0;
        data.net = empSalary.net_salary || 0;
        data.deductions = empSalary.total_deductions || 0;
        data.employees = 1;
      }
    }
    
    monthlyPayrollData.push(data);
  }

  // Department summary
  const departmentData = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Other';
    const existing = acc.find(d => d.name === dept);
    const empSalaries = yearSalaries.filter(s => s.employee_id === emp.id);
    const totalPaid = empSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
    
    if (existing) {
      existing.value += totalPaid;
      existing.employees += 1;
      existing.avgSalary = Math.round(existing.value / existing.employees);
    } else {
      acc.push({ 
        name: dept, 
        value: totalPaid, 
        employees: 1,
        avgSalary: totalPaid
      });
    }
    return acc;
  }, []);

  // Totals
  const totalGross = yearSalaries.reduce((sum, s) => sum + (s.gross_salary || 0), 0);
  const totalNet = yearSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const totalDeductions = yearSalaries.reduce((sum, s) => sum + (s.total_deductions || 0), 0);
  const avgMonthlyPayroll = totalNet / 12;

  // Attendance summary
  const avgAttendance = yearAttendance.length > 0
    ? Math.round(yearAttendance.reduce((sum, a) => {
        return sum + (a.working_days > 0 ? (a.present_days / a.working_days) * 100 : 100);
      }, 0) / yearAttendance.length)
    : 0;

  const exportReport = (type) => {
    let content = '';
    let filename = '';

    if (type === 'payroll') {
      content = `Payroll Report - ${selectedYear}\n\n`;
      content += `Month,Gross Salary,Deductions,Net Salary,Employees\n`;
      monthlyPayrollData.forEach(d => {
        content += `${d.month},${d.gross},${d.deductions},${d.net},${d.employees}\n`;
      });
      content += `\nTotal,${totalGross},${totalDeductions},${totalNet},${employees.length}\n`;
      filename = `payroll-report-${selectedYear}.csv`;
    } else if (type === 'department') {
      content = `Department Report - ${selectedYear}\n\n`;
      content += `Department,Total Paid,Employees,Average Salary\n`;
      departmentData.forEach(d => {
        content += `${d.name},${d.value},${d.employees},${d.avgSalary}\n`;
      });
      filename = `department-report-${selectedYear}.csv`;
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
          <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analyze payroll and workforce data</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-48">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Gross ({selectedYear})</p>
            </div>
            <p className="text-2xl font-bold">${totalGross.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Net Paid</p>
            </div>
            <p className="text-2xl font-bold text-green-600">${totalNet.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Avg Monthly Payroll</p>
            <p className="text-2xl font-bold">${Math.round(avgMonthlyPayroll).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Avg Attendance</p>
            <p className="text-2xl font-bold text-primary">{avgAttendance}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payroll">Monthly Payroll</TabsTrigger>
          <TabsTrigger value="department">Department Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Monthly Payroll Summary</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportReport('payroll')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPayrollData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="gross" name="Gross Salary" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deductions" name="Deductions" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="net" name="Net Salary" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Department-wise Salary Distribution</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportReport('department')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, '']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept, index) => (
                    <div key={dept.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          <p className="text-xs text-muted-foreground">{dept.employees} employees</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${dept.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Avg: ${dept.avgSalary.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPayrollData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="gross" name="Gross" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(217, 91%, 50%)' }} />
                    <Line type="monotone" dataKey="net" name="Net" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ fill: 'hsl(142, 76%, 36%)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Employee Count by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Employees Processed per Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPayrollData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="employees" name="Employees" fill="hsl(280, 65%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}