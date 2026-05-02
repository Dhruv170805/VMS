import mongoose, { Document } from 'mongoose';
export interface ILog extends Document {
    visitor_id: mongoose.Types.ObjectId;
    event: string;
    timestamp: Date;
    actor: string;
    gate_id?: string;
    meta?: any;
}
declare const _default: mongoose.Model<ILog, {}, {}, {}, mongoose.Document<unknown, {}, ILog, {}, mongoose.DefaultSchemaOptions> & ILog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ILog>;
export default _default;
