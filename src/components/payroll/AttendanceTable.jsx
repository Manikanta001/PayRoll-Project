import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AttendanceTable({ records, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Employee</TableHead>
            <TableHead>Month</TableHead>
            <TableHead className="text-center">Working Days</TableHead>
            <TableHead className="text-center">Present</TableHead>
            <TableHead className="text-center">Absent</TableHead>
            <TableHead className="text-center">Leave</TableHead>
            <TableHead>Attendance %</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No attendance records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => {
              const attendancePercent = record.working_days > 0 
                ? Math.round((record.present_days / record.working_days) * 100) 
                : 0;
              
              return (
                <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{record.employee_id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{record.month}</TableCell>
                  <TableCell className="text-center">{record.working_days}</TableCell>
                  <TableCell className="text-center text-green-600 font-medium">{record.present_days}</TableCell>
                  <TableCell className="text-center text-red-500 font-medium">{record.absent_days || 0}</TableCell>
                  <TableCell className="text-center text-yellow-600 font-medium">{record.leave_days || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={attendancePercent} className="h-2 w-20" />
                      <span className="text-sm font-medium">{attendancePercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(record)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete?.(record)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}