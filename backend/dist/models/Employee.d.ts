import mongoose, { Document } from 'mongoose';
export interface IEmployee extends Document {
    name: string;
    department: string;
    email: string;
    phone: string;
    isActive: boolean;
}
declare const _default: mongoose.Model<IEmployee, {}, {}, {}, mongoose.Document<unknown, {}, IEmployee, {}, mongoose.DefaultSchemaOptions> & IEmployee & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEmployee>;
export default _default;
