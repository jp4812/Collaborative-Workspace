var express = require('express');
var dotenv = require('dotenv');
var connectDB = require('./config/db');

// Route imports
var authRoutes = require('./routes/authRoutes');
var workspaceRoutes = require('./routes/workspaceRoutes');

// Environment & Database
dotenv.config();
connectDB();

var app = express();

// CORS Middleware
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// JSON Body Parser Middleware
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Base health route
app.get('/', function (req, res) {
    res.send('Server is working');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Start Server
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log('Server running on port ' + PORT);
});