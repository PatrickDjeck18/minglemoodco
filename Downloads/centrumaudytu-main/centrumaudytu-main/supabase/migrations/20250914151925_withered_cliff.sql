/*
  # Training Materials System

  1. New Tables
    - `training_materials`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `type` (enum: 'pdf', 'video', 'link', 'document')
      - `file_url` (text, optional - for uploaded files)
      - `external_url` (text, optional - for external links)
      - `file_size` (bigint, optional)
      - `duration` (integer, optional - for videos in seconds)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `material_assignments`
      - `id` (uuid, primary key)
      - `material_id` (uuid, references training_materials)
      - `participant_id` (uuid, optional - references profiles)
      - `group_id` (uuid, optional - references groups)
      - `assigned_by` (uuid, references profiles)
      - `assigned_at` (timestamp)
      - `due_date` (timestamp, optional)
      - `is_required` (boolean, default true)

    - `material_progress`
      - `id` (uuid, primary key)
      - `material_id` (uuid, references training_materials)
      - `participant_id` (uuid, references profiles)
      - `status` (enum: 'not_started', 'in_progress', 'completed')
      - `progress_percentage` (integer, 0-100)
      - `started_at` (timestamp, optional)
      - `completed_at` (timestamp, optional)
      - `last_accessed_at` (timestamp, optional)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin full access
    - Add policies for participant read access to assigned materials
    - Add policies for participant progress tracking

  3. Constraints
    - Assignment must target either participant OR group (not both)
    - Progress percentage must be between 0 and 100
    - Material type validation
    - Status validation
*/

-- Create enum types
CREATE TYPE material_type AS ENUM ('pdf', 'video', 'link', 'document', 'image', 'audio');
CREATE TYPE material_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Training Materials table
CREATE TABLE IF NOT EXISTS training_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type material_type NOT NULL,
  file_url text,
  external_url text,
  file_size bigint,
  duration integer, -- in seconds for videos/audio
  thumbnail_url text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT material_url_check CHECK (
    (file_url IS NOT NULL AND external_url IS NULL) OR
    (file_url IS NULL AND external_url IS NOT NULL)
  )
);

-- Material Assignments table
CREATE TABLE IF NOT EXISTS material_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES training_materials(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  due_date timestamptz,
  is_required boolean DEFAULT true,
  notes text,
  
  -- Constraints
  CONSTRAINT assignment_target_check CHECK (
    (participant_id IS NOT NULL AND group_id IS NULL) OR
    (participant_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Material Progress table
CREATE TABLE IF NOT EXISTS material_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES training_materials(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status material_status DEFAULT 'not_started',
  progress_percentage integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz DEFAULT now(),
  notes text,
  
  -- Constraints
  CONSTRAINT progress_percentage_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  CONSTRAINT unique_material_participant UNIQUE (material_id, participant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_materials_created_by ON training_materials(created_by);
CREATE INDEX IF NOT EXISTS idx_training_materials_type ON training_materials(type);
CREATE INDEX IF NOT EXISTS idx_training_materials_created_at ON training_materials(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_material_assignments_material_id ON material_assignments(material_id);
CREATE INDEX IF NOT EXISTS idx_material_assignments_participant_id ON material_assignments(participant_id);
CREATE INDEX IF NOT EXISTS idx_material_assignments_group_id ON material_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_material_assignments_assigned_by ON material_assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_material_progress_material_id ON material_progress(material_id);
CREATE INDEX IF NOT EXISTS idx_material_progress_participant_id ON material_progress(participant_id);
CREATE INDEX IF NOT EXISTS idx_material_progress_status ON material_progress(status);

-- Enable RLS
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_materials
CREATE POLICY "training_materials_admin_all"
  ON training_materials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "training_materials_participant_read_assigned"
  ON training_materials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM material_assignments ma
      LEFT JOIN profiles p ON p.id = auth.uid()
      WHERE ma.material_id = training_materials.id
      AND (
        ma.participant_id = auth.uid() OR
        (ma.group_id IS NOT NULL AND ma.group_id = p.group_id)
      )
    )
  );

-- RLS Policies for material_assignments
CREATE POLICY "material_assignments_admin_all"
  ON material_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "material_assignments_participant_read_own"
  ON material_assignments
  FOR SELECT
  TO authenticated
  USING (
    participant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.group_id = material_assignments.group_id
    )
  );

-- RLS Policies for material_progress
CREATE POLICY "material_progress_admin_read_all"
  ON material_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "material_progress_participant_all_own"
  ON material_progress
  FOR ALL
  TO authenticated
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for training_materials
CREATE TRIGGER update_training_materials_updated_at
  BEFORE UPDATE ON training_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create progress records when material is assigned
CREATE OR REPLACE FUNCTION create_material_progress_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If assigned to individual participant
  IF NEW.participant_id IS NOT NULL THEN
    INSERT INTO material_progress (material_id, participant_id, status)
    VALUES (NEW.material_id, NEW.participant_id, 'not_started')
    ON CONFLICT (material_id, participant_id) DO NOTHING;
  END IF;
  
  -- If assigned to group, create progress for all group members
  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO material_progress (material_id, participant_id, status)
    SELECT NEW.material_id, p.id, 'not_started'
    FROM profiles p
    WHERE p.group_id = NEW.group_id
    AND p.role = 'participant'
    ON CONFLICT (material_id, participant_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for material_assignments
CREATE TRIGGER create_progress_on_assignment
  AFTER INSERT ON material_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_material_progress_on_assignment();

-- Function to create progress for new group members
CREATE OR REPLACE FUNCTION create_progress_for_new_group_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Only if user is being added to a group (not removed)
  IF NEW.group_id IS NOT NULL AND (OLD.group_id IS NULL OR OLD.group_id != NEW.group_id) THEN
    -- Create progress records for all materials assigned to this group
    INSERT INTO material_progress (material_id, participant_id, status)
    SELECT ma.material_id, NEW.id, 'not_started'
    FROM material_assignments ma
    WHERE ma.group_id = NEW.group_id
    ON CONFLICT (material_id, participant_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles when group_id changes
CREATE TRIGGER create_progress_for_group_member
  AFTER UPDATE OF group_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_progress_for_new_group_member();