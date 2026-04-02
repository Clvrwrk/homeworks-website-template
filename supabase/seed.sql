-- supabase/seed.sql
-- Seeds the 6 hardcoded projects from projects/index.astro and projects/[slug].astro
-- into the Supabase projects table.
--
-- Grandfathered: these 6 records are published despite before_photo_url being empty.
-- before_photo_url = '' (not null) — publish gate only applies to new records.

INSERT INTO projects (
  slug, status, title, category, neighborhood, community, location,
  summary, before_label, after_label, before_photo_url, after_photo_url,
  overview, challenge, result, scope_items, duration, scope, published_at
) VALUES

(
  'stonebridge-ranch-drywall',
  'published',
  'Stonebridge Ranch Drywall Restoration',
  'Drywall',
  'Stonebridge Ranch',
  'Stonebridge Ranch',
  'McKinney, TX 75069',
  'Water-damaged drywall in master bedroom — cut out, replaced, and textured to match.',
  'Water damage, sagging drywall',
  'Seamless repair, ready to paint',
  '',
  '/services/drywall.webp',
  'The homeowner noticed a soft, discolored section on the master bedroom ceiling following a slow roof leak. The damaged area had grown over several months before being addressed. We assessed the damage, identified and confirmed the leak source was fixed, then removed the compromised drywall, treated for mold, installed new drywall, applied joint compound in multiple coats, matched the original orange-peel texture, and primed — all in a single day.',
  'The original texture was a custom blend between orange-peel and knockdown — not a standard pattern. Matching it required testing three samples before landing on the right technique.',
  'The repaired area is completely invisible. The homeowner was unable to identify where the repair was made during the final walkthrough.',
  ARRAY['Removed 14 sq ft of water-damaged drywall', 'Mold treatment and prevention spray', 'New 5/8" drywall installed', 'Three-coat joint compound application', 'Orange-peel texture match', 'Primer coat applied, ready for paint'],
  '1 day',
  'Water-damaged drywall repair, texture match, prime',
  now()
),

(
  'craig-ranch-living-room',
  'published',
  'Craig Ranch Living Room Refresh',
  'Painting',
  'Craig Ranch',
  'Craig Ranch',
  'McKinney, TX 75070',
  'Full living room repaint with new accent wall, fresh trim, and updated fixtures.',
  'Dated paint, scuffed walls',
  'Clean, modern finish throughout',
  '',
  '/services/painting.webp',
  'This Craig Ranch family was ready to move on from the builder beige that came with their home. We prepped all surfaces — filled nail holes, caulked gaps at trim and ceiling, lightly sanded — then applied fresh primer before a full two-coat paint across walls and ceiling, plus a deep navy accent wall behind the sofa.',
  'The existing baseboard had numerous paint drips from prior work and needed sanding down before repainting. The accent wall color required three coats for full opacity.',
  'The room was transformed from builder standard to a polished, intentional space. The family said it felt like moving into a new home.',
  ARRAY['Surface prep: filling, caulking, sanding', 'Primer coat on all walls and ceiling', 'Two-coat wall paint (Sherwin-Williams Accessible Beige)', 'Three-coat deep navy accent wall', 'Trim and baseboard repainting', 'Touch-ups and final inspection'],
  '2 days',
  'Full room paint, accent wall, trim and baseboard repaint',
  now()
),

(
  'eldorado-bathroom-fixtures',
  'published',
  'Eldorado Master Bath Fixture Upgrade',
  'Plumbing',
  'Historic Downtown',
  'Eldorado',
  'McKinney, TX 75072',
  'All-new faucets, mirrors, light fixtures, and towel bars installed across master bath.',
  'Builder-grade fixtures',
  'Upgraded, cohesive look',
  '',
  '/services/plumbing.webp',
  'The homeowner had already selected all new fixtures — they just needed a skilled hand to install everything in one clean visit. We replaced both vanity faucets, installed a new frameless mirror, swapped out the light bar for a new matte black fixture, and installed coordinating towel bars, robe hooks, and toilet paper holders throughout.',
  'The existing light bar wiring was set at a non-standard height, requiring a new junction box to properly center the new fixture. The mirror weight also required stud location and appropriate wall anchors.',
  'A complete bathroom upgrade completed in a single day. The matte black hardware throughout the room creates a cohesive, intentional look.',
  ARRAY['Dual vanity faucet replacement', 'Frameless mirror installation (60x36)', 'Matte black vanity light bar install', 'New junction box for light centering', '6-piece hardware set install (towel bar, hooks, TP holder)', 'Cleanup and final inspection'],
  '1 day',
  'Faucet replacement, mirror installation, light fixtures, hardware',
  now()
),

