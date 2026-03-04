import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw, 
  CheckCircle2,
  Code,
  Server,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function DatabaseDemo() {
  const [testEmployee, setTestEmployee] = useState({
    name: 'Alice Johnson',
    email: 'alice.test@company.com',
    department: 'Engineering',
    designation: 'Test Engineer',
    basic_salary: 6000,
    joining_date: '2026-02-01',
    status: 'Active'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [operationLog, setOperationLog] = useState([]);

  const queryClient = useQueryClient();

  // Real-time data fetching
  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      logOperation('READ', 'Fetching all employees from database');
      const data = await base44.entities.Employee.list();
      logOperation('SUCCESS', `Retrieved ${data.length} employees`);
      return data;
    },
  });

  const { data: salaryRecords = [] } = useQuery({
    queryKey: ['salaries'],
    queryFn: () => base44.entities.SalaryRecord.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  // CREATE operation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      logOperation('CREATE', 'Inserting new employee into database', data);
      const empId = `EMP${String(employees.length + 1).padStart(4, '0')}`;
      const result = await base44.entities.Employee.create({ ...data, emp_id: empId });
      logOperation('SUCCESS', `Employee created with ID: ${result.id}`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created in database');
    },
  });

  // UPDATE operation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      logOperation('UPDATE', `Updating employee ID: ${id}`, data);
      const result = await base44.entities.Employee.update(id, data);
      logOperation('SUCCESS', 'Employee record updated');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated in database');
    },
  });

  // DELETE operation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      logOperation('DELETE', `Removing employee ID: ${id} from database`);
      await base44.entities.Employee.delete(id);
      logOperation('SUCCESS', 'Employee deleted from database');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted from database');
    },
  });

  // QUERY/FILTER operation
  const queryMutation = useMutation({
    mutationFn: async ({ query }) => {
      logOperation('QUERY', 'Filtering employees with query', query);
      const result = await base44.entities.Employee.filter(query);
      logOperation('SUCCESS', `Query returned ${result.length} results`);
      return result;
    },
  });

  const logOperation = (type, message, data = null) => {
    const log = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setOperationLog(prev => [log, ...prev].slice(0, 20));
  };

  const handleCreateTest = () => {
    createMutation.mutate(testEmployee);
  };

  const handleUpdateFirst = () => {
    if (employees.length > 0) {
      const firstEmp = employees[0];
      updateMutation.mutate({
        id: firstEmp.id,
        data: { basic_salary: (firstEmp.basic_salary || 0) + 500 }
      });
    }
  };

  const handleDeleteLast = () => {
    if (employees.length > 0) {
      const lastEmp = employees[employees.length - 1];
      if (window.confirm(`Delete ${lastEmp.name}?`)) {
        deleteMutation.mutate(lastEmp.id);
      }
    }
  };

  const handleSearch = () => {
    if (searchQuery) {
      queryMutation.mutate({
        query: { name: { $regex: searchQuery, $options: 'i' } }
      });
    }
  };

  const handleFilterByDept = () => {
    if (filterDept) {
      queryMutation.mutate({
        query: { department: filterDept }
      });
    }
  };

  const handleBulkCreate = async () => {
    const bulkData = [
      { name: 'Test Employee 1', email: 'test1@company.com', department: 'Engineering', designation: 'Dev', basic_salary: 5000, joining_date: '2026-02-15', status: 'Active', emp_id: `EMP${String(employees.length + 1).padStart(4, '0')}` },
      { name: 'Test Employee 2', email: 'test2@company.com', department: 'Sales', designation: 'Rep', basic_salary: 4500, joining_date: '2026-02-15', status: 'Active', emp_id: `EMP${String(employees.length + 2).padStart(4, '0')}` },
      { name: 'Test Employee 3', email: 'test3@company.com', department: 'HR', designation: 'Coordinator', basic_salary: 4800, joining_date: '2026-02-15', status: 'Active', emp_id: `EMP${String(employees.length + 3).padStart(4, '0')}` }
    ];
    
    logOperation('BULK_CREATE', 'Inserting multiple employees', bulkData);
    await base44.entities.Employee.bulkCreate(bulkData);
    logOperation('SUCCESS', `Bulk created ${bulkData.length} employees`);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success('Bulk insert completed');
  };

  const stats = {
    totalEmployees: employees.length,
    totalSalaries: salaryRecords.length,
    totalAttendance: attendance.length,
    activeDepts: [...new Set(employees.map(e => e.department))].length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          Database Operations Demo
        </h1>
        <p className="text-muted-foreground mt-1">
          Live demonstration of backend database CRUD operations with real-time data persistence
        </p>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Employees Table</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            <p className="text-xs text-muted-foreground">records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Salary Table</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalSalaries}</p>
            <p className="text-xs text-muted-foreground">records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-purple-500" />
              <p className="text-sm text-muted-foreground">Attendance Table</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalAttendance}</p>
            <p className="text-xs text-muted-foreground">records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-muted-foreground">Active Depts</p>
            </div>
            <p className="text-2xl font-bold">{stats.activeDepts}</p>
            <p className="text-xs text-muted-foreground">departments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations">CRUD Operations</TabsTrigger>
          <TabsTrigger value="queries">Queries & Filters</TabsTrigger>
          <TabsTrigger value="logs">Operation Logs</TabsTrigger>
        </TabsList>

        {/* CRUD Operations */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CREATE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  CREATE Operation
                </CardTitle>
                <CardDescription>Insert new employee record into database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={testEmployee.name}
                    onChange={(e) => setTestEmployee({...testEmployee, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={testEmployee.email}
                    onChange={(e) => setTestEmployee({...testEmployee, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={testEmployee.department}
                      onChange={(e) => setTestEmployee({...testEmployee, department: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Salary</Label>
                    <Input
                      type="number"
                      value={testEmployee.basic_salary}
                      onChange={(e) => setTestEmployee({...testEmployee, basic_salary: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateTest} 
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Insert into Database
                </Button>
                <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                  <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                  <code>INSERT INTO employees (name, email, dept, salary) VALUES ('{testEmployee.name}', ...)</code>
                </div>
              </CardContent>
            </Card>

            {/* READ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  READ Operation
                </CardTitle>
                <CardDescription>Fetch all records from database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Current Records:</p>
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {employees.slice(0, 5).map(emp => (
                      <div key={emp.id} className="text-xs p-2 bg-background rounded flex justify-between">
                        <span className="font-medium">{emp.name}</span>
                        <Badge variant="outline" className="text-xs">{emp.department}</Badge>
                      </div>
                    ))}
                    {employees.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        ... and {employees.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => refetch()} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh from Database
                </Button>
                <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                  <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                  <code>SELECT * FROM employees ORDER BY created_date DESC</code>
                </div>
              </CardContent>
            </Card>

            {/* UPDATE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-yellow-600" />
                  UPDATE Operation
                </CardTitle>
                <CardDescription>Modify existing record in database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Will update first employee:</p>
                  {employees.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{employees[0].name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Salary:</span>
                        <span className="font-medium">${employees[0].basic_salary}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>New Salary:</span>
                        <span className="font-bold">${(employees[0].basic_salary || 0) + 500}</span>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleUpdateFirst} 
                  disabled={updateMutation.isPending || employees.length === 0}
                  className="w-full"
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Edit className="mr-2 h-4 w-4" />
                  Update Record (+$500 Salary)
                </Button>
                <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                  <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                  <code>UPDATE employees SET basic_salary = basic_salary + 500 WHERE id = ...</code>
                </div>
              </CardContent>
            </Card>

            {/* DELETE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  DELETE Operation
                </CardTitle>
                <CardDescription>Remove record from database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Will delete last employee:</p>
                  {employees.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{employees[employees.length - 1].name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono text-xs">{employees[employees.length - 1].emp_id}</span>
                      </div>
                      <Badge variant="destructive" className="w-full justify-center">
                        This record will be permanently deleted
                      </Badge>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleDeleteLast} 
                  disabled={deleteMutation.isPending || employees.length === 0}
                  variant="destructive"
                  className="w-full"
                >
                  {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete from Database
                </Button>
                <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                  <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                  <code>DELETE FROM employees WHERE id = ...</code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                Bulk Operations
              </CardTitle>
              <CardDescription>Insert multiple records in a single transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleBulkCreate} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Bulk Insert 3 Test Employees
              </Button>
              <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                <code>INSERT INTO employees (name, email, ...) VALUES (...), (...), (...)</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queries & Filters */}
        <TabsContent value="queries" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Query
                </CardTitle>
                <CardDescription>Find employees by name (LIKE query)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search by Name</Label>
                  <Input
                    placeholder="Enter name to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearch} disabled={!searchQuery} className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Execute Search Query
                </Button>
                {queryMutation.data && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                      Query Results: {queryMutation.data.length} found
                    </p>
                    <div className="space-y-1">
                      {queryMutation.data.map(emp => (
                        <div key={emp.id} className="text-xs p-2 bg-white dark:bg-gray-800 rounded">
                          {emp.name} - {emp.department}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                  <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                  <code>SELECT * FROM employees WHERE name LIKE '%{searchQuery}%'</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Filter Query
                </CardTitle>
                <CardDescription>Filter employees by department (WHERE clause)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filter by Department</Label>
                  <Input
                    placeholder="e.g., Engineering, Sales, HR..."
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                  />
                </div>
                <Button onClick={handleFilterByDept} disabled={!filterDept} className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Execute Filter Query
                </Button>
                {queryMutation.data && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                      Filter Results: {queryMutation.data.length} found
                    </p>
                    <div className="space-y-1">
                      {queryMutation.data.map(emp => (
                        <div key={emp.id} className="text-xs p-2 bg-white dark:bg-gray-800 rounded">
                          {emp.name} - ${emp.basic_salary}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                  <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                  <code>SELECT * FROM employees WHERE department = '{filterDept}'</code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Data Relationships</CardTitle>
              <CardDescription>JOIN operations across multiple tables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.slice(0, 3).map(emp => {
                  const empSalaries = salaryRecords.filter(s => s.employee_id === emp.emp_id);
                  const empAttendance = attendance.filter(a => a.employee_id === emp.emp_id);
                  
                  return (
                    <div key={emp.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.emp_id} - {emp.department}</p>
                        </div>
                        <Badge>{emp.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Salary Records</p>
                          <p className="font-bold">{empSalaries.length}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Attendance Records</p>
                          <p className="font-bold">{empAttendance.length}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Total Paid</p>
                          <p className="font-bold text-green-600">
                            ${empSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs font-mono">
                <p className="text-muted-foreground mb-1">SQL Equivalent:</p>
                <code>
                  SELECT e.*, COUNT(s.id) as salary_count, COUNT(a.id) as attendance_count<br/>
                  FROM employees e<br/>
                  LEFT JOIN salary s ON e.emp_id = s.employee_id<br/>
                  LEFT JOIN attendance a ON e.emp_id = a.employee_id<br/>
                  GROUP BY e.id
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operation Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Real-Time Operation Logs
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setOperationLog([])}
                >
                  Clear Logs
                </Button>
              </CardTitle>
              <CardDescription>
                Live tracking of all database operations (last 20 operations)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {operationLog.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No operations yet. Try any CRUD operation above.</p>
                  </div>
                ) : (
                  operationLog.map((log, index) => (
                    <div key={index} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            log.type === 'CREATE' ? 'default' :
                            log.type === 'READ' ? 'secondary' :
                            log.type === 'UPDATE' ? 'outline' :
                            log.type === 'DELETE' ? 'destructive' :
                            log.type === 'SUCCESS' ? 'default' : 'secondary'
                          }>
                            {log.type}
                          </Badge>
                          <span className="text-sm font-medium">{log.message}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                      {log.data && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {log.data}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Architecture Info */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Backend Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">✅ Database Layer</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Cloud-hosted database (managed)</li>
                <li>• Automatic backups & replication</li>
                <li>• ACID transactions</li>
                <li>• Real-time data sync</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">✅ API Layer</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• RESTful endpoints</li>
                <li>• Authentication & authorization</li>
                <li>• Rate limiting</li>
                <li>• Error handling</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">✅ Data Operations</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• CREATE (INSERT)</li>
                <li>• READ (SELECT)</li>
                <li>• UPDATE (UPDATE)</li>
                <li>• DELETE (DELETE)</li>
                <li>• QUERY (WHERE, FILTER)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">✅ Advanced Features</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Bulk operations</li>
                <li>• Relational queries (JOIN)</li>
                <li>• Indexing & optimization</li>
                <li>• Real-time subscriptions</li>
              </ul>
            </div>
          </div>
          <Separator />
          <div className="p-4 bg-background rounded-lg">
            <p className="text-sm font-medium mb-2">Data Persistence Guarantee:</p>
            <p className="text-sm text-muted-foreground">
              All data is stored in a cloud database with automatic backups. Records persist across sessions, 
              page refreshes, and even if the app is redeployed. This is a <strong>real backend database</strong>, 
              not local storage or temporary memory.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}