-- Fix fitness_score column to allow values 0-100
ALTER TABLE public.evolution_state 
ALTER COLUMN fitness_score TYPE numeric(7, 4);