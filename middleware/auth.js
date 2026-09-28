const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexus_super_secret_key');
        const userId = decoded.id || decoded._id || decoded.userId;
        req.user = {
            ...decoded,
            id: userId,
            _id: userId
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

function authorizeRoles(...allowedRoles) {
    const roles = allowedRoles.flat();
    return function (req, res, next) {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access forbidden: Insufficient permissions.' });
        }
        next();
    };
}

module.exports = {
    authenticate,
    authorizeRoles
};