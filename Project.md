## TurfsKE — Project Handoff Document

### What TurfsKE Is

TurfsKE is a two-sided mobile marketplace for football turf bookings in Kenya. It connects turf managers (who list and manage football facilities) with players (who discover and book pitches). Built as a group computer science project by five JKUAT BBIT students with a June 2026 deadline.

**Team:** Mark Mwendwa Nthei, Yvonne Wambura, Stephane Wangari, Zuni Namelok, Dancun Philip

### Tech Stack

LayerTechnologyFrontendReact Native, Expo SDK 54, TypeScript, Expo RouterBackendRuby on Rails 8 API-onlyDatabasePostgreSQLAuthDevise + devise-jwtImage StorageActive Storage + Google Cloud StorageState ManagementZustand + expo-secure-storeFontsInter (Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold)NavigationExpo Router file-based routing

### Brand Tokens

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GREEN_DARK   = "#004440"  GREEN_LIGHT  = "#C7E976"  GREEN_MID    = "#1A6B45"  WHITE        = "#FFFFFF"  OFF_WHITE    = "#F5F5F0"  GREY_LIGHT   = "#E8E4DC"  TEXT_PRIMARY = "#2D2A2A"  TEXT_MUTED   = "#9CA3AF"  DANGER       = "#DC2626"   `

### Project Structure

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   TURFSKE_FRONTED/  └── src/      ├── app/      │   ├── _layout.tsx               # Root Stack, loads Inter fonts + auth on mount      │   ├── index.tsx                 # Redirects to /splash      │   ├── splash/index.tsx      │   ├── (auth)/                   # Auth screens — DO NOT TOUCH      │   │   ├── _layout.tsx      │   │   ├── confirm/index.tsx      │   │   ├── manager/signup/index.tsx      │   │   ├── manager/login/index.tsx      │   │   ├── player/signup/index.tsx      │   │   └── player/login/index.tsx      │   ├── (manager)/      │   │   ├── _layout.tsx           # Bottom tab navigator (4 tabs)      │   │   ├── dashboard/index.tsx      │   │   ├── my-turfs/index.tsx      │   │   ├── add-turf/index.tsx    # 6-step multi-step form      │   │   ├── bookings/index.tsx    # stub      │   │   └── profile/index.tsx     # stub      │   └── (player)/      │       ├── _layout.tsx           # Floating pill tab bar (4 tabs)      │       ├── home/index.tsx        # Discovery screen      │       ├── activity/index.tsx    # stub      │       ├── bookings/index.tsx    # stub      │       ├── profile/index.tsx     # stub      │       └── turf/[id].tsx         # Venue detail screen      ├── components/      │   ├── common/      │   │   ├── Logo.tsx      │   │   └── AppHeader.tsx         # Shared green header used on all screens      │   └── ui/      │       └── Button.tsx      ├── services/      │   ├── api.js                    # All API functions      │   └── apiConfig.js              # Dynamic API base URL resolution      ├── store/      │   ├── authStore.ts              # Zustand + expo-secure-store      │   └── managerStore.ts           # Venue list state      └── theme/          ├── index.js          ├── colors.js          ├── typography.js             # Inter font families and sizes          └── spacing.js   `

### Database Schema (8 tables — DO NOT modify migrations)

#### users

- id, email, encrypted_password, first_name, last_name, phone_number
- jti (JWT ID for token revocation)
- roles — PostgreSQL array: \["player"\] or \["manager"\]
- confirmation_token, confirmed_at, reset_password_token

#### turf_venues

- id, user_id (FK → manager), name, description, full_address, county, landmark
- latitude, longitude, contact_phone, whatsapp_number, contact_email
- paystack_reference, status (draft/active/inactive)
- has_many_attached :images via Active Storage

#### turves (Rails pluralization of Turf)

- id, turf_venue_id, name, surface_type (artificial/natural/both)
- pitch_format (5-a-side/7-a-side/11-a-side)
- pitch_length_m, pitch_width_m, price_per_hour, peak_price, peak_from, peak_to
- min_booking_minutes, slot_duration_minutes, buffer_minutes
- auto_approve (boolean), status (active/inactive)

#### amenities

- id, turf_venue_id
- Boolean columns: showers, toilets, floodlights, ball_provided, free_parking, drinking_water, bibs_vests, spectator_seating, canteen, referee, cctv, wifi, first_aid, changing_rooms
- extra_notes (text)

#### turf_availabilities

- id, turf_id, day_of_week (0=Monday to 6=Sunday)
- is_open (boolean), open_time, close_time

#### bookings

