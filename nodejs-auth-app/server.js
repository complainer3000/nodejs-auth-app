const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({ dest: 'uploads/' }).single('avatar'));

// Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');

    try {
        await db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, bcrypt.hashSync(password, 10)]);
        res.send('User registered successfully');
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) return res.status(409).send('Username already exists');
        res.status(500).send(err.message);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');

    try {
        const user = await db.get(`SELECT * FROM users WHERE username = ?`, [username]);
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            res.send({ message: 'Login successful', userId: user.id });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/upload-avatar', async (req, res) => {
    if (!req.file || !req.session.userId) return res.status(400).send('No file uploaded or user not logged in');

    try {
        await db.run(`UPDATE users SET avatar = ? WHERE id = ?`, [req.file.filename, req.session.userId]);
        res.send('Avatar uploaded successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});