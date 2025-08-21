-- Complete Database Setup Script for Qitt App
-- This script creates all necessary tables, functions, triggers, and policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.downloads CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    school TEXT NOT NULL,
    department TEXT NOT NULL,
    level TEXT NOT NULL,
    role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'uploader', 'admin')),
    is_verified BOOLEAN DEFAULT false,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create resources table
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    uploader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    level TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00 CHECK (price >= 0),
    tags TEXT[] DEFAULT '{}',
    file_type TEXT NOT NULL,
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_type TEXT DEFAULT 'purchase' CHECK (transaction_type IN ('purchase', 'refund')),
    payment_method TEXT DEFAULT 'wallet',
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    method TEXT DEFAULT 'paystack' CHECK (method IN ('paystack', 'flutterwave', 'bank_transfer', 'mobile_money', 'internal')),
    reference TEXT,
    description TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    price_paid DECIMAL(10,2) NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

-- Create downloads table
CREATE TABLE public.downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_resources_uploader ON public.resources(uploader_id);
CREATE INDEX idx_resources_department ON public.resources(department);
CREATE INDEX idx_resources_level ON public.resources(level);
CREATE INDEX idx_resources_price ON public.resources(price);
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX idx_transactions_resource ON public.transactions(resource_id);
CREATE INDEX idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_downloads_user ON public.downloads(user_id);
CREATE INDEX idx_purchases_user ON public.purchases(user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create wallet for new user
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user wallet creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to increment wallet balance
CREATE OR REPLACE FUNCTION increment_wallet_balance(user_id_param UUID, amount_param DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE public.wallets 
  SET balance = balance + amount_param,
      updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to process resource purchases
CREATE OR REPLACE FUNCTION process_purchase(
    p_buyer_id UUID,
    p_resource_id UUID,
    p_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
    v_seller_id UUID;
    v_buyer_balance DECIMAL;
    v_seller_earnings DECIMAL;
    v_transaction_id UUID;
BEGIN
    -- Get seller ID and buyer balance
    SELECT uploader_id INTO v_seller_id FROM public.resources WHERE id = p_resource_id;
    SELECT balance INTO v_buyer_balance FROM public.wallets WHERE user_id = p_buyer_id;

    -- Check sufficient balance
    IF v_buyer_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Calculate seller earnings (95% after 5% platform fee)
    v_seller_earnings := p_amount * 0.95;

    -- Process transaction
    BEGIN
        -- Deduct from buyer
        UPDATE public.wallets SET balance = balance - p_amount WHERE user_id = p_buyer_id;

        -- Add to seller
        UPDATE public.wallets SET balance = balance + v_seller_earnings WHERE user_id = v_seller_id;

        -- Create transaction record
        INSERT INTO public.transactions (buyer_id, seller_id, resource_id, amount, reference_id)
        VALUES (p_buyer_id, v_seller_id, p_resource_id, p_amount, uuid_generate_v4()::text)
        RETURNING id INTO v_transaction_id;

        -- Create purchase record
        INSERT INTO public.purchases (user_id, resource_id, price_paid)
        VALUES (p_buyer_id, p_resource_id, p_amount)
        ON CONFLICT (user_id, resource_id) DO NOTHING;

        -- Update resource download count
        UPDATE public.resources SET download_count = download_count + 1 WHERE id = p_resource_id;

        RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);

    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view and update their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Resources are publicly viewable but only owners can update
CREATE POLICY "Resources are publicly viewable" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Users can insert own resources" ON public.resources FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update own resources" ON public.resources FOR UPDATE USING (auth.uid() = uploader_id);

-- Transactions - users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions 
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Wallet transactions - users can view their own
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet transactions" ON public.wallet_transactions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchases - users can view their own
CREATE POLICY "Users can view own purchases" ON public.purchases 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Downloads - users can view and manage their own
CREATE POLICY "Users can view own downloads" ON public.downloads 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own downloads" ON public.downloads 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites - users can manage their own
CREATE POLICY "Users can view own favorites" ON public.favorites 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites 
FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;