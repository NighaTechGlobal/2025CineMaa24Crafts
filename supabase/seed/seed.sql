-- Seed script for 24Krafts
-- This script creates sample users, profiles, companies, posts, conversations, and messages

-- Insert sample companies
INSERT INTO companies (id, name, phone, email, logo_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tamil Film Producers Council', '+919876543210', 'info@tfpc.com', 'https://example.com/logos/tfpc.png'),
  ('22222222-2222-2222-2222-222222222222', 'Chennai Film Production House', '+919876543211', 'contact@chennaifilms.com', 'https://example.com/logos/cfph.png');

-- Insert sample users (phone-based auth)
INSERT INTO users (id, phone, email) VALUES
  ('a1111111-1111-1111-1111-111111111111', '+919876000001', 'rajesh.artist@example.com'),
  ('a2222222-2222-2222-2222-222222222222', '+919876000002', 'priya.artist@example.com'),
  ('a3333333-3333-3333-3333-333333333333', '+919876000003', 'kumar.artist@example.com'),
  ('r1111111-1111-1111-1111-111111111111', '+919876000004', 'suresh.recruiter@example.com'),
  ('r2222222-2222-2222-2222-222222222222', '+919876000005', 'lakshmi.recruiter@example.com');

-- Insert sample profiles: 3 artists
INSERT INTO profiles (id, user_id, role, first_name, last_name, alt_phone, maa_associative_number, gender, department, state, city, profile_photo_url, company_id, premium_until) VALUES
  ('pa111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'artist', 'Rajesh', 'Kumar', '+919876100001', 'MAA-2023-001', 'Male', 'Acting', 'Tamil Nadu', 'Chennai', 'https://i.pravatar.cc/150?img=11', NULL, now() + INTERVAL '6 months'),
  ('pa222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'artist', 'Priya', 'Sharma', '+919876100002', 'MAA-2023-002', 'Female', 'Dance', 'Tamil Nadu', 'Chennai', 'https://i.pravatar.cc/150?img=5', NULL, NULL),
  ('pa333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'artist', 'Kumar', 'Natarajan', '+919876100003', 'MAA-2023-003', 'Male', 'Music', 'Tamil Nadu', 'Coimbatore', 'https://i.pravatar.cc/150?img=13', NULL, now() + INTERVAL '3 months');

-- Insert sample profiles: 2 recruiters
INSERT INTO profiles (id, user_id, role, first_name, last_name, alt_phone, gender, department, state, city, profile_photo_url, company_id) VALUES
  ('pr111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 'recruiter', 'Suresh', 'Babu', '+919876100004', 'Male', 'Casting', 'Tamil Nadu', 'Chennai', 'https://i.pravatar.cc/150?img=33', '11111111-1111-1111-1111-111111111111'),
  ('pr222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222', 'recruiter', 'Lakshmi', 'Menon', '+919876100005', 'Female', 'Production', 'Tamil Nadu', 'Chennai', 'https://i.pravatar.cc/150?img=27', '22222222-2222-2222-2222-222222222222');

-- Insert social links for profiles
INSERT INTO social_links (profile_id, platform, url, order_index) VALUES
  ('pa111111-1111-1111-1111-111111111111', 'instagram', 'https://instagram.com/rajesh.kumar', 1),
  ('pa111111-1111-1111-1111-111111111111', 'facebook', 'https://facebook.com/rajesh.kumar', 2),
  ('pa222222-2222-2222-2222-222222222222', 'youtube', 'https://youtube.com/priyasharma', 1),
  ('pa333333-3333-3333-3333-333333333333', 'website', 'https://kumarnatarajan.com', 1);

-- Insert sample projects
INSERT INTO projects (id, title, description, poster_url, start_date, end_date, created_by) VALUES
  ('pj111111-1111-1111-1111-111111111111', 'Tamil Action Blockbuster 2025', 'High-octane action thriller set in Chennai. Looking for talented artists for key roles.', 'https://via.placeholder.com/400x600/FF5733/FFFFFF?text=Action+Film', '2025-11-01', '2026-02-28', 'pr111111-1111-1111-1111-111111111111'),
  ('pj222222-2222-2222-2222-222222222222', 'Romance Drama - Kadhal Kaaviyam', 'A beautiful love story exploring relationships in modern Tamil Nadu.', 'https://via.placeholder.com/400x600/33C1FF/FFFFFF?text=Romance+Drama', '2025-12-01', '2026-03-31', 'pr222222-2222-2222-2222-222222222222');

-- Insert project members
INSERT INTO project_members (project_id, profile_id, role_in_project) VALUES
  ('pj111111-1111-1111-1111-111111111111', 'pa111111-1111-1111-1111-111111111111', 'Lead Actor'),
  ('pj111111-1111-1111-1111-111111111111', 'pa222222-2222-2222-2222-222222222222', 'Supporting Actress'),
  ('pj222222-2222-2222-2222-222222222222', 'pa111111-1111-1111-1111-111111111111', 'Supporting Actor'),
  ('pj222222-2222-2222-2222-222222222222', 'pa333333-3333-3333-3333-333333333333', 'Music Director');

-- Insert sample schedules
INSERT INTO schedules (id, project_id, title, description, date, start_time, end_time, location, created_by) VALUES
  ('sc111111-1111-1111-1111-111111111111', 'pj111111-1111-1111-1111-111111111111', 'Action Sequence Shoot', 'High-intensity fight scene at Marina Beach', '2025-11-15', '06:00:00', '18:00:00', 'Marina Beach, Chennai', 'pr111111-1111-1111-1111-111111111111'),
  ('sc222222-2222-2222-2222-222222222222', 'pj111111-1111-1111-1111-111111111111', 'Dialogue Rehearsal', 'Practice key emotional scenes', '2025-11-20', '10:00:00', '16:00:00', 'Studio 5, AVM Productions', 'pr111111-1111-1111-1111-111111111111'),
  ('sc333333-3333-3333-3333-333333333333', 'pj222222-2222-2222-2222-222222222222', 'Music Recording Session', 'Record background score and songs', '2025-12-05', '14:00:00', '20:00:00', 'AR Rahman Studio, Chennai', 'pr222222-2222-2222-2222-222222222222');

-- Insert schedule members
INSERT INTO schedule_members (schedule_id, profile_id, status) VALUES
  ('sc111111-1111-1111-1111-111111111111', 'pa111111-1111-1111-1111-111111111111', 'accepted'),
  ('sc111111-1111-1111-1111-111111111111', 'pa222222-2222-2222-2222-222222222222', 'accepted'),
  ('sc222222-2222-2222-2222-222222222222', 'pa111111-1111-1111-1111-111111111111', 'pending'),
  ('sc333333-3333-3333-3333-333333333333', 'pa333333-3333-3333-3333-333333333333', 'accepted');

-- Insert sample posts
INSERT INTO posts (id, author_profile_id, image_url, caption, likes_count, comments_count, created_at) VALUES
  ('po111111-1111-1111-1111-111111111111', 'pa111111-1111-1111-1111-111111111111', 'https://via.placeholder.com/800x600/3498db/FFFFFF?text=Behind+the+Scenes', 'Just wrapped an intense action sequence! 💪 #TamilCinema #ActionMode', 45, 12, now() - INTERVAL '2 days'),
  ('po222222-2222-2222-2222-222222222222', 'pa222222-2222-2222-2222-222222222222', 'https://via.placeholder.com/800x600/e74c3c/FFFFFF?text=Dance+Rehearsal', 'Perfecting the moves for the grand finale! 💃✨ #DanceLife #TamilFilms', 78, 23, now() - INTERVAL '1 day'),
  ('po333333-3333-3333-3333-333333333333', 'pa333333-3333-3333-3333-333333333333', 'https://via.placeholder.com/800x600/2ecc71/FFFFFF?text=Music+Studio', 'Late night music sessions are the best! 🎵🎹 #MusicProducer #TamilMusic', 92, 18, now() - INTERVAL '5 hours'),
  ('po444444-4444-4444-4444-444444444444', 'pr111111-1111-1111-1111-111111111111', 'https://via.placeholder.com/800x600/f39c12/FFFFFF?text=Project+Announcement', 'Excited to announce our new Tamil action blockbuster! Auditions starting soon. 🎬 #CastingCall #TamilCinema', 156, 34, now() - INTERVAL '12 hours');

-- Insert post comments
INSERT INTO post_comments (post_id, author_profile_id, content, created_at) VALUES
  ('po111111-1111-1111-1111-111111111111', 'pa222222-2222-2222-2222-222222222222', 'Amazing work Rajesh! Can''t wait to see the final cut! 🔥', now() - INTERVAL '1 day'),
  ('po111111-1111-1111-1111-111111111111', 'pa333333-3333-3333-3333-333333333333', 'That was epic! Great job on set yesterday.', now() - INTERVAL '20 hours'),
  ('po222222-2222-2222-2222-222222222222', 'pa111111-1111-1111-1111-111111111111', 'Your dance moves are incredible Priya! 👏', now() - INTERVAL '18 hours'),
  ('po333333-3333-3333-3333-333333333333', 'pr222222-2222-2222-2222-222222222222', 'The music is sounding fantastic Kumar! Keep it up!', now() - INTERVAL '4 hours');

-- Insert post likes
INSERT INTO post_likes (post_id, profile_id) VALUES
  ('po111111-1111-1111-1111-111111111111', 'pa222222-2222-2222-2222-222222222222'),
  ('po111111-1111-1111-1111-111111111111', 'pa333333-3333-3333-3333-333333333333'),
  ('po111111-1111-1111-1111-111111111111', 'pr111111-1111-1111-1111-111111111111'),
  ('po222222-2222-2222-2222-222222222222', 'pa111111-1111-1111-1111-111111111111'),
  ('po222222-2222-2222-2222-222222222222', 'pa333333-3333-3333-3333-333333333333'),
  ('po333333-3333-3333-3333-333333333333', 'pa111111-1111-1111-1111-111111111111'),
  ('po333333-3333-3333-3333-333333333333', 'pa222222-2222-2222-2222-222222222222'),
  ('po444444-4444-4444-4444-444444444444', 'pa111111-1111-1111-1111-111111111111');

-- Insert sample conversations
INSERT INTO conversations (id, is_group, name, created_by) VALUES
  ('cv111111-1111-1111-1111-111111111111', false, NULL, 'pa111111-1111-1111-1111-111111111111'),
  ('cv222222-2222-2222-2222-222222222222', false, NULL, 'pa222222-2222-2222-2222-222222222222'),
  ('cv333333-3333-3333-3333-333333333333', true, 'Action Blockbuster Team', 'pr111111-1111-1111-1111-111111111111');

-- Insert conversation members
INSERT INTO conversation_members (conversation_id, profile_id, is_admin) VALUES
  -- One-on-one: Rajesh and Suresh
  ('cv111111-1111-1111-1111-111111111111', 'pa111111-1111-1111-1111-111111111111', false),
  ('cv111111-1111-1111-1111-111111111111', 'pr111111-1111-1111-1111-111111111111', false),
  -- One-on-one: Priya and Kumar
  ('cv222222-2222-2222-2222-222222222222', 'pa222222-2222-2222-2222-222222222222', false),
  ('cv222222-2222-2222-2222-222222222222', 'pa333333-3333-3333-3333-333333333333', false),
  -- Group: Action Blockbuster Team
  ('cv333333-3333-3333-3333-333333333333', 'pr111111-1111-1111-1111-111111111111', true),
  ('cv333333-3333-3333-3333-333333333333', 'pa111111-1111-1111-1111-111111111111', false),
  ('cv333333-3333-3333-3333-333333333333', 'pa222222-2222-2222-2222-222222222222', false);

-- Insert sample messages
INSERT INTO messages (conversation_id, sender_profile_id, content, created_at, delivered) VALUES
  -- Conversation 1: Rajesh and Suresh
  ('cv111111-1111-1111-1111-111111111111', 'pr111111-1111-1111-1111-111111111111', 'Hi Rajesh! Hope you''re doing well. I wanted to discuss the upcoming action sequence shoot.', now() - INTERVAL '3 hours', true),
  ('cv111111-1111-1111-1111-111111111111', 'pa111111-1111-1111-1111-111111111111', 'Hey Suresh! Yes, I''m ready. What are the details?', now() - INTERVAL '2 hours 50 minutes', true),
  ('cv111111-1111-1111-1111-111111111111', 'pr111111-1111-1111-1111-111111111111', 'We''ll be shooting at Marina Beach on Nov 15th. Early morning call time at 6 AM.', now() - INTERVAL '2 hours 45 minutes', true),
  ('cv111111-1111-1111-1111-111111111111', 'pa111111-1111-1111-1111-111111111111', 'Perfect! I''ll be there. Do I need to bring any specific gear?', now() - INTERVAL '2 hours 30 minutes', true),
  ('cv111111-1111-1111-1111-111111111111', 'pr111111-1111-1111-1111-111111111111', 'The action choreographer will provide everything. Just come prepared physically! 💪', now() - INTERVAL '2 hours 20 minutes', true),
  -- Conversation 2: Priya and Kumar
  ('cv222222-2222-2222-2222-222222222222', 'pa222222-2222-2222-2222-222222222222', 'Kumar! Your music compositions are amazing! 🎵', now() - INTERVAL '1 day', true),
  ('cv222222-2222-2222-2222-222222222222', 'pa333333-3333-3333-3333-333333333333', 'Thank you Priya! Your dance performances inspire me to create better music!', now() - INTERVAL '23 hours', true),
  ('cv222222-2222-2222-2222-222222222222', 'pa222222-2222-2222-2222-222222222222', 'We should collaborate on something soon!', now() - INTERVAL '22 hours', true),
  -- Group conversation: Action Blockbuster Team
  ('cv333333-3333-3333-3333-333333333333', 'pr111111-1111-1111-1111-111111111111', 'Welcome everyone to the Action Blockbuster project group! 🎬', now() - INTERVAL '5 days', true),
  ('cv333333-3333-3333-3333-333333333333', 'pa111111-1111-1111-1111-111111111111', 'Excited to be part of this project!', now() - INTERVAL '5 days' + INTERVAL '10 minutes', true),
  ('cv333333-3333-3333-3333-333333333333', 'pa222222-2222-2222-2222-222222222222', 'Looking forward to working with this amazing team! 🙌', now() - INTERVAL '5 days' + INTERVAL '20 minutes', true),
  ('cv333333-3333-3333-3333-333333333333', 'pr111111-1111-1111-1111-111111111111', 'First schedule shoot details have been posted. Check your schedules section!', now() - INTERVAL '3 days', true),
  ('cv333333-3333-3333-3333-333333333333', 'pa111111-1111-1111-1111-111111111111', 'Got it! I''ve marked my calendar. See you all on set!', now() - INTERVAL '3 days' + INTERVAL '30 minutes', true);

-- Insert presence records (some users online/typing)
INSERT INTO presence (conversation_id, profile_id, last_seen_at, is_typing) VALUES
  ('cv111111-1111-1111-1111-111111111111', 'pa111111-1111-1111-1111-111111111111', now() - INTERVAL '30 seconds', false),
  ('cv111111-1111-1111-1111-111111111111', 'pr111111-1111-1111-1111-111111111111', now() - INTERVAL '10 minutes', false),
  ('cv333333-3333-3333-3333-333333333333', 'pr111111-1111-1111-1111-111111111111', now() - INTERVAL '1 minute', false);

-- Insert project applications
INSERT INTO project_applications (project_id, artist_profile_id, status, cover_letter, portfolio_link, applied_at) VALUES
  -- Applications for Tamil Action Blockbuster 2025 (using post ID as project_id since posts can be projects)
  ('po444444-4444-4444-4444-444444444444', 'pa222222-2222-2222-2222-222222222222', 'pending', 'I am very interested in this action project. I have experience in dance choreography and would love to contribute to the action sequences.', 'https://portfolio.priyasharma.com', now() - INTERVAL '2 days'),
  ('po444444-4444-4444-4444-444444444444', 'pa333333-3333-3333-3333-333333333333', 'accepted', 'As a music director, I would like to compose the background score for this action thriller. My previous work includes several successful Tamil films.', 'https://music.kumarnatarajan.com', now() - INTERVAL '3 days'),
  
-- Additional sample users and profiles for more realistic data
INSERT INTO users (id, phone, email) VALUES
  ('a4444444-4444-4444-4444-444444444444', '+919876000006', 'meera.artist@example.com'),
  ('a5555555-5555-5555-5555-555555555555', '+919876000007', 'arjun.artist@example.com'),
  ('r3333333-3333-3333-3333-333333333333', '+919876000008', 'kavitha.recruiter@example.com');

INSERT INTO profiles (id, user_id, role, first_name, last_name, alt_phone, maa_associative_number, gender, department, state, city, profile_photo_url, company_id) VALUES
  ('pa444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'artist', 'Meera', 'Krishnan', '+919876100006', 'MAA-2023-004', 'Female', 'Acting', 'Tamil Nadu', 'Madurai', 'https://i.pravatar.cc/150?img=9', NULL),
  ('pa555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'artist', 'Arjun', 'Reddy', '+919876100007', 'MAA-2023-005', 'Male', 'Cinematography', 'Tamil Nadu', 'Salem', 'https://i.pravatar.cc/150?img=15', NULL),
  ('pr333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333', 'recruiter', 'Kavitha', 'Raman', '+919876100008', 'Female', 'Talent Management', 'Tamil Nadu', 'Trichy', 'https://i.pravatar.cc/150?img=21', '11111111-1111-1111-1111-111111111111');

-- More project applications with the new profiles
INSERT INTO project_applications (project_id, artist_profile_id, status, cover_letter, portfolio_link, applied_at) VALUES
  ('po444444-4444-4444-4444-444444444444', 'pa444444-4444-4444-4444-444444444444', 'pending', 'I have been acting in Tamil cinema for 5 years and would love to be part of this action blockbuster. I am comfortable with action sequences and stunts.', 'https://acting.meerakrishnan.com', now() - INTERVAL '1 day'),
  ('po444444-4444-4444-4444-444444444444', 'pa555555-5555-5555-5555-555555555555', 'rejected', 'As a cinematographer, I would like to work on the visual storytelling of this action film. I specialize in high-octane action sequences.', 'https://cinema.arjunreddy.com', now() - INTERVAL '4 days');

-- Additional social links for new profiles
INSERT INTO social_links (profile_id, platform, url, order_index) VALUES
  ('pa444444-4444-4444-4444-444444444444', 'instagram', 'https://instagram.com/meera.krishnan', 1),
  ('pa444444-4444-4444-4444-444444444444', 'twitter', 'https://twitter.com/meerakrishnan', 2),
  ('pa555555-5555-5555-5555-555555555555', 'website', 'https://arjunreddy.photography', 1),
  ('pa555555-5555-5555-5555-555555555555', 'linkedin', 'https://linkedin.com/in/arjunreddy', 2);

-- Additional posts from new profiles
INSERT INTO posts (id, author_profile_id, image_url, caption, likes_count, comments_count, created_at) VALUES
  ('po555555-5555-5555-5555-555555555555', 'pa444444-4444-4444-4444-444444444444', 'https://via.placeholder.com/800x600/9b59b6/FFFFFF?text=Acting+Workshop', 'Just completed an intensive acting workshop! Ready for new challenges 🎭 #ActingLife #TamilCinema', 34, 8, now() - INTERVAL '6 hours'),
  ('po666666-6666-6666-6666-666666666666', 'pa555555-5555-5555-5555-555555555555', 'https://via.placeholder.com/800x600/34495e/FFFFFF?text=Cinematography', 'Capturing the beauty of Tamil Nadu through my lens 📸 #Cinematography #TamilNadu', 67, 15, now() - INTERVAL '8 hours');

