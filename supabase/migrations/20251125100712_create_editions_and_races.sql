/*
  # Création des tables pour les éditions et courses
  
  1. Nouvelles tables
    - `editions` : Éditions de la course (années, dates, statuts)
    - `race_categories` : Catégories de courses (distances, types, horaires)
    - `program_items` : Programme de la journée (horaires des événements)
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies en lecture publique (données publiques du site)
*/

CREATE TABLE IF NOT EXISTS editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  year integer NOT NULL,
  edition_number integer NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  hero_subtitle text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  registration_online_url text,
  results_url text,
  photos_album_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS race_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid REFERENCES editions(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  distance_km numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('adult', 'junior', 'walking', 'villageoise')),
  start_time text NOT NULL,
  start_location text,
  description text,
  min_age integer,
  max_age integer,
  price numeric,
  registration_online boolean DEFAULT true,
  registration_onsite boolean DEFAULT true,
  onsite_supplement numeric,
  refreshments text,
  facilities text,
  souvenir text,
  route_map_image_id text,
  route_gpx_url text,
  elevation_gain integer,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid REFERENCES editions(id) ON DELETE CASCADE,
  time text NOT NULL,
  label text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for editions"
  ON editions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for race_categories"
  ON race_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for program_items"
  ON program_items FOR SELECT
  TO anon, authenticated
  USING (true);
