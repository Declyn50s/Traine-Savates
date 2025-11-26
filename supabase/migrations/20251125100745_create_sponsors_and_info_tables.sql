/*
  # Création des tables pour sponsors et infos pratiques
  
  1. Nouvelles tables
    - `sponsors` : Sponsors et partenaires
    - `practical_info` : Informations pratiques
    - `faq_items` : Questions fréquentes
    - `contact_messages` : Messages de contact
    - `membership_requests` : Demandes d'adhésion
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies appropriées pour chaque table
*/

CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('principal', 'secondary')),
  logo_asset_id text,
  website_url text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practical_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text,
  google_maps_url text,
  train_info text,
  car_info text,
  parking_info text,
  facilities text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  birth_date date,
  address text,
  city text,
  postal_code text,
  membership_type text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE practical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for sponsors"
  ON sponsors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for practical_info"
  ON practical_info FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for faq_items"
  ON faq_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert contact_messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can insert membership_requests"
  ON membership_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
