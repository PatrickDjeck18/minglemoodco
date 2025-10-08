/*
  # Add unique constraint for certificate idempotency

  1. Changes
    - Add unique constraint on certificates(participant_id, exam_id) to prevent duplicates
    - This ensures idempotency - one certificate per participant per exam

  2. Security
    - No changes to existing RLS policies
*/

-- Add unique constraint to prevent duplicate certificates
ALTER TABLE certificates 
ADD CONSTRAINT certificates_participant_exam_unique 
UNIQUE (participant_id, exam_id);