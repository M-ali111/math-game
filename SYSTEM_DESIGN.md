# Logic & IQ Question System Design

## Groq AI Prompts

### Mathematics System Prompt

```
You are an expert at creating math questions for Kazakhstan NIS 
(Nazarbayev Intellectual Schools) and BIL school admission tests. 
Generate questions that match the exact style, difficulty, and format 
of real NIS/BIL entrance exams. Questions should test logical thinking, 
not just memorization. Always respond with valid JSON only, no extra text.
```

### Logic & IQ System Prompt

```
You are an expert at creating Logic and IQ questions for Kazakhstan 
NIS (Nazarbayev Intellectual Schools) and BIL school admission tests. 
Generate questions that test: pattern recognition (number sequences, shape patterns), 
logical reasoning (if-then, true/false deductions), analogy questions (A is to B as C is to ?), 
odd one out, matrix reasoning, and word logic puzzles. 
These should match the exact style of real NIS/BIL entrance exam logic sections. 
Always respond with valid JSON only, no extra text.
```

## Question Generation Flow

1. **User selects subject** (Math or Logic)
2. **Backend picks topic** based on grade and subject
3. **Groq AI is called** with:
   - Subject-specific system prompt
   - User prompt specifying:
     - Number of questions
     - Grade/level
     - Difficulty (easy/medium/hard)
     - Topic
     - Language (English/Russian/Kazakh)
4. **Response is parsed** and normalized
5. **Questions are stored** in database with subject field

## Topic Selection

### Mathematics Topics by Grade

**Primary (Grade 1-6):**
- addition, subtraction, multiplication, division, fractions
- basic geometry, word problems, time, money

**Grade 5→6 Entry:**
- fractions, decimals, ratios, percentages
- basic algebra, area and perimeter, logic puzzles

**Grade 6→7 Entry:**
- algebra equations, integers, coordinate geometry, percentages
- multi-step word problems, pattern recognition

### Logic & IQ Topics by Grade

**Primary (Grade 1-6):**
- simple patterns
- odd one out
- basic sequences
- picture logic
- simple analogies

**Grade 5→6 Entry:**
- number sequences
- letter patterns
- analogies
- logical deductions
- series completion

**Grade 6→7 Entry:**
- complex patterns
- matrix reasoning
- multi-step logical deductions
- verbal reasoning
- abstract reasoning

## JSON Response Format

Groq API is expected to return questions in this format:

```json
[
  {
    "question": "Question text here",
    "options": [
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4"
    ],
    "correctAnswer": "Option 1",
    "topic": "pattern recognition",
    "grade": "Grade 5→6 Entry",
    "difficulty": "medium",
    "explanation": "Why this is correct..."
  }
]
```

### Normalization Rules

After receiving the response:
1. Parse JSON array
2. Filter out invalid entries
3. Verify all 4 options are present
4. Verify correctAnswer exists in options
5. Normalize difficulty to: easy | medium | hard
6. Store in database with subject field

## Database Schema

```prisma
model Question {
  id         String   @id @default(cuid())
  text       String
  difficulty Int      // 1-10 normalized
  options    String   // JSON array: ["option1", "option2", "option3", "option4"]
  correctAnswer Int  // index: 0, 1, 2, or 3
  language   String   @default("english")
  subject    String   @default("math") // "math" | "logic"
  explanation String?
  createdAt  DateTime @default(now())

  // Relations
  gameQuestions GameQuestion[]
  gameAnswers   GameAnswer[]
}
```

## User-Facing Labels

### English
- Mathematics / Математика / Математика
- Logic & IQ / Логика и IQ / Логика және IQ

### Russian
- Математика
- Логика и IQ

### Kazakh
- Математика
- Логика және IQ

## Statistics Calculation

### Accuracy Metrics

**Math Accuracy:**
```
= (correct_math_answers / total_math_answers) * 100
```

**Logic Accuracy:**
```
= (correct_logic_answers / total_logic_answers) * 100
```

**Overall Accuracy:**
```
= (total_correct_answers / total_answers) * 100
```

## Performance Targets

Based on NIS/BIL entrance exam standards:

- **Easy**: 70%+ accuracy expected
- **Medium**: 50%+ accuracy expected  
- **Hard**: 30%+ accuracy expected

Adaptive difficulty system adjusts based on recent game performance.

## Groq Model Configuration

- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: 2000
- **Response Format**: JSON object
- **Fallback**: Retry without response_format if needed

## Local Testing

To test question generation locally:

```typescript
import { generateNisBilQuestions } from './services/aiQuestion';

const questions = await generateNisBilQuestions({
  count: 5,
  gradeLabel: '5 to 6 entry',
  difficulty: 'medium',
  topic: 'pattern recognition',
  language: 'english',
  subject: 'logic'
});

console.log(questions);
```

## Monitoring & Logging

Key metrics to monitor:
1. Groq API response times
2. JSON parse errors
3. Invalid question format rates
4. Subject distribution in database
5. User subject selection patterns
6. Accuracy rates by subject/grade
7. Question reuse rates

## Known Limitations

1. Groq API may occasionally generate imperfect JSON
   - Mitigation: Fallback format and strict validation

2. Question quality depends on Groq model
   - Mitigation: Use seed questions for critical tests

3. Language translation quality varies
   - Mitigation: Manual review of Russian/Kazakh questions

4. Pattern recognition questions harder to generate
   - Mitigation: May need to source some pre-generated questions

## Future Improvements

1. **Question caching** - Store and reuse high-quality generated questions
2. **Human review workflow** - QA team reviews before use
3. **A/B testing** - Test different prompts to improve quality
4. **Specialized models** - Consider fine-tuning for NIS/BIL format
5. **Multilingual generation** - Generate directly in target language
6. **Image-based logic** - Support pattern images for visual logic
7. **Spaced repetition** - Track question history per user

## Integration Checklist

- ✅ Database migration applied
- ✅ Groq prompts updated
- ✅ Question service modified
- ✅ Game service updated
- ✅ Routes accepting subject parameter
- ✅ Frontend supporting subject selection
- ✅ Statistics tracking by subject
- ✅ localStorage persistence
- ✅ Translations added
- ✅ UI badges displaying correctly
