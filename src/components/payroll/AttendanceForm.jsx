import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';

export default function AttendanceForm({ open, onOpenChange, attendance, employees, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    month: format(new Date(), 'yyyy-MM'),
    working_days: 22,
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    half_days: 0,
    overtime_hours: 0,
    remarks: '',
  });

  useEffect(() => {
    if (attendance) {
      setFormData({
        employee_id: attendance.employee_id || '',
        month: attendance.month || format(new Date(), 'yyyy-MM'),
        working_days: attendance.working_days || 22,
        present_days: attendance.present_days || 22,
        absent_days: attendance.absent_days || 0,
        leave_days: attendance.leave_days || 0,
        half_days: attendance.half_days || 0,
        overtime_hours: attendance.overtime_hours || 0,
        remarks: attendance.remarks || '',
      });
    } else {
      setFormData({
        employee_id: '',
        month: format(new Date(), 'yyyy-MM'),
        working_days: 22,
        present_days: 22,
        absent_days: 0,
        leave_days: 0,
        half_days: 0,
        overtime_hours: 0,
        remarks: '',
      });
    }
  }, [attendance, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
    onSubmit({
      ...formData,
      employee_name: selectedEmployee?.name || '',
      working_days: parseInt(formData.working_days) || 0,
      present_days: parseInt(formData.present_days) || 0,
      absent_days: parseInt(formData.absent_days) || 0,
      leave_days: parseInt(formData.leave_days) || 0,
      half_days: parseInt(formData.half_days) || 0,
      overtime_hours: parseFloat(formData.overtime_hours) || 0,
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Auto-calculate absent days
      if (field === 'working_days' || field === 'present_days' || field === 'leave_days') {
        const working = field === 'working_days' ? parseInt(value) || 0 : parseInt(prev.working_days) || 0;
        const present = field === 'present_days' ? parseInt(value) || 0 : parseInt(prev.present_days) || 0;
        const leave = field === 'leave_days' ? parseInt(value) || 0 : parseInt(prev.leave_days) || 0;
        newData.absent_days = Math.max(0, working - present - leave);
      }
      return newData;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {attendance ? 'Edit Attendance' : 'Record Attendance'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee *</Label>
            <Select 
              value={formData.employee_id} 
              onValueChange={(v) => handleChange('employee_id', v)}
              disabled={!!attendance}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.emp_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="month">Month *</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => handleChange('month', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="working_days">Working Days</Label>
              <Input
                id="working_days"
                type="number"
                min="0"
                max="31"
                value={formData.working_days}
                onChange={(e) => handleChange('working_days', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="present_days">Present Days</Label>
              <Input
                id="present_days"
                type="number"
                min="0"
                max={formData.working_days}
                value={formData.present_days}
                onChange={(e) => handleChange('present_days', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave_days">Leave Days</Label>
              <Input
                id="leave_days"
                type="number"
                min="0"
                value={formData.leave_days}
                onChange={(e) => handleChange('leave_days', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="absent_days">Absent Days</Label>
              <Input
                id="absent_days"
                type="number"
                min="0"
                value={formData.absent_days}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="half_days">Half Days</Label>
              <Input
                id="half_days"
                type="number"
                min="0"
                value={formData.half_days}
                onChange={(e) => handleChange('half_days', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtime_hours">Overtime Hours</Label>
              <Input
                id="overtime_hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.overtime_hours}
                onChange={(e) => handleChange('overtime_hours', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.employee_id}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {attendance ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}