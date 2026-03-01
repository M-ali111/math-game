# MATH GAME - COMPLETE SYSTEM DOCUMENTATION

> **Generated:** March 2, 2026  
> **Purpose:** Full technical documentation of the Math Game application  
> **Developer:** Senior Developer Analysis

---

## ═══════════════════════════════════════
## 1. APP OVERVIEW
## ═══════════════════════════════════════

### What is this app?
A fullstack educational game platform for Kazakhstan NIS (Nazarbayev Intellectual Schools) and BIL school entrance exam preparation. Players can practice **Mathematics** and **Logic & IQ** questions through solo or multiplayer modes with adaptive difficulty.

### Who is it for?
- Students preparing for NIS/BIL entrance exams (Grades 5→6, 6→7 transitions)
- Primary school students (Grades 1-6) practicing math fundamentals
- Users who want to test logic and IQ skills with pattern recognition, sequences, and analogies

### Technologies Used

**Backend:**
- Node.js v16+
- Express.js 4.18+ - Web server and REST API
- TypeScript 5.3+ - Type safety
- Socket.io 4.6+ - Real-time multiplayer communication
- Prisma 5.7+ - ORM for database management
- PostgreSQL - Production database
- JWT (jsonwebtoken 9.0) - Authentication tokens
- bcryptjs 2.4 - Password hashing
- Groq SDK 0.37 - AI question generation
- dotenv 16.6 - Environment configuration
- CORS - Cross-origin resource sharing

**Frontend:**
- React 18.2
- TypeScript 5.3+
- Vite 5.0+ - Build tool and dev server
- Socket.io Client 4.6+ - Real-time communication
- Axios 1.6+ - HTTP client
- Recharts 2.12+ - Data visualization for stats
- Tailwind CSS 3.4+ - Styling framework
- PostCSS & Autoprefixer - CSS processing

**Development & Deployment:**
- ts-node - TypeScript execution
- Render - Backend hosting
- Render - Frontend hosting (static site)
- Git & GitHub - Version control

### Folder Structure
```
Maths Game/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (6 models)
│   │   ├── seed.ts                # Database seeding script
│   │   ├── resetUsers.ts          # User reset utility
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── index.ts               # Main server entry (Express + Socket.io)
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.ts            # Auth endpoints (signup/login/me)
│   │   │   ├── game.ts            # Game endpoints (solo/multiplayer)
│   │   │   └── stats.ts           # Stats endpoint (dashboard)
│   │   ├── services/
│   │   │   ├── aiQuestion.ts      # Groq AI question generation (973 lines)
│   │   │   ├── auth.ts            # Authentication logic
│   │   │   ├── game.ts            # Game business logic (567 lines)
│   │   │   ├── question.ts        # Question retrieval logic
│   │   │   └── stats.ts           # Statistics calculation (212 lines)
│   │   ├── sockets/
│   │   │   └── game.ts            # Socket.io event handlers (757 lines)
│   │   └── utils/
│   │       ├── jwt.ts             # JWT token utilities
│   │       └── difficulty.ts      # Adaptive difficulty algorithm
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # App entry point with providers
│   │   ├── App.tsx                # Main app routing & state
│   │   ├── components/
│   │   │   ├── Login.tsx          # Login/Signup UI
│   │   │   ├── GameMenu.tsx       # Main menu (subject selection)
│   │   │   ├── ModeSelection.tsx  # Solo/Multiplayer choice
│   │   │   ├── GradeSelector.tsx  # Grade selection (1-6, 5→6, 6→7)
│   │   │   ├── SubjectSelection.tsx # Math vs Logic choice
│   │   │   ├── SoloGame.tsx       # Solo game UI (315 lines)
│   │   │   ├── MultiplayerGame.tsx # Multiplayer UI (853 lines)
│   │   │   ├── Stats.tsx          # User statistics dashboard
│   │   │   ├── Leaderboard.tsx    # Global leaderboard
│   │   │   ├── ProgressIndicator.tsx # Question progress bar
│   │   │   └── TopicPractice.tsx  # Topic-based practice (placeholder)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # User auth state & JWT management
│   │   │   ├── GameContext.tsx    # Game state (subject/mode/grade)
│   │   │   └── LanguageContext.tsx # UI language (EN/RU/KZ)
│   │   ├── hooks/
│   │   │   └── useGameSocket.ts   # Socket.io connection hook
│   │   ├── utils/
│   │   │   ├── api.ts             # API request wrapper
│   │   │   └── translations.ts    # Multi-language strings
│   │   ├── index.css              # Global styles + Tailwind
│   │   └── vite-env.d.ts          # TypeScript definitions
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── package.json                   # Root workspace scripts
├── README.md                      # Basic project info
├── SETUP_GUIDE.md                 # Complete setup instructions
├── SYSTEM_DESIGN.md               # Architecture documentation
└── [Other documentation files]
```

---

## ═══════════════════════════════════════
## 2. AUTHENTICATION FLOW
## ═══════════════════════════════════════

### How Signup Works (Step by Step)

**Frontend (Login.tsx):**
1. User fills form: email, username, password
2. Client validates fields are not empty
3. Calls `authService.signup(email, username, password)`

**Backend (auth.ts route → authService.signup):**
4. Checks if user with email or username already exists
5. If exists → returns error "User already exists"
6. Hashes password using bcrypt (10 salt rounds)
7. Creates User in database with:
   - `id`: CUID (auto-generated)
   - `email`, `username`, `password` (hashed)
   - `rating`: 1000 (default)
   - `currentDifficulty`: 1 (default)
   - `totalGamesPlayed`: 0
   - `totalWins`: 0
   - `bestScore`: 0
8. Generates JWT token with payload: `{ userId: user.id }`, expires in 7 days
9. Returns: `{ user: { id, email, username, rating, currentDifficulty }, token }`

**Frontend (AuthContext):**
10. Stores token in `localStorage.setItem('token', token)`
11. Sets user state in AuthContext
12. User is now logged in → redirects to menu

### How Login Works (Step by Step)

**Frontend (Login.tsx):**
1. User enters email and password
2. Calls `authService.login(email, password)`

**Backend (auth.ts route → authService.login):**
3. Finds user by email in database
4. If not found → returns error "User not found"
5. Compares password with hashed password using bcrypt.compare
6. If invalid → returns error "Invalid password"
7. Generates JWT token with `{ userId: user.id }`
8. Returns: `{ user: { id, email, username, rating, currentDifficulty }, token }`

**Frontend (AuthContext):**
9. Stores token in localStorage
10. Sets user state
11. User redirects to menu

### JWT Token Storage & Usage

**Storage:**
- Token stored in browser `localStorage` with key `'token'`
- Persists across page refreshes
- Cleared on logout

**Usage:**
- Every API request includes header: `Authorization: Bearer <token>`
- `authMiddleware` on backend:
  1. Extracts token from Authorization header
  2. Verifies token using JWT secret
  3. Decodes userId from token payload
  4. Attaches `req.userId` for route handlers
  5. If invalid/expired → returns 401 Unauthorized

**Token Structure:**
```javascript
{
  userId: "clxxxxx...",
  iat: 1234567890,  // Issued at timestamp
  exp: 1234567890   // Expires in 7 days
}
```

### Session Persistence After Refresh

**On App Load (AuthContext useEffect):**
1. Reads token from `localStorage.getItem('token')`
2. Checks if token is expired:
   - Decodes JWT payload (base64)
   - Compares `exp` timestamp with current time
   - If expired → clears auth state
3. If valid → calls `/api/auth/me` endpoint with token
4. Backend verifies token and returns full user data
5. Sets user state → user stays logged in

**Auto-logout on expiry:**
- If `/api/auth/me` returns 401 → clears localStorage and state

### How Logout Works

**Frontend (App.tsx):**
1. User clicks logout button
2. Calls `AuthContext.logout()`
3. Clears user state: `setUser(null)`
4. Clears token state: `setToken(null)`
5. Removes from localStorage: `localStorage.removeItem('token')`
6. Disconnects socket (if connected)
7. Resets game flow state
8. Redirects to login screen

**No backend endpoint needed** - token simply becomes invalid when removed from client

---

## ═══════════════════════════════════════
## 3. COMPLETE USER JOURNEY
## ═══════════════════════════════════════

### Landing/Login Screen
**State:** `appState === 'login'`
- User sees Login form (email + password)
- Option to switch to Signup form (email + username + password)
- On success → AuthContext stores token and user → navigates to menu

### Home Screen (Main Menu)
**State:** `appState === 'menu'`

**User sees:**
- Welcome message with username
- **2 Main Subject Cards:**
  - 🎓 **Mathematics** - "Practice arithmetic, algebra, and more"
  - 🧠 **Logic & IQ** - "Pattern recognition, sequences, and reasoning"
- **Top Navigation:**
  - 📊 **Stats** button (opens stats dashboard)
  - 🏆 **Leaderboard** button (opens global leaderboard)
  - 🚪 **Logout** button
- **Bottom:**
  - Language selector (🇬🇧 English | 🇷🇺 Russian | 🇰🇿 Kazakh)

