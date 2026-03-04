import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Calendar, TrendingUp, Building2, Clock } from "lucide-react";
import StatCard from '@/components/payroll/StatCard';
import DepartmentChart from '@/components/payroll/DepartmentChart';
import SalaryChart from '@/components/payroll/SalaryChart';
import { format, subMonths } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
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

  // Calculate stats
  const activeEmployees = employees.filter(e => e.status === 'Active' || !e.status).length;
  const totalEmployees = employees.length;
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  
  const currentMonthSalaries = salaryRecords.filter(s => s.month === currentMonth);
  const lastMonthSalaries = salaryRecords.filter(s => s.month === lastMonth);
  
  const totalPayroll = currentMonthSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const lastMonthPayroll = lastMonthSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const payrollChange = lastMonthPayroll > 0 
    ? ((totalPayroll - lastMonthPayroll) / lastMonthPayroll * 100).toFixed(1)
    : 0;

  const avgSalary = activeEmployees > 0 
    ? Math.round(employees.reduce((sum, e) => sum + (e.basic_salary || 0), 0) / activeEmployees)
    : 0;

  const currentAttendance = attendance.filter(a => a.month === currentMonth);
  const avgAttendancePercent = currentAttendance.length > 0
    ? Math.round(currentAttendance.reduce((sum, a) => {
        const percent = a.working_days > 0 ? (a.present_days / a.working_days) * 100 : 100;
        return sum + percent;
      }, 0) / currentAttendance.length)
    : 100;

  // Department distribution
  const departmentData = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Other';
    const existing = acc.find(d => d.name === dept);
    if (existing) {
      existing.value += emp.basic_salary || 0;
      existing.count += 1;
    } else {
      acc.push({ name: dept, value: emp.basic_salary || 0, count: 1 });
    }
    return acc;
  }, []);

  // Monthly salary trend (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const month = format(subMonths(new Date(), i), 'yyyy-MM');
    const monthName = format(subMonths(new Date(), i), 'MMM');
    const monthSalaries = salaryRecords.filter(s => s.month === month);
    monthlyData.push({
      month: monthName,
      gross: monthSalaries.reduce((sum, s) => sum + (s.gross_salary || 0), 0),
      net: monthSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0),
    });
  }

  // Recent salary records
  const recentSalaries = [...salaryRecords]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your payroll overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          subtitle={`${activeEmployees} active`}
          icon={Users}
          trend={`${employees.filter(e => {
            const joinDate = new Date(e.joining_date);
            const monthAgo = subMonths(new Date(), 1);
            return joinDate > monthAgo;
          }).length} new this month`}
          trendUp
        />
        <StatCard
          title="Monthly Payroll"
          value={`$${totalPayroll.toLocaleString()}`}
          subtitle={format(new Date(), 'MMMM yyyy')}
          icon={DollarSign}
          trend={`${payrollChange}% vs last month`}
          trendUp={parseFloat(payrollChange) >= 0}
        />
        <StatCard
          title="Average Salary"
          value={`$${avgSalary.toLocaleString()}`}
          subtitle="Per employee"
          icon={TrendingUp}
        />
        <StatCard
          title="Attendance Rate"
          value={`${avgAttendancePercent}%`}
          subtitle={format(new Date(), 'MMMM yyyy')}
          icon={Calendar}
          trend={avgAttendancePercent >= 90 ? "On track" : "Below target"}
          trendUp={avgAttendancePercent >= 90}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalaryChart data={monthlyData} title="Monthly Payroll Trend" />
        <DepartmentChart data={departmentData} title="Salary by Department" />
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Department Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentData.map((dept, index) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ 
                      backgroundColor: ['hsl(217, 91%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 84%, 60%)', 'hsl(180, 70%, 45%)'][index % 6] 
                    }} />
                    <div>
                      <p className="font-medium text-sm">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.count} employees</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${dept.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total salary</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Departments</span>
              </div>
              <span className="font-semibold">{departmentData.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pending Payroll</span>
              </div>
              <span className="font-semibold">
                {activeEmployees - currentMonthSalaries.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm">Paid This Month</span>
              </div>
              <span className="font-semibold text-green-600">
                {currentMonthSalaries.filter(s => s.status === 'Paid').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}