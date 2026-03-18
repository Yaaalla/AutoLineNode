CREATE DATABASE IF NOT EXISTS autoline_db;
USE autoline_db;

CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Luxury Collection',
    price DECIMAL(10, 2) NOT NULL,
    power VARCHAR(50),
    seats INT DEFAULT 4,
    transmission VARCHAR(50) DEFAULT 'Automatic',
    fuel VARCHAR(50) DEFAULT 'Gasoline',
    image VARCHAR(255),
    status ENUM('Available', 'Booked', 'Service') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image VARCHAR(255),
    author VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'مدير عام',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(50) UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(50),
    license_number VARCHAR(100),
    license_image VARCHAR(255),
    car_id INT,
    start_date DATE,
    end_date DATE,
    pickup_time VARCHAR(20),
    location VARCHAR(255),
    total_amount DECIMAL(10, 2),
    status ENUM('Pending', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL
);

-- Insert dummy data for manual verification
INSERT INTO cars (brand, model, price, power, seats, transmission, fuel, image, status) VALUES 
('Rolls-Royce', 'Phantom VIII', 1200.00, '6.7L V12', 4, 'Automatic', 'Gasoline', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_e5OwHlZLhveh9r00JnVnFw3kvM2-GSpy2RARRs9PM4fj7iWkD6i2xTgjwKNOWuUqJULIqs8WjGnnrtyGpWlcjNinJhCGCJ_F3-BNYoCsGC0nbmiqdVwa-QA2QyBcnSDk0hkERTmRdEmiiql1kt6_-DHsz22t_beMBQvNBGwDIWdcdEJsbnTHeuDip7sHVb0A16Bv6ThA15kFPYstpBK03hSPiD_XM9IhHHdWUszKRpMOyXp8YoRjV2LkX285vIlV2zKPxyJWIj05', 'Available'),
('Lamborghini', 'Huracán EVO', 850.00, '5.2L V10', 2, 'Automatic', 'Gasoline', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5vmeleIA_GGGgTfxeVNiuuOvWQlGbrHsDbPeDgVXIUgdP1zalDqZU69Xg2J7f6rUmm20CgD4cBv8R5zMJYxDU3Y5ckVd26Xh2WRRUpqlmgAAQzWuhCn-GDkkyJ3q7U9vF9te4rQvgKTj5AUJ6LTzHiWepqVyk5H5OyqaF3ePU_-VbrKkJbT1eLUw2-Dfa2LWu3i1YgGr11wBVBJYlO50AXJqJKhXA_byZqBtixa0HSjHMeF1qCFjEzUX5A_Ic166hJ1JH9zeI1c5d', 'Available');

INSERT INTO blogs (title, content, image) VALUES 
('Why the Phantom is the Ultimate Luxury Drive', 'Experience the unparalleled comfort and prestige of the Rolls-Royce Phantom VIII on your next journey. It defines modern luxury mobility.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNMVt6XOaDedA5EZxbl5zsxmOWZWYoY2ChVNCxwM6frsFLVBX3KzlR5poN0w2nbJzhsvROb7mN0ZjzKfKy6xFODbzLlusJou7mCDFVvo9BnfIMk8MZMhBcKGJRnES4w0GZB0cAk-PuggLnQ_9MSdp2v_o2c9ISUfPlSULmq3rniYd3ssZ1OSKi3ZSe0Ool6tIeFHk54j9UjBhsQAUv9UhCFGl0PpCPEdBtNmTKvW-TqTsLG7iKiIuEgBWvHrVPMXUxxlMCCuE_4x2L');
