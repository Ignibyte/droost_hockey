# Source audit

http://localhost:5199/ and the files in `/var/www/html/design/KC-Hockey-Hub`, read 2026-10-21T02:16:09.061Z.

## Routes

| Id | Status | Declared | Note |
|---|---|---|---|
| `r:/` | 200 | yes |  |
| `r:/camps` | 200 | yes |  |
| `r:/rinks` | 200 | yes |  |
| `r:/private-lessons` | 200 | yes |  |
| `r:/new-to-hockey` | 200 | yes |  |
| `r:/youth-leagues` | 200 | yes |  |
| `r:/adult-leagues` | 200 | yes |  |
| `r:/contact` | 200 | yes |  |

## Frame

Header: KC Hockey → / · Home → / · Camps & Clinics → /camps · Private Lessons → /private-lessons · KC Rinks → /rinks · New to Hockey → /new-to-hockey · Youth Leagues → /youth-leagues · Adult Leagues → /adult-leagues · Contact Us → /contact

Footer: KC Hockey → / · (icon) → / · (icon) → / · (icon) → / · Camps & Clinics → /camps · Private Lessons → /private-lessons · KC Rink Directory → /rinks · New to Hockey → /new-to-hockey · Youth Leagues → /youth-leagues · Adult Leagues → /adult-leagues · info@kchockey.com → mailto:info@kchockey.com · (816) 555-0199 → tel:+18165550199 · Privacy Policy → / · Terms of Service → /

## Typefaces

- Inter, on 425 text(s): drawn
- Oswald, on 216 text(s): drawn

## `p:/` — KC Hockey

Sections: `p:/#s1` Kansas City's Ice Headquarters · `p:/#s2` (Next USAH Level 1 Clinic: Oct 4-5 Adult …) · `p:/#s3` Summer Power Skating Camp [shows d:artifacts/kchockey/src/data/mock-data.ts#CAMPS@camp-1] · `p:/#s4` Upcoming Action · `p:/#s5` Find Your Ice

- `p:/#r1` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/#r2` chips, 6 in main
  - 1. text (the same in every item) [date]: "Next USAH Level 1 Clinic: Oct 4-5"
  - 2. text (the same in every item): "Adult League Reg Open"
  - 3. text (the same in every item): "Fall Puck Dev Clinic filling fast!"
- `p:/#r3` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- `p:/#r4` items, 3 in main
  - 1. text: "Date", "Location", "Ages"
  - 2. text: "July 28–Aug 1", "Pepsi Ice Midwest", "8–14"
- `p:/#r5` cards, 3 in main, also p:/camps#r3
  - renders `d:artifacts/kchockey/src/data/mock-data.ts#CAMPS` (3 of its records)
  - 1. heading = title: "Goalie Clinic", "Back-to-School Skills Camp", "Fall Puck Development Clinic"
  - 2. text = location: "Central Park Ice Arena", "Cable Dahmer Arena", "Pepsi Ice Midwest"
  - 3. text (the same in every item): "Date"
  - 4. text [date] = date: "Aug 10", "Aug 18–22", "Sept 6"
  - 5. text (the same in every item): "Ages"
  - 6. text [range] = ages: "10–18", "6–16", "12–18"
  - 7. text (the same in every item): "Level"
  - 8. text = skillLevel: "Intermediate/Advanced", "Beginner/Intermediate", "Advanced"
  - 9. text (the same in every item): "Price"
  - 10. text [price] = price: "$95", "$250", "$85"
  - 11. link (the same in every item): "Details" → /camps
- `p:/#r6` cards, 3 in main, also p:/rinks#r1
  - renders `d:artifacts/kchockey/src/data/mock-data.ts#RINKS` (3 of its records)
  - 1. heading = name: "Pepsi Ice Midwest", "Cable Dahmer Arena", "Central Park Ice Arena"
  - 2. text = city: "Overland Park , KS", "Independence , MO", "Kansas City , MO"
  - 3. list = amenities: "NHL Sheet | Pro Shop | Lessons", "Professional Venue | Event Seating | Concessions", "Public Skate | Learn-to-Skate | Youth Leagues"
  - 4. link (the same in every item): "View Rink" → /rinks

## `p:/camps` — KC Hockey

Sections: `p:/camps#s1` Camps & Clinics · `p:/camps#s2` Summer Power Skating Camp