(
  'allen-tv-mounting',
  'published',
  'Allen Home Theater Setup',
  'Electrical',
  'Westridge',
  'Twin Creeks',
  'Allen, TX 75013',
  '85" TV mounted on stone fireplace wall with full in-wall cable concealment.',
  'No TV mount, loose cables',
  'Clean wall-mount, zero visible cables',
  '',
  '/services/tv-mount.webp',
  'Mounting a large TV on a stone fireplace requires masonry anchors rated for the load, proper placement above the firebox, and careful planning for cable routing. We used a full-motion mount with masonry anchors, routed power and HDMI through the wall to an existing outlet below, and installed an in-wall cable management kit.',
  'The stone surface had uneven texture requiring custom shim plates to keep the mount perfectly level. The cable routing also needed to avoid a cross-brace inside the wall.',
  'An 85" TV perfectly positioned on a stone fireplace with zero visible cables — the installation looks custom-built.',
  ARRAY['Masonry anchor installation in stone', 'Full-motion mount (rated to 200 lbs)', 'In-wall HDMI and power routing', 'Custom shim plates for level installation', 'AV component shelf installation', 'Final calibration and test'],
  'Half day',
  '85" TV mount on stone fireplace, in-wall cable concealment',
  now()
),

(
  'frisco-crown-molding',
  'published',
  'Frisco Crown Molding Installation',
  'Carpentry',
  'Stonebridge Ranch',
  'Newman Village',
  'Frisco, TX 75034',
  'Crown molding installed throughout main floor — kitchen, dining, living, and hallways.',
  'No crown, flat walls',
  'Custom trim throughout',
  '',
  '/services/door.webp',
  'This Frisco homeowner wanted to elevate their builder-grade home with crown molding throughout the main living areas. We selected a 3.5" colonial profile to complement the 9-foot ceilings, cut all miters and copes precisely, installed with construction adhesive and finish nails, filled and caulked all joints, and left everything sanded and primer-ready.',
  'The hallways had multiple 45-degree turns that required compound miter cuts. One ceiling had a slight bow requiring careful scribing to keep the molding flush.',
  'The main floor feels custom and complete. Several guests assumed the molding was original to the home.',
  ARRAY['180 linear feet of 3.5" colonial crown', 'Coped joints at all inside corners', 'Mitered joints at all outside corners', 'Construction adhesive + 15-gauge finish nails', 'All joints filled, caulked, and sanded', 'Ready for paint'],
  '3 days',
  'Crown molding throughout main floor — kitchen, dining, living, hallways',
  now()
),

(
  'prosper-deck-restoration',
  'published',
  'Prosper Backyard Deck Restoration',
  'Outdoor',
  'Craig Ranch',
  'Windsong Ranch',
  'Prosper, TX 75078',
  'Pressure washed, repaired rotted boards, sanded, and stained a 400 sq ft cedar deck.',
  'Weathered, grey, damaged boards',
  'Restored, stained, and protected',
  '',
  '/services/painting.webp',
  'After 8 years of North Texas sun and rain, this cedar deck had gone grey, with several boards showing signs of rot and splitting. We pressure washed at appropriate pressure for wood, replaced 12 damaged boards, sanded the entire surface, and applied a semi-transparent cedar-tone deck stain.',
  'The deck had been stained previously with a solid color stain that needed to be fully stripped before the new semi-transparent stain could penetrate. This required an additional chemical stripping step.',
  'The deck looks better than it did when new. The homeowners said they''ll actually use it again now — they had been avoiding it.',
  ARRAY['Full deck pressure wash (appropriate PSI for cedar)', 'Chemical stain strip for old solid stain', '12 cedar board replacements', 'Full deck sanding (60 then 120 grit)', 'Two-coat semi-transparent cedar deck stain', 'Hardware tightening and inspection'],
  '2 days',
  'Pressure wash, board replacement, sand, stain entire 400 sq ft deck',
  now()
)

ON CONFLICT (slug) DO NOTHING;
