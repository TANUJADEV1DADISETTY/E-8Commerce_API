-- Seed users
INSERT INTO users (id, email, password) VALUES
(1, 'alice@example.com', 'hashedpassword123'),
(2, 'bob@example.com', 'hashedpassword456');

-- Reset users sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Seed products
INSERT INTO products (id, name, price, stock, version) VALUES
(1, 'Laptop', 1200.00, 10, 1),
(2, 'Smartphone', 800.00, 20, 1),
(3, 'Headphones', 150.00, 50, 1),
(4, 'Keyboard', 100.00, 15, 1),
(5, 'Out of Stock Monitor', 300.00, 0, 1);

-- Reset products sequence
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
