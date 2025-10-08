/*
  # Create certificates table

  1. New Tables
    - `certificates`
      - `id` (text, primary key) - certificate number
      - `attempt_id` (uuid, foreign key) - reference to exam attempt
      - `participant_id` (uuid, foreign key) - reference to participant
      - `exam_id` (uuid, foreign key) - reference to exam
      - `certificate_data` (jsonb) - all certificate data including placeholders
      - `pdf_url` (text) - URL to generated PDF
      - `generated_at` (timestamp) - when certificate was generated
      - `created_at` (timestamp) - record creation time

  2. Security
    - Enable RLS on `certificates` table
    - Add policies for participants to read their own certificates
    - Add policies for admins to read all certificates
*/

CREATE TABLE IF NOT EXISTS certificates (
  id text PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  certificate_data jsonb NOT NULL DEFAULT '{}',
  pdf_url text,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Participants can read their own certificates
CREATE POLICY "certificates_participants_read_own"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (participant_id = auth.uid());

-- Admins can read all certificates
CREATE POLICY "certificates_admin_read_all"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert certificates (via service role)
CREATE POLICY "certificates_system_insert"
  ON certificates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS certificates_participant_id_idx ON certificates(participant_id);
CREATE INDEX IF NOT EXISTS certificates_exam_id_idx ON certificates(exam_id);
CREATE INDEX IF NOT EXISTS certificates_attempt_id_idx ON certificates(attempt_id);