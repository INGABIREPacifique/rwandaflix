-- Adds a real trailer_url to every published movie that doesn't have
-- one yet, using the same small, verified-working test video from
-- earlier in this project (the MDN flower.mp4). This is placeholder
-- test content, not real movie trailers — swap these for real trailer
-- clips whenever you have them, using the same UPDATE pattern.
--
-- This is what actually makes the hero-carousel autoplay and the
-- movie-card hover-preview features visible — without any trailer_url
-- set, those features correctly show static images instead (that's
-- the honest fallback, not a bug), so nothing will look different
-- until you run this.

update public.movies
set trailer_url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
where is_published = true and (trailer_url is null or trailer_url = '');

-- Verify:
select title, trailer_url from public.movies where is_published = true;
