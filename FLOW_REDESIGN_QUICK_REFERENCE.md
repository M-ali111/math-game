# Game Flow Redesign - Quick Reference

## New Game Architecture

### The 5-Step Flow

```
┌─────────────┐
│    LOGIN    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    MENU     │ (Play Solo / Play Multiplayer / Stats)
└──────┬──────┘
       │ (plays Solo or Multiplayer)
       ▼
┌──────────────────────┐
│ SUBJECT SELECTION    │ ← NEW FIRST STEP
│ • Mathematics        │
│ • Logic & IQ         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ MODE SELECTION       │ ← NEW DEDICATED STEP
│ • Solo Play          │
│ • Multiplayer        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ GRADE SELECTION      │ (with Language Selector)
│ • Primary (1-6)      │
│ • Grade 5→6 Entry    │
│ • Grade 6→7 Entry    │
│ 🌐 Language: EN/RU/KZ│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   PLAY GAME          │
│ • Questions display  │
│ • Subject badge      │
│ • Answer options     │
└──────┬───────────────┘
       │ (Exit to Menu)
       ▼
┌──────────────────────┐
│  BACK TO MENU        │
│  (Flow resets)       │
└──────────────────────┘
```

## Component Hierarchy

```
App
├── Login
├── GameMenu
├── SubjectSelection [NEW]
│   └── Called with onSubjectSelected callback
├── ModeSelection [NEW]
│   └── Shows current subject selection
├── SoloGame
│   └── GradeSelector (grade-only, no subject)
│       └── Starts game with subject from GameContext
├── MultiplayerGame
│   └── GradeSelector (grade-only, no subject)
│       └── Creates/joins game with subject from GameContext
└── Stats
    └── Shows stats filtered by subject
```

## State Management

### GameContext (NEW)
```javascript
{
  subject: 'math' | 'logic' | null        // Global subject selection
  selectedMode: 'solo' | 'multiplayer' | null
  selectedGrade: 1 | 2 | 3 | null
  currentStep: 'subject' | 'mode' | 'grade' | 'language' | 'playing'
}

// Methods
setSubject(subject)           // Updates + saves to localStorage
setSelectedMode(mode)
setSelectedGrade(grade)
setCurrentStep(step)
resetGameFlow()               // Clears all game state
```

### LanguageContext (Existing)
```javascript
{
  language: 'english' | 'russian' | 'kazakh'
}

// Methods
setLanguage(language)
```

### AuthContext (Existing)
```javascript
{
  user: User | null
  token: string | null
}

// Methods
login(email, password)
signup(email, username, password)
logout()
```

## Key File Changes

### NEW Files Created
✨ **GameContext.tsx**
- Global state for game flow
- Subject persistence via localStorage
- Flow reset capability

✨ **SubjectSelection.tsx**
- 2 subject buttons with color coding
- Calls onSubjectSelected when ready
- Back button to menu

✨ **ModeSelection.tsx**
- 2 mode buttons (Solo/Multiplayer)
- Shows current subject
- Back button to subject selection

✨ **ProgressIndicator.tsx**
- Visual 5-step progress tracker
- Color-coded (green=completed, blue=current, gray=upcoming)

### MODIFIED Files
🔄 **App.tsx**
- Added 'subject-selection' and 'mode-selection' app states
- Routes GameMenu → SubjectSelection → ModeSelection → Game
- Calls resetGameFlow() on back-to-menu

🔄 **main.tsx**
- Wrapped App with GameProvider
- Provider hierarchy: Auth → Language → Game → App

🔄 **SubjectSelection.tsx** (was part of GradeSelector)
- Now standalone component
- Takes onSubjectSelected callback prop
- Input: none → Output: subject set in GameContext

🔄 **GradeSelector.tsx**
- Reverted to grade-only selection
- Removed subject selection logic
- Updated onSelect callback: `(grade, subject)` → `(grade)`
- Language selector still included

🔄 **SoloGame.tsx**
- Uses subject from GameContext via useGame()
- GradeSelector takes only onSelect(grade)
- Game start triggered when grade selected

