const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const multer = require('multer');

// Set up storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/avatars/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Set up SQLite database
let db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, avatar TEXT)");
});

// User registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).send(err);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], function(err) {
            if (err) return res.status(500).send(err);
            res.send({ message: 'User registered successfully', userId: this.lastID });
        });
    });
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) return res.status(500).send(err);
        if (!row) return res.status(401).send('Authentication failed');
        bcrypt.compare(password, row.password, (err, result) => {
            if (err) return res.status(500).send(err);
            if (!result) return res.status(401).send('Authentication failed');
            res.send({ message: 'Login successful', userId: row.id });
        });
    });
});

// Avatar upload
app.post('/upload-avatar/:userId', upload.single('avatar'), (req, res) => {
    const userId = req.params.userId;
    const avatarPath = req.file.path;

    db.run("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, userId], function(err) {
        if (err) return res.status(500).send(err);
        res.send({ message: 'Avatar uploaded successfully', avatarPath: avatarPath });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});