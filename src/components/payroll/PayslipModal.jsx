import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, Printer, Building2 } from "lucide-react";
import { format } from 'date-fns';

export default function PayslipModal({ open, onOpenChange, salary, employee, onDownload, onEmail }) {
  const payslipRef = useRef(null);

  const handlePrint = () => {
    const content = payslipRef.current;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Payslip</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
      .payslip { max-width: 800px; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 20px; }
      .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
      .section { margin: 15px 0; }
      .section-title { font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
      .row { display: flex; justify-content: space-between; padding: 5px 0; }
      .label { color: #6b7280; }
      .value { font-weight: 500; }
      .total { font-size: 18px; font-weight: bold; color: #059669; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
      th { background: #f9fafb; font-weight: 600; }
      .text-right { text-align: right; }
      .text-green { color: #059669; }
      .text-red { color: #dc2626; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(content.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (!salary) return null;

  const salaryMonth = salary.month ? format(new Date(salary.month + '-01'), 'MMMM yyyy') : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payslip - {salaryMonth}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDownload?.(salary)}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEmail?.(salary)}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={payslipRef} className="payslip bg-white p-6 rounded-lg">
          {/* Company Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary">PayRoll Pro</h1>
          </div>

          <Separator className="my-4" />

          <h2 className="text-lg font-semibold text-center mb-4">SALARY SLIP FOR {salaryMonth.toUpperCase()}</h2>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee Name:</span>
                <span className="font-medium">{salary.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee ID:</span>
                <span className="font-medium">{salary.employee_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium">{salary.department}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pay Period:</span>
                <span className="font-medium">{salaryMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Working Days:</span>
                <span className="font-medium">{salary.working_days || 22}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Worked:</span>
                <span className="font-medium">{salary.attendance_days || salary.working_days || 22}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Earnings and Deductions */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings */}
            <div>
              <h3 className="font-semibold mb-3 text-green-700">Earnings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-medium">₹{salary.basic_salary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>HRA (20%)</span>
                  <span className="font-medium">₹{salary.hra?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>DA (10%)</span>
                  <span className="font-medium">₹{salary.da?.toLocaleString()}</span>
                </div>
                {salary.other_allowances > 0 && (
                  <div className="flex justify-between">
                    <span>Other Allowances</span>
                    <span className="font-medium">₹{salary.other_allowances?.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Gross Salary</span>
                  <span className="text-green-600">₹{salary.gross_salary?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="font-semibold mb-3 text-red-700">Deductions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>PF (12%)</span>
                  <span className="font-medium">₹{salary.pf_deduction?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span className="font-medium">₹{salary.tax_deduction?.toLocaleString()}</span>
                </div>
                {salary.other_deductions > 0 && (
                  <div className="flex justify-between">
                    <span>Other Deductions</span>
                    <span className="font-medium">₹{salary.other_deductions?.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-red-600">₹{salary.deductions?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Net Salary */}
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Net Salary</p>
            <p className="text-3xl font-bold text-primary">₹{salary.net_salary?.toLocaleString()}</p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-1">Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
            <p className="mt-3 font-semibold text-gray-500">Designed by Manikanta</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}