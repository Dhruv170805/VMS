import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  visitor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor' },
  event: { type: String, required: true },
  actor: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.Log || mongoose.model('Log', LogSchema);
