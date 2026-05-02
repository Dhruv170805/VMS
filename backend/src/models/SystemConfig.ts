import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema({
  appName: { type: String, default: 'NG-VMS' },
  appSubtitle: { type: String, default: 'Next Generation Series - Visitor Management System' },
  companyName: { type: String, default: 'Apple Studio' },
  contactEmail: { type: String, default: process.env.ADMIN_EMAIL || 'admin@vms.com' },
  allowPublicRegistration: { type: Boolean, default: true },
  visitorCodePrefix: { type: String, default: 'NG' },
  theme: {
    primaryColor: { type: String, default: '#0071e3' },
    glassOpacity: { type: Number, default: 0.45 }
  }
}, { timestamps: true });

export default mongoose.model('SystemConfig', SystemConfigSchema);
