import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String },
  purpose: { type: String, required: true },
  host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  id_type: { type: String, required: true },
  id_number: { type: String, required: true },
  photo_base64: { type: String, required: true },
  id_photo_base64: { type: String, required: true },
  visitor_code: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'GATE_IN', 'MEET_IN', 'MEET_OVER', 'GATE_OUT'],
    default: 'PENDING' 
  },
  validity: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  visit_timestamps: {
    approved_at: Date,
    gate_in_at: Date,
    meet_in_at: Date,
    meet_over_at: Date,
    gate_out_at: Date
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.models.Visitor || mongoose.model('Visitor', VisitorSchema);
