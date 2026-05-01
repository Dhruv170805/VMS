import { z } from 'zod';

export const VisitorRegistrationSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  company: z.string().min(2),
  purpose: z.enum(['OFFICE', 'INTERNSHIP', 'TRAINING', 'OTHER']),
  host_id: z.string(),
  photo_base64: z.string(),
  id_photo_base64: z.string(),
  id_type: z.enum(['AADHAR', 'PAN', 'DRIVING_LICENSE', 'ELECTION_CARD', 'OTHER']),
  id_number: z.string().min(4),
  validity: z.object({
    from: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
    to: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
  })
});

export const VisitorApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'])
});
