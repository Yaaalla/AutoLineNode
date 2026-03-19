const db = require('./db');
const sql = `
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'مسؤول عام',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
const sql2 = `INSERT IGNORE INTO admins (username, password, role) VALUES ('admin', 'admin123', 'مسؤول عام');`;

(async () => {
    try {
        await db.query(sql);
        await db.query(sql2);
        console.log('Admins table setup complete!');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
})();
