import mongoose, { Document } from 'mongoose';
export interface IBlacklist extends Document {
    value: string;
    type: 'EMAIL' | 'PHONE';
    reason?: string;
    created_at: Date;
}
declare const _default: mongoose.Model<IBlacklist, {}, {}, {}, mongoose.Document<unknown, {}, IBlacklist, {}, mongoose.DefaultSchemaOptions> & IBlacklist & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBlacklist>;
export default _default;
