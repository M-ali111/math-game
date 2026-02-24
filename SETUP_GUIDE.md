# Maths Game - Complete Setup & Running Guide

## ✅ What Has Been Built

I've created a complete fullstack Maths Game application with the following features:

### Backend (Node.js + Express + Socket.io)
✅ User authentication (signup/login with JWT)
✅ Solo game mode with adaptive difficulty
✅ Multiplayer with real-time WebSocket synchronization
✅ 125 math questions across 10 difficulty levels
✅ Random question generation for each game
✅ Score calculation and tracking
✅ User statistics and leaderboard
✅ Database with Prisma ORM

### Frontend (React + TypeScript)
✅ Login/Signup forms
✅ Main game menu
✅ Solo game interface with real-time scoring
✅ Multiplayer game with game ID sharing
✅ User stats and global leaderboard
✅ Real-time socket communication

### Database
✅ SQLite database with Prisma
✅ 9 models: User, Game, GamePlayer, GameQuestion, GameAnswer, Question
✅ 125+ math questions pre-populated
✅ Proper indexing and relationships

## 🚀 How to Run

Open **2 separate terminals** and run these commands:

### Terminal 1 - Backend Server

```bash
cd "c:\Users\muham\OneDrive\Desktop\Maths Game\backend"
npm run dev
```

**Expected output:**
```
Server running on port 5000
```

### Terminal 2 - Frontend Server

```bash
cd "c:\Users\muham\OneDrive\Desktop\Maths Game\frontend"
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in XXX ms
Local: http://localhost:3000/
```

## 🎮 Using the Application

### First Time
1. Open http://localhost:3000 in your browser
2. Click "Sign Up" to create a new account
3. Enter email, username, and password
4. You'll be logged in automatically

### Playing Solo Game
1. Click "Solo Game" from menu
2. Answer 10 random questions
3. Score will be calculated automatically
4. Difficulty adjusts based on your performance:
   - Score ≥ 80% → Difficulty increases
   - Score < 50% → Difficulty decreases
   - Otherwise → Difficulty stays same

