import { Request, Response } from 'express';
import Employee from '../models/Employee';
import * as xlsx from 'xlsx';

export const uploadEmployees = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ error: 'Empty Excel file' });
    
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]!);

    // Map and validate data
    const employees = data.map((row: any) => ({
      name: row.Name || row.name,
      department: row.Department || row.department,
      designation: row.Designation || row.designation || 'Staff',
      email: row.Email || row.email,
      phone: row.Phone || row.phone
    }));

    // For simplicity, we clear and re-upload or upsert
    const ops = employees.map(emp => ({
      updateOne: {
        filter: { email: emp.email },
        update: { $set: emp },
        upsert: true
      }
    }));

    await Employee.bulkWrite(ops);

    res.json({ message: 'Employees uploaded successfully', count: employees.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    const employees = await Employee.find(filter).sort({ name: 1 });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleEmployeeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    employee.isActive = !employee.isActive;
    await employee.save();
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
