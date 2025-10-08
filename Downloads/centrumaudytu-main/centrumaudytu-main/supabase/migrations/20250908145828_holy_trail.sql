/*
  # Add certificate template to exams

  1. Changes
    - Add certificate_template JSONB column to exams table
    - This will store the template data for certificate generation

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE exams 
ADD COLUMN certificate_template JSONB DEFAULT NULL;

COMMENT ON COLUMN exams.certificate_template IS 'Template data for certificate generation including szkolenie, kompetencje, opisUkonczenia';