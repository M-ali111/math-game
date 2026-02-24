# Logic & IQ Questions - Quick Start Guide

## For Users

### How to Play Logic & IQ Questions

1. **Start a Game**
   - Click "Play Solo" or "Multiplayer"
   - Select your grade level (Primary, Grade 5→6, or Grade 6→7)
   - **NEW**: Select your subject:
     - 🔢 **Mathematics**: Traditional math problems
     - 🧠 **Logic & IQ**: Pattern recognition, reasoning, analogies, and logic puzzles

2. **During Gameplay**
   - Each question shows a colored badge indicating the subject:
     - Blue badge = Mathematics question
     - Purple badge = Logic & IQ question
   - Answer questions as you normally would
   - Your accuracy is tracked per subject

3. **Track Your Progress**
   - Visit the Stats/Performance Dashboard
   - See separate accuracy metrics for:
     - 🔢 Mathematics accuracy
     - 🧠 Logic & IQ accuracy
   - Your subject preference is saved for next time

### Language Support
- English
- Русский (Russian)
- Қазақша (Kazakh)

## For Developers

### Configuration

The system is designed for NIS/BIL (Nazarbayev Intellectual Schools) entrance exam preparation with:
- **3 grade levels**: Primary (1-6), Grade 5→6 Entry, Grade 6→7 Entry
- **2 subjects**: Math and Logic & IQ
- **3 languages**: English, Russian, Kazakh
- **3 difficulty levels**: Easy, Medium, Hard (adaptive)

### Logic Question Categories by Grade

#### Primary (Grades 1-6)
- Simple patterns
- Odd one out
- Basic sequences
- Picture logic
- Simple analogies

#### Grade 5→6 Entry
- Number sequences
- Letter patterns
- Analogies
- Logical deductions
- Series completion

#### Grade 6→7 Entry
- Complex patterns
- Matrix reasoning
- Multi-step logical deductions
- Verbal reasoning
- Abstract reasoning

### API Usage

**Create Solo Game with Logic Questions:**
```javascript
const response = await fetch('/api/games/solo/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    grade: 2,              // 1, 2, or 3
    language: 'english',   // 'english', 'russian', or 'kazakh'
    subject: 'logic'       // 'math' or 'logic'
  })
});
```

**Create Multiplayer Game with Logic Questions:**
```javascript
const response = await fetch('/api/games/multiplayer/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    grade: 2,
    language: 'english',
    subject: 'logic'
  })
});
```

### Database

Questions are now stored with a `subject` field:
- `subject: 'math'` - Mathematics questions
- `subject: 'logic'` - Logic & IQ questions

Queries should filter by subject when needed:
```typescript
const mathQuestions = await prisma.question.findMany({
  where: { subject: 'math' }
});

const logicQuestions = await prisma.question.findMany({
  where: { subject: 'logic' }
});
```

### AI Question Generation

The system uses Groq API with specialized prompts:

**Math Questions Prompt:**
```
You are an expert at creating math questions for Kazakhstan NIS 
(Nazarbayev Intellectual Schools) and BIL school admission tests...
```

**Logic Questions Prompt:**
```
You are an expert at creating Logic and IQ questions for Kazakhstan NIS 
(Nazarbayev Intellectual Schools) and BIL school admission tests.
Generate questions that test:
- Pattern recognition (number sequences, shape patterns)
- Logical reasoning (if-then, true/false deductions)
- Analogy questions (A is to B as C is to ?)
- Odd one out
- Matrix reasoning
- Word logic puzzles
```

### Statistics

Dashboard now includes subject-specific metrics:
```typescript
{
  subjectStats: {
    mathAccuracy: 75.5,    // percentage
    logicAccuracy: 62.3    // percentage
  }
}
```

## Troubleshooting

### Questions not generating for Logic subject
- Ensure `GROQ_API_KEY` is configured
- Check that the request includes `subject: 'logic'`
- Verify Groq API is responding

### Subject badges not displaying
- Clear browser cache
- Ensure question objects include `subject` field from API
- Check CSS is loading correctly

### localStorage not persisting
- Ensure browser allows localStorage
- Check that no private/incognito mode is active
- Verify localStorage key: `preferredSubject`

## Future Enhancements

Potential improvements:
1. Add detailed analytics comparing subject performance
2. Implement subject-specific achievements/badges
3. Create focused practice modes for weak subjects
4. Add timed challenges for specific subjects
5. Implement adaptive subject switching based on performance
6. Create leaderboards split by subject

## Support

For issues or questions, refer to:
- Backend logs for Groq API errors
- Browser console for frontend errors
- Database logs for data integrity issues
