const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Organization = require('./models/Organization');

dotenv.config();

// Fail fast on startup in production if secrets are missing
if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
        console.error('FATAL: JWT_SECRET environment variable is required in production.');
        process.exit(1);
    }
    if (!process.env.OTP_SECRET) {
        console.error('FATAL: OTP_SECRET environment variable is required in production.');
        process.exit(1);
    }
}

const app = express();

// Trust reverse proxy (e.g. Render, Heroku, Nginx) for accurate IP-based rate limiting
app.set('trust proxy', 1);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route redirect to Corporate Sign In
app.get('/', (req, res) => {
    res.redirect('/signin.html');
});

// API Routes
const otpRoutes = require('./routes/otp.routes');
app.use('/api/auth', otpRoutes);
app.use('/api/organizations', otpRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Enterprise Root Admin Seeding Function
async function seedInitialAdmin() {
    try {
        let defaultOrg = await Organization.findOne({ orgId: 'ORG-NEXUS-01' });
        if (!defaultOrg) {
            defaultOrg = await Organization.create({
                orgId: 'ORG-NEXUS-01',
                orgName: 'Nexus Enterprise',
                allowedDomains: ['nexus.in', 'admin.nexus.in', 'emp.nexus.in', 'nexus.internal', 'nexus.com'],
                status: 'Active'
            });
        }

        const adminExists = await User.findOne({ role: 'Admin' });
        if (!adminExists) {
            const email = process.env.ROOT_ADMIN_EMAIL || 'admin@nexus.internal';
            const password = process.env.ROOT_ADMIN_PASSWORD || 'AdminRoot123!';

            const admin = await User.create({
                name: 'Nexus Root Admin',
                email,
                password,
                role: 'Admin',
                organization: defaultOrg._id
            });

            if (!defaultOrg.owner) {
                defaultOrg.owner = admin._id;
                await defaultOrg.save();
            }

            console.log('\n=============================================');
            console.log('--- ENTERPRISE ROOT ADMIN SEEDED ---');
            console.log(`Email:        ${email}`);
            console.log(`Password:     ${password}`);
            console.log(`Organization: ${defaultOrg.orgName}`);
            console.log('=============================================\n');
        }
    } catch (error) {
        console.error('Root Admin Seed Error:', error);
    }
}

// Database Connection & Server Initialization
const PORT = process.env.PORT || 3000;
let MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collaborative_workspace_db';

// Guard against missing database name in URI (e.g. 'mongodb://localhost:27017/' or 'mongodb://localhost:27017')
// which causes Mongoose to silently default to the 'test' database.
const uriWithoutQuery = MONGO_URI.split('?')[0];
const pathSegments = uriWithoutQuery.split('://')[1]?.split('/') || [];
if (pathSegments.length < 2 || !pathSegments[1].trim()) {
    const defaultDb = 'collaborative_workspace_db';
    MONGO_URI = MONGO_URI.replace(/\/$/, '') + '/' + defaultDb;
    console.warn(`[WARN] MONGO_URI lacked a database name. Automatically appending: ${MONGO_URI}`);
}

mongoose
    .connect(MONGO_URI)
    .then(async () => {
        console.log(`Connected to MongoDB database: "${mongoose.connection.name}" at ${MONGO_URI}`);
        await seedInitialAdmin();
        app.listen(PORT, () => {
            console.log(`Nexus Enterprise Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });