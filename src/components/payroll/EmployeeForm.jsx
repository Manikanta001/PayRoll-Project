import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const DEPARTMENTS = ["Engineering", "Human Resources", "Finance", "Marketing", "Sales", "Operations", "IT Support", "Administration"];
const STATUSES = ["Active", "Inactive", "On Leave", "Terminated"];

export default function EmployeeForm({ open, onOpenChange, employee, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    basic_salary: '',
    joining_date: '',
    status: 'Active',
    bank_account: '',
    pan_number: '',
    address: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        basic_salary: employee.basic_salary || '',
        joining_date: employee.joining_date || '',
        status: employee.status || 'Active',
        bank_account: employee.bank_account || '',
        pan_number: employee.pan_number || '',
        address: employee.address || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        basic_salary: '',
        joining_date: '',
        status: 'Active',
        bank_account: '',
        pan_number: '',
        address: '',
      });
    }
  }, [employee, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      basic_salary: parseFloat(formData.basic_salary) || 0,
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(v) => handleChange('department', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                placeholder="Software Engineer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic_salary">Basic Salary *</Label>
              <Input
                id="basic_salary"
                type="number"
                value={formData.basic_salary}
                onChange={(e) => handleChange('basic_salary', e.target.value)}
                placeholder="5000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joining_date">Joining Date *</Label>
              <Input
                id="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={(e) => handleChange('joining_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account">Bank Account</Label>
              <Input
                id="bank_account"
                value={formData.bank_account}
                onChange={(e) => handleChange('bank_account', e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan_number">PAN Number</Label>
              <Input
                id="pan_number"
                value={formData.pan_number}
                onChange={(e) => handleChange('pan_number', e.target.value)}
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter full address"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {employee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}