import { z } from 'zod';
export declare const VisitorRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    company: z.ZodString;
    purpose: z.ZodEnum<{
        OTHER: "OTHER";
        OFFICE: "OFFICE";
        INTERNSHIP: "INTERNSHIP";
        TRAINING: "TRAINING";
        DELIVERY: "DELIVERY";
        INTERVIEW: "INTERVIEW";
    }>;
    host_id: z.ZodString;
    photo_base64: z.ZodString;
    id_photo_base64: z.ZodString;
    id_type: z.ZodEnum<{
        AADHAR: "AADHAR";
        PAN: "PAN";
        DRIVING_LICENSE: "DRIVING_LICENSE";
        ELECTION_CARD: "ELECTION_CARD";
        PASSPORT: "PASSPORT";
        OTHER: "OTHER";
    }>;
    id_number: z.ZodString;
    validity: z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const VisitorApprovalSchema: z.ZodObject<{
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        REJECTED: "REJECTED";
    }>;
}, z.core.$strip>;
