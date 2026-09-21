var express = require('express');
var dotenv = require('dotenv');
var connectDB = require('./config/db');
var authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

var app = express();

// Enable CORS for frontend requests (e.g. from Live Server or separate port)
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// MUST BE BEFORE THE ROUTES:
app.use(express.json());

// Serve static files from public folder (signin.html, css, js, etc.)
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.send('Server is working');
});
// Auth routes:
app.use('/api/auth', authRoutes);

var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log('Server running on port ' + PORT);
});