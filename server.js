require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const db = require('./db');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = 'public/uploads/';
        if (req.originalUrl.includes('/cars')) dest += 'cars/';
        else if (req.originalUrl.includes('/blogs')) dest += 'blogs/';
        else if (req.originalUrl.includes('/bookings')) dest += 'licenses/';
        
        // ensure dir exists
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// =======================
// CARS API
// =======================

// Get all cars
app.get('/api/cars', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cars ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single car
app.get('/api/cars/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cars WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Car not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new car
app.post('/api/cars', upload.single('image'), async (req, res) => {
    try {
        const { brand, model, category, price, power, seats, transmission, fuel, status } = req.body;
        const image = req.file ? `/uploads/cars/${req.file.filename}` : null;
        
        const [result] = await db.query(
            'INSERT INTO cars (brand, model, category, price, power, seats, transmission, fuel, image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [brand, model, category, price, power, seats, transmission, fuel, image, status || 'Available']
        );
        res.status(201).json({ id: result.insertId, message: 'Car added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a car
app.put('/api/cars/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const { brand, model, category, price, power, seats, transmission, fuel, status } = req.body;
        
        // Basic update query elements
        let query = 'UPDATE cars SET brand=?, model=?, category=?, price=?, power=?, seats=?, transmission=?, fuel=?, status=?';
        let params = [brand, model, category, price, power, seats, transmission, fuel, status];

        if (req.file) {
            query += ', image=?';
            params.push(`/uploads/cars/${req.file.filename}`);
        }
        
        query += ' WHERE id=?';
        params.push(id);
        
        await db.query(query, params);
        res.json({ message: 'Car updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a car
app.delete('/api/cars/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM cars WHERE id = ?', [req.params.id]);
        res.json({ message: 'Car deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// BLOGS API
// =======================

// Get all blogs
app.get('/api/blogs', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM blogs ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new blog
app.post('/api/blogs', upload.single('image'), async (req, res) => {
    try {
        const { title, content, author } = req.body;
        const image = req.file ? `/uploads/blogs/${req.file.filename}` : null;
        
        const [result] = await db.query(
            'INSERT INTO blogs (title, content, image, author) VALUES (?, ?, ?, ?)',
            [title, content, image, author || 'Admin']
        );
        res.status(201).json({ id: result.insertId, message: 'Blog added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a blog
app.put('/api/blogs/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const { title, content, author } = req.body;
        
        let query = 'UPDATE blogs SET title=?, content=?, author=?';
        let params = [title, content, author];

        if (req.file) {
            query += ', image=?';
            params.push(`/uploads/blogs/${req.file.filename}`);
        }
        
        query += ' WHERE id=?';
        params.push(id);
        
        await db.query(query, params);
        res.json({ message: 'Blog updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a blog
app.delete('/api/blogs/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM blogs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// BOOKINGS API
// =======================

app.get('/api/bookings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT bookings.*, cars.brand, cars.model, cars.image as car_image FROM bookings LEFT JOIN cars ON bookings.car_id = cars.id ORDER BY bookings.created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bookings', upload.single('license_image'), async (req, res) => {
    try {
        const { customer_name, customer_email, customer_phone, license_number, car_id, start_date, end_date, pickup_time, location, total_amount } = req.body;
        const license_image = req.file ? `/uploads/licenses/${req.file.filename}` : null;
        const booking_ref = '#AL-' + Math.floor(1000 + Math.random() * 9000); // Generate Ref
        
        const [result] = await db.query(
            'INSERT INTO bookings (booking_ref, customer_name, customer_email, customer_phone, license_number, license_image, car_id, start_date, end_date, pickup_time, location, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [booking_ref, customer_name, customer_email, customer_phone, license_number, license_image, car_id, start_date, end_date, pickup_time, location, total_amount, 'Pending']
        );
        res.status(201).json({ id: result.insertId, ref: booking_ref, message: 'Booking completed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Booking status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// ADMINS API
// =======================

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            res.json({ success: true, user: { id: rows[0].id, username: rows[0].username, role: rows[0].role } });
        } else {
            res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admins', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, role, created_at FROM admins ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admins', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const [result] = await db.query('INSERT INTO admins (username, password, role) VALUES (?, ?, ?)', [username, password, role || 'مدير عام']);
        res.status(201).json({ id: result.insertId, message: 'Admin added successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
             res.status(400).json({ error: 'اسم المستخدم مسجل بالفعل' });
        } else {
             res.status(500).json({ error: err.message });
        }
    }
});

app.delete('/api/admins/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM admins WHERE id = ?', [req.params.id]);
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
