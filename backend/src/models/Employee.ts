import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  isActive: boolean;
}

const EmployeeSchema: Schema = new Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
