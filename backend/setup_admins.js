const db = require('./db');
const bcrypt = require('bcryptjs');

const sql = `
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'مسؤول عام',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

(async () => {
    try {
        await db.query(sql);
        
        // Hash the initial password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const sql2 = `INSERT IGNORE INTO admins (username, password, role) VALUES (?, ?, ?);`;
        
        await db.query(sql2, ['admin', hashedPassword, 'مسؤول عام']);
        
        console.log('Admins table setup complete with hashed password!');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
})();
