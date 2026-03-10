import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Mail, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Processed: "bg-blue-100 text-blue-700 border-blue-200",
  Paid: "bg-green-100 text-green-700 border-green-200",
  "On Hold": "bg-red-100 text-red-700 border-red-200",
};

export default function SalaryTable({ records, onViewPayslip, onDownload, onEmail, onStatusChange }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Employee</TableHead>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Gross Salary</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Net Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No salary records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-medium">{record.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{record.department}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{record.month}</TableCell>
                <TableCell className="text-right font-medium">
                  ₹{record.gross_salary?.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-red-500">
                  -₹{record.total_deductions?.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  ₹{record.net_salary?.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[record.status] || statusColors.Pending}>
                    {record.status || 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewPayslip?.(record)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Payslip
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload?.(record)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEmail?.(record)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email Payslip
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}