🔄 **MultiplayerGame.tsx**
- Uses subject from GameContext via useGame()
- createGame(grade, subject) → createGame(grade)
- GradeSelector integration mirrors SoloGame

🔄 **translations.ts**
- Added 9 new translation keys for new flow
- All keys in English, Russian, Kazakh

## How Subject Selection Works

### Step 1: SubjectSelection Component
```tsx
<SubjectSelection 
  onSubjectSelected={() => setAppState('mode-selection')}
  onBack={() => setAppState('menu')}
/>
```

### Step 2: User Selects Subject
```tsx
const handleSelectSubject = (subject) => {
  setSubject(subject)              // Saves to GameContext + localStorage
  onSubjectSelected?.()             // Calls parent callback
}
```

### Step 3: App Advances to Mode Selection
```tsx
if (onSubjectSelected called) {
  setAppState('mode-selection')
}
```

### Step 4: Subject Available Throughout Flow
```tsx
const { subject } = useGame()  // Available in any component
// Use subject for game creation, question filtering, etc.
```

## LocalStorage Persistence

Subject preference is saved and restored:

```javascript
// On selection
localStorage.setItem('selectedSubject', 'math')

// On app reload
const stored = localStorage.getItem('selectedSubject')
if (stored === 'math' || stored === 'logic') {
  restore to previousy selected subject
}
```

## Translation Keys

### New Keys (All Languages)
```
chooseSubject       "What do you want to practice?"
selectMode          "Choose a game mode"
chooseLanguage      "Choose a language"
mathematics         "Mathematics"
logicIQ             "Logic & IQ"
grade               "Grade"
language            "Language"
```

### Existing Keys (Still Used)
```
startGame, chooseGrade, playSolo, multiplayer, 
back, subject, math, logic
```

## Testing the New Flow

### Test 1: Complete Solo Game Flow
1. Login
2. Click "Play Solo"
3. Select "Mathematics"
4. Select "Solo"
5. Select Grade 2
6. Select Language
7. Play game
8. Verify subject icon shows "🔢 Mathematics"
9. Exit to menu

### Test 2: Complete Multiplayer Flow
1. Login
2. Click "Play Multiplayer" (or from Menu)
3. Select "Logic & IQ"
4. Select "Multiplayer"
5. Select Grade 1
6. Create/Join game
7. Verify subject badge shows "🧩 Logic & IQ"
8. Exit to menu

### Test 3: Subject Persistence
1. Login
2. Select "Mathematics"
3. Close browser/logout
4. Login again
5. Click "Play Solo"
6. Verify "Mathematics" is pre-selected

### Test 4: Back Navigation
1. Login
2. Start to select subject
3. Click Back → Returns to menu
4. Click "Play Solo" again
5. Select subject, then click Back in Mode Selection
6. Should return to subject selection (not menu)

## Breaking Changes for Developers

### GradeSelector API Change
```tsx
// OLD
<GradeSelector onSelect={(grade, subject) => {}} />

// NEW
<GradeSelector onSelect={(grade) => {}} />
```

### Game Start Flow
```tsx
// OLD
// In SoloGame/MultiplayerGame, always show GradeSelector first
// Then subject was selected as second step

// NEW
// Subject is selected globally BEFORE entering game components
// Game components only show GradeSelector
// Subject is accessed via useGame() hook
```

### localStorage Subject Key
```javascript
// OLD (if was being used)
localStorage.setItem('preferredSubject', subject)

// NEW
localStorage.setItem('selectedSubject', subject)
// (automatically managed by GameContext)
```

## Performance Notes

- GameContext uses useMemo to prevent unnecessary re-renders
- Subject persists in localStorage for instant restoration
- No unnecessary API calls - subject is known before game starts
- New components are lightweight with minimal dependencies

## Future Enhancements

1. Add ProgressIndicator to main UI header
2. Add page transition animations
3. Add quiz/tutorial for first-time users
4. Add stats comparison between Math and Logic
5. Add subject recommendations based on performance
