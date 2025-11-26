/*
  # Création des tables pour le club
  
  1. Nouvelles tables
    - `club_content` : Contenu du club (intro, histoire, esprit)
    - `training_sessions` : Séances d'entraînement
    - `committee_members` : Membres du comité
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies en lecture publique
*/

CREATE TABLE IF NOT EXISTS club_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_intro text,
  club_history text,
  club_spirit text,
  members_count integer DEFAULT 0,
  founded_year integer,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('adult', 'junior', 'nordic', 'prep_20km')),
  title text NOT NULL,
  day_of_week text NOT NULL,
  start_time text NOT NULL,
  end_time text,
  location text NOT NULL,
  level text,
  description text,
  target_audience text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL,
  email text,
  phone text,
  photo_asset_id text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE club_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for club_content"
  ON club_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for training_sessions"
  ON training_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for committee_members"
  ON committee_members FOR SELECT
  TO anon, authenticated
  USING (true);