- `p:/camps#r1` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/camps#r2` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- `p:/camps#r3` cards, 5 in main, also p:/#r5
  - renders `d:artifacts/kchockey/src/data/mock-data.ts#CAMPS` (5 of its records)
  - 1. heading = title: "Goalie Clinic", "Back-to-School Skills Camp", "Fall Puck Development Clinic", "Adult Hockey League Showcase"
  - 2. text [date] = date: "Aug 10", "Aug 18–22", "Sept 6", "Sept 14"
  - 3. text = location: "Central Park Ice Arena", "Cable Dahmer Arena", "Pepsi Ice Midwest", "Twin Rinks Ice Pavilion"
  - 4. text (the same in every item): "Ages:"
  - 5. text = ages: "10–18", "6–16", "12–18", "18+"
  - 6. text (the same in every item): "Level:"
  - 7. text = skillLevel: "Intermediate/Advanced", "Beginner/Intermediate", "Advanced", "All Levels"
  - 8. text = price: "$95", "$250", "$85", "FREE"
  - 9. button (the same in every item): "Register"
- `p:/camps#r4` buttons, 4 in main
  - 1. button: "All Events", "Youth Hockey", "Adult/Coaches", "Goalies"

## `p:/rinks` — KC Hockey

Sections: `p:/rinks#s1` KC Rink Directory · `p:/rinks#s2` Find your sheet.

- `p:/rinks#r1` cards, 8 in main, also p:/#r6
  - renders `d:artifacts/kchockey/src/data/mock-data.ts#RINKS` (8 of its records)
  - 1. heading = name: "Pepsi Ice Midwest", "Cable Dahmer Arena", "Central Park Ice Arena", "Twin Rinks Ice Pavilion"
  - 2. text = city: "Overland Park , KS", "Independence , MO", "Kansas City , MO", "Liberty , MO"
  - 3. text = description: "A premier facility offering a full NHL sheet, dedicated pro ", "Home of the ECHL's Kansas City Mavericks. A professional ven", "The heart of KC's recreational skating. Great for families, ", "A massive dual-sheet facility hosting the region's largest t"
  - 4. text (the same in every item): "Amenities"
  - 5. list = amenities: "NHL Sheet | Pro Shop | Lessons | Leagues", "Professional Venue | Event Seating | Concessions | Team Stor", "Public Skate | Learn-to-Skate | Youth Leagues | Snack Bar", "Two Sheets | Tournaments | Figure Skating | Meeting Rooms"
  - 6. text [phone] = phone: "(913) 555-0101", "(816) 555-0202", "(816) 555-0303", "(816) 555-0404"
  - 7. link = website: "Visit Website" → https://example.com/pepsi-ice, https://example.com/cable-dahmer, https://example.com/central-park, https://example.com/twin-rinks, https://example.com/olathe-ice, https://example.com/blade-runners
- `p:/rinks#r2` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/rinks#r3` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- embeds: www.google.com

## `p:/private-lessons` — KC Hockey

Sections: `p:/private-lessons#s1` Private Lessons · `p:/private-lessons#s2` Coach Mike Donovan

- `p:/private-lessons#r1` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/private-lessons#r2` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- `p:/private-lessons#r3` chips, 4 in main, also p:/new-to-hockey#r5, p:/youth-leagues#r6, p:/adult-leagues#r5
  - 1. text: "Former ECHL player", "15 years coaching", "Youth through adult", "Individual game plan"
- `p:/private-lessons#r4` cards, 4 in main
  - renders `d:artifacts/kchockey/src/data/mock-data.ts#COACHES` (4 of its records)
  - 1. text = imageFallback: "MD", "ST", "JR", "EV"
  - 2. text (the same in every item): "View Profile"
  - 3. heading = name: "Coach Mike Donovan", "Coach Sarah Tillman", "Coach Jake Reardon", "Coach Elena Voss"
  - 4. text = specialty: "Power skating specialist", "Youth development & learn-to-skate", "Goalie coach", "Figure skating & edge work"
  - 5. text = experience: "15 years coaching, former ECHL player", "USAH certified Level 4", "Former D1 college goalie", "ISU certified, crossover training expert"
  - 6. text (the same in every item): "All Ages & Skill Levels"
  - 7. text (the same in every item): "Rate"
  - 8. text [price] = rate: "$ 75", "$ 60", "$ 80", "$ 65"
  - 9. text (the same in every item): "/hr"
  - 10. button (the same in every item): "Inquire"

