const bcrypt = require('bcryptjs');

// Function to register a new user
exports.registerUser = (db, username, password, avatar) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return reject(err);
            db.run("INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)", [username, hash, avatar], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    });
};

// Function to authenticate a user
exports.authenticateUser = (db, username, password) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);

            bcrypt.compare(password, row.password, (err, res) => {
                if (err) return reject(err);
                resolve(res ? row : null);
            });
        });
    });
};