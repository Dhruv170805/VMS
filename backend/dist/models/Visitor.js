"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const VisitorSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, required: true },
    photo_base64: { type: String, required: true },
    id_photo_base64: { type: String, required: true },
    id_type: {
        type: String,
        enum: ['AADHAR', 'PAN', 'DRIVING_LICENSE', 'ELECTION_CARD', 'OTHER'],
        required: true
    },
    id_number: { type: String, required: true },
    purpose: {
        type: String,
        enum: ['OFFICE', 'INTERNSHIP', 'TRAINING', 'OTHER'],
        required: true
    },
    host_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    visitor_code: { type: String, unique: true, required: true },
    validity: {
        from: { type: Date, required: true },
        to: { type: Date, required: true }
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'GATE_IN', 'MEET_IN', 'MEET_OVER', 'GATE_OUT'],
        default: 'PENDING',
        index: true
    },
    timestamps: {
        approved_at: { type: Date },
        gate_in_at: { type: Date },
        meet_in_at: { type: Date },
        meet_over_at: { type: Date },
        gate_out_at: { type: Date }
    },
    created_at: { type: Date, default: Date.now }
});
// Index for status queries
VisitorSchema.index({ email: 1 });
VisitorSchema.index({ visitor_code: 1 });
VisitorSchema.index({ name: 1, phone: 1 });
exports.default = mongoose_1.default.model('Visitor', VisitorSchema);
//# sourceMappingURL=Visitor.js.map