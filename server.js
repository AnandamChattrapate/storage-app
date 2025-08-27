// server.js - Backend ready for deployment with MySQL
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or 3000

// Middleware
app.use(cors()); // Allow all origins for public access
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Database setup (MySQL via Railway)
let db;
async function connectDB() {
    try {
        db = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('✅ Connected to MySQL database');

        // Ensure table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS names (
                id INT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
}
connectDB();

// Serve the frontend at root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.post('/api/store', async (req, res) => {
    const { id, name } = req.body;

    if (!id || !name) {
        return res.status(400).json({ error: 'ID and name are required' });
    }

    if (name.length > 100) {
        return res.status(400).json({ error: 'Name too long (max 100 characters)' });
    }

    try {
        await db.query(
            'INSERT INTO names (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
            [id, name.trim()]
        );
        res.json({
            success: true,
            message: 'Name stored successfully',
            id: id,
            name: name.trim()
        });
        console.log(`Stored: ID=${id}, Name=${name.trim()}`);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to store data' });
    }
});

app.get('/api/get/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const [rows] = await db.query(
            'SELECT name, created_at FROM names WHERE id = ?',
            [id]
        );

        if (rows.length > 0) {
            res.json({
                success: true,
                id: id,
                name: rows[0].name,
                created_at: rows[0].created_at
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No name found for this ID'
            });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

app.get('/api/all', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM names ORDER BY id');
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access your app at: http://localhost:${PORT}`);
    console.log('📡 API endpoints available');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    if (db) {
        await db.end();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});
