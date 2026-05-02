import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  visitor_id: mongoose.Types.ObjectId;
  event: string;
  timestamp: Date;
  actor: string;
  gate_id?: string;
  meta?: any;
}

const LogSchema: Schema = new Schema({
  visitor_id: { type: Schema.Types.ObjectId, ref: 'Visitor', required: true, index: true },
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, required: true },
  gate_id: { type: String },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<ILog>('Log', LogSchema);