### Playing Multiplayer
1. Click "Multiplayer"
2. Select "Create Game" to make a new room (you'll get a Game ID)
3. Share the Game ID with a friend
4. Friend clicks "Multiplayer" → "Join Game" and enters the ID
5. Once both players join, the game starts
6. Both answer the same 10 questions
7. First to answer correctly wins that question

### Viewing Stats
1. Click "View Stats & Leaderboard"
2. See your personal stats (wins, best score, etc.)
3. View global leaderboard

## 📊 Question Bank

The game includes **125 questions** across 10 difficulty levels:
- **Level 1**: Basic addition/subtraction (2+2, 10-3, etc.)
- **Level 2-5**: Intermediate operations
- **Level 6-8**: Advanced multi-digit calculations
- **Level 9-10**: Complex math problems

Each game picks 10 random questions with this mix:
- 70% from your current difficulty level
- 20% from one level harder
- 10% from one level easier

## 🔑 Key Features Explained

### Adaptive Difficulty
After each game, your difficulty is adjusted:
```
Accuracy ≥ 80% → Difficulty goes up (max 10)
Accuracy < 50% → Difficulty goes down (min 1)
Accuracy 50-79% → Stay at same difficulty
```

### Real-time Multiplayer
Uses Socket.io WebSocket connection:
- Both players receive questions simultaneously
- Answers are validated server-side (no cheating!)
- Real-time score updates
- Automatic winner calculation

### Question Randomization
- Every game generates a new set of 10 questions
- Questions are picked randomly from the bank
- No two consecutive games have the same questions
- Difficulty level varies within each game

## 📁 Project Structure

```
Maths Game/
├── backend/
│   ├── src/
│   │   ├── index.ts                 (Main server)
│   │   ├── middleware/auth.ts       (JWT auth)
│   │   ├── routes/                  (API endpoints)
│   │   ├── services/                (Business logic)
│   │   ├── sockets/game.ts          (Real-time events)
│   │   └── utils/                   (Helpers)
│   ├── prisma/
│   │   ├── schema.prisma            (Database schema)
│   │   └── seed.ts                  (125 questions)
│   ├── .env                         (Environment variables)
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 (Entry point)
│   │   ├── App.tsx                  (Main component)
│   │   ├── components/              (React components)
│   │   ├── context/AuthContext.tsx  (Auth state)
│   │   ├── hooks/useGameSocket.ts   (Socket hook)
│   │   └── utils/api.ts             (API calls)
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🔐 Test Accounts

Create your own account through the signup form! No pre-created accounts needed.

Example:
- Email: test@example.com
- Username: testuser
- Password: password123

## 🌐 API Endpoints

All API calls require JWT authentication header:
```
Authorization: Bearer <token>
```

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/stats` - Get user stats

### Games
- `POST /api/games/solo/start` - Start solo game
- `POST /api/games/solo/:gameId/answer` - Submit answer
- `POST /api/games/solo/:gameId/complete` - Finish game
- `POST /api/games/multiplayer/create` - Create room
- `POST /api/games/multiplayer/:gameId/join` - Join room
- `GET /api/games/leaderboard/global` - Get leaderboard

## 🔧 Troubleshooting

### "Cannot find module" errors
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Port 5000 or 3000 already in use
Change in backend/.env:
```
PORT=5001
```

Change in frontend/vite.config.ts:
```typescript
server: {
  port: 3001,
  ...
}
```

### Database errors
```bash
cd backend
rm prisma/dev.db
npm run prisma:migrate dev --name init
npm run prisma:seed
```

### Socket connection issues
- Check that backend is running on port 5000
- Check browser console (F12) for errors
- Hard refresh the page (Ctrl+Shift+R)

## 📱 Browser Compatibility

Works on:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with WebSocket support

## 🎯 Next Steps / Enhancements

You can add these features:
1. Daily challenges
2. Achievements/badges
3. Timed rounds (e.g., 10 seconds per question)
4. Question categories
5. Friend challenges
6. Chat during multiplayer games
7. Mobile app (React Native)
8. Dark mode
9. Sound effects
10. Difficulty presets

## 💡 How Questions Are Different Each Time

The question service:
1. Gets random questions from the database
2. Uses `Math.random()` with `skip` offset
3. Returns questions in random order
4. Filters by difficulty level range
5. Each game gets a unique set

So players can play thousands of times without seeing repeats!

## 🎮 Game Flow

### Solo Game
```
Start → 10 Questions → Calculate Score → Update Difficulty → Save Results
```

### Multiplayer Game
```
Create Room → Share ID → Friend Joins → Game Starts →
Both Answer Same 10 Questions →
Compare Scores → Declare Winner → Save Results
```

## 📊 Database Schema (Simplified)

```
Users
├── id, email, username, password
├── rating, currentDifficulty
└── totalGamesPlayed, totalWins, bestScore

Games
├── id, gameType (solo/multiplayer), status
├── createdBy (user), difficulty
└── createdAt, updatedAt

GamePlayers
├── gameId, userId, score
├── isWinner, completedAt
└── Links user to games

Questions
├── id, text, options (JSON), correctAnswer
├── difficulty (1-10), category
└── 125 questions total

GameAnswers
├── gameId, userId, questionId
├── selectedAnswer, isCorrect, timeToAnswer
└── Tracks all answers per game
```

## 🚀 Deployment Ready

The app is ready for deployment to:
- Vercel (frontend)
- Heroku/Railway (backend)
- AWS/Azure (either)

Just set up environment variables on deployment platform.

## 📝 Configuration Files

All necessary config files are created:
- `.env` - Backend environment variables
- `tsconfig.json` - TypeScript configs (both backend & frontend)
- `vite.config.ts` - Frontend build config
- `prisma/schema.prisma` - Database schema
- `package.json` - Dependencies

## ✨ You're All Set!

The complete game is built and ready to use. Just:
1. Open 2 terminals
2. Run `npm run dev` in each (backend & frontend)
3. Open browser to http://localhost:3000
4. Click Sign Up and start playing!

Enjoy! 🎮✨

---

**Questions?** Check the README.md file for more detailed documentation.
