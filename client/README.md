# Sword Growing Game - Client

Next.js frontend client for the Sword Growing Game.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home/Dashboard page
│   ├── login/             # Login page
│   ├── register/          # Register page
│   ├── weapons/           # My weapons page
│   ├── gacha/             # Gacha page
│   ├── battle/            # Battle page
│   ├── ranking/           # Ranking page
│   ├── mail/              # Mail page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/            # Header, Sidebar
│   ├── auth/              # Login, Register forms
│   ├── weapons/           # Weapon-related components
│   ├── gacha/             # Gacha-related components
│   ├── battle/            # Battle-related components
│   └── common/            # Reusable components
├── lib/                   # Utilities
│   ├── api.ts            # Axios instance with interceptors
│   ├── auth.ts           # Auth helper functions
│   └── utils.ts          # Utility functions
├── stores/               # Zustand stores
│   ├── authStore.ts      # Authentication state
│   ├── userStore.ts      # User data state
│   └── weaponStore.ts    # Weapons state
└── types/                # TypeScript types
    └── index.ts          # All game types
```

## Features

### Authentication
- Login/Register with JWT
- Auto-logout on 401
- Protected routes

### Weapons Management
- View all weapons
- Filter by rarity
- Sort by level/rarity
- Equip/sell weapons

### Gacha System
- Pull weapons for gold
- Reroll system
- Keep or reroll decisions

### Battle System
- Enter battle arena
- Match with opponents
- Battle results with rewards
- Win streaks

### Ranking
- Top 100 players
- Current season info
- Personal rank display

### Mail System
- Receive mails with rewards
- Claim gold/stones
- Delete mails

### Dashboard
- Quick stats (gold, stones, weapons)
- Attendance check
- Quick actions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Integration

All API calls are made through the configured Axios instance in `src/lib/api.ts`:

- Base URL from `NEXT_PUBLIC_API_URL`
- JWT token automatically added to headers
- Global error handling with toast notifications
- 401 errors trigger auto-logout and redirect to login

## State Management

### Auth Store
- `user` - Current user data
- `isAuthenticated` - Auth status
- `login()` - Login user
- `register()` - Register new user
- `logout()` - Logout user
- `checkAuth()` - Verify auth status

### User Store
- `gold` - Current gold amount
- `stones` - Current stones amount
- `fetchProfile()` - Fetch user profile
- `checkAttendance()` - Check daily attendance

### Weapon Store
- `weapons` - List of weapons
- `fetchWeapons()` - Fetch all weapons
- `equipWeapon()` - Equip a weapon
- `sellWeapon()` - Sell a weapon

## Styling

### Rarity Colors
- Common: Gray
- Rare: Blue
- Epic: Purple
- Legendary: Orange

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Grid layouts adapt to screen size

## Build & Deploy

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Docker Support

Build Docker image:
```bash
docker build -t sword-game-client .
```

Run container:
```bash
docker run -p 3001:3000 sword-game-client
```
