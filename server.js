const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize the app
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// Database setup
let db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, avatar TEXT)");
});

const auth = require('./auth');

// Registration route
app.post('/register', (req, res) => {
    const { username, password, avatar } = req.body;
    auth.registerUser(db, username, password, avatar)
        .then(userId => {
            req.session.userId = userId;
            res.redirect('/');
        })
        .catch(err => {
            console.error('Error registering user:', err);
            res.status(500).send('Internal Server Error');
        });
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    auth.authenticateUser(db, username, password)
        .then(user => {
            if (!user) return res.status(401).send('Invalid credentials');
            req.session.userId = user.id;
            res.redirect('/');
        })
        .catch(err => {
            console.error('Error authenticating user:', err);
            res.status(500).send('Internal Server Error');
        });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Could not log out');
        res.redirect('/');
    });
});

// Avatar upload route
app.post('/upload-avatar/:userId', (req, res) => {
    if (!req.files || !req.files.avatar) return res.status(400).send('No file uploaded.');

    const avatar = req.files.avatar;
    const userId = req.params.userId;

    // Save the file to a directory
    const filePath = path.join(__dirname, 'uploads', avatar.name);
    avatar.mv(filePath, err => {
        if (err) return res.status(500).send(err);

        // Update the user's avatar in the database
        db.run("UPDATE users SET avatar = ? WHERE id = ?", [filePath, userId], function(err) {
            if (err) return res.status(500).send(err);
            res.send('Avatar uploaded successfully.');
        });
    });
});

// Start the server on port 8200
const PORT = process.env.PORT || 8200;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});