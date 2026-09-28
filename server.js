const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config();

const app = express();

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
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Enterprise Root Admin Seeding Function
async function seedInitialAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'Admin' });
        if (!adminExists) {
            const email = process.env.ROOT_ADMIN_EMAIL || 'admin@nexus.internal';
            const password = process.env.ROOT_ADMIN_PASSWORD || 'AdminRoot123!';

            await User.create({
                name: 'Nexus Root Admin',
                email,
                password,
                role: 'Admin'
            });

            console.log('\n=============================================');
            console.log('--- ENTERPRISE ROOT ADMIN SEEDED ---');
            console.log(`Email:    ${email}`);
            console.log(`Password: ${password}`);
            console.log('=============================================\n');
        }
    } catch (error) {
        console.error('Root Admin Seed Error:', error);
    }
}

// Database Connection & Server Initialization
const PORT = process.env.PORT || 5000;
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