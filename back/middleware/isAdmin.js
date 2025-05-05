// middleware/isAdmin.js
// Этот middleware должен вызываться ПОСЛЕ authenticateToken
const isAdmin = (req, res, next) => {
    
    if (!req.user || req.user.role !== 'admin') {
        console.log(`Ошибка авторизации : ${req.user?.id} не админ, роль ${req.user?.role}`);
        return res.status(403).json({ message: 'Доступ запрещён, необходимы права администратора' }); // Forbidden
    }
    console.log(`Администратор авторизован: ${req.user.id}`);
    next(); 
};
// Экспорт
module.exports = isAdmin;