/*
  # User Profiles and Health Data Schema

  ## Overview
  Creates the core database structure for a health-focused restaurant menu recommendation app.
  Users can set health goals, dietary preferences, and receive personalized menu recommendations.

  ## New Tables
  
  ### `user_profiles`
  Stores user profile information and health data
  - `id` (uuid, FK to auth.users) - User identifier
  - `full_name` (text) - User's full name
  - `age` (integer) - User's age for nutritional calculations
  - `weight` (decimal) - Current weight in kg
  - `height` (decimal) - Height in cm
  - `gender` (text) - Gender for biological calculations
  - `activity_level` (text) - Activity level (sedentary, light, moderate, active, very_active)
  - `bio` (text) - Additional information about the user
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `health_goals`
  Stores user health and fitness goals
  - `id` (uuid, PK) - Goal identifier
  - `user_id` (uuid, FK) - Reference to user_profiles
  - `goal_type` (text) - Type: weight_loss, muscle_building, health_management, maintenance
  - `target_weight` (decimal, optional) - Target weight for weight goals
  - `target_date` (date, optional) - Target completion date
  - `is_active` (boolean) - Whether goal is currently active
  - `created_at` (timestamptz) - Goal creation timestamp

  ### `dietary_preferences`
  Stores user dietary restrictions and preferences
  - `id` (uuid, PK) - Preference identifier
  - `user_id` (uuid, FK) - Reference to user_profiles
  - `preference_type` (text) - Type: vegetarian, vegan, gluten_free, dairy_free, keto, paleo, halal, kosher, etc.
  - `is_restriction` (boolean) - True if allergy/restriction, false if preference
  - `notes` (text, optional) - Additional notes
  - `created_at` (timestamptz) - Preference creation timestamp

  ### `menu_scans`
  Stores video scans of restaurant menus
  - `id` (uuid, PK) - Scan identifier
  - `user_id` (uuid, FK) - Reference to user_profiles
  - `restaurant_name` (text, optional) - Restaurant name if identified
  - `video_url` (text) - URL to stored video
  - `scan_date` (timestamptz) - When scan was performed
  - `processing_status` (text) - Status: pending, processing, completed, failed
  - `created_at` (timestamptz) - Scan creation timestamp

  ### `recommendations`
  Stores AI-generated menu recommendations
  - `id` (uuid, PK) - Recommendation identifier
  - `scan_id` (uuid, FK) - Reference to menu_scans
  - `user_id` (uuid, FK) - Reference to user_profiles
  - `dish_name` (text) - Recommended dish name
  - `description` (text) - Dish description
  - `estimated_calories` (integer, optional) - Estimated calorie content
  - `protein_g` (decimal, optional) - Protein in grams
  - `carbs_g` (decimal, optional) - Carbohydrates in grams
  - `fat_g` (decimal, optional) - Fat in grams
  - `recommendation_reason` (text) - Why this was recommended
  - `health_score` (integer) - Score 1-100 based on user goals
  - `created_at` (timestamptz) - Recommendation creation timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  age integer,
  weight decimal(5,2),
  height decimal(5,2),
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  activity_level text DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create health_goals table
CREATE TABLE IF NOT EXISTS health_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_building', 'health_management', 'maintenance')),
  target_weight decimal(5,2),
  target_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create dietary_preferences table
CREATE TABLE IF NOT EXISTS dietary_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  preference_type text NOT NULL,
  is_restriction boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create menu_scans table
CREATE TABLE IF NOT EXISTS menu_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  restaurant_name text DEFAULT '',
  video_url text NOT NULL,
  scan_date timestamptz DEFAULT now(),
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES menu_scans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dish_name text NOT NULL,
  description text DEFAULT '',
  estimated_calories integer,
  protein_g decimal(6,2),
  carbs_g decimal(6,2),
  fat_g decimal(6,2),
  recommendation_reason text NOT NULL,
  health_score integer CHECK (health_score >= 1 AND health_score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Health Goals Policies
CREATE POLICY "Users can view own goals"
  ON health_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON health_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON health_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON health_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Dietary Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON dietary_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON dietary_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON dietary_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON dietary_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Menu Scans Policies
CREATE POLICY "Users can view own scans"
  ON menu_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON menu_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
  ON menu_scans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recommendations Policies
CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_health_goals_user_id ON health_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_health_goals_active ON health_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_dietary_preferences_user_id ON dietary_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_scans_user_id ON menu_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_scans_status ON menu_scans(user_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_recommendations_scan_id ON recommendations(scan_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();