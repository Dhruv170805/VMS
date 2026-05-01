"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = __importDefault(require("./config/db"));
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT;
if (!PORT) {
    throw new Error('⚠️ PORT not found in environment variables.');
}
// Connect to Database
(0, db_1.default)();
// Middleware
app.use((0, morgan_1.default)('dev')); // HTTP request logging
// Robust CORS Middleware for Safari/Local Development
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});
app.use(express_1.default.json({ limit: '10mb' })); // Support base64 images
// Routes
app.use('/api', api_1.default);
// Basic Route
app.get('/', (req, res) => {
    res.send('VMS API is running...');
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map