
-- Function to automatically create wallet when user is created
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create wallet when user is inserted
DROP TRIGGER IF EXISTS create_wallet_trigger ON users;
CREATE TRIGGER create_wallet_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();

-- Function to update resource download count
CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resources 
  SET download_count = download_count + 1 
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment download count
DROP TRIGGER IF EXISTS increment_download_trigger ON downloads;
CREATE TRIGGER increment_download_trigger
  AFTER INSERT ON downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_download_count();

-- Function to handle wallet transactions
CREATE OR REPLACE FUNCTION process_transaction(
  p_buyer_id UUID,
  p_resource_id UUID,
  p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  buyer_balance DECIMAL;
  uploader_id UUID;
BEGIN
  -- Get buyer's current balance
  SELECT balance INTO buyer_balance 
  FROM wallets 
  WHERE user_id = p_buyer_id;
  
  -- Check if buyer has sufficient funds
  IF buyer_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Get uploader ID
  SELECT uploader_id INTO uploader_id 
  FROM resources 
  WHERE id = p_resource_id;
  
  -- Deduct from buyer's wallet
  UPDATE wallets 
  SET balance = balance - p_amount 
  WHERE user_id = p_buyer_id;
  
  -- Add to uploader's wallet
  UPDATE wallets 
  SET balance = balance + p_amount 
  WHERE user_id = uploader_id;
  
  -- Record transaction
  INSERT INTO transactions (buyer_id, resource_id, amount, status)
  VALUES (p_buyer_id, p_resource_id, p_amount, 'completed');
  
  -- Record download
  INSERT INTO downloads (user_id, resource_id)
  VALUES (p_buyer_id, p_resource_id)
  ON CONFLICT (user_id, resource_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to search resources
CREATE OR REPLACE FUNCTION search_resources(
  search_term TEXT DEFAULT '',
  filter_department TEXT DEFAULT '',
  filter_level TEXT DEFAULT '',
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  uploader_id UUID,
  department TEXT,
  level TEXT,
  price DECIMAL,
  tags TEXT[],
  storage_path TEXT,
  file_type TEXT,
  featured BOOLEAN,
  download_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  uploader_name TEXT,
  avg_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.uploader_id,
    r.department,
    r.level,
    r.price,
    r.tags,
    r.storage_path,
    r.file_type,
    r.featured,
    r.download_count,
    r.created_at,
    u.name as uploader_name,
    COALESCE(AVG(rev.rating), 0) as avg_rating
  FROM resources r
  JOIN users u ON r.uploader_id = u.id
  LEFT JOIN reviews rev ON r.id = rev.resource_id
  WHERE 
    (search_term = '' OR 
     r.title ILIKE '%' || search_term || '%' OR 
     r.description ILIKE '%' || search_term || '%' OR
     array_to_string(r.tags, ' ') ILIKE '%' || search_term || '%')
    AND (filter_department = '' OR r.department = filter_department)
    AND (filter_level = '' OR r.level = filter_level)
  GROUP BY r.id, u.name
  ORDER BY 
    CASE 
      WHEN sort_by = 'title' AND sort_order = 'ASC' THEN r.title
      WHEN sort_by = 'price' AND sort_order = 'ASC' THEN r.price::TEXT
      WHEN sort_by = 'download_count' AND sort_order = 'ASC' THEN r.download_count::TEXT
      WHEN sort_by = 'created_at' AND sort_order = 'ASC' THEN r.created_at::TEXT
    END ASC,
    CASE 
      WHEN sort_by = 'title' AND sort_order = 'DESC' THEN r.title
      WHEN sort_by = 'price' AND sort_order = 'DESC' THEN r.price::TEXT
      WHEN sort_by = 'download_count' AND sort_order = 'DESC' THEN r.download_count::TEXT
      WHEN sort_by = 'created_at' AND sort_order = 'DESC' THEN r.created_at::TEXT
      ELSE r.created_at::TEXT
    END DESC;
END;
$$ LANGUAGE plpgsql;
