/*
  # Add Profile Photos and Health History

  ## New Features
  
  ### Update user_profiles table
  - Add profile_photo_url for storing user profile pictures
  
  ### New Tables
  
  ### `health_history`
  Stores user health conditions and medical history
  - `id` (uuid, PK) - History identifier
  - `user_id` (uuid, FK) - Reference to user_profiles
  - `history_type` (text) - Type: condition, medication, surgery, allergy, etc.
  - `description` (text) - Details about the health item
  - `date_recorded` (date) - When the condition occurred
  - `is_active` (boolean) - Whether condition is currently relevant
  - `created_at` (timestamptz) - Record creation timestamp

  ### `menstrual_cycle`
  Stores menstrual cycle tracking data for personalized nutrition
  - `id` (uuid, PK) - Cycle identifier
  - `user_id` (uuid, FK) - Reference to user_profiles
  - `cycle_date` (date) - Date of cycle start
  - `cycle_day` (integer) - Current day in cycle
  - `flow_intensity` (text) - Light, moderate, heavy
  - `symptoms` (text[]) - Associated symptoms
  - `created_at` (timestamptz) - Record creation timestamp

  ### `daily_calorie_intake`
  Tracks daily calorie consumption for weekly reporting
  - `id` (uuid, PK) - Record identifier
  - `user_id` (uuid, FK) - Reference to user_profiles
  - `intake_date` (date) - Date of intake
  - `total_calories` (integer) - Total calories consumed
  - `meals_count` (integer) - Number of meals tracked
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
*/

-- Add profile_photo_url to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN profile_photo_url text DEFAULT '';
  END IF;
END $$;

-- Create health_history table
CREATE TABLE IF NOT EXISTS health_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  history_type text NOT NULL CHECK (history_type IN ('condition', 'medication', 'surgery', 'allergy', 'supplement', 'other')),
  description text NOT NULL,
  date_recorded date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create menstrual_cycle table
CREATE TABLE IF NOT EXISTS menstrual_cycle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  cycle_date date NOT NULL,
  cycle_day integer,
  flow_intensity text CHECK (flow_intensity IN ('light', 'moderate', 'heavy', 'spotting')),
  symptoms text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now()
);

-- Create daily_calorie_intake table
CREATE TABLE IF NOT EXISTS daily_calorie_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  intake_date date NOT NULL UNIQUE,
  total_calories integer DEFAULT 0,
  meals_count integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE menstrual_cycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_calorie_intake ENABLE ROW LEVEL SECURITY;

-- Health History Policies
CREATE POLICY "Users can view own health history"
  ON health_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health history"
  ON health_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health history"
  ON health_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health history"
  ON health_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Menstrual Cycle Policies
CREATE POLICY "Users can view own menstrual cycle"
  ON menstrual_cycle FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menstrual cycle"
  ON menstrual_cycle FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menstrual cycle"
  ON menstrual_cycle FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own menstrual cycle"
  ON menstrual_cycle FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily Calorie Intake Policies
CREATE POLICY "Users can view own calorie intake"
  ON daily_calorie_intake FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calorie intake"
  ON daily_calorie_intake FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calorie intake"
  ON daily_calorie_intake FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_history_user_id ON health_history(user_id);
CREATE INDEX IF NOT EXISTS idx_menstrual_cycle_user_id ON menstrual_cycle(user_id);
CREATE INDEX IF NOT EXISTS idx_menstrual_cycle_date ON menstrual_cycle(cycle_date);
CREATE INDEX IF NOT EXISTS idx_daily_calorie_user_date ON daily_calorie_intake(user_id, intake_date);