- id, turf_id, player_id, reference_number
- slot_date, start_time, end_time, duration_hours, amount_kes
- status (pending/approved_awaiting_payment/confirmed/cancelled)
- cancel_reason, cancelled_by
- Unique index: \[turf_id, slot_date, start_time\] where status IN (pending, confirmed)

#### payments

- id, turf_venue_id, user_id, payment_type
- amount_kobo, currency, paystack_reference, paystack_transaction_id
- channel, status, paystack_metadata (JSONB), paid_at

#### reviews

- id, turf_id, booking_id, player_id, rating (1-5), comment

### All API Endpoints

#### Auth (DO NOT TOUCH — fully working)

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   POST   /players/signup  POST   /players/login  DELETE /players/logout  POST   /players/password  PUT    /players/password  POST   /managers/signup  POST   /managers/login  DELETE /managers/logout  POST   /managers/password  PUT    /managers/password  POST   /auth/confirmation  POST   /auth/confirmation/resend  GET    /auth/confirmation  GET    /test_auth   `

#### Manager Endpoints

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET    /managers/turf_venues  GET    /managers/turf_venues/:id  POST   /managers/turf_venues  POST   /managers/turf_venues/complete_create    # transactional: venue+amenity+turf+availability+images  PUT    /managers/turf_venues/:id  DELETE /managers/turf_venues/:id  POST   /managers/turf_venues/:id/upload_images  DELETE /managers/turf_venues/:id/delete_image/:image_id  GET    /managers/turf_venues/:turf_venue_id/amenity  POST   /managers/turf_venues/:turf_venue_id/amenity  GET    /managers/turf_venues/:turf_venue_id/turfs  GET    /managers/turf_venues/:turf_venue_id/turfs/:id  POST   /managers/turf_venues/:turf_venue_id/turfs  PUT    /managers/turf_venues/:turf_venue_id/turfs/:id  DELETE /managers/turf_venues/:turf_venue_id/turfs/:id  GET    /managers/turf_venues/:turf_venue_id/turfs/:turf_id/availability  POST   /managers/turf_venues/:turf_venue_id/turfs/:turf_id/availability   `

#### Player Endpoints

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET    /players/turf_venues        # list active venues, Haversine distance sort  GET    /players/turf_venues/:id    # venue detail with turfs + amenities   `

### Key Implementation Details

#### Auth Flow

- Devise + JWT. Token stored in expo-secure-store via Zustand authStore
- JWT expires in 10 days. JTI revocation on logout and password change
- Login accepts email OR phone_number via unified :login param
- setAuth is synchronous state update + async background SecureStore write
- 401 responses auto-clear auth and redirect to login

#### complete_create Endpoint (CRITICAL)

Single transactional POST that creates venue + amenity + turf + availability + uploads images.Frontend sends nested FormData: venue\[name\], amenity\[showers\], turf\[name\], availability\[0\]\[day_of_week\], images.Backend uses params.require(:venue).permit(...) pattern.Images are attached OUTSIDE the transaction so venue creation is not blocked by upload failures.

#### Image Upload — Cross-Platform Fix

javascript

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML``   // Web: convert to Blob  const response = await fetch(img.uri);  const blob = await response.blob();  formData.append("images", blob, `image_${i}.jpg`);  // Native: use object format  formData.append("images", { uri: img.uri.replace("file://",""), name: "image.jpg", type: "image/jpeg" });  // Detection:  if (typeof document !== "undefined") { /* web */ } else { /* native */ }   ``

#### Image URLs

API returns relative paths: /rails/active_storage/blobs/...Always prepend API base URL from apiConfig.js before passing to .

#### Distance Sorting

No PostGIS — uses Haversine formula in raw SQL for player venue discovery endpoint.

#### Add Turf Form (CRITICAL — keyboard fix)

Step render functions MUST be plain function calls renderBasicInfo() NOT React components . Inner components cause keyboard dismissal on every keystroke because React sees new function references on every render and unmounts/remounts the inputs.

#### Navigation After Form Submit

Use router.replace("/(manager)/dashboard") NOT router.navigate(). The replace call correctly pops the add-turf screen and lands on the dashboard tab.

#### surface_type Case

Frontend pills show "Artificial"/"Natural"/"Both". Must call .toLowerCase() before sending to Rails because the model validates against %w\[artificial natural both\].

#### Geolocation (Add Turf Screen)

On mount: show location permission modal → user taps Allow → Location.requestForegroundPermissionsAsync() → getCurrentPositionAsync() → auto-fills latitude/longitude → reverseGeocodeAsync() pre-fills county.

#### Player Location Display (Home Screen)

