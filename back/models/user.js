// models/user.js
const db = require('../db/connection');
// const bcrypt = require('bcryptjs'); // Removed: Using hash.util.js now
const { hashPassword, comparePassword: utilComparePassword } = require('../utils/hash.util'); // Assuming hash.util.js is in a utils directory relative to models

// const SALT_ROUNDS = 10; // Removed: Cost factor managed by hash.util.js

const User = {
    /**
     * Creates a new user with a hashed password.
     * @param {string} login - The user's login name (must be unique).
     * @param {string} password - The user's plain text password.
     * @param {string} [role='user'] - The user's role ('user' or 'admin').
     * @param {string} [status='active'] - The user's status ('active' or 'blocked').
     * @returns {Promise<object>} A promise that resolves with the created user object (excluding password).
     */
    create: (login, password, role = 'user', status = 'active') => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!login || !password) {
                    return reject(new Error('Login and password are required.')); // Added return for early exit
                }
                // Hash the password using the utility function
                const hashedPassword = await hashPassword(password);

                const sql = `INSERT INTO users (login, password, role, status) VALUES (?, ?, ?, ?)`;
                // Note: CHECK constraints for role and status are handled by the DB schema

                db.run(sql, [login, hashedPassword, role, status], function (err) {
                    if (err) {
                        console.error('Error creating user:', err.message);
                        if (err.message.includes('UNIQUE constraint failed: users.login')) {
                            reject(new Error('Login already exists.'));
                        } else if (err.message.includes('CHECK constraint failed')) {
                             reject(new Error('Invalid role or status value.'));
                        }
                         else {
                            reject(err);
                        }
                    } else {
                        // Return user data without the password hash
                        resolve({ id: this.lastID, login, role, status });
                    }
                });
            } catch (hashError) {
                 // Error from hashPassword utility or other async operations before db.run
                 console.error('Error during user creation process (incl. hashing):', hashError.message);
                 reject(new Error('Failed to create user.')); // More generic error message
            }
        });
    },

    /**
     * Finds a user by their ID.
     * @param {number} id - The user's ID.
     * @returns {Promise<object|null>} A promise that resolves with the user object (excluding password) or null if not found.
     */
    findById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, login, role, status FROM users WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error finding user by ID:', err.message);
                    reject(err);
                } else {
                    resolve(row || null); // Return null if not found
                }
            });
        });
    },

    /**
     * Finds user profile information (login and status) by ID.
     * @param {number} id - The user's ID.
     * @returns {Promise<object|null>} A promise that resolves with the user's login and status, or null if not found.
     */
    findProfileById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT login, status FROM users WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error finding user profile by ID:', err.message);
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    },

    /**
     * Finds a user by their login name. Includes the password hash for authentication checks.
     * Use with caution and typically only during login validation.
     * @param {string} login - The user's login name.
     * @returns {Promise<object|null>} A promise that resolves with the user object (including password hash) or null if not found.
     */
    findByLogin: (login) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE login = ?`; // Select all fields including password
            db.get(sql, [login], (err, row) => {
                if (err) {
                    console.error('Error finding user by login:', err.message);
                    reject(err);
                } else {
                    resolve(row || null); // Return null if not found
                }
            });
        });
    },

    /**
     * Retrieves all users.
     * @returns {Promise<Array<object>>} A promise that resolves with an array of user objects (excluding passwords).
     */
    findAll: () => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, login, role, status FROM users ORDER BY login`;
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching all users:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    /**
     * Updates a user's details. Can update login, password, role, and status.
     * @param {number} id - The ID of the user to update.
     * @param {object} updates - An object containing the fields to update (e.g., { login, password, role, status }).
     * @returns {Promise<number>} A promise that resolves with the number of rows affected.
     */
    update: (id, updates) => {
        return new Promise(async (resolve, reject) => {
            const allowedFields = ['login', 'password', 'role', 'status'];
            const fieldsToUpdate = [];
            const values = [];
            let hashedPassword; // Declare here to handle potential async error

            try {
                // Process password separately if present using the utility function
                if (updates.password) {
                    if (updates.password.trim() === '') {
                        return reject(new Error('Password cannot be empty.')); // Added return
                    }
                    hashedPassword = await hashPassword(updates.password);
                    fieldsToUpdate.push('password = ?');
                    values.push(hashedPassword);
                }

                // Process other allowed fields
                for (const field of allowedFields) {
                    // Ensure we don't process password again and only include defined fields
                    if (field !== 'password' && updates.hasOwnProperty(field)) { // Use hasOwnProperty for safety
                        fieldsToUpdate.push(`${field} = ?`);
                        values.push(updates[field]);
                    }
                }

                if (fieldsToUpdate.length === 0) {
                    return resolve(0); // No changes to apply
                }

                values.push(id); // Add the ID for the WHERE clause

                const sql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

                db.run(sql, values, function (err) {
                    if (err) {
                        console.error('Error updating user:', err.message);
                        if (err.message.includes('UNIQUE constraint failed: users.login')) {
                            reject(new Error('Login already exists.'));
                        } else if (err.message.includes('CHECK constraint failed')) {
                            reject(new Error('Invalid role or status value.'));
                        }
                        else {
                            reject(err);
                        }
                    } else {
                        resolve(this.changes);
                    }
                });
            } catch (hashError) {
                // Error from hashPassword utility or other async operations before db.run
                console.error('Error during user update process (incl. hashing):', hashError.message);
                reject(new Error('Failed to update user.')); // More generic error message
            }
        });
    },

    /**
     * Deletes a user by their ID. Associated reviews will be deleted due to ON DELETE CASCADE.
     * @param {number} id - The ID of the user to delete.
     * @returns {Promise<number>} A promise that resolves with the number of rows affected.
     */
    remove: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM users WHERE id = ?`;
            db.run(sql, [id], function (err) {
                if (err) {
                    console.error('Error deleting user:', err.message);
                    reject(err);
                } else {
                    // Associated reviews are handled by ON DELETE CASCADE in the DB schema
                    resolve(this.changes);
                }
            });
        });
    },

    /**
     * Compares a plain text password with a stored hash using the utility function.
     * @param {string} plainPassword - The password provided by the user.
     * @param {string} hashedPassword - The hash stored in the database.
     * @returns {Promise<boolean>} A promise that resolves with true if the passwords match, false otherwise.
     */
    comparePassword: (plainPassword, hashedPassword) => {
        // Use the imported utility function directly
        return utilComparePassword(plainPassword, hashedPassword);
    }
};

module.exports = User;