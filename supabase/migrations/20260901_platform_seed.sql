-- RwandaFlix catalog seed
-- RUN THIS IN SUPABASE SQL EDITOR AFTER THE EXISTING SCHEMA/MIGRATIONS.
-- This migration is idempotent and only seeds demo catalog rows.

insert into public.movies
  (title, description, poster_url, backdrop_url, release_year, duration_minutes, genre, language, is_featured, is_original, is_published)
select v.title, v.description, v.poster_url, v.backdrop_url, v.release_year, v.duration_minutes, v.genre, v.language, v.is_featured, v.is_original, v.is_published
from (values
  ('The Long Road Home', 'A fictional Rwandan drama about family, ambition and the difficult journey home.', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80', 2026, 124, 'Drama', 'Kinyarwanda', true, true, true),
  ('Kigali Nights', 'A fictional story following young people navigating friendship and dreams in Kigali.', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80', 2025, 108, 'Drama', 'Kinyarwanda', false, false, true),
  ('Imizi', 'A fictional cultural story exploring identity, family and generations.', 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=1600&q=80', 2026, 95, 'Culture', 'Kinyarwanda', false, true, true),
  ('The Journey', 'A fictional adventure across Rwanda as a young traveler searches for answers.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80', 2025, 112, 'Adventure', 'Kinyarwanda', false, false, true),
  ('Our Story', 'A fictional documentary concept celebrating Rwandan voices.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80', 2026, 82, 'Documentary', 'Kinyarwanda', false, true, true),
  ('A New Dawn', 'A fictional story about hope, change and starting again.', 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=80', 2025, 101, 'Drama', 'Kinyarwanda', false, false, true),
  ('Ubumwe', 'A fictional drama exploring community and the meaning of unity.', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80', 2026, 118, 'Drama', 'Kinyarwanda', false, true, true),
  ('Kigali Love', 'A fictional romantic story set against modern Kigali.', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80', 2025, 106, 'Romance', 'Kinyarwanda', false, false, true)
) as v(title, description, poster_url, backdrop_url, release_year, duration_minutes, genre, language, is_featured, is_original, is_published)
where not exists (select 1 from public.movies m where m.title = v.title);
