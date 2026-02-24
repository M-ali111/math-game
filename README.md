# Math Game 🎮

A fullstack web application for playing solo and multiplayer math games with adaptive difficulty and real-time multiplayer support.

## Features

### Solo Mode
- 10 random questions per game
- Adaptive difficulty that increases/decreases based on performance
- Real-time score tracking
- Progress tracking with difficulty levels (1-10)
- Mix of questions: 70% current level, 20% harder, 10% easier

### Multiplayer Mode
- Share Game ID with friends to play together
- Real-time synchronization using WebSocket
- Both players answer the same 10 questions
- First player to answer correctly wins the round
- Comprehensive leaderboard system

### User Features
- User authentication with email and password
- Personal statistics and game history
- Difficulty tracking throughout gameplay
- Global leaderboard
- Rating system

## Tech Stack

### Backend
- **Node.js** + **Express.js** - Web server
- **TypeScript** - Type-safe code
- **Prisma** - ORM for database management
- **SQLite** - Lightweight database
- **Socket.io** - Real-time multiplayer communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe code
- **Vite** - Build tool
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

## Project Structure

```
Maths Game/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Main server file
│   │   ├── middleware/
│   │   │   └── auth.ts        # Authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.ts        # Auth endpoints
│   │   │   └── game.ts        # Game endpoints
│   │   ├── services/
│   │   │   ├── auth.ts        # Auth business logic
│   │   │   ├── question.ts    # Question logic
│   │   │   └── game.ts        # Game logic
│   │   ├── sockets/
│   │   │   └── game.ts        # Socket.io events
│   │   └── utils/
│   │       ├── jwt.ts         # JWT utilities
│   │       └── difficulty.ts  # Difficulty algorithm
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data (125 questions)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Main app component
│   │   ├── components/
│   │   │   ├── Login.tsx      # Login/Signup
│   │   │   ├── GameMenu.tsx   # Main menu
│   │   │   ├── SoloGame.tsx   # Solo game
│   │   │   ├── MultiplayerGame.tsx  # Multiplayer game
│   │   │   └── Stats.tsx      # Stats & leaderboard
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Authentication context
│   │   ├── hooks/
│   │   │   └── useGameSocket.ts # Socket.io hook
│   │   ├── utils/
│   │   │   └── api.ts         # API utilities
│   │   └── index.css          # Global styles
│   └── package.json
│
└── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Set up Database

```bash
# Run migrations
npm run prisma:migrate

# Seed with 125 math questions
npm run prisma:seed
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Running the Application

### Terminal 1 - Start Backend Server

```bash
cd backend
npm run dev
```

Server will run on `http://localhost:5000`

### Terminal 2 - Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/stats` - Get user statistics

### Games
- `POST /api/games/solo/start` - Start a solo game
- `POST /api/games/solo/:gameId/answer` - Submit answer in solo game
- `POST /api/games/solo/:gameId/complete` - Complete solo game
- `POST /api/games/multiplayer/create` - Create multiplayer room
- `POST /api/games/multiplayer/:gameId/join` - Join a multiplayer game
- `GET /api/games/:gameId` - Get game details
- `GET /api/games/leaderboard/global?limit=50` - Get leaderboard

## Socket.io Events

### Client → Server
- `authenticate` - Send JWT token for authentication
- `join_game` - Join a multiplayer game room
- `submit_answer` - Submit an answer during game
- `end_game` - End the current game

### Server → Client
- `authenticated` - Authentication successful
- `player_joined` - New player joined the game
- `game_started` - Game has started with questions
- `answer_submitted` - Player submitted an answer
- `round_result` - Result of a round (who won)
- `game_ended` - Game has ended with final results
- `error` - Error occurred

## How It Works

### Solo Game Flow
1. User selects "Solo Game"
2. 10 random questions are generated based on user's current difficulty
3. User answers each question in sequence
4. Score is calculated: (correct answers / 10) × 100
5. Difficulty is adjusted:
   - If score ≥ 80%: Increase difficulty (max 10)
   - If score < 50%: Decrease difficulty (min 1)
   - Otherwise: Keep same difficulty
6. Results are saved to database

### Multiplayer Game Flow
1. User A creates a game (gets unique Game ID)
2. User B joins with the Game ID
3. Both players receive the same 10 questions simultaneously
4. Players answer questions in real-time
5. First player to answer correctly wins that question
6. After all 10 questions, the player with more correct answers wins
7. Results are saved and ratings updated

### Difficulty System
Questions are selected using this distribution:
- 70% from current difficulty level
- 20% from difficulty level + 1 (harder)
- 10% from difficulty level - 1 (easier)

This ensures gradual progression and challenge.

## Database Schema

### Users
- Stores user information, ratings, and progress
- Tracks current difficulty level

### Games
- Records all game sessions
- Tracks game type (solo/multiplayer) and status

### Questions
- 125+ questions across 10 difficulty levels
- Each question has 4 options and a correct answer

### GamePlayers
- Joins users to games
- Tracks score and winner status per game

### GameAnswers
- Records all answers submitted during games
- Tracks correctness and time taken

## Testing Accounts

After seeding, you can create accounts or use these test credentials (create your own):

1. Create a new account through the signup form
2. Start playing!

## Features Implemented

✅ User authentication (signup/login)
✅ Solo game mode with 10 questions
✅ Adaptive difficulty system
✅ Multiplayer with game ID sharing
✅ Real-time WebSocket communication
✅ User statistics tracking
✅ Global leaderboard
✅ 125+ math questions (various difficulties)
✅ Random question selection
✅ Score calculation and storage
✅ JWT-based authentication
✅ Responsive UI

## Future Enhancements

- [ ] Daily challenges
- [ ] Achievement badges
- [ ] Question categories (algebra, geometry, etc.)
- [ ] Timed rounds
- [ ] Multiplayer tournaments
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Social features (friendlist, chat)

## Security Features

- Passwords hashed with bcryptjs
- JWT tokens for session management
- Server-side answer verification (no client-side cheating)
- Input validation on all endpoints
- CORS enabled for frontend communication

## Troubleshooting

### Database Connection Issues
```bash
cd backend
rm prisma/dev.db
npm run prisma:migrate dev --name init
npm run prisma:seed
```

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change `port` in `vite.config.ts`

### Socket Connection Issues
- Ensure backend is running on port 5000
- Check browser console for errors
- Verify CORS settings in backend/src/index.ts

## License

ISC

## Author

Built with ❤️

---

Enjoy the Math Game! 🎮✨
