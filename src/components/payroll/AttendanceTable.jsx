import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/lib/AuthContext';

export default function AttendanceTable({ records, onEdit, onDelete, onMarkDay }) {
  const { user } = useAuth();
  const canMarkAttendance = user?.role === 'admin' || user?.role === 'hr';
  const [expandedRow, setExpandedRow] = useState(null);

  // Helper function to get days in month
  const getDaysInMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, month, 0).getDate();
  };
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
            <TableHead>Attendance %</TableHead>
            {canMarkAttendance && (
              <TableHead className="text-center">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canMarkAttendance ? 7 : 6} className="text-center py-8 text-muted-foreground">
                No attendance records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => {
              const attendancePercent = record.working_days > 0 
                ? Math.round((record.present_days / record.working_days) * 100) 
                : 0;
              
              // Parse attendance_days JSON if available
              const attendanceDays = record.attendance_days || {};
              const daysInMonth = getDaysInMonth(record.month);
              
              return (
                <React.Fragment key={record.id}>
                  <TableRow className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={attendancePercent} className="h-2 w-20" />
                        <span className="text-sm font-medium">{attendancePercent}%</span>
                      </div>
                    </TableCell>
                    {canMarkAttendance && (
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit?.(record); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); onDelete?.(record); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  
                  {/* Day-by-day attendance for HR/Admin */}
                  {canMarkAttendance && expandedRow === record.id && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={canMarkAttendance ? 7 : 6} className="p-4">
                        <div>
                          <p className="font-semibold mb-3">Mark Daily Attendance for {record.month}</p>
                          <div className="grid grid-cols-7 md:grid-cols-14 gap-2">
                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const day = i + 1;
                              const isPresent = attendanceDays[day] === true;
                              const isAbsent = attendanceDays[day] === false;
                              
                              return (
                                <div key={day} className="flex flex-col items-center gap-1">
                                  <label className="text-xs font-medium cursor-pointer flex items-center gap-1">
                                    <Checkbox
                                      checked={isPresent}
                                      onChange={(e) => onMarkDay?.(record, day, e.target.checked)}
                                      className="h-4 w-4"
                                    />
                                    <span className="text-xs">{day}</span>
                                  </label>
                                  <span className={`text-xs px-1 rounded ${isPresent ? 'bg-green-100 text-green-700' : isAbsent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {isPresent ? 'P' : isAbsent ? 'A' : '-'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}