Uses Nominatim reverse geocoding API (free, no API key):

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   GET https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}  Headers: { "User-Agent": "TurfsKE/1.0" }   `

Extracts address.neighbourhood + address.city to display e.g. "Hunters, Nairobi".

#### Tab Bar Padding

The floating player tab bar is position: absolute. All FlatList/ScrollView content needs paddingBottom: 110 so the last item is not hidden behind the bar.

### Manager Tab Navigator (src/app/(manager)/\_layout.tsx)

- Standard bottom tabs, NOT floating
- Tabs: Dashboard (grid), My Turfs (football), Bookings (calendar), Profile (person)
- Add Turf has href: null — accessed via router.push("/(manager)/add-turf")
- Active color: #004440, inactive: #9CA3AF

### Player Tab Navigator (src/app/(player)/\_layout.tsx)

- Floating pill bar: position: absolute, bottom: 16/24, borderRadius: 36
- Custom TabItem component renders icon + label inside a pill View
- Active pill: backgroundColor: "#D8F3DF", border #CFEBD5
- tabBarShowLabel: false — label rendered inside custom TabItem
- Turf detail screen \[id\] has href: null and tabBarStyle: { display: "none" }

### Shared AppHeader Component (src/components/common/AppHeader.tsx)

Used on ALL screens. Always on GREEN_DARK background.

- Left: Primary Logo (light/white variant)
- Right: Bell icon (notifications-outline, WHITE) + Avatar circle (GREEN_MID bg, GREEN_LIGHT border, initials in WHITE Inter_700Bold)
- NOT used on turf detail screen (that screen has full-bleed image header instead)

### Payment Architecture (DESIGNED, NOT YET IMPLEMENTED)

#### Model

Marketplace split using Paystack Sub-accounts.

- Each manager has a paystack_subaccount_code on their user record
- TurfsKE takes ~8% commission, manager receives ~92%
- Paystack handles the split automatically on each transaction

#### Planned Booking Payment Flow

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   Player requests slot → booking status: "pending"  Manager approves → booking status: "approved_awaiting_payment"  Player receives FCM notification → opens app → taps "Pay Now"  Backend initiates Paystack STK Push to player's phone  Player completes M-Pesa payment  Paystack webhook fires → backend confirms payment  Paystack splits: 92% → manager bank, 8% → TurfsKE balance  Booking status → "confirmed"  Both parties receive FCM notification   `

#### What Still Needs Building

- Manager bank details collection screen (Profile tab)
- Paystack sub-account creation endpoint
- Booking request flow (player side — slot selection UI)
- Payment initiation endpoint
- Paystack webhook handler for booking payments
- FCM push notifications
- Manager booking approval dashboard
- Player booking history screen
- Reviews system
- Production deployment (Railway or Render)

### Development Setup

#### Backend

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   cd TURFSKE_API  bundle install  rails db:create db:migrate  rails server  # runs on port 3000   `

#### Ngrok (for Paystack webhooks in development)

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   ngrok http 3000   # NOT ngrok https 3000   `

Copy the https://xxx.ngrok-free.app URL → paste into Paystack dashboard webhook URL.Note: URL changes every restart on free plan — update Paystack dashboard each time.

#### Frontend

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   cd TURFSKE_FRONTED  npm install  npx expo start   `

#### Environment Variables (Backend)

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   PAYSTACK_SECRET_KEY=sk_test_xxx  PAYSTACK_CALLBACK_URL=https://xxx.ngrok-free.app/paystack/webhook   `

#### GCS Credentials

Place config/gcs.json (Google Cloud service account JSON) in the Rails config directory.config/storage.yml points to turfske bucket.

### What Is Complete

- Auth system (Devise + JWT, player/manager, email confirmation, password reset)
- Database schema (8 tables, all migrations)
- Active Storage + GCS image uploads
- complete_create transactional endpoint
- Manager CRUD for venues, turfs, amenities, availability
- Player venue discovery endpoint (Haversine)
- Add Turf 6-step form with geolocation auto-fill
- Manager tab navigator
- Player home discovery screen with reverse geocoding
- Player floating tab bar
- Turf detail screen with sticky reserve button
- Zustand auth persistence
- AppHeader shared component
- Full UI revamp (green header zones, consistent brand)

### Do Not Touch

- Anything inside src/app/(auth)/
- app/controllers/auth/ (Rails)
- app/controllers/managers/sessions_controller.rb
- app/controllers/managers/registrations_controller.rb
- app/controllers/players/sessions_controller.rb
- app/controllers/players/registrations_controller.rb
- app/controllers/application_controller.rb
- config/initializers/devise.rb
- Any migration files
