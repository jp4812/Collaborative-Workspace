var jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    var authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    var token = authHeader.split(' ')[1];

    try {
        var decoded = jwt.verify(token, process.env.JWT_SECRET || 'workspace_jwt_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

function authorizeRoles(allowedRoles) {
    return function (req, res, next) {
        if (!req.user || allowedRoles.indexOf(req.user.role) === -1) {
            return res.status(403).json({ message: 'Access forbidden: Insufficient permissions.' });
        }
        next();
    };
}

module.exports = {
    authenticate: authenticate,
    authorizeRoles: authorizeRoles
};