## `p:/new-to-hockey` — KC Hockey

Sections: `p:/new-to-hockey#s1` New to Hockey? · `p:/new-to-hockey#s2` Find the ice

- `p:/new-to-hockey#r1` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/new-to-hockey#r2` cards, 6 in main, also p:/youth-leagues#r5, p:/adult-leagues#r3
  - renders `d:artifacts/kchockey/src/pages/new-to-hockey.tsx#faqs` (6 of its records)
  - 1. heading = question: "What age can my child start hockey?", "What equipment do we need to begin?", "Does my player need to know how to skate?", "How much does it cost to get started?"
  - 2. text = answer: "Most KC rinks welcome skaters as young as three through intr", "A helmet with a full face cage, skates, shoulder and elbow p", "Not at all. Hockey starts with skating, stopping, and feelin", "Introductory classes vary by rink, but most families can try"
- `p:/new-to-hockey#r3` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- `p:/new-to-hockey#r4` cards, 3 in main
  - renders `d:artifacts/kchockey/src/pages/new-to-hockey.tsx#firstSteps` (3 of its records)
  - 1. text [number]: "01", "02", "03"
  - 2. heading = title: "Find the ice", "Get fitted", "Take the first stride"
  - 3. text = text: "Start with a rink that offers learn-to-skate or beginner hoc", "Ask the rink about rental gear or a proper equipment fitting", "Book an intro class, clinic, or private lesson and have fun "
- `p:/new-to-hockey#r5` chips, 3 in main, also p:/private-lessons#r3, p:/youth-leagues#r6, p:/adult-leagues#r5
  - 1. text: "No skating experience required", "Rental gear is available at many rinks", "Programs for kids and adults"

## `p:/youth-leagues` — KC Hockey

Sections: `p:/youth-leagues#s1` Youth Leagues · `p:/youth-leagues#s2` A team for every stage.

- `p:/youth-leagues#r1` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/youth-leagues#r2` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- `p:/youth-leagues#r3` cards, 5 in main
  - renders `d:artifacts/kchockey/src/pages/youth-leagues.tsx#divisions` (5 of its records)
  - 1. heading = age: "Mite", "Squirt", "Peewee", "Bantam"
  - 2. text = ages: "6U–8U", "10U", "12U", "14U"
  - 3. text = description: "A welcoming introduction to team hockey with an emphasis on ", "Players build stronger fundamentals while learning positioni", "A faster pace with more tactical detail, helping players fin", "Players sharpen decision-making, systems, and physical confi"
  - 4. text = detail: "Half-ice games and skill-first practices", "Full-ice development and game play", "Competitive rec and travel pathways", "Team systems and skill development"
- `p:/youth-leagues#r4` items, 4 in main
  - 1. text: "5", "8+", "1", "100%"
  - 2. text: "Age pathways", "KC rinks", "Great first step", "Team energy"
- `p:/youth-leagues#r5` cards, 4 in main, also p:/new-to-hockey#r2, p:/adult-leagues#r3
  - renders `d:artifacts/kchockey/src/pages/youth-leagues.tsx#faqs` (4 of its records)
  - 1. heading = question: "Does my child need prior hockey experience?", "How are players placed on teams?", "What does a typical season include?", "Where can I find youth league registration?"
  - 2. text = answer: "No. Many players begin with learn-to-skate and introductory ", "Most programs use age group and a short evaluation skate to ", "A recreational season commonly includes weekly practices, sc", "Start with the rink directory to find a facility near you, t"
- `p:/youth-leagues#r6` chips, 3 in main, also p:/private-lessons#r3, p:/new-to-hockey#r5, p:/adult-leagues#r5
  - 1. text: "Beginner-friendly programs", "Certified coaches", "Rec and competitive paths"

## `p:/adult-leagues` — KC Hockey

Sections: `p:/adult-leagues#s1` Adult Leagues · `p:/adult-leagues#s2` A league for every level.

