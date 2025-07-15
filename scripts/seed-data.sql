
-- Insert sample users
INSERT INTO users (id, name, email, school, department, level, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john.doe@university.edu', 'University of Technology', 'Computer Science', '300', 'uploader'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane.smith@university.edu', 'University of Technology', 'Engineering', '200', 'buyer'),
('550e8400-e29b-41d4-a716-446655440003', 'Mike Johnson', 'mike.johnson@university.edu', 'University of Technology', 'Medicine', '400', 'uploader')
ON CONFLICT (id) DO NOTHING;

-- Insert wallets for users
INSERT INTO wallets (user_id, balance) VALUES
('550e8400-e29b-41d4-a716-446655440001', 5000.00),
('550e8400-e29b-41d4-a716-446655440002', 2500.00),
('550e8400-e29b-41d4-a716-446655440003', 7500.00)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample resources
INSERT INTO resources (id, title, description, uploader_id, department, level, price, tags, storage_path, file_type, featured) VALUES
('resource-1', 'Data Structures and Algorithms Complete Guide', 'Comprehensive notes covering all major data structures, algorithms, time complexity analysis with practical examples and coding exercises', '550e8400-e29b-41d4-a716-446655440001', 'Computer Science', '300', 2500, ARRAY['algorithms', 'data-structures', 'programming', 'coding'], 'resources/dsa-notes.pdf', 'application/pdf', true),
('resource-2', 'Calculus Past Questions 2020-2023', 'Collection of past examination questions with detailed step-by-step solutions and explanations', '550e8400-e29b-41d4-a716-446655440001', 'Engineering', '200', 0, ARRAY['calculus', 'mathematics', 'past-questions', 'solutions'], 'resources/calculus-pq.pdf', 'application/pdf', false),
('resource-3', 'Database Management Systems Masterclass', 'Complete course material for DBMS including SQL tutorials, normalization, ER diagrams, and practical projects', '550e8400-e29b-41d4-a716-446655440001', 'Computer Science', '300', 3000, ARRAY['database', 'sql', 'dbms', 'normalization'], 'resources/dbms-notes.pdf', 'application/pdf', true),
('resource-4', 'Physics Laboratory Manual & Experiments', 'Complete laboratory experiments, procedures, safety guidelines and report templates for Physics students', '550e8400-e29b-41d4-a716-446655440003', 'Engineering', '100', 1500, ARRAY['physics', 'laboratory', 'experiments', 'reports'], 'resources/physics-lab.pdf', 'application/pdf', false),
('resource-5', 'Modern Web Development Bootcamp 2024', 'Complete guide to modern web development with React, Node.js, MongoDB, and deployment strategies', '550e8400-e29b-41d4-a716-446655440001', 'Computer Science', '400', 5000, ARRAY['web-development', 'react', 'nodejs', 'fullstack'], 'resources/web-dev.pdf', 'application/pdf', true),
('resource-6', 'Organic Chemistry Reactions Summary', 'Quick reference guide for organic chemistry reactions, mechanisms, and synthesis pathways', '550e8400-e29b-41d4-a716-446655440003', 'Medicine', '200', 0, ARRAY['chemistry', 'organic', 'reactions', 'mechanisms'], 'resources/organic-chem.pdf', 'application/pdf', false),
('resource-7', 'Machine Learning Fundamentals', 'Introduction to ML algorithms, Python implementation, and real-world applications with datasets', '550e8400-e29b-41d4-a716-446655440001', 'Computer Science', '400', 4500, ARRAY['machine-learning', 'python', 'ai', 'algorithms'], 'resources/ml-fundamentals.pdf', 'application/pdf', true),
('resource-8', 'Constitutional Law Case Studies', 'Landmark constitutional law cases with detailed analysis and legal precedents', '550e8400-e29b-41d4-a716-446655440003', 'Law', '300', 3500, ARRAY['law', 'constitutional', 'cases', 'legal'], 'resources/constitutional-law.pdf', 'application/pdf', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (buyer_id, resource_id, amount, status) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'resource-1', 2500, 'completed'),
('550e8400-e29b-41d4-a716-446655440002', 'resource-3', 3000, 'completed')
ON CONFLICT DO NOTHING;

-- Insert sample downloads
INSERT INTO downloads (user_id, resource_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'resource-1'),
('550e8400-e29b-41d4-a716-446655440002', 'resource-2'),
('550e8400-e29b-41d4-a716-446655440002', 'resource-3')
ON CONFLICT (user_id, resource_id) DO NOTHING;

-- Insert sample reviews
INSERT INTO reviews (user_id, resource_id, rating, comment) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'resource-1', 5, 'Excellent resource! Very comprehensive and well-structured.'),
('550e8400-e29b-41d4-a716-446655440002', 'resource-3', 4, 'Good material, helped me understand DBMS concepts better.')
ON CONFLICT (user_id, resource_id) DO NOTHING;

-- Insert sample bookmarks
INSERT INTO bookmarks (user_id, resource_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'resource-5'),
('550e8400-e29b-41d4-a716-446655440002', 'resource-7')
ON CONFLICT (user_id, resource_id) DO NOTHING;
