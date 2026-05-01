import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitor extends Document {
  name: string;
  phone: string;
  email: string;
  company: string;
  photo_base64: string;
  id_photo_base64: string;
  id_type: 'AADHAR' | 'PAN' | 'DRIVING_LICENSE' | 'ELECTION_CARD' | 'OTHER';
  id_number: string;
  purpose: 'OFFICE' | 'INTERNSHIP' | 'TRAINING' | 'OTHER';
  host_id: mongoose.Types.ObjectId;
  visitor_code: string;
  validity: {
    from: Date;
    to: Date;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'GATE_IN' | 'MEET_IN' | 'MEET_OVER' | 'GATE_OUT';
  timestamps: {
    approved_at?: Date;
    gate_in_at?: Date;
    meet_in_at?: Date;
    meet_over_at?: Date;
    gate_out_at?: Date;
  };
  created_at: Date;
}

const VisitorSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true },
  photo_base64: { type: String, required: true },
  id_photo_base64: { type: String, required: true },
  id_type: { 
    type: String, 
    enum: ['AADHAR', 'PAN', 'DRIVING_LICENSE', 'ELECTION_CARD', 'OTHER'],
    required: true 
  },
  id_number: { type: String, required: true },
  purpose: { 
    type: String, 
    enum: ['OFFICE', 'INTERNSHIP', 'TRAINING', 'OTHER'],
    required: true 
  },
  host_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  visitor_code: { type: String, unique: true, required: true },
  validity: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'GATE_IN', 'MEET_IN', 'MEET_OVER', 'GATE_OUT'],
    default: 'PENDING',
    index: true
  },
  timestamps: {
    approved_at: { type: Date },
    gate_in_at: { type: Date },
    meet_in_at: { type: Date },
    meet_over_at: { type: Date },
    gate_out_at: { type: Date }
  },
  created_at: { type: Date, default: Date.now }
});

// Index for status queries
VisitorSchema.index({ email: 1 });
VisitorSchema.index({ visitor_code: 1 });
VisitorSchema.index({ name: 1, phone: 1 });

export default mongoose.model<IVisitor>('Visitor', VisitorSchema);
