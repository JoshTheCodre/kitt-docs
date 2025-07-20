
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS downloads CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    image TEXT, -- Google profile picture
    school VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'buyer' CHECK (role IN ('buyer', 'uploader', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00
);

-- Create wallets table
CREATE TABLE wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    tags TEXT[] DEFAULT '{}',
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT, -- File size in bytes
    storage_path TEXT NOT NULL, -- Path to file in storage
    thumbnail_path TEXT, -- Thumbnail/preview image
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
    rating_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Create indexes for common queries
    CONSTRAINT resources_title_check CHECK (LENGTH(title) >= 3)
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_type VARCHAR(20) DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund', 'withdrawal', 'deposit')),
    payment_method VARCHAR(50) DEFAULT 'wallet',
    reference_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create downloads table (track user downloads)
CREATE TABLE downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate downloads tracking
    UNIQUE(user_id, resource_id)
);

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent multiple reviews from same user for same resource
    UNIQUE(user_id, resource_id)
);

-- Create bookmarks table
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate bookmarks
    UNIQUE(user_id, resource_id)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'purchase', 'sale', 'review')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet transactions table for detailed wallet history
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    description TEXT NOT NULL,
    reference_id VARCHAR(255),
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_resources_uploader ON resources(uploader_id);
CREATE INDEX idx_resources_department_level ON resources(department, level);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_resources_featured ON resources(featured) WHERE featured = true;
CREATE INDEX idx_resources_price ON resources(price);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_resource ON transactions(resource_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_downloads_user ON downloads(user_id);
CREATE INDEX idx_downloads_resource ON downloads(resource_id);
CREATE INDEX idx_reviews_resource ON reviews(resource_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update resource ratings
CREATE OR REPLACE FUNCTION update_resource_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE resources 
    SET 
        rating_average = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
        )
    WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for rating updates
CREATE TRIGGER update_resource_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_resource_rating();

-- Create function to process transactions
CREATE OR REPLACE FUNCTION process_transaction(
    p_buyer_id UUID,
    p_resource_id UUID,
    p_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
    v_seller_id UUID;
    v_buyer_balance DECIMAL;
    v_transaction_id UUID;
    v_result JSON;
BEGIN
    -- Get seller ID
    SELECT uploader_id INTO v_seller_id FROM resources WHERE id = p_resource_id;
    
    -- Check if buyer has sufficient balance
    SELECT balance INTO v_buyer_balance FROM wallets WHERE user_id = p_buyer_id;
    
    IF v_buyer_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
    
    -- Start transaction
    BEGIN
        -- Deduct from buyer
        UPDATE wallets SET balance = balance - p_amount WHERE user_id = p_buyer_id;
        
        -- Add to seller (minus platform fee if any)
        UPDATE wallets SET balance = balance + (p_amount * 0.95) WHERE user_id = v_seller_id;
        
        -- Create transaction record
        INSERT INTO transactions (buyer_id, seller_id, resource_id, amount, reference_id)
        VALUES (p_buyer_id, v_seller_id, p_resource_id, p_amount, uuid_generate_v4()::text)
        RETURNING id INTO v_transaction_id;
        
        -- Add download record
        INSERT INTO downloads (user_id, resource_id) 
        VALUES (p_buyer_id, p_resource_id) 
        ON CONFLICT (user_id, resource_id) DO NOTHING;
        
        -- Update download count
        UPDATE resources SET download_count = download_count + 1 WHERE id = p_resource_id;
        
        -- Update user totals
        UPDATE users SET total_spent = total_spent + p_amount WHERE id = p_buyer_id;
        UPDATE users SET total_earnings = total_earnings + (p_amount * 0.95) WHERE id = v_seller_id;
        
        -- Create wallet transaction records
        INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id, balance_after)
        VALUES (
            p_buyer_id, 
            -p_amount, 
            'debit', 
            'Purchase: Resource #' || p_resource_id::text,
            v_transaction_id::text,
            (SELECT balance FROM wallets WHERE user_id = p_buyer_id)
        );
        
        INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id, balance_after)
        VALUES (
            v_seller_id, 
            (p_amount * 0.95), 
            'credit', 
            'Sale: Resource #' || p_resource_id::text,
            v_transaction_id::text,
            (SELECT balance FROM wallets WHERE user_id = v_seller_id)
        );
        
        -- Create notifications
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
            p_buyer_id,
            'Purchase Successful',
            'You have successfully purchased a resource',
            'purchase'
        );
        
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
            v_seller_id,
            'New Sale',
            'Someone purchased your resource',
            'sale'
        );
        
        v_result := json_build_object('success', true, 'transaction_id', v_transaction_id);
        
    EXCEPTION WHEN OTHERS THEN
        v_result := json_build_object('success', false, 'error', SQLERRM);
    END;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Create policies for wallets
CREATE POLICY "Users can view their own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallet" ON wallets FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for resources
CREATE POLICY "Anyone can view approved resources" ON resources FOR SELECT USING (approved = true);
CREATE POLICY "Users can view their own resources" ON resources FOR SELECT USING (auth.uid() = uploader_id);
CREATE POLICY "Users can create resources" ON resources FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update their own resources" ON resources FOR UPDATE USING (auth.uid() = uploader_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create policies for downloads
CREATE POLICY "Users can view their own downloads" ON downloads FOR SELECT USING (auth.uid() = user_id);

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO authenticated;
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for wallet transactions
CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Insert sample data for testing (optional)
-- You can uncomment this section for testing purposes

/*
-- Sample users
INSERT INTO users (id, email, name, school, department, level, role) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'john@example.com', 'John Doe', 'University of Lagos', 'Computer Science', '400', 'buyer'),
('123e4567-e89b-12d3-a456-426614174001', 'jane@example.com', 'Jane Smith', 'University of Ibadan', 'Engineering', '300', 'uploader');

-- Sample wallets
INSERT INTO wallets (user_id, balance) VALUES
('123e4567-e89b-12d3-a456-426614174000', 1000.00),
('123e4567-e89b-12d3-a456-426614174001', 500.00);

-- Sample resources
INSERT INTO resources (title, description, uploader_id, department, level, price, file_type, storage_path) VALUES
('Advanced Algorithms Notes', 'Comprehensive notes on advanced algorithms and data structures', '123e4567-e89b-12d3-a456-426614174001', 'Computer Science', '400', 50.00, 'application/pdf', '/uploads/algorithms.pdf'),
('Engineering Mathematics', 'Complete guide to engineering mathematics', '123e4567-e89b-12d3-a456-426614174001', 'Engineering', '200', 75.00, 'application/pdf', '/uploads/math.pdf');
*/

-- Create function to initialize user wallet
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0.00);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create wallet for new users
CREATE TRIGGER create_user_wallet_trigger
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Final message
SELECT 'Database setup completed successfully!' as status;
