# Pantry

A shared fridge/pantry tracker for a household of two. One Expo codebase runs as a
website and as an iOS/Android app.

- **Pantry** — everything you have, grouped by how soon it expires, with `−`/`+`
  quantity steppers and per-item edit.
- **Cook now** — recipes you can make right now, ordered so the food closest to
  expiring gets used first.
- **Almost** — recipes you're up to three ingredients short of, each with
  *Add missing to shopping list*.
- **Discover** — Spoonacular search (by name, or built around your pantry) with
  *Add to my recipes*.
- **Shopping** — a shared list with **Bought all**, which walks you through expiry
  dates and moves everything into the pantry in one write.

Data lives in Firebase Realtime Database under a *household*, so both members see the
same pantry live.

## Setup

1. `npm install`

2. Fill in `.env` (see `.env.example`). The database URL is already there; you still need:

   | Variable | Where to find it |
   | --- | --- |
   | `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project settings → Your apps → Web app → SDK setup |
   | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration |
   | `EXPO_PUBLIC_SPOONACULAR_KEY` | https://spoonacular.com/food-api (free tier, ~150 requests/day) |

   The app runs without the Spoonacular key — the Discover tab just says it isn't set
   up. It cannot run without the Firebase values, and says which ones are missing.

   Env changes only reach the bundle after a restart; use `npx expo start --clear` if a
   value seems stale.

3. In the Firebase Console, enable **Authentication → Google** as a sign-in provider,
   and add `localhost` to the authorised domains.

4. Put both Google addresses into `database.rules.json` (it is git-ignored so the
   addresses never reach the repo or the app bundle — copy it from
   `database.rules.example.json`), then deploy the rules:

   ```
   npx firebase deploy --only database
   ```

   The rules are the only gate, and they are enforced server-side: only those two
   accounts can read or write, and only within a household they belong to. The app
   itself no longer knows which emails are allowed — a rejected account signs in but
   every read and write is refused by Firebase.

## Running

```
npm start        # then press w for web, or scan the QR code with Expo Go
npm run web
npm test         # jest: domain logic + screen render tests
npm run typecheck
```

On first sign-in, create a household — it shows a six-character invite code. Your
flatmate signs in on their own device and enters that code to join the same pantry.

### Google sign-in on a device

Web and Expo Go work with the web client ID alone. A standalone App Store / Play Store
build additionally needs iOS and Android OAuth clients from the Google Cloud Console,
set as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.

## How it's put together

```
app/                 screens (expo-router file-based routing)
  (tabs)/            pantry, cook, missing, discover, shopping
  item/[id].tsx      edit a pantry item
  recipe/[id].tsx    recipe detail, "cooked this", delete
  recipe/new.tsx     write your own recipe
  shopping/review    the confirmation step behind "Bought all"
src/domain/          pure logic — no Firebase, fully unit-tested
  normalize.ts       nameKey(), unit conversion, category guessing
  expiry.ts          day arithmetic, status colours, default shelf lives
  match.ts           pantry ↔ recipe matching, ranking, plannedUsage()
  purchase.ts        shopping entries → pantry drafts
src/data/            Firebase reads/writes; the UI never touches ref() directly
src/lib/             firebase init, auth, household create/join, live store
```

Recipe matching joins on `nameKey`, a normalized singular form
(`"2 Boneless Chicken Breasts, chopped"` → `chicken breast`). Quantities are compared
in base units (g / ml / piece); when units can't be compared — `1 pack` of flour
against `400 g` — the ingredient counts as present but is marked approximate and
cooking won't deduct it.

## Data shape

```
/users/{uid}            { email, displayName, householdId }
/householdCodes/{CODE}   householdId
/households/{hid}
  members/{uid}          true
  memberProfiles/{uid}   { email, displayName }
  inviteCode             "ABC123"
  items/{itemId}         { name, nameKey, qty, unit, category, expiry, addedAt, addedBy }
  shopping/{entryId}     { name, nameKey, qty, unit, category, addedAt, sourceRecipeId? }
  recipes/{recipeId}     { title, image?, servings, steps[], source, spoonacularId?, ingredients[] }
```
