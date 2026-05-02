import mongoose, { Document } from 'mongoose';
export interface IVisitor extends Document {
    name: string;
    phone: string;
    email: string;
    company: string;
    photo_base64: string;
    id_photo_base64: string;
    id_type: 'AADHAR' | 'PAN' | 'DRIVING_LICENSE' | 'ELECTION_CARD' | 'PASSPORT' | 'OTHER';
    id_number: string;
    purpose: 'OFFICE' | 'INTERNSHIP' | 'TRAINING' | 'DELIVERY' | 'INTERVIEW' | 'OTHER';
    host_id: mongoose.Types.ObjectId;
    visitor_code: string;
    approval_level: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    priority: 'VIP' | 'NORMAL' | 'LOW';
    visit_time: Date;
    approved_by: string[];
    validity: {
        from: Date;
        to: Date;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'GATE_IN' | 'MEET_IN' | 'MEET_OVER' | 'GATE_OUT';
    visit_timestamps: {
        approved_at?: Date;
        gate_in_at?: Date;
        meet_in_at?: Date;
        meet_over_at?: Date;
        gate_out_at?: Date;
    };
    created_at: Date;
}
declare const _default: mongoose.Model<IVisitor, {}, {}, {}, mongoose.Document<unknown, {}, IVisitor, {}, mongoose.DefaultSchemaOptions> & IVisitor & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVisitor>;
export default _default;
