// server.js - Backend ready for deployment
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or 3000

// Middleware
app.use(cors()); // Allow all origins for public access
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Database setup - use persistent file for production
const dbPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, 'data', 'names.db')
    : 'names.db';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database error:', err);
    } else {
        console.log('Connected to SQLite database');
        db.run(`CREATE TABLE IF NOT EXISTS names (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Serve the frontend at root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.post('/api/store', (req, res) => {
    const { id, name } = req.body;
    
    if (!id || !name) {
        return res.status(400).json({ error: 'ID and name are required' });
    }
    
    if (name.length > 100) {
        return res.status(400).json({ error: 'Name too long (max 100 characters)' });
    }
    
    db.run(
        'INSERT OR REPLACE INTO names (id, name) VALUES (?, ?)',
        [id, name.trim()],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to store data' });
            } else {
                res.json({ 
                    success: true,
                    message: 'Name stored successfully', 
                    id: id, 
                    name: name.trim()
                });
                console.log(`Stored: ID=${id}, Name=${name.trim()}`);
            }
        }
    );
});

app.get('/api/get/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    db.get(
        'SELECT name, created_at FROM names WHERE id = ?',
        [id],
        (err, row) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to retrieve data' });
            } else if (row) {
                res.json({ 
                    success: true,
                    id: id, 
                    name: row.name,
                    created_at: row.created_at
                });
            } else {
                res.status(404).json({ 
                    success: false,
                    error: 'No name found for this ID' 
                });
            }
        }
    );
});

app.get('/api/all', (req, res) => {
    db.all(
        'SELECT * FROM names ORDER BY id', 
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Failed to retrieve data' });
            } else {
                res.json({ 
                    success: true,
                    count: rows.length,
                    data: rows 
                });
            }
        }
    );
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
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('✅ Database connection closed');
        process.exit(0);
    });
});