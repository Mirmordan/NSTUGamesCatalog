const isAdmin = (req, res, next) => {
    // Этот middleware должен вызываться ПОСЛЕ authenticateToken
    if (!req.user || req.user.role !== 'admin') {
        console.log(`Authorization failed: User ${req.user?.id} is not an admin. Role: ${req.user?.role}`);
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' }); // Forbidden
    }
    console.log(`Admin access granted for user: ${req.user.id}`);
    next(); // Пользователь - админ, разрешаем доступ
};

module.exports = isAdmin;