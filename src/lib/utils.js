import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { jsPDF } from "jspdf"
import { format } from "date-fns"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 

export const isIframe = window.self !== window.top;

export function generatePayslipPDF(salary) {
  const doc = new jsPDF();
  const salaryMonth = salary.month ? format(new Date(salary.month + '-01'), 'MMMM yyyy') : '-';

  // Fonts & styling
  doc.setFont("helvetica", "normal");

  // Title / Brand
  doc.setFillColor(30, 64, 175); // Dark blue primary color
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PayRoll Pro", 15, 26);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Official Salary Statement", 195, 26, { align: "right" });

  // Main title
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`SALARY SLIP - ${salaryMonth.toUpperCase()}`, 15, 55);

  // Metadata block
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Column 1
  doc.text(`Employee Name:  ${salary.employee_name}`, 15, 68);
  doc.text(`Employee ID:    ${salary.employee_id || salary.id}`, 15, 75);
  doc.text(`Department:     ${salary.department || "General"}`, 15, 82);

  // Column 2
  doc.text(`Pay Period:     ${salaryMonth}`, 115, 68);
  doc.text(`Working Days:   ${salary.working_days || 22}`, 115, 75);
  doc.text(`Days Worked:    ${salary.attendance_days || salary.present_days || salary.working_days || 22}`, 115, 82);

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(15, 90, 195, 90);

  // Table Headers
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 96, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Earnings", 18, 101.5);
  doc.text("Deductions", 118, 101.5);

  // Table Data
  doc.setFont("helvetica", "normal");
  
  // Basic
  doc.text("Basic Salary", 18, 112);
  doc.text(`INR ${salary.basic_salary?.toLocaleString()}`, 90, 112, { align: "right" });
  // PF
  doc.text("Provident Fund (12%)", 118, 112);
  doc.text(`INR ${salary.pf_deduction?.toLocaleString()}`, 192, 112, { align: "right" });

  // HRA
  doc.text("HRA (20%)", 18, 119);
  doc.text(`INR ${salary.hra?.toLocaleString()}`, 90, 119, { align: "right" });
  // Tax
  doc.text("Income Tax (5%)", 118, 119);
  doc.text(`INR ${salary.tax_deduction?.toLocaleString()}`, 192, 119, { align: "right" });

  // DA
  doc.text("Dearness Allowance (10%)", 18, 126);
  doc.text(`INR ${salary.da?.toLocaleString()}`, 90, 126, { align: "right" });

  // Other Allowance
  const otherAllowance = salary.allowances || salary.other_allowances || 0;
  doc.text("Other Allowances", 18, 133);
  doc.text(`INR ${otherAllowance.toLocaleString()}`, 90, 133, { align: "right" });

  // Other Deductions
  const otherDeduction = salary.other_deductions || 0;
  if (otherDeduction > 0) {
    doc.text("Other Deductions", 118, 126);
    doc.text(`INR ${otherDeduction.toLocaleString()}`, 192, 126, { align: "right" });
  }

  // Divider line
  doc.line(15, 140, 195, 140);

  // Totals Row
  doc.setFont("helvetica", "bold");
  doc.text("Gross Earnings", 18, 147);
  doc.text(`INR ${salary.gross_salary?.toLocaleString()}`, 90, 147, { align: "right" });
  
  const totalDeductions = salary.total_deductions || salary.deductions || 0;
  doc.text("Total Deductions", 118, 147);
  doc.text(`INR ${totalDeductions.toLocaleString()}`, 192, 147, { align: "right" });

  // Net Salary Box
  doc.setFillColor(239, 246, 255);
  doc.rect(15, 155, 180, 15, "F");
  
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.text("NET SALARY PAYABLE", 20, 164);
  
  doc.setFontSize(14);
  doc.text(`INR ${salary.net_salary?.toLocaleString()}`, 190, 165, { align: "right" });

  // Reset text color
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  
  doc.text("This is a system generated statement and does not require physical signature.", 105, 185, { align: "center" });
  doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 105, 190, { align: "center" });

  doc.save(`payslip-${salary.employee_name}-${salary.month}.pdf`);
}
