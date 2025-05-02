const bcrypt = require('bcrypt');
const saltRounds = 10; // Степень сложности хеширования

const hashPassword = async (plainPassword) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(plainPassword, salt);
        return hash;
    } catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Password hashing failed"); // Пробрасываем ошибку выше
    }
};

const comparePassword = async (plainPassword, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error("Error comparing password:", error);
        return false; // В случае ошибки сравнения считаем, что пароли не совпадают
    }
};

module.exports = {
    hashPassword,
    comparePassword,
};