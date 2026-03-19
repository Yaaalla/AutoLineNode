require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const db = require('./db');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const sharp = require('sharp');

// Rate Limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for login
    message: { error: 'تم تجاوز عدد محاولات الدخول. يرجى المحاولة بعد 15 دقيقة.' }
});

const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 bookings per hour
    message: { error: 'تم تجاوز الحد الأقصى للحجوزات المسموح بها حالياً. يرجى المحاولة لاحقاً.' }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // e.g. 'your-email@gmail.com'
        pass: process.env.EMAIL_PASS  // e.g. 'app-password'
    }
});

const sendBookingEmail = async (bookingDetails) => {
    const mailOptions = {
        from: `"أوتو لاين" <${process.env.EMAIL_USER}>`,
        to: 'ah3268690@gmail.com',
        subject: `تحديث حالة الحجز: ${bookingDetails.booking_ref}`,
        text: `
            مرحباً،
            
            تم تحديث حالة الحجز الخاص بك:
            رقم الحجز: ${bookingDetails.booking_ref}
            الحالة الجديدة: ${bookingDetails.status}
            العميل: ${bookingDetails.customer_name}
            السيارة: ${bookingDetails.brand} ${bookingDetails.model}
            التكلفة: ${bookingDetails.total_amount} ج.م
            
            شكراً لاختيارك أوتو لاين.
        `,
        html: `
            <div style="direction: rtl; font-family: Cairo, Arial, sans-serif; padding: 20px; background-color: #12110f; color: #fff; border-radius: 10px;">
                <h2 style="color: #c9a96e;">تحديث حالة الحجز</h2>
                <p>مرحباً،</p>
                <p>تم تحديث حالة الحجز رقم <strong>${bookingDetails.booking_ref}</strong> إلى <strong>${bookingDetails.status}</strong>.</p>
                <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
                <p><strong>تفاصيل الحجز:</strong></p>
                <ul>
                    <li>العميل: ${bookingDetails.customer_name}</li>
                    <li>السيارة: ${bookingDetails.brand} ${bookingDetails.model}</li>
                    <li>التكلفة: ${bookingDetails.total_amount} ج.م</li>
                </ul>
                <p>شكراً لاختيارك أوتو لاين.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent for booking ${bookingDetails.booking_ref}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root folder (parent of 'backend')
app.use(express.static(path.join(__dirname, '..')));

// Explicitly serve index.html from the root for / and /index.html
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let rootUploads = path.join(__dirname, '..', 'uploads');
        let dest = rootUploads + '/';
        
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
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم. يرجى رفع صور فقط (JPG, PNG, WebP)'));
        }
    }
});

// Image Compression Middleware
const processImages = async (req, res, next) => {
    if (!req.files && !req.file) return next();
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    try {
        for (const file of files) {
            const outputPath = file.path + '.webp';
            await sharp(file.path)
                .resize(1200, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(outputPath);
            
            // Delete original and point to webp
            fs.unlinkSync(file.path);
            file.path = outputPath;
            file.filename = path.basename(outputPath);
            file.mimetype = 'image/webp';
        }
        next();
    } catch (err) {
        console.error('Image processing error:', err);
        next(); // continue anyway but log error
    }
};

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
        
        const [images] = await db.query('SELECT * FROM car_images WHERE car_id = ?', [req.params.id]);
        const [bookings] = await db.query('SELECT end_date FROM bookings WHERE car_id = ? AND status = "Ongoing" ORDER BY end_date DESC LIMIT 1', [req.params.id]);
        
        const car = rows[0];
        car.images = images.map(img => img.image_path);
        car.reserved_until = bookings.length > 0 ? bookings[0].end_date : null;
        
        res.json(car);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new car
app.post('/api/cars', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'additional_images', maxCount: 10 }]), processImages, async (req, res) => {
    try {
        const { brand, model, category, price, power, seats, transmission, fuel, status, color, mileage, year, tire_condition, car_condition } = req.body;
        const image = req.files['image'] ? `/uploads/cars/${req.files['image'][0].filename}` : null;
        
        const [result] = await db.query(
            'INSERT INTO cars (brand, model, category, price, power, seats, transmission, fuel, image, status, color, mileage, year, tire_condition, car_condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [brand, model, category || 'Luxury', price, power || '', seats, transmission, fuel, image, status || 'Available', color, mileage, year, tire_condition || '', car_condition || 100]
        );

        // Handle additional images
        if (req.files['additional_images']) {
            const carId = result.insertId;
            const insertImagePromises = req.files['additional_images'].map(file => {
                return db.query('INSERT INTO car_images (car_id, image_path) VALUES (?, ?)', [carId, `/uploads/cars/${file.filename}`]);
            });
            await Promise.all(insertImagePromises);
        }

        res.status(201).json({ id: result.insertId, message: 'Car added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a car
app.put('/api/cars/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'additional_images', maxCount: 10 }]), processImages, async (req, res) => {
    try {
        const id = req.params.id;
        const { brand, model, category, price, power, seats, transmission, fuel, status, color, mileage, year, tire_condition, car_condition } = req.body;
        
        // Basic update query elements
        let query = 'UPDATE cars SET brand=?, model=?, category=?, price=?, power=?, seats=?, transmission=?, fuel=?, status=?, color=?, mileage=?, year=?, tire_condition=?, car_condition=?';
        let params = [brand, model, category || 'Luxury', price, power || '', seats, transmission, fuel, status || 'Available', color, mileage, year, tire_condition || '', car_condition || 100];

        if (req.files['image']) {
            query += ', image=?';
            params.push(`/uploads/cars/${req.files['image'][0].filename}`);
        }
        
        query += ' WHERE id=?';
        params.push(id);
        
        await db.query(query, params);

        // Handle additional images (optional: simple append for now)
        if (req.files['additional_images']) {
            const insertImagePromises = req.files['additional_images'].map(file => {
                return db.query('INSERT INTO car_images (car_id, image_path) VALUES (?, ?)', [id, `/uploads/cars/${file.filename}`]);
            });
            await Promise.all(insertImagePromises);
        }

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
app.post('/api/blogs', upload.single('image'), processImages, async (req, res) => {
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
app.put('/api/blogs/:id', upload.single('image'), processImages, async (req, res) => {
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
// PROMO CODES API
// =======================

// Get all promo codes
app.get('/api/promo-codes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new promo code
app.post('/api/promo-codes', async (req, res) => {
    try {
        const { code, discount_type, discount_value, expiry_date, usage_limit } = req.body;
        await db.query(
            'INSERT INTO promo_codes (code, discount_type, discount_value, expiry_date, usage_limit) VALUES (?, ?, ?, ?, ?)',
            [code, discount_type, discount_value, expiry_date, usage_limit || 100]
        );
        res.status(201).json({ message: 'Promo code added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validate promo code
app.post('/api/promo-codes/validate', async (req, res) => {
    try {
        const { code } = req.body;
        const [rows] = await db.query(
            'SELECT * FROM promo_codes WHERE code = ? AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date >= CURDATE()) AND used_count < usage_limit',
            [code]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'كود خصم غير صالح أو منتهي الصلاحية' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete promo code
app.delete('/api/promo-codes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM promo_codes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Promo code deleted successfully' });
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

app.post('/api/bookings', bookingLimiter, upload.single('license_image'), async (req, res) => {
    try {
        let { customer_name, customer_email, customer_phone, license_number, car_id, start_date, end_date, pickup_time, location, total_amount } = req.body;
        
        // Defaults for missing optional fields
        location = location || 'فرع القاهرة';
        pickup_time = pickup_time || '10:00';
        license_number = license_number || 'ST-102030';
        
        // Strict Availability Check
        const [conflicts] = await db.query(
            'SELECT * FROM bookings WHERE car_id = ? AND status NOT IN ("Cancelled", "Completed") AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (? <= start_date AND ? >= end_date))',
            [car_id, start_date, start_date, end_date, end_date, start_date, end_date]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ error: 'السيارة غير متاحة في التواريخ المختارة' });
        }

        const license_image = req.file ? `/uploads/licenses/${req.file.filename}` : null;
        const booking_ref = '#AL-' + Math.floor(1000 + Math.random() * 9000); // Generate Ref
        
        const [result] = await db.query(
            'INSERT INTO bookings (booking_ref, customer_name, customer_email, customer_phone, license_number, license_image, car_id, start_date, end_date, pickup_time, location, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [booking_ref, customer_name, customer_email, customer_phone, license_number, license_image, car_id, start_date, end_date, pickup_time, location, total_amount, 'Pending']
        );

        // Notify Admin of new booking
        const [carDetails] = await db.query('SELECT brand, model FROM cars WHERE id = ?', [car_id]);
        sendBookingEmail({
            booking_ref,
            customer_name,
            customer_email,
            status: 'Pending (New Booking)',
            brand: carDetails[0].brand,
            model: carDetails[0].model,
            total_amount
        });

        res.status(201).json({ id: result.insertId, ref: booking_ref, message: 'Booking completed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/cars/:id/availability', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT start_date, end_date FROM bookings WHERE car_id = ? AND status != "Cancelled"',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/bookings/:id', async (req, res) => {
    try {
        const { customer_name, customer_phone, status, total_amount } = req.body;
        const id = req.params.id;
        
        await db.query(
            'UPDATE bookings SET customer_name = ?, customer_phone = ?, status = ?, total_amount = ? WHERE id = ?',
            [customer_name, customer_phone, status, total_amount, id]
        );
        
        res.json({ message: 'Booking updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/bookings/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const id = req.params.id;
        
        await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        
        // Fetch booking and car details for the email
        const [rows] = await db.query(
            'SELECT bookings.*, cars.brand, cars.model FROM bookings LEFT JOIN cars ON bookings.car_id = cars.id WHERE bookings.id = ?', 
            [id]
        );
        
        if (rows.length > 0) {
            sendBookingEmail(rows[0]);
        }
        
        res.json({ message: 'Booking status updated and notification sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =======================
// ADMINS API
// =======================

app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
        
        if (rows.length > 0) {
            const isMatch = await bcrypt.compare(password, rows[0].password);
            if (isMatch) {
                res.json({ success: true, user: { id: rows[0].id, username: rows[0].username, role: rows[0].role } });
            } else {
                res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
            }
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO admins (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role || 'مدير عام']);
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

// Periodic status update: Sync bookings and car availability
setInterval(async () => {
    try {
        const now = new Date().toISOString().split('T')[0];
        
        // 1. Mark 'Pending' bookings as 'Cancelled' if start_date has passed
        await db.query(`
            UPDATE bookings 
            SET status = 'Cancelled' 
            WHERE status = 'Pending' AND start_date < ?
        `, [now]);

        // 2. Mark 'Ongoing' bookings as 'Completed' if end_date has passed
        await db.query(`
            UPDATE bookings 
            SET status = 'Completed' 
            WHERE status = 'Ongoing' AND end_date < ?
        `, [now]);

        // 3. Update Car Status based on current active bookings
        // A car is 'Reserved' if it has an 'Ongoing' booking today
        await db.query(`
            UPDATE cars 
            SET status = 'Reserved' 
            WHERE id IN (
                SELECT car_id FROM bookings 
                WHERE status = 'Ongoing' AND start_date <= ? AND end_date >= ?
            )
        `, [now, now]);

        // A car is 'Available' if it has NO 'Ongoing' booking today
        await db.query(`
            UPDATE cars 
            SET status = 'Available' 
            WHERE id NOT IN (
                SELECT car_id FROM bookings 
                WHERE status = 'Ongoing' AND start_date <= ? AND end_date >= ?
            )
        `, [now, now]);

        console.log('Automated status sync completed at', new Date().toLocaleString());
    } catch (err) {
        console.error('Periodic update error:', err);
    }
}, 1000 * 60 * 60); // Run every hour

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
