var mongoose = require('mongoose');

function connectDB() {
    mongoose.connect(process.env.MONGO_URI)
        .then(function () {
            console.log('MongoDB Connected Successfully to Compass');
        })
        .catch(function (err) {
            console.log('MongoDB Connection Failed: ' + err);
        });
}

module.exports = connectDB;