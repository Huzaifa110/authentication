const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 8000;

const jwt = require('jsonwebtoken');

const jwtSecret = "MyNameIsHuzaifa";


app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", 
    database: "auth"
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const checkUserQuery = "SELECT * FROM user WHERE email = ?";
    db.query(checkUserQuery, [email], (checkErr, existingUser) => {
        if (checkErr) {
            console.error('Error checking user:', checkErr);
            return res.status(500).json({ error: "Internal server error." });
        }

        if (existingUser.length > 0) {
            return res.status(409).json({ error: "User already exists." });
        }

        const insertUserQuery = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
        db.query(insertUserQuery, [name, email, password], (insertErr, result) => {
            if (insertErr) {
                console.error('Error inserting user:', insertErr);
                return res.status(500).json({ error: "Internal server error." });
            }

            console.log('New user registered:', result.insertId);
            return res.status(201).json({ message: "User registered successfully." });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const getUserQuery = "SELECT * FROM user WHERE email = ?";
    db.query(getUserQuery, [email], (err, user) => {
        if (err) {
            console.error('Error finding user:', err);
            return res.status(500).json({ error: "Internal server error." });
        }

        if (user.length === 0) {
            return res.status(401).json({ error: "User not found." });
        }

        if (user[0].password !== password) {
            return res.status(401).json({ error: "Incorrect password." });
        }

        const token = jwt.sign({ userId: user[0].id }, jwtSecret, { expiresIn: '1h' });

        console.log('User logged in:', user[0].id);
        return res.status(200).json({ message: "Login successful.", token });
    });
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
