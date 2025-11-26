export interface Edition {
  id: string;
  slug: string;
  year: number;
  edition_number: number;
  date: string;
  title: string;
  hero_subtitle?: string;
  status: 'draft' | 'published' | 'archived';
  registration_online_url?: string;
  results_url?: string;
  photos_album_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RaceCategory {
  id: string;
  edition_id: string;
  name: string;
  slug: string;
  distance_km: number;
  type: 'adult' | 'junior' | 'walking' | 'villageoise';
  start_time: string;
  start_location?: string;
  description?: string;
  min_age?: number;
  max_age?: number;
  price?: number;
  registration_online?: boolean;
  registration_onsite?: boolean;
  onsite_supplement?: number;
  refreshments?: string;
  facilities?: string;
  souvenir?: string;
  route_map_image_id?: string;
  route_gpx_url?: string;
  elevation_gain?: number;
  order_index: number;
}

export interface ProgramItem {
  id: string;
  edition_id: string;
  time: string;
  label: string;
  description?: string;
  order_index: number;
}

export interface ClubContent {
  id: string;
  club_intro?: string;
  club_history?: string;
  club_spirit?: string;
  members_count?: number;
  founded_year?: number;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  category: 'adult' | 'junior' | 'nordic' | 'prep_20km';
  title: string;
  day_of_week: string;
  start_time: string;
  end_time?: string;
  location: string;
  level?: string;
  description?: string;
  target_audience?: string;
  order_index: number;
}

export interface CommitteeMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email?: string;
  phone?: string;
  photo_asset_id?: string;
  order_index: number;
}

export interface Sponsor {
  id: string;
  name: string;
  category: 'principal' | 'secondary';
  logo_asset_id?: string;
  website_url?: string;
  order_index: number;
  is_visible?: boolean; // <-- AJOUT
}


export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order_index: number;
}

export interface PracticalInfo {
  id: string;
  address?: string;
  google_maps_url?: string;
  train_info?: string;
  car_info?: string;
  parking_info?: string;
  facilities?: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  url: string;
  alt_text?: string;
  width?: number;
  height?: number;
}

export interface HomeData {
  edition: Edition;
  featured_races: RaceCategory[];
  club_excerpt: ClubContent;
  main_sponsors: Sponsor[];
  practical_info_excerpt: PracticalInfo;
}

export interface EditionFullData {
  edition: Edition;
  races: RaceCategory[];
  program: ProgramItem[];
}

export interface ClubData {
  content: ClubContent;
  training_sessions: TrainingSession[];
  committee_members: CommitteeMember[];
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface MembershipFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  membership_type: string;
  message?: string;
}
