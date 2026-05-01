"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('⚠️ MONGODB_URI not found in environment variables.');
        }
        else if (!mongoUri.includes('mongodb+srv://')) {
            console.warn('⚠️  Current MONGODB_URI does not appear to be a MongoDB Atlas connection string.');
        }
        else {
            console.log('🌐 Connecting to MongoDB Atlas...');
        }
        const conn = await mongoose_1.default.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`❌ Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map