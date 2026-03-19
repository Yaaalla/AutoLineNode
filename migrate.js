const db = require('./backend/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Create car_images table
        await db.query(`
            CREATE TABLE IF NOT EXISTS car_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                car_id INT,
                image_path VARCHAR(255),
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
            )
        `);
        console.log('Table car_images created or already exists.');

        // Check if additional specs columns exist in cars table
        const [columns] = await db.query('SHOW COLUMNS FROM cars');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('color')) {
            await db.query('ALTER TABLE cars ADD COLUMN color VARCHAR(50)');
            console.log('Column color added to cars.');
        }
        if (!columnNames.includes('mileage')) {
            await db.query('ALTER TABLE cars ADD COLUMN mileage VARCHAR(50)');
            console.log('Column mileage added to cars.');
        }
        if (!columnNames.includes('year')) {
            await db.query('ALTER TABLE cars ADD COLUMN year INT');
            console.log('Column year added to cars.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
