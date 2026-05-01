"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorApprovalSchema = exports.VisitorRegistrationSchema = void 0;
const zod_1 = require("zod");
exports.VisitorRegistrationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(10),
    email: zod_1.z.string().email(),
    company: zod_1.z.string().min(2),
    purpose: zod_1.z.enum(['OFFICE', 'INTERNSHIP', 'TRAINING', 'DELIVERY', 'INTERVIEW', 'OTHER']),
    host_id: zod_1.z.string(),
    photo_base64: zod_1.z.string(),
    id_photo_base64: zod_1.z.string(),
    id_type: zod_1.z.enum(['AADHAR', 'PAN', 'DRIVING_LICENSE', 'ELECTION_CARD', 'PASSPORT', 'OTHER']),
    id_number: zod_1.z.string().min(4),
    validity: zod_1.z.object({
        from: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
        to: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
    })
});
exports.VisitorApprovalSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPROVED', 'REJECTED'])
});
//# sourceMappingURL=visitor.schema.js.map