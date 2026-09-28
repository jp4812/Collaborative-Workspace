const mongoose = require('mongoose');

function connectDB() {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collaborative_workspace_db';
    const uriWithoutQuery = mongoUri.split('?')[0];
    const pathSegments = uriWithoutQuery.split('://')[1]?.split('/') || [];
    if (pathSegments.length < 2 || !pathSegments[1].trim()) {
        mongoUri = mongoUri.replace(/\/$/, '') + '/collaborative_workspace_db';
    }

    mongoose.connect(mongoUri)
        .then(function () {
            console.log(`MongoDB Connected Successfully to "${mongoose.connection.name}" at ${mongoUri}`);
        })
        .catch(function (err) {
            console.log('MongoDB Connection Failed: ' + err);
        });
}

module.exports = connectDB;