**User Actions:**
- Selects **Math** → stores `subject: 'math'` → goes to Mode Selection
- Selects **Logic & IQ** → stores `subject: 'logic'` → goes to Mode Selection
- Clicks **Stats** → `appState = 'stats'`
- Clicks **Leaderboard** → `appState = 'leaderboard'`

### Subject Selection
**Handled in:** GameMenu.tsx

**Options:**
1. **Mathematics** - Arithmetic, algebra, geometry, word problems
2. **Logic & IQ** - Patterns, sequences, analogies, deductions

**Selection stored in:** `GameContext.subject`

### Mode Selection
**State:** `appState === 'mode-selection'`

**User sees 2 options:**
1. **🎮 Play Solo** - Single-player practice
2. **👥 Multiplayer** - Play with others (create/join/random)

**User Actions:**
- Clicks **Play Solo** → `selectedMode = 'solo'`
- Clicks **Multiplayer** → `selectedMode = 'multiplayer'`

**Next Step:**
- **If Math subject** → shows Grade Selection
- **If Logic subject** → skips grade selection, goes directly to game (logic has no grades)

### Grade Selection (Math Only)
**State:** `appState === 'grade-selection'`

**User sees 3 options:**
1. **Grade 1** - Primary (Grades 1-6) - Basic arithmetic
2. **Grade 2** - Grade 5 → 6 NIS/BIL Entry - Intermediate math
3. **Grade 3** - Grade 6 → 7 NIS/BIL Entry - Advanced topics

**Selection stored in:** `GameContext.selectedGrade`

**After selection:**
- If Solo → `appState = 'solo'` (SoloGame component)
- If Multiplayer → `appState = 'multiplayer'` (MultiplayerGame component)

### Language Selection
**Available throughout app** (persistent state)

**Options:**
1. 🇬🇧 **English** - Default
2. 🇷🇺 **Russian** - Русский
3. 🇰🇿 **Kazakh** - Қазақ

**Affects:**
- Question text language (sent to AI generator)
- UI labels and buttons
- Answer options

**Stored in:** `LanguageContext` + `localStorage`

### Game Starts
**For Solo:** SoloGame component loads
**For Multiplayer:** MultiplayerGame component loads

---

## ═══════════════════════════════════════
## 4. SOLO GAME FLOW
## ═══════════════════════════════════════

### How Solo Game Starts

**1. Component Mount (SoloGame.tsx):**
- Checks if grade is selected (for math) or subject is logic
- Calls `startGame(grade, subject)`

**2. Frontend API Call:**
```typescript
POST /api/games/solo/start
Body: { grade: 1|2|3, language: 'english'|'russian'|'kazakh', subject: 'math'|'logic' }
Headers: { Authorization: Bearer <token> }
```

**3. Backend Processing (gameService.createSoloGame):**
- Gets user's current adaptive difficulty
- Creates Game record in database:
  - `gameType: 'solo'`
  - `difficulty: <calculated>`
  - `grade: <selected>`
  - `status: 'active'`
  - `subject: 'math'|'logic'`
- Creates GamePlayer record linking user to game
- Generates 10 questions using Groq AI (see Question Generation section)
- Creates 10 GameQuestion records with `questionIndex` 0-9
- Returns: `{ gameId, grade, questions: [{ id, text, options, difficulty, explanation }] }`

**4. Frontend Display:**
- Shows question 1 of 10
- Displays 4 multiple choice options
- Starts timer (tracking time to answer)
- User selects an option

### How Questions are Generated
**Source:** Groq AI (with database fallback)

**Process:**
1. Calculate adaptive difficulty based on last 5 games:
   - Avg score > 80% → difficulty = 'hard' (value: 9)
   - Avg score 50-80% → difficulty = 'medium' (value: 6)
   - Avg score < 50% → difficulty = 'easy' (value: 3)
2. Pick random topic for grade level
3. Call Groq AI API with prompt (see Question Generation section)
4. Parse and validate response
5. Save questions to database (upsert to avoid duplicates)
6. If Groq fails → fallback to existing database questions

### How Adaptive Difficulty Works

**Calculation (getAdaptiveDifficulty in game.ts):**
```typescript
// Get last 5 completed games
const recentGames = await GamePlayer.findMany({ 
  where: { userId, completedAt: not null },
  orderBy: { completedAt: 'desc' },
  take: 5
})

// Calculate average score
avgScore = sum(recentGames.score) / recentGames.length

// Determine difficulty
if (avgScore > 80) return { label: 'hard', value: 9 }
if (avgScore >= 50) return { label: 'medium', value: 6 }
return { label: 'easy', value: 3 }
```

**First-time users:** Start at difficulty = 3 (easy)

**Difficulty range:** 1-10 (linear scale)

### How Many Questions Per Game
**Exactly 10 questions** per solo game

### How Scoring is Calculated

**During Game:**
- Each correct answer → `score++`
- Incorrect answer → no score change, shows explanation

**After Submitting Answer (handleAnswerSubmit):**
```typescript
POST /api/games/solo/:gameId/answer
Body: {
  questionId: "clxxx...",
  selectedAnswer: 0|1|2|3,  // index of chosen option
  timeToAnswer: 15  // seconds
}
```

**Backend (gameService.submitSoloAnswer):**
1. Verifies answer by checking `question.correctAnswer === selectedAnswer`
2. Creates GameAnswer record:
   - `isCorrect: true|false`
   - `timeToAnswer: <seconds>`
3. Returns `{ isCorrect: boolean }`

**Frontend:**
- If correct → increments score, moves to next question
- If incorrect → shows explanation, waits for "Next" click

### What Happens When Game Ends

**Trigger:** User answers question 10

**Frontend calls:**
```typescript
POST /api/games/solo/:gameId/complete
```

**Backend (gameService.completeSoloGame):**
1. Gets all GameAnswer records for this game
2. Calculates:
   - `correctAnswers = count(where isCorrect = true)`
   - `totalAnswers = count(all answers)`
   - `score = (correctAnswers / totalAnswers) * 100`
3. Updates GamePlayer:
   - `score: Math.round(score)`
   - `isWinner: true`
   - `completedAt: new Date()`
4. Updates Game status to 'completed'
5. **Updates User stats:**
   - Calculates next difficulty using algorithm
   - Increments `totalGamesPlayed`
   - Increments `totalWins` (solo always wins)
   - Updates `bestScore` if current score is higher
   - Updates `currentDifficulty` for next game
6. Returns: `{ gameId, score, correctAnswers, totalAnswers, nextDifficulty }`

**Frontend displays results:**
- 🎉 if score ≥ 70% (passed)
- 💪 if score < 70% (good effort)
- Shows: Score percentage, correct/total answers, grade, next difficulty level
- Buttons: "Play Again" or "Back to Menu"

### How Results are Saved
**Database records updated:**
1. **GamePlayer:**
   - `score` set
   - `isWinner = true` (solo always wins)
   - `completedAt` timestamp
2. **Game:**
   - `status = 'completed'`
3. **User:**
   - `totalGamesPlayed` incremented
   - `totalWins` incremented
   - `bestScore` updated if higher
   - `currentDifficulty` adjusted (±1 based on performance)
4. **GameAnswer records:** Already saved during gameplay (10 records)

---

## ═══════════════════════════════════════
## 5. MULTIPLAYER GAME FLOW
## ═══════════════════════════════════════

### Multiplayer Modes Overview
User has 3 ways to start multiplayer:
1. **Create Game** - Make a room, share Game ID
2. **Join Game** - Enter a friend's Game ID
3. **Play Random** - Get matched with online players (via game requests)

### How "Create Game" Works

**Frontend (MultiplayerGame.tsx):**
1. User selects grade, subject, language
2. Clicks "Create Game"
3. Calls socket: `socket.emit('join_game', gameId)` after getting gameId from REST

**Backend REST API:**
```typescript
POST /api/games/multiplayer/create
Body: { grade: 1|2|3, language: 'english', subject: 'math' }
```

**gameService.createMultiplayerGame:**
1. Gets user's adaptive difficulty
2. Creates Game:
   - `gameType: 'multiplayer'`
   - `difficulty: <adaptive>`
   - `grade: <selected>`
   - `subject: <selected>`
   - `status: 'active'`
3. Creates GamePlayer for creator
4. Returns: `{ gameId, createdBy, grade }`

**Frontend:**
- Shows "Waiting for Opponent..." screen
- Displays Game ID prominently
- User shares this ID with friend (copy button available)

**Game NOT started yet** - waiting for 2nd player

### How "Join Game" Works

**Frontend:**
1. User enters Game ID in input field
2. Clicks "Join Game"

**Backend REST API:**
```typescript
POST /api/games/multiplayer/:gameId/join
Body: { grade: 1|2|3, language: 'english', subject: 'math' }
```

**gameService.joinMultiplayerGame:**
1. Validates game exists and is active
2. Validates grade matches (can't join Grade 2 room with Grade 1 selection)
3. Checks user not already in game
4. Checks game not full (max 2 players)
5. Creates GamePlayer for joining user
6. **Generates 10 AI questions** (happens now, when 2nd player joins)
7. Creates 10 GameQuestion records
8. Returns: `{ gameId, status: 'ready', grade, questions }`

**Socket Event Flow:**
1. Both players emit: `socket.emit('join_game', gameId)`
2. Backend handles in `socket.on('join_game')`:
   - Sets `socket.data.gameId = gameId`
   - Joins socket room: `socket.join('game:${gameId}')`
   - Updates onlineUsers map with gameId
   - Emits to room: `io.to('game:${gameId}').emit('player_joined', { gameId, playerCount, players })`
3. When playerCount reaches 2:
   - Emits: `io.to('game:${gameId}').emit('game_started', { gameId, questions })`

**Frontend (both players):**
- Receives `game_started` event
- Sets `gameStarted = true`
- Loads questions
- Shows Question 1 simultaneously

### How "Play Random" Works

**Online User Tracking:**
- When user authenticates socket: `socket.emit('authenticate', token)`
- Backend adds to `onlineUsers` Map:
  ```typescript
  onlineUsers.set(socketId, {
    userId: user.id,
    username: user.username,
    status: 'available' | 'in-game',
    gameId?: string
  })
  ```
- Broadcasts updated list to all clients: `socket.emit('online_users', [list])`

**Game Request Flow:**

**Sender (Requester):**
1. Sees list of online users with status 'available'
2. Clicks "Challenge" on a user
3. Emits: `socket.emit('send_game_request', { toUserId, grade, language })`

**Backend (send_game_request handler):**
1. Finds target user's socketId from onlineUsers map
2. Emits to target: `io.to(targetSocketId).emit('game_request_received', { fromUserId, fromUsername, grade, language })`

**Receiver (Target):**
1. Sees popup: "[Username] wants to play Grade X"
2. Options: **Accept** or **Decline**

**If Accept clicked:**
3. Emits: `socket.emit('accept_game_request', { fromUserId, grade, language })`

**Backend (accept_game_request handler):**
4. Creates multiplayer game via `gameService.createMultiplayerGame()`
5. Joins 2nd player via `gameService.joinMultiplayerGame()`
6. Emits to both players: `io.to([socketIds]).emit('game_request_accepted', { gameId, grade, language, players })`

**Both players:**
7. Receive gameId
8. Emit: `socket.emit('join_game', gameId)`
9. Game starts (same flow as Create/Join)

**If Decline clicked:**
3. Emits: `socket.emit('decline_game_request', { fromUserId })`
4. Backend emits to sender: `io.to(senderSocketId).emit('game_request_declined')`
5. Sender sees: "Request declined"

### Questions Synchronized Between Players

**Synchronization Method:**
- Questions generated ONCE when 2nd player joins
- Stored in database (GameQuestion table)
- Both players receive SAME array of questions via `game_started` event
- Questions already include: `{ id, text, options, difficulty, explanation }`
- Frontend stores in state, both display same question at same index

**No re-generation** - questions fixed for that game session

### Round Progression (Both Answer → Next Question)

**Answer Tracking (backend/src/sockets/game.ts):**
```typescript
const gameAnswers = new Map<gameId, Map<userId, isCorrect>>()
```

**Player Submits Answer:**
1. Frontend: `socket.emit('submit_answer', { gameId, questionId, selectedAnswer, timeToAnswer })`

**Backend `submit_answer` handler:**
2. Verifies answer with `questionService.verifyAnswer(questionId, selectedAnswer)`
3. Saves to database: `GameAnswer { gameId, userId, questionId, selectedAnswer, isCorrect, timeToAnswer }`
4. Stores in memory: `gameAnswers.get(gameId).set(userId, isCorrect)`
5. Broadcasts: `io.to('game:${gameId}').emit('answer_submitted', { userId, isCorrect, timeToAnswer })`
6. **Checks if both players answered:**
   ```typescript
   if (gameAnswers.get(gameId).size === 2) {
     // Both answered!
   }
   ```

**When Both Players Answer:**
7. Finds winner of round (first to answer correctly):
   ```typescript
   const roundAnswers = await GameAnswer.findMany({ 
     where: { gameId, questionId },
     orderBy: { createdAt: 'asc' }
   })
   let winner = null
   for (const answer of roundAnswers) {
     if (answer.isCorrect) {
       winner = answer.userId
       break
     }
   }
   ```
8. Emits: `io.to('game:${gameId}').emit('round_result', { winner, nextQuestionIndex })`
9. Clears round answers: `gameAnswers.get(gameId).clear()`
10. Checks if last question (`nextQuestionIndex >= 10`)
11. **If NOT last question** (questions 1-9):
    - Waits 2 seconds (to show round result)
    - Emits: `io.to('game:${gameId}').emit('next_question', { question, questionIndex, totalQuestions })`
12. **If last question** (question 10):
    - Calculate final scores
    - Determine overall winner
    - Emit `game_ended` event (see below)

**Frontend (both players):**
13. Receive `round_result` → display winner indicator
14. Receive `next_question` → update currentIndex, reset answer state
15. Display next question simultaneously

### How Many Questions Per Game
**Exactly 10 questions** per multiplayer game

### Winner Determination

**Per-Round Winner:**
- First player to answer correctly wins that round
- If both wrong → no winner for that round

**Overall Game Winner:**
**Calculated when all 10 questions answered**

**Scoring Algorithm:**
```typescript
// Count correct answers per player
const userScores = Map<userId, { correct: number, total: number }>

for (const answer of allGameAnswers) {
  userScores[userId].total++
  if (answer.isCorrect) userScores[userId].correct++
}

// Calculate percentage score
for (const [userId, scoreData] of userScores) {
  score = Math.round((correct / total) * 100)
  // Update GamePlayer.score
}

// Sort by score descending
const sortedPlayers = gamePlayers.sort((a, b) => b.score - a.score)
const winner = sortedPlayers[0]
const loser = sortedPlayers[1]

// Mark winner
GamePlayer.update({ where: { id: winner.id }, data: { isWinner: true } })
```

**Tiebreaker:** First in array (determined by join order)

### What Happens When Opponent Quits

**Scenario:** Player A quits mid-game, Player B still playing

**Quit Methods:**
1. Player clicks "Quit" button → `handleQuit()` → `socket.emit('leave_game', { gameId })`
2. Player closes browser → `disconnect` event
3. Player navigates away → cleanup effect → `socket.emit('leave_game')`

**Backend Handling (handleOpponentLeft function):**
1. Checks game status is 'active'
2. Finds remaining player
3. Marks winner:
   ```typescript
   GamePlayer.update({ 
     where: { userId: remainingPlayer.userId },
     data: { isWinner: true, score: 100, completedAt: now }
   })
   ```
4. Marks loser:
   ```typescript
   GamePlayer.update({ 
     where: { userId: leavingPlayer.userId },
     data: { isWinner: false, score: 0, completedAt: now }
   })
   ```
5. Updates game status to 'completed'
6. Emits: `io.to('game:${gameId}').emit('opponent_left', { message, result: 'win', gameId })`
7. Sets both players status back to 'available'
8. Cleans up answer tracking

**Safeguards:**
- `gameStarted` guard prevents emit before game actually starts
- `gameId` validation prevents stale/wrong game events
- Room emit + direct socket emit for reliability

**Frontend (remaining player):**
1. Receives `opponent_left` event
2. Sets `opponentLeft = true`
3. Shows popup: "🎉 You Win! Your opponent left the game"
4. Buttons: "Play Again" or "Back to Menu"

**Result saved to database:**
- Winner gets score 100, isWinner = true
- Leaver gets score 0, isWinner = false
- Both get `totalGamesPlayed` incremented
- Winner gets `totalWins` incremented

### How Results are Saved

**When game ends normally (all 10 questions):**

**Database Updates:**
1. **GameAnswer records:** 20 total (10 per player) - saved during gameplay
2. **GamePlayer records (both):**
   - `score` calculated from correct answers
   - `isWinner` marked for winner
   - `completedAt` timestamp
3. **Game record:**
   - `status = 'completed'`
4. **User records (implicit via stats queries):**
   - Calculated dynamically from GamePlayer records
   - Leaderboard queries count isWinner = true

**When opponent quits:**
- Same as above but scores are 100 (winner) and 0 (quitter)

---

## ═══════════════════════════════════════
## 6. QUESTION GENERATION
## ═══════════════════════════════════════

### Question Sources
1. **Primary:** Groq AI API (llama-3.3-70b-versatile model)
2. **Fallback:** PostgreSQL database (questions from previous AI generations)

### How Groq AI Generates Questions

**Trigger:** When game starts (solo or multiplayer with 2nd player)

**Function:** `generateNisBilQuestions(params)` in aiQuestion.ts

**Parameters:**
```typescript
{
  count: 10,
  gradeLabel: "Grade 5 → 6 NIS/BIL Entry",
  difficulty: "easy" | "medium" | "hard",
  topic: "fractions" (randomly picked from grade topics),
  language: "english" | "russian" | "kazakh",
  subject: "math" | "logic"
}
```

### System Prompts Used

**Math Prompt:**
```
You are an expert at creating math questions for Kazakhstan NIS 
(Nazarbayev Intellectual Schools) and BIL school admission tests. 
Generate questions that match the exact style, difficulty, and format 
of real NIS/BIL entrance exams. Questions should test logical thinking, 
not just memorization. 
CRITICAL: You MUST respond with ONLY a valid JSON array. 
No explanations, no markdown, no backticks, no extra text. 
Start your response with [ and end with ]
```

**Logic Prompt:**
```
You are an expert at creating Logic and IQ questions for Kazakhstan 
NIS (Nazarbayev Intellectual Schools) and BIL school admission tests. 
Generate questions that test: pattern recognition (number sequences, shape patterns), 
logical reasoning (if-then, true/false deductions), analogy questions (A is to B as C is to ?), 
odd one out, matrix reasoning, and word logic puzzles. 
These should match the exact style of real NIS/BIL entrance exam logic sections. 
CRITICAL: You MUST respond with ONLY a valid JSON array. 
No explanations, no markdown, no backticks, no extra text. 
Start your response with [ and end with ]
```

### User Prompt Format
```
Generate 10 [math|logic] questions for a student applying to NIS/BIL 
for grade [gradeLabel] entry. Difficulty: [easy|medium|hard]. 
Topic: [topic]. 
All text in the response including question, options, and explanation must be in [English/Russian/Kazakh] only. 
No mixing of languages. 
Return ONLY a JSON array in this exact format:
[
  {
    question: string,
    options: [string, string, string, string],
    correctAnswer: string,
    topic: string,
    grade: string,
    difficulty: easy | medium | hard,
    explanation: string
  }
]
Remember: respond with ONLY the JSON array, nothing else.
```

### Subjects Supported
1. **Math** (`subject: 'math'`)
   - Arithmetic (addition, subtraction, multiplication, division)
   - Fractions and decimals
   - Ratios and percentages
   - Basic algebra
   - Geometry (area, perimeter)
   - Word problems
   - Pattern recognition

2. **Logic & IQ** (`subject: 'logic'`)
   - Number sequences
   - Shape patterns
   - Analogies (A:B::C:?)
   - Odd one out
   - Logical deductions (if-then)
   - Matrix reasoning
   - Series completion
   - Abstract reasoning
   - Verbal reasoning

### Grades Supported

**For Math:**
- **Grade 1 (0):** Primary (Grades 1-6)
  - Topics: addition, subtraction, multiplication, division, fractions, basic geometry, word problems, time, money
  - Range: 1-20, no decimals, no negatives
  
- **Grade 2 (1):** Grade 5 → 6 NIS/BIL Entry
  - Topics: fractions, decimals, ratios, percentages, basic algebra, area and perimeter, logic puzzles
  - Range: 1-100
  
- **Grade 3 (2):** Grade 6 → 7 NIS/BIL Entry
  - Topics: algebra equations, integers, coordinate geometry, percentages, multi-step word problems, pattern recognition
  - Range: 1-1000, allows decimals and negatives

**For Logic:**
- **Grade 0 (general):** All levels combined
  - Topics: patterns, sequences, analogies, odd one out, logical deductions, matrix reasoning, series completion, abstract reasoning

### Languages Supported
1. **English** (default)
2. **Russian** (`language: 'russian'`)
3. **Kazakh** (`language: 'kazakh'`)

**Language Enforcement:**
- System prompt explicitly requires questions in selected language
- User prompt repeats: "All text must be in [Language] only. No mixing of languages."
- Applies to: question text, options, explanation

### Retry Logic

**Groq API Call with Retry:**
```typescript
async function createGroqCompletionWithRetry(messages, useResponseFormat, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Call Groq API
      const result = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' } // if useResponseFormat
      })
      return result
    } catch (error) {
      // If json_object format error on first attempt, retry without format
      if (useResponseFormat && attempt === 0) {
        return createGroqCompletionWithRetry(messages, false, 3)
      }
      // Wait 1 second before next retry
      if (attempt < retries - 1) {
        await sleep(1000)
      }
    }
  }
  throw new Error('Groq API failed after 3 retries')
}
```

**Total Attempts:**
- First: With `response_format: json_object`
- If fails: Retry without format (3 attempts)
- **Max 4 attempts total**

### Fallback to Database

**When Groq Fails:**
1. Logs error to console with details
2. Calls `getFallbackQuestionsFromDatabase(difficulty, count, subject)`
3. Queries PostgreSQL:
   ```typescript
   Question.findMany({
     where: {
       difficulty: { gte: difficulty - 2, lte: difficulty + 2 },
       subject: subject
     },
     take: count,
     orderBy: { id: 'desc' }
   })
   ```
4. If not enough found → gets any available for subject
5. Converts to NisBilQuestion format
6. Returns to game creation

**User Experience:**
- No error shown to user
- Game continues with database questions
- Backend logs fallback for monitoring

### How Questions are Saved

**After AI Generation (upsertQuestionFromAi):**
1. Parses correctAnswer index from options array
2. Checks if question already exists:
   ```typescript
   Question.findFirst({ where: { text: question, language, subject } })
   ```
3. If exists → checks if explanation missing → updates if new explanation available
4. If new → creates Question record:
   ```typescript
   Question.create({
     text: aiQuestion.question,
     difficulty: difficultyValue,
     options: JSON.stringify(aiQuestion.options),
     correctAnswer: correctAnswerIndex,
     language: language,
     subject: subject,
     explanation: aiQuestion.explanation || null
   })
   ```
5. Links to game via GameQuestion:
   ```typescript
   GameQuestion.create({
     gameId: game.id,
     questionId: question.id,
     questionIndex: 0-9
   })
   ```

**Result:** Questions accumulate in database over time, improving fallback coverage

---

## ═══════════════════════════════════════
## 7. SOCKET.IO EVENTS
## ═══════════════════════════════════════

### Connection Events

**Event:** `connection`
- **Emitted by:** Socket.io (automatic)
- **Handler:** Server
- **Data:** Socket object
- **Triggers:** Logs "User connected: [socketId]"

**Event:** `disconnect`
- **Emitted by:** Socket.io (automatic when client disconnects)
- **Handler:** Server
- **Data:** None
- **Triggers:**
  - Checks if user was in active game
  - If in game → calls `handleOpponentLeft()`
  - Removes from `onlineUsers` map
  - Broadcasts updated online users list

---

### Authentication Events

**Event:** `authenticate`
- **Emitted by:** Client (immediately after connection)
- **Data:** `{ token: string }` or `string` (token)
- **Handler:** Server
- **Action:**
  1. Verifies JWT token
  2. Finds user in database
  3. Stores userId in `socket.data.userId`
  4. Adds to `onlineUsers` map: `{ userId, username, status: 'available' }`
  5. Emits back: `authenticated` event
  6. Broadcasts: `online_users` to all clients
- **On Error:** Emits `auth_error`

**Event:** `authenticated`
- **Emitted by:** Server (response to authenticate)
- **Data:** `{ userId: string, username: string }`
- **Handler:** Client
- **Action:** Logs success

**Event:** `auth_error`
- **Emitted by:** Server
- **Data:** `string` (error message)
- **Handler:** Client
- **Action:** Logs error

---

### Online Users & Matchmaking Events

**Event:** `online_users`
- **Emitted by:** Server (broadcast to all)
- **Data:** `Array<{ userId: string, username: string, status: 'available' | 'in-game' }>`
- **Handler:** Client
- **Action:** Updates `onlineUsers` state (displays list for random matchmaking)
- **Triggers:** 
  - After any user authenticates
  - After user status changes (available ↔ in-game)
  - After user disconnects

**Event:** `send_game_request`
- **Emitted by:** Client (when challenging another player)
- **Data:** `{ toUserId: string, grade: number, language: string }`
- **Handler:** Server
- **Action:**
  1. Validates sender is authenticated
  2. Finds target user's socketId
  3. Emits to target: `game_request_received`
- **On Error:** Emits `game_request_failed`

**Event:** `game_request_received`
- **Emitted by:** Server (to target player)
- **Data:** `{ fromUserId: string, fromUsername: string, grade: number, language: string }`
- **Handler:** Client
- **Action:** Shows popup with Accept/Decline buttons

**Event:** `accept_game_request`
- **Emitted by:** Client (when accepting challenge)
- **Data:** `{ fromUserId: string, grade: number, language: string }`
- **Handler:** Server
- **Action:**
  1. Creates multiplayer game
  2. Joins both players
  3. Emits to both: `game_request_accepted`
- **On Error:** Emits `game_request_failed`

**Event:** `game_request_accepted`
- **Emitted by:** Server (to both players)
- **Data:** `{ gameId: string, grade: number, language: string, players: Array }`
- **Handler:** Client
- **Action:**
  1. Sets gameId
  2. Sets mode to 'waiting'
  3. Emits: `update_user_status` with 'in-game'
  4. Emits: `join_game` with gameId

**Event:** `decline_game_request`
- **Emitted by:** Client (when declining challenge)
- **Data:** `{ fromUserId: string }`
- **Handler:** Server
- **Action:** Emits to sender: `game_request_declined`

**Event:** `game_request_declined`
- **Emitted by:** Server (to original requester)
- **Data:** `{ fromUserId: string }`
- **Handler:** Client
- **Action:** Shows "Request declined" message

**Event:** `game_request_failed`
- **Emitted by:** Server
- **Data:** `{ message: string }`
- **Handler:** Client
- **Action:** Shows error message

**Event:** `update_user_status`
- **Emitted by:** Client
- **Data:** `'available' | 'in-game'`
- **Handler:** Server
- **Action:** Updates onlineUsers map, broadcasts updated list

---

### Game Room Events

**Event:** `join_game`
- **Emitted by:** Client (after getting gameId from REST API or game_request_accepted)
- **Data:** `string` (gameId)
- **Handler:** Server
- **Action:**
  1. Validates user is authenticated
  2. Sets `socket.data.gameId = gameId`
  3. Joins socket room: `socket.join('game:${gameId}')`
  4. Updates onlineUsers with gameId and status 'in-game'
  5. Gets game details
  6. Emits to room: `player_joined`
  7. If 2 players → emits to room: `game_started`
  8. Initializes `gameAnswers.set(gameId, new Map())`

**Event:** `player_joined`
- **Emitted by:** Server (to game room)
- **Data:** `{ gameId: string, playerCount: number, players: Array<{ id, username }> }`
- **Handler:** Client
- **Action:** Updates players list, sets gameStatus to 'ready' if playerCount === 2

**Event:** `game_started`
- **Emitted by:** Server (to game room when 2nd player joins)
- **Data:** `{ gameId: string, questions: Array<Question> }`
- **Handler:** Client
- **Action:**
  1. Sets `gameStarted = true`
  2. Stores questions array
  3. Sets mode to 'playing'
  4. Sets gameStatus to 'playing'
  5. Starts timer

---

### Gameplay Events

**Event:** `submit_answer`
- **Emitted by:** Client (when player selects an answer)
- **Data:** `{ gameId: string, questionId: string, selectedAnswer: number, timeToAnswer: number }`
- **Handler:** Server
- **Action:**
  1. Verifies answer correctness
  2. Saves GameAnswer to database
  3. Stores answer in memory: `gameAnswers.get(gameId).set(userId, isCorrect)`
  4. Emits to room: `answer_submitted`
  5. Checks if both answered → processes round result

**Event:** `answer_submitted`
- **Emitted by:** Server (to game room)
- **Data:** `{ userId: string, isCorrect: boolean, timeToAnswer: number }`
- **Handler:** Client
- **Action:**
  - If own answer:
    - If correct → clears explanation
    - If incorrect → sets explanation to 'loading'
  - Displays indicator for opponent's answer

**Event:** `round_result`
- **Emitted by:** Server (after both players answer)
- **Data:** `{ winner: string | null, nextQuestionIndex: number }`
- **Handler:** Client
- **Action:** Logs round winner (component used to increment index, now handled by next_question)

**Event:** `next_question`
- **Emitted by:** Server (2 seconds after round_result, for questions 1-9)
- **Data:** `{ question: Question, questionIndex: number, totalQuestions: number }`
- **Handler:** Client
- **Action:**
  1. Updates `currentIndex` to questionIndex
  2. Resets `selectedAnswer` to null
  3. Resets timer
  4. Clears explanation

**Event:** `game_ended`
- **Emitted by:** Server (after question 10 answered by both)
- **Data:** `{ winner: string, winnerName: string, loser: string, loserName: string, winnerScore: number, loserScore: number, questionWinners: Array }`
- **Handler:** Client
- **Action:**
  1. Sets `gameResult` with data
  2. Sets mode to 'completed'
  3. Displays final results screen

---

### Quit/Leave Events

**Event:** `leave_game`
- **Emitted by:** Client (when player quits or component unmounts)
- **Data:** `{ gameId: string }`
- **Handler:** Server
- **Action:**
  1. Validates user and gameId
  2. Checks game status is 'active'
  3. Removes from socket room: `socket.leave('game:${gameId}')`
  4. Clears `socket.data.gameId`
  5. Updates onlineUsers status to 'available'
  6. Calls `handleOpponentLeft(gameId, userId, io)`

**Event:** `quit_game` (legacy, aliased to leave_game)
- **Emitted by:** Client
- **Data:** `{ gameId: string, userId: string }`
- **Handler:** Server
- **Action:** Same as leave_game

**Event:** `opponent_left`
- **Emitted by:** Server (when opponent quits or disconnects)
- **Data:** `{ message: string, result: 'win', gameId: string }`
- **Handler:** Client
- **Action:**
  1. Validates gameId matches current game
  2. Sets `opponentLeft = true`
  3. Shows victory popup

---

### Error Event

**Event:** `error`
- **Emitted by:** Server (when any socket handler throws)
- **Data:** `string` (error message)
- **Handler:** Client
- **Action:** Logs error or shows alert

---

### Socket Room Structure

**Room Naming:** `game:${gameId}`

**Example:** If gameId is `clxabc123`, room name is `game:clxabc123`

**Joining:** `socket.join('game:clxabc123')`

**Broadcasting:** `io.to('game:clxabc123').emit('event_name', data)`

**Purpose:** Ensures events only go to players in that specific game

---

## ═══════════════════════════════════════
## 8. API ENDPOINTS
## ═══════════════════════════════════════

### Authentication Endpoints

**POST /api/auth/signup**
- **Purpose:** Create new user account
- **Body:** `{ email: string, username: string, password: string }`
- **Authenticated:** No
- **Returns:** `{ user: { id, email, username, rating, currentDifficulty }, token: string }`
- **Errors:**
  - 400: "Missing required fields"
  - 400: "User already exists"

**POST /api/auth/login**
- **Purpose:** Login existing user
- **Body:** `{ email: string, password: string }`
- **Authenticated:** No
- **Returns:** `{ user: { id, email, username, rating, currentDifficulty }, token: string }`
- **Errors:**
  - 400: "Missing required fields"
  - 400: "User not found"
  - 400: "Invalid password"

**GET /api/auth/me**
- **Purpose:** Get current user profile (session restore)
- **Body:** None
- **Authenticated:** Yes
- **Returns:** `{ id, email, username, rating, currentDifficulty, totalGamesPlayed, totalWins, bestScore, createdAt }`
- **Errors:**
  - 401: "Unauthorized" (invalid/missing token)
  - 400: "User not found"

**GET /api/auth/stats**
- **Purpose:** Get user statistics
- **Body:** None
- **Authenticated:** Yes
- **Returns:** `{ user: User, totalGames: number, totalWins: number, winRate: string }`
- **Errors:**
  - 401: Unauthorized
  - 400: "User not found"

---

### Solo Game Endpoints

**POST /api/games/solo/start**
- **Purpose:** Start a new solo game
- **Body:** `{ grade: number (1|2|3), language: string ('english'|'russian'|'kazakh'), subject: string ('math'|'logic') }`
- **Authenticated:** Yes
- **Returns:** `{ gameId: string, grade: number, questions: Array<Question> }`
- **Process:**
  - Creates Game record
  - Creates GamePlayer record
  - Generates 10 AI questions
  - Creates 10 GameQuestion records
- **Errors:**
  - 400: "Missing required fields"
  - 400: "Invalid grade/language/subject"
  - 401: Unauthorized

**POST /api/games/solo/:gameId/answer**
- **Purpose:** Submit answer for a question
- **Body:** `{ questionId: string, selectedAnswer: number (0-3), timeToAnswer: number }`
- **Authenticated:** Yes
- **Returns:** `{ isCorrect: boolean }`
- **Process:**
  - Verifies answer
  - Creates GameAnswer record
- **Errors:**
  - 400: "Missing required fields"
  - 401: Unauthorized

**POST /api/games/solo/:gameId/complete**
- **Purpose:** Complete solo game and get results
- **Body:** None
- **Authenticated:** Yes
- **Returns:** `{ gameId: string, score: number, correctAnswers: number, totalAnswers: number, nextDifficulty: number }`
- **Process:**
  - Calculates score from GameAnswer records
  - Updates GamePlayer (score, isWinner, completedAt)
  - Updates Game status to 'completed'
  - Updates User stats (totalGamesPlayed, totalWins, bestScore, currentDifficulty)
- **Errors:**
  - 401: Unauthorized

---

### Multiplayer Game Endpoints

**POST /api/games/multiplayer/create**
- **Purpose:** Create a new multiplayer game room
- **Body:** `{ grade: number, language: string, subject: string }`
- **Authenticated:** Yes
- **Returns:** `{ gameId: string, createdBy: string, grade: number }`
- **Process:**
  - Creates Game record (gameType: 'multiplayer')
  - Creates GamePlayer for creator
- **Errors:**
  - 400: "Missing required fields"
  - 401: Unauthorized

**POST /api/games/multiplayer/:gameId/join**
- **Purpose:** Join existing multiplayer game
- **Body:** `{ grade: number, language: string, subject: string }`
- **Authenticated:** Yes
- **Returns:** `{ gameId: string, status: 'ready' | 'waiting', grade: number, questions?: Array<Question> }`
- **Process:**
  - Validates game exists and is active
  - Validates grade matches
  - Checks not already joined
  - Checks room not full
  - Creates GamePlayer for joiner
  - If 2nd player: generates 10 questions
- **Errors:**
  - 400: "Missing required fields"
  - 400: "Game not found"
  - 400: "Game is not active"
  - 400: "Grade mismatch"
  - 400: "User already joined"
  - 400: "Game is full"
  - 401: Unauthorized

**GET /api/games/:gameId**
- **Purpose:** Get game details
- **Body:** None
- **Authenticated:** Yes
- **Returns:** Full game object with players and questions
- **Errors:**
  - 400: "Game not found"
  - 401: Unauthorized

---

### Leaderboard Endpoint

**GET /api/games/leaderboard/global**
- **Purpose:** Get global multiplayer leaderboard
- **Body:** None
- **Query Params:** `?limit=50` (optional, default 50)
- **Authenticated:** No (public)
- **Returns:** `Array<{ rank: number, id: string, username: string, totalMultiplayerWins: number, totalMultiplayerGames: number }>`
- **Process:**
  - Gets all users
  - For each user: counts multiplayer games and wins
  - Sorts by wins descending, then username ascending
  - Adds rank numbers
- **Errors:** None (returns empty array if no data)

---

### Stats Dashboard Endpoint

**GET /api/stats/dashboard**
- **Purpose:** Get comprehensive user statistics
- **Body:** None
- **Authenticated:** Yes
- **Returns:**
  ```typescript
  {
    overview: {
      totalGames: number,
      overallAccuracy: number,  // percentage
      currentStreak: number,     // days
      longestStreak: number,     // days
      multiplayerWinRate: number // percentage
    },
    subjectStats: {
      mathAccuracy: number,
      logicAccuracy: number
    },
    soloStats: {
      totalGames: number,
      averageScore: number,
      bestScore: number
    },
    multiplayerStats: {
      totalGames: number,
      wins: number,
      losses: number,
      winRate: number
    },
    performanceOverTime: Array<{
      date: string,  // YYYY-MM-DD
      soloAverageScore: number | null,
      multiplayerAverageScore: number | null
    }>,  // Last 30 days
    recentGames: Array<{
      gameId: string,
      date: string,
      mode: 'solo' | 'multiplayer',
      score: number,
      result: 'Win' | 'Loss' | 'Completed'
    }>  // Last 10 games
  }
  ```
- **Process:**
  - Queries all GameAnswer records for user
  - Queries all GamePlayer records for user
  - Calculates accuracy by subject
  - Calculates streaks based on consecutive play days
  - Builds 30-day performance chart data
  - Gets last 10 completed games
- **Errors:**
  - 401: Unauthorized

---

### Health Check

**GET /api/health**
- **Purpose:** Server health check
- **Body:** None
- **Authenticated:** No
- **Returns:** `{ status: 'ok' }`
- **Errors:** None

---

## ═══════════════════════════════════════
## 9. DATABASE MODELS
## ═══════════════════════════════════════

### User Model
```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  username          String   @unique
  password          String   // bcrypt hashed
  rating            Int      @default(1000)
  currentDifficulty Int      @default(1)
  totalGamesPlayed  Int      @default(0)
  totalWins         Int      @default(0)
  bestScore         Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  games             GamePlayer[]
  gameAnswers       GameAnswer[]
  createdGames      Game[]
}
```

**Purpose:** Store user accounts and aggregate stats

**Key Fields:**
- `id`: Unique CUID identifier
- `email`: For login (unique)
- `username`: Display name (unique)
- `password`: Hashed with bcrypt
- `rating`: ELO-style rating (default 1000, currently unused)
- `currentDifficulty`: Adaptive difficulty level (1-10)
- `totalGamesPlayed`: Count of completed games
- `totalWins`: Count of wins (solo always wins, multiplayer based on score)
- `bestScore`: Highest percentage score achieved

---

### Game Model
```prisma
model Game {
  id           String   @id @default(cuid())
  gameType     String   // "solo" or "multiplayer"
  createdBy    String
  creator      User     @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  status       String   @default("active") // "active", "completed", "abandoned"
  difficulty   Int      @default(1)
  grade        Int      @default(1)
  subject      String   @default("math") // "math" | "logic"
  currentRound Int      @default(1) // for multiplayer (currently unused)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  players      GamePlayer[]
  questions    GameQuestion[]
  answers      GameAnswer[]
}
```

**Purpose:** Store game sessions

**Key Fields:**
- `gameType`: "solo" or "multiplayer"
- `createdBy`: User ID of game creator
- `status`: "active" (in progress), "completed" (finished), "abandoned" (quit)
- `difficulty`: AI question difficulty level (1-10)
- `grade`: Selected grade (1-3 for math, 0 for logic)
- `subject`: "math" or "logic"
- `currentRound`: Intended for round tracking (not actively used)

**Lifecyle:**
1. Created with status "active"
2. Questions generated and linked
3. Players answer questions
4. Status set to "completed" when finished or "abandoned" if quit

---

### GamePlayer Model
```prisma
model GamePlayer {
  id          String    @id @default(cuid())
  gameId      String
  userId      String
  game        Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  score       Int       @default(0)
  isWinner    Boolean   @default(false)
  completedAt DateTime?
  
  @@unique([gameId, userId])
}
```

**Purpose:** Link users to games with results

**Key Fields:**
- `gameId`: Which game
- `userId`: Which player
- `score`: Percentage score (0-100)
- `isWinner`: true if won (solo always true, multiplayer highest score)
- `completedAt`: Timestamp when player finished

**Unique Constraint:** `@@unique([gameId, userId])` - user can only be in game once

**Notes:**
- Solo: 1 GamePlayer per game
- Multiplayer: 2 GamePlayers per game
- Score calculated after game ends
- Used for leaderboard and stats queries

---

### Question Model
```prisma
model Question {
  id            String   @id @default(cuid())
  text          String
  difficulty    Int      // 1-10
  options       String   // JSON array: ["option1", "option2", "option3", "option4"]
  correctAnswer Int      // index: 0, 1, 2, or 3
  language      String   @default("english")
  subject       String   @default("math") // "math" | "logic"
  explanation   String?
  createdAt     DateTime @default(now())

  // Relations
  gameQuestions GameQuestion[]
  gameAnswers   GameAnswer[]
}
```

**Purpose:** Store question bank (AI-generated and manual)

**Key Fields:**
- `text`: Question text (in specified language)
- `difficulty`: Numeric difficulty (1-10)
- `options`: JSON stringified array of 4 options
- `correctAnswer`: Index of correct option (0-3)
- `language`: "english", "russian", or "kazakh"
- `subject`: "math" or "logic"
- `explanation`: Optional explanation for incorrect answers

**Notes:**
- Questions accumulated from AI generations
- Upserted to avoid duplicates (checks text + language + subject)
- Used as fallback when Groq API fails
- Options are JSON stringified: `'["opt1", "opt2", "opt3", "opt4"]'`

---

### GameQuestion Model
```prisma
model GameQuestion {
  id            String   @id @default(cuid())
  gameId        String
  questionId    String
  questionIndex Int      // 0-9 for the 10 questions
  game          Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  question      Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  @@unique([gameId, questionIndex])
}
```

**Purpose:** Link questions to games in specific order

**Key Fields:**
- `gameId`: Which game
- `questionId`: Which question from question bank
- `questionIndex`: Position in game (0-9)

**Unique Constraint:** `@@unique([gameId, questionIndex])` - each game has exactly 10 questions with indices 0-9

**Why Needed:**
- Same question can be used in multiple games
- Questions presented in specific order
- Allows querying "what were the questions for this game?"

---

### GameAnswer Model
```prisma
model GameAnswer {
  id             String   @id @default(cuid())
  gameId         String
  userId         String
  questionId     String
  selectedAnswer Int      // index: 0, 1, 2, or 3
  isCorrect      Boolean
  timeToAnswer   Int      // in seconds
  createdAt      DateTime @default(now())
  
  game     Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

**Purpose:** Store individual answer submissions

**Key Fields:**
- `gameId`: Which game
- `userId`: Which player
- `questionId`: Which question answered
- `selectedAnswer`: Index of selected option (0-3)
- `isCorrect`: true if selectedAnswer === question.correctAnswer
- `timeToAnswer`: Seconds taken to answer
- `createdAt`: Timestamp (used for tie-breaking in multiplayer)

**Notes:**
- Solo game: 10 GameAnswer records per game
- Multiplayer game: 20 GameAnswer records per game (10 per player)
- Used to calculate scores after game ends
- Used to determine round winners (first correct answer)
- Used in stats calculations (accuracy, streaks, etc.)

---

## ═══════════════════════════════════════
## 10. PERFORMANCE DASHBOARD
## ═══════════════════════════════════════

### What Stats are Tracked

**Overview Section:**
- **Total Games:** Count of all games played (solo + multiplayer)
- **Overall Accuracy:** Percentage of correct answers across all subjects
- **Current Streak:** Consecutive days with completed games (resets if miss a day)
- **Longest Streak:** Highest consecutive day streak ever achieved
- **Multiplayer Win Rate:** Percentage of multiplayer games won

**Subject Stats:**
- **Math Accuracy:** Percentage of correct answers in math questions
- **Logic Accuracy:** Percentage of correct answers in logic questions

**Solo Stats:**
- **Total Games:** Count of solo games played
- **Average Score:** Mean score across all solo games
- **Best Score:** Highest score achieved in solo games

**Multiplayer Stats:**
- **Total Games:** Count of multiplayer games played
- **Wins:** Count of multiplayer games won
- **Losses:** Count of multiplayer games lost
- **Win Rate:** Percentage (wins / total games)

**Performance Over Time:**
- **30-Day Chart:** Daily average scores for solo and multiplayer
- **X-axis:** Date (YYYY-MM-DD)
- **Y-axis:** Score (0-100)
- **Two Lines:** Solo average (one color), Multiplayer average (another color)

**Recent Games:**
- **Last 10 Games:** List showing:
  - Date played
  - Mode (solo/multiplayer)
  - Score
  - Result (Win/Loss/Completed)

### How Accuracy is Calculated

**Overall Accuracy:**
```typescript
const totalAnswers = GameAnswer.count({ where: { userId } })
const correctAnswers = GameAnswer.count({ where: { userId, isCorrect: true } })
const accuracy = (correctAnswers / totalAnswers) * 100
```

**Subject-Specific Accuracy:**
```typescript
// Get all answers with question relation
const answers = await GameAnswer.findMany({
  where: { userId },
  include: { question: true }
})

// Filter by subject
const mathAnswers = answers.filter(a => a.question.subject === 'math')
const logicAnswers = answers.filter(a => a.question.subject === 'logic')

// Calculate
mathAccuracy = (mathCorrect / mathAnswers.length) * 100
logicAccuracy = (logicCorrect / logicAnswers.length) * 100
```

**Display:** Rounded to 1 decimal place

### How Streaks are Calculated

**Algorithm (buildStreaks function in stats.ts):**

1. **Get all game completion dates:**
   ```typescript
   const completedGames = GamePlayer.findMany({
     where: { userId, completedAt: not null }
   })
   const dates = completedGames.map(g => toDateKey(g.completedAt))
   ```

2. **Remove duplicates and sort:**
   ```typescript
   const uniqueDates = Array.from(new Set(dates)).sort()
   ```

3. **Calculate longest streak:**
   ```typescript
   let longestStreak = 1
   let currentRun = 1
   
   for (let i = 1; i < uniqueDates.length; i++) {
     const dayDiff = (date[i] - date[i-1]) / MS_PER_DAY
     if (dayDiff === 1) {
       currentRun++
       longestStreak = Math.max(longestStreak, currentRun)
     } else {
       currentRun = 1
     }
   }
   ```

4. **Calculate current streak:**
   ```typescript
   let currentStreak = 0
   let cursor = startOfUtcDay(today)
   
   // Count backwards from today
   while (dateSet.has(toDateKey(cursor))) {
     currentStreak++
     cursor = addDays(cursor, -1)
   }
   
   // If didn't play today, streak is 0
   if (!dateSet.has(todayKey)) {
     currentStreak = 0
   }
   ```

**Rules:**
- Streak counts unique days, not number of games per day
- Must play at least 1 game per day to maintain streak
- Streak resets to 0 if you miss a day
- Uses UTC time for consistent day boundaries

### What Dashboard Shows

**Visual Components (Stats.tsx):**

1. **Overview Cards (Top Row):**
   - 🎯 Total Games: Large number
   - 📊 Accuracy: Percentage with progress bar
   - 🔥 Current/Longest Streak: Days counter
   - 🏆 Multiplayer Win Rate: Percentage

2. **Subject Breakdown:**
   - 🎓 Math Accuracy: Percentage with colored indicator
   - 🧠 Logic Accuracy: Percentage with colored indicator

3. **Mode Stats (Two Columns):**
   - **Solo Stats:**
     - Total games
     - Average score
     - Best score
   - **Multiplayer Stats:**
     - Total games
     - Wins/Losses
     - Win rate

4. **Performance Chart:**
   - Line chart (Recharts library)
   - 30 days of historical data
   - Two lines: Solo (cyan), Multiplayer (green)
   - X-axis: Dates
   - Y-axis: Average score (0-100)
   - Tooltips on hover

5. **Recent Games Table:**
   - Date (formatted: "MMM DD, YYYY")
   - Mode (Solo/Multiplayer badge)
   - Score
   - Result (Win/Loss/Completed badge with colors)
   - Shows last 10 games

**Refresh:**
- Loads on component mount
- Re-fetches when user navigates back to stats page
- No auto-refresh while viewing (would need manual refresh or re-navigation)

---

## ═══════════════════════════════════════
## 11. LEADERBOARD
## ═══════════════════════════════════════

### How Leaderboard is Calculated

**Query Process (gameService.getLeaderboard):**

1. **Get all users:**
   ```typescript
   const allUsers = await User.findMany({
     select: { id: true, username: true }
   })
   ```

2. **For each user, count multiplayer stats:**
   ```typescript
   for (const user of allUsers) {
     const multiplayerGames = await GamePlayer.findMany({
       where: {
         userId: user.id,
         game: {
           gameType: 'multiplayer',
           status: 'completed'
         }
       }
     })
     
     const totalWins = multiplayerGames.filter(gp => gp.isWinner).length
     const totalGames = multiplayerGames.length
   }
   ```

3. **Sort by wins descending, then username alphabetically:**
   ```typescript
   leaderboardData.sort((a, b) => {
     if (b.totalMultiplayerWins !== a.totalMultiplayerWins) {
       return b.totalMultiplayerWins - a.totalMultiplayerWins
     }
     return a.username.localeCompare(b.username)
   })
   ```

4. **Add rank numbers:**
   ```typescript
   .map((entry, index) => ({
     rank: index + 1,
     ...entry
   }))
   ```

**Tiebreaker:** If two users have same number of wins, sorted alphabetically by username

### What Data is Shown

**Leaderboard Table Columns:**
1. **Rank:** 1, 2, 3, 4, ... (with medals for top 3)
   - 🥇 Gold for rank 1
   - 🥈 Silver for rank 2
   - 🥉 Bronze for rank 3
   - Numbers for 4+

2. **Username:** Player's display name

3. **Wins:** Total multiplayer games won

4. **Games Played:** Total completed multiplayer games

**Visual Styling (Leaderboard.tsx):**
- Top 3 ranks have highlighted rows (gold/silver/bronze backgrounds)
- Current user's row highlighted in cyan (if in leaderboard)
- Responsive table (scrollable on mobile)
- Shows top 50 by default (configurable via query param)

### How Often Does It Refresh

**Refresh Behavior:**
- **On Component Mount:** Fetches data automatically
- **On Manual Refresh:** User can click refresh button (if implemented)
- **No Auto-Refresh:** Does not refresh while viewing (static after load)

**API Call:**
```typescript
GET /api/games/leaderboard/global?limit=50
```

**Notes:**
- Public endpoint (no authentication required)
- Cached in frontend state until user navigates away
- Backend calculates fresh data on each request (no caching)
- Could be optimized with Redis caching if needed

---

## ═══════════════════════════════════════
## 12. KNOWN ISSUES OR INCOMPLETE FEATURES
## ═══════════════════════════════════════

### Incomplete Features

1. **Topic-Based Practice (TopicPractice.tsx)**
   - Component exists but not integrated into app flow
   - Intended for practicing specific topics (fractions, algebra, etc.)
   - Currently bypassed in favor of grade-based selection

2. **Rating System (ELO)**
   - User.rating field exists (default 1000)
   - Not currently used in matchmaking or leaderboard
   - Could be used for skill-based matching in future

3. **currentRound Field (Game Model)**
   - Field exists in database: `currentRound Int @default(1)`
   - Not actively used in multiplayer logic
   - Intended for potential future multi-round games

4. **Admin/Teacher Features**
   - No admin panel or teacher dashboard
   - No ability to create custom question sets
   - No class/group management

5. **Question Difficulty Range Expansion**
   - `EXPAND_RANGE_AFTER` and `RANGE_EXPAND_BY` constants defined in aiQuestion.ts
   - Intended for expanding search range if not enough questions found
   - Partially implemented but not fully utilized

### Hardcoded Values

1. **Questions Per Game**
   - Hardcoded: 10 questions per game
   - Found in: Multiple locations (game.ts, socket handlers, frontend)
   - Could be made configurable per grade/subject

2. **Socket Room Format**
   - Hardcoded: `game:${gameId}`
   - Found in: socket handlers (join_game, emit events)
   - Consistent throughout app (not an issue, just documented)

3. **Groq Model**
   - Hardcoded: `'llama-3.3-70b-versatile'`
   - Found in: aiQuestion.ts, GROQ_MODEL constant
   - Could be environment variable for flexibility

4. **JWT Expiry**
   - Hardcoded: 7 days
   - Found in: jwt.ts, `expiresIn: '7d'`
   - Could be environment variable

5. **Difficulty Thresholds**
   - Hardcoded: 80% for hard, 50% for medium
   - Found in: game.ts, getAdaptiveDifficulty function
   - Could be made configurable per grade

6. **Next Question Delay**
   - Hardcoded: 2000ms (2 seconds)
   - Found in: game.ts socket handler, setTimeout for next_question
   - Could be made configurable

7. **API URLs**
   - Defaults: `http://localhost:5001` (backend), `http://localhost:5173` (frontend)
   - Found in: index.ts (CORS), AuthContext, useGameSocket, api.ts
   - Should be environment variables (already using VITE_API_URL and VITE_SOCKET_URL)

8. **Leaderboard Limit**
   - Default: 50 players
   - Found in: game.ts route, getLeaderboard function
   - Configurable via query param but defaults to 50

9. **Recent Games Limit**
   - Hardcoded: 10 games
   - Found in: stats.ts, dashboard query
   - Could be made configurable or paginated

10. **Performance Chart Days**
    - Hardcoded: 30 days
    - Found in: stats.ts, buildDailySeries function
    - Could allow different time ranges (7, 30, 90 days)

### Potential Improvements

1. **Solo Game Always Counts as Win**
   - Logic: Solo game sets `isWinner = true` regardless of score
   - May inflate win statistics
   - Consider: Only count as win if score >= threshold

2. **No Pagination on Leaderboard**
   - Returns all results up to limit
   - Could be slow with many users
   - Consider: Implement pagination or virtual scrolling

3. **No Question Reporting**
   - Users can't report incorrect/poorly worded questions
   - No mechanism to flag AI-generated question errors

4. **No Time Limits Per Question**
   - timeToAnswer is tracked but not enforced
   - Players can take unlimited time
   - Consider: Add countdown timer and auto-submit

5. **No Explanation for Correct Answers**
   - Only shows explanation when answer is incorrect
   - Could show for all answers to aid learning

6. **Socket Reconnection on Network Issues**
   - Basic reconnection configured (5 attempts)
   - Game state not fully restored after reconnection
   - May need to rejoin game room and sync state

7. **No Mobile-Specific Optimizations**
   - Responsive design exists
   - Could benefit from touch-optimized controls
   - Offline mode not supported

8. **AI Question Generation Cost**
   - Groq API calls on every game start
   - Could implement question pool/caching strategy
   - Fallback to database helps but not optimized

9. **Database Query Optimization**
   - Some N+1 queries in leaderboard generation
   - Stats dashboard makes many sequential queries
   - Could use database aggregations or caching

10. **No Email Verification**
    - Users can sign up without verifying email
    - Could lead to fake accounts
    - Email field not validated beyond format

### Technical Debt

1. **Console.log Statements**
   - Extensive logging in socket handlers
   - Should use proper logging library (Winston, Pino)
   - Should have log levels (debug, info, warn, error)

2. **Error Handling**
   - Generic "try-catch" blocks with `error.message`
   - Could provide more specific error types
   - Frontend shows generic alerts instead of toast notifications

3. **Type Safety**
   - Some `any` types in socket handlers
   - Could strengthen TypeScript types throughout
   - Prisma types not always used consistently

4. **Test Coverage**
   - No unit tests
   - No integration tests
   - No E2E tests

5. **Environment Variables Documentation**
   - .env.example exists only for frontend
   - Backend environment variables not documented in .env.example
   - Required vars: DATABASE_URL, JWT_SECRET, GROQ_API_KEY

---

## ═══════════════════════════════════════
## 13. DEPLOYMENT
## ═══════════════════════════════════════

### Where is Frontend Hosted?
**Platform:** Render (Static Site)

**URL:** https://math-game-frontend-aihx.onrender.com

**Build Process:**
1. Render connects to GitHub repository
2. On push to main branch → triggers build
3. Runs: `npm run build` (Vite build)
4. Outputs to: `dist/` folder
5. Serves static files from dist/

**Build Command:** `npm run build`
**Publish Directory:** `dist`

**Environment Variables Needed:**
- `VITE_API_URL` - Backend API URL (e.g., https://math-game-backend.onrender.com)
- `VITE_SOCKET_URL` - Socket.io server URL (same as API URL)

---

### Where is Backend Hosted?
**Platform:** Render (Web Service)

**URL:** https://math-game-backend.onrender.com (example)

**Deployment Process:**
1. Render connects to GitHub repository
2. On push to main branch → triggers deploy
3. Runs: `npm install` (installs dependencies)
4. Runs: `npx prisma generate` (generates Prisma client)
5. Runs: `npx prisma migrate deploy` (applies migrations)
6. Runs: `npm run build` (compiles TypeScript)
7. Runs: `npm start` (starts Node.js server)

**Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
**Start Command:** `npm start`

---

### What Environment Variables are Needed?

**Backend (.env):**
```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# JWT Authentication
JWT_SECRET=your-secret-key-here-change-in-production

# AI Question Generation
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server
PORT=5000

# CORS (optional, for specific frontend URL)
FRONTEND_URL=https://math-game-frontend-aihx.onrender.com
```

**Frontend (.env):**
```bash
# Backend API URL
VITE_API_URL=https://math-game-backend.onrender.com

# Socket.io URL
VITE_SOCKET_URL=https://math-game-backend.onrender.com
```

**Critical Notes:**
- `JWT_SECRET` must be kept secret and should be a long random string
- `GROQ_API_KEY` get from https://console.groq.com/keys
- `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Frontend env vars MUST start with `VITE_` to be exposed to client

---

### What is the Database?

**Production:** PostgreSQL (managed by Render)

**Development:** Can use SQLite or PostgreSQL

**Connection:**
- Managed through Prisma ORM
- Connection string in DATABASE_URL environment variable

**Migrations:**
- Located in: `backend/prisma/migrations/`
- Applied with: `npx prisma migrate deploy` (production) or `npx prisma migrate dev` (development)

**Seeding:**
- Seed script: `backend/prisma/seed.ts`
- Run with: `npm run prisma:seed`
- Seeds initial question bank (if needed)

**Schema:**
- Defined in: `backend/prisma/schema.prisma`
- 6 models: User, Game, GamePlayer, Question, GameQuestion, GameAnswer

---

### Deployment Checklist

✅ **Backend Setup:**
1. Create Render Web Service
2. Connect to GitHub repository
3. Set branch to `main`
4. Set root directory to `backend/`
5. Add environment variables (DATABASE_URL, JWT_SECRET, GROQ_API_KEY)
6. Configure build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
7. Configure start command: `npm start`
8. Deploy

✅ **Database Setup:**
1. Create PostgreSQL database on Render
2. Copy DATABASE_URL
3. Add to backend environment variables
4. Migrations applied automatically on deploy

✅ **Frontend Setup:**
1. Create Render Static Site
2. Connect to GitHub repository
3. Set branch to `main`
4. Set root directory to `frontend/`
5. Add environment variables (VITE_API_URL, VITE_SOCKET_URL)
6. Configure build command: `npm run build`
7. Set publish directory: `dist`
8. Deploy

✅ **CORS Configuration:**
1. Update `backend/src/index.ts` CORS origins
2. Add production frontend URL to allowed origins
3. Redeploy backend

✅ **Testing:**
1. Visit frontend URL
2. Test signup/login
3. Test solo game
4. Test multiplayer with 2 devices
5. Check stats dashboard
6. Check leaderboard

---

## ═══════════════════════════════════════
## END OF DOCUMENTATION
## ═══════════════════════════════════════

**Last Updated:** March 2, 2026
**Total Lines Analyzed:** ~8,000+
**Components Documented:** 47
**API Endpoints:** 15
**Socket Events:** 25
**Database Models:** 6

This documentation represents a complete analysis of the Math Game codebase as it exists at the time of generation. The application is fully functional with robust solo and multiplayer modes, AI-powered question generation, adaptive difficulty, and comprehensive statistics tracking.

**Key Achievements:**
- ✅ Full authentication system with JWT
- ✅ Real-time multiplayer with Socket.io
- ✅ AI question generation with Groq (with database fallback)
- ✅ Adaptive difficulty algorithm
- ✅ Multi-language support (English, Russian, Kazakh)
- ✅ Two subjects (Math and Logic & IQ)
- ✅ Comprehensive statistics dashboard
- ✅ Global leaderboard
- ✅ Production-ready deployment on Render

**For New Developers:**
Start with:
1. SETUP_GUIDE.md - Get the app running locally
2. README.md - Understand features and structure
3. This SUMMARY.md - Deep dive into implementation details
4. SYSTEM_DESIGN.md - Architecture decisions

**For Feature Development:**
- Backend changes: Start in `backend/src/services/`
- Frontend changes: Start in `frontend/src/components/`
- Database changes: Edit `backend/prisma/schema.prisma` then migrate
- Socket events: Edit `backend/src/sockets/game.ts`

**Support:**
For questions or issues, refer to GitHub repository or contact the development team.

---