- `p:/adult-leagues#r1` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/adult-leagues#r2` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- `p:/adult-leagues#r3` cards, 4 in main, also p:/new-to-hockey#r2, p:/youth-leagues#r5
  - renders `d:artifacts/kchockey/src/pages/adult-leagues.tsx#faqs` (4 of its records)
  - 1. heading = question: "Do I need a full team to register?", "What equipment do adult players need?", "What level should I sign up for?", "Where are adult leagues played?"
  - 2. text = answer: "Not always. Many KC adult leagues accept individual free age", "Players should bring a properly fitted helmet with a full ca", "Be honest about your skating, pace, and playing experience. ", "Adult league games run at rinks across the metro, including "
- `p:/adult-leagues#r4` cards, 3 in main
  - renders `d:artifacts/kchockey/src/pages/adult-leagues.tsx#formats` (3 of its records)
  - 1. text = level: "All skill levels", "C / B level", "A / AA level"
  - 2. heading = title: "Recreational", "Intermediate", "Advanced"
  - 3. text = description: "Low-pressure games, new friends, and a reason to leave work ", "Competitive enough to matter and friendly enough to grab a d", "Fast, structured hockey for players who want a serious skate"
- `p:/adult-leagues#r5` chips, 3 in main, also p:/private-lessons#r3, p:/new-to-hockey#r5, p:/youth-leagues#r6
  - 1. text: "Sept 14", "Twin Rinks Ice Pavilion", "18+ · All levels"

## `p:/contact` — KC Hockey

Sections: `p:/contact#s1` Hit Us Up · `p:/contact#s2` Contact Info

- `p:/contact#r1` links, 7 in nav
  - 1. link: "Home", "Camps & Clinics", "Private Lessons", "KC Rinks" → /, /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues
- `p:/contact#r2` links, 6 in footer
  - 1. link: "Camps & Clinics", "Private Lessons", "KC Rink Directory", "New to Hockey" → /camps, /private-lessons, /rinks, /new-to-hockey, /youth-leagues, /adult-leagues
- `p:/contact#r3` chips, 4 in main
  - 1. text: "Camp Inquiry", "Private Lessons", "Rink Information", "Other"
- `p:/contact#r4` chips, 3 in main
  - 1. text: "Location", "Kansas City Metro Area", "We operate out of rinks across KC."
- `p:/contact#f1` form (Fire Away): Name [text, required]; Email [email, required]; Subject [select: Camp Inquiry/Private Lessons/Rink Information/Other]; Message [textarea, required]

## Data the files declare

- `d:artifacts/kchockey/src/data/mock-data.ts#Camp` interface: id: string, title: string, date: string, location: string, ages: string, skillLevel: string, price: number, featured: boolean?
- `d:artifacts/kchockey/src/data/mock-data.ts#Rink` interface: id: string, name: string, city: string, state: string, description: string, amenities: string[], phone: string, website: string
- `d:artifacts/kchockey/src/data/mock-data.ts#Coach` interface: id: string, name: string, specialty: string, experience: string, rate: number, imageFallback: string
- `d:artifacts/kchockey/src/data/mock-data.ts#CAMPS` records, 6 of Camp: id: string, title: string, date: string, location: string, ages: string, skillLevel: string, price: number, featured: boolean?
- `d:artifacts/kchockey/src/data/mock-data.ts#RINKS` records, 8 of Rink: id: string, name: string, city: string, state: string, description: string, amenities: string[], phone: string, website: string
- `d:artifacts/kchockey/src/data/mock-data.ts#COACHES` records, 4 of Coach: id: string, name: string, specialty: string, experience: string, rate: number, imageFallback: string
- `d:artifacts/kchockey/src/pages/adult-leagues.tsx#formats` records, 3: title, level, description, icon
- `d:artifacts/kchockey/src/pages/adult-leagues.tsx#faqs` records, 4: question, answer
- `d:artifacts/kchockey/src/pages/new-to-hockey.tsx#faqs` records, 6: question, answer
- `d:artifacts/kchockey/src/pages/new-to-hockey.tsx#firstSteps` records, 3: icon, title, text
- `d:artifacts/kchockey/src/pages/youth-leagues.tsx#divisions` records, 5: age, ages, description, detail
- `d:artifacts/kchockey/src/pages/youth-leagues.tsx#faqs` records, 4: question, answer
- `d:lib/api-spec/openapi.yaml#api` api: paths /healthz — a health check only: no content in this API

## Notes

- 1 database schema file(s) and no table: a template's empty schema
