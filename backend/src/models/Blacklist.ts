import mongoose, { Schema, Document } from 'mongoose';

export interface IBlacklist extends Document {
  value: string; // Email or Phone
  type: 'EMAIL' | 'PHONE';
  reason?: string;
  created_at: Date;
}

const BlacklistSchema: Schema = new Schema({
  value: { type: String, required: true, unique: true },
  type: { type: String, enum: ['EMAIL', 'PHONE'], required: true },
  reason: { type: String },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<IBlacklist>('Blacklist', BlacklistSchema);
