import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calculator, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';

export default function ProcessPayrollModal({ 
  open, 
  onOpenChange, 
  employees, 
  attendanceRecords,
  existingSalaries,
  onProcess, 
  isLoading 
}) {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [calculations, setCalculations] = useState([]);

  useEffect(() => {
    if (open) {
      const activeEmployees = employees.filter(e => e.status === 'Active' || !e.status);
      setSelectedEmployees(activeEmployees.map(e => e.id));
      calculateSalaries(activeEmployees.map(e => e.id), month);
    }
  }, [open, employees, month]);

  const calculateSalaries = (empIds, selectedMonth) => {
    const calcs = empIds.map(empId => {
      const employee = employees.find(e => e.id === empId);
      if (!employee) return null;

      const monthAttendance = attendanceRecords.filter(a => {
        if (a.employee_id !== empId) return false;
        if (a.month) return a.month === selectedMonth;
        if (a.date) {
          const d = new Date(a.date);
          const recordMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return recordMonth === selectedMonth;
        }
        return false;
      });

      const basicSalary = employee.basic_salary || 0;
      const workingDays = monthAttendance.length > 0 ? monthAttendance.length : 22;
      const presentDays = monthAttendance.length > 0
        ? monthAttendance.filter(a => a.status === 'Present').length
        : workingDays;

      const attendanceRatio = workingDays > 0 ? presentDays / workingDays : 1;
      const proRatedBasic = Math.round(basicSalary * attendanceRatio);

      const hra = Math.round(proRatedBasic * 0.20); // 20% HRA
      const da = Math.round(proRatedBasic * 0.10);  // 10% DA
      const grossSalary = proRatedBasic + hra + da;

      const pfDeduction = Math.round(proRatedBasic * 0.12); // 12% PF
      const taxDeduction = Math.round(grossSalary * 0.05);  // 5% Tax
      const totalDeductions = pfDeduction + taxDeduction;

      const netSalary = grossSalary - totalDeductions;

      const existing = existingSalaries.find(
        s => s.employee_id === empId && s.month === selectedMonth
      );

      return {
        employee_id: empId,
        employee_name: employee.name,
        email: employee.email,
        department: employee.department,
        basic_salary: proRatedBasic,
        hra,
        da,
        gross_salary: grossSalary,
        pf_deduction: pfDeduction,
        tax_deduction: taxDeduction,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        working_days: workingDays,
        attendance_days: presentDays,
        already_processed: !!existing,
      };
    }).filter(Boolean);

    setCalculations(calcs);
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev => {
      const newSelection = prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId];
      calculateSalaries(newSelection, month);
      return newSelection;
    });
  };

  const toggleAll = () => {
    const activeEmployees = employees.filter(e => e.status === 'Active' || !e.status);
    if (selectedEmployees.length === activeEmployees.length) {
      setSelectedEmployees([]);
      setCalculations([]);
    } else {
      const allIds = activeEmployees.map(e => e.id);
      setSelectedEmployees(allIds);
      calculateSalaries(allIds, month);
    }
  };

  const handleProcess = () => {
    const toProcess = calculations
      .filter(c => selectedEmployees.includes(c.employee_id) && !c.already_processed)
      .map(c => ({
        ...c,
        month,
        status: 'Processed',
        other_allowances: 0,
        other_deductions: 0,
      }));
    onProcess(toProcess);
  };

  const totals = calculations
    .filter(c => selectedEmployees.includes(c.employee_id) && !c.already_processed)
    .reduce((acc, c) => ({
      gross: acc.gross + c.gross_salary,
      deductions: acc.deductions + c.total_deductions,
      net: acc.net + c.net_salary,
    }), { gross: 0, deductions: 0, net: 0 });

  const alreadyProcessedCount = calculations.filter(c => c.already_processed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Process Payroll
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Select Month</Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  calculateSalaries(selectedEmployees, e.target.value);
                }}
                className="w-48"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                checked={selectedEmployees.length === employees.filter(e => e.status === 'Active' || !e.status).length}
                onCheckedChange={toggleAll}
              />
              <Label>Select All Employees</Label>
            </div>
          </div>

          {alreadyProcessedCount > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {alreadyProcessedCount} employee(s) already have salary processed for this month and will be skipped.
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[350px] rounded-md border">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left w-10"></th>
                  <th className="p-2 text-left">Employee</th>
                  <th className="p-2 text-right">Basic</th>
                  <th className="p-2 text-right">HRA</th>
                  <th className="p-2 text-right">DA</th>
                  <th className="p-2 text-right">Gross</th>
                  <th className="p-2 text-right">Deductions</th>
                  <th className="p-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc) => (
                  <tr 
                    key={calc.employee_id} 
                    className={`border-b hover:bg-muted/30 ${calc.already_processed ? 'opacity-50' : ''}`}
                  >
                    <td className="p-2">
                      <Checkbox
                        checked={selectedEmployees.includes(calc.employee_id)}
                        onCheckedChange={() => toggleEmployee(calc.employee_id)}
                        disabled={calc.already_processed}
                      />
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium text-sm">{calc.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{calc.department}</p>
                        {calc.already_processed && (
                          <p className="text-xs text-yellow-600">Already processed</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-right text-sm">₹{calc.basic_salary?.toLocaleString()}</td>
                    <td className="p-2 text-right text-sm">₹{calc.hra?.toLocaleString()}</td>
                    <td className="p-2 text-right text-sm">₹{calc.da?.toLocaleString()}</td>
                    <td className="p-2 text-right text-sm font-medium">₹{calc.gross_salary?.toLocaleString()}</td>
                    <td className="p-2 text-right text-sm text-red-500">-₹{calc.total_deductions?.toLocaleString()}</td>
                    <td className="p-2 text-right text-sm font-bold text-green-600">₹{calc.net_salary?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          <div className="flex justify-end gap-6 p-4 bg-muted/30 rounded-lg">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Gross</p>
              <p className="font-semibold">₹{totals.gross.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Deductions</p>
              <p className="font-semibold text-red-500">₹{totals.deductions.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Net</p>
              <p className="font-bold text-green-600 text-lg">₹{totals.net.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcess} 
            disabled={isLoading || selectedEmployees.filter(id => !calculations.find(c => c.employee_id === id)?.already_processed).length === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Payroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}