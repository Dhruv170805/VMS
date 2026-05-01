import mongoose from 'mongoose';

const BlacklistSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  type: { type: String, enum: ['EMAIL', 'PHONE'], required: true },
  reason: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Blacklist || mongoose.model('Blacklist', BlacklistSchema);
