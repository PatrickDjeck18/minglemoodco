/*
  # Add exam randomization system

  1. Schema Changes
    - Add `questions_per_exam` field to exams table
    - Add `question_order` and `shuffled_options` to exam_attempts table
    - Update RLS policies

  2. Features
    - Admins can set how many questions to randomly select from pool
    - Each attempt gets randomized questions and shuffled answers
    - Question order and answer shuffling is saved per attempt
*/

-- Add questions_per_exam field to exams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'questions_per_exam'
  ) THEN
    ALTER TABLE exams ADD COLUMN questions_per_exam integer DEFAULT 10;
  END IF;
END $$;

-- Add randomization fields to exam_attempts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_attempts' AND column_name = 'question_order'
  ) THEN
    ALTER TABLE exam_attempts ADD COLUMN question_order jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_attempts' AND column_name = 'shuffled_options'
  ) THEN
    ALTER TABLE exam_attempts ADD COLUMN shuffled_options jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;