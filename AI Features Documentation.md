# AI Features Documentation

This document lists all AI-powered features used in the system.

## AI Provider
- **Service**: Google Gemini AI (Free Tier)
- **Model**: `gemini-2.0-flash-lite` (configurable via `VITE_GEMINI_MODEL`)
- **API Key**: Required via `VITE_GOOGLE_AI_API_KEY` environment variable
- **Rate Limit**: 15 requests per minute (Free Tier)

## AI Features

### 1. Project Description Generation
**Function**: `generateProjectDescriptionWithGemini()`
**Location**: Quote Creation - Client Selection Step
**Purpose**: Generates professional project description from category and user input
**Input**: 
- Project category
- User's written context/description
- Custom category (if selected)

**Output**: Professional project description in user's language

---

### 2. Voice-to-Text Enhancement
**Function**: `enhanceTranscriptionWithAI()`
**Location**: Quote Creation - Project Description & Task Definition
**Purpose**: Improves voice transcription quality (grammar, clarity, professionalism)
**Input**:
- Raw transcribed text from speech recognition
- Project categories (for context)
- Custom category (if selected)

**Output**: Enhanced, professional text with corrected grammar and improved clarity

**Features**:
- Corrects grammar and spelling
- Improves clarity and structure
- Makes style more professional and technical
- Adapts vocabulary to project category
- Maintains proportional length to original input

---

### 3. Task Description Generation
**Function**: `generateTaskDescriptionWithGemini()`
**Location**: Quote Creation - Task Definition Step
**Purpose**: Generates detailed task description with technical specifications
**Input**:
- Task context/description
- Project context/categories

**Output**: Detailed task description including:
- Technical specifications
- Implementation steps
- Estimated materials
- Labor pricing suggestions
- Duration estimates

---

### 4. Task Suggestions
**Function**: `generateTaskSuggestionsWithGemini()`
**Location**: Quote Creation - Task Definition Step
**Purpose**: Suggests relevant tasks based on project category and description
**Input**:
- Project category
- Project description
- Maximum number of tasks (default: 3)

**Output**: Array of suggested tasks with:
- Task title
- Description
- Estimated duration
- Labor price
- Suggested materials list

**Note**: Results are cached to avoid repeated API calls during navigation

---

### 5. Text Translation
**Function**: `translateTextWithAI()`
**Location**: Quote & Invoice Send Modals
**Purpose**: Translates custom email messages to client's language preference
**Input**:
- Text to translate (custom message/subject)
- Target language (client's language preference)
- Source language (user's language preference)

**Output**: Translated text in target language

**Use Case**: 
- User writes custom email message in their language
- System automatically translates to client's language before sending
- Graceful fallback: uses original text if translation fails

---

## Where AI is Used

### Quote Creation Flow
1. **Step 1 - Client Selection**: 
   - Project description generation
   - Voice-to-text enhancement for project description

2. **Step 3 - Task Definition**:
   - Voice-to-text enhancement for task descriptions
   - Task description generation (from voice or text input)
   - Task suggestions (based on project)

### Email Sending
- **Quote Send Modal**: Custom message translation
- **Invoice Send Modal**: Custom message translation

---

## Service File
All AI functions are located in: `src/services/googleAIService.js`

---

## Error Handling
All AI functions include graceful error handling:
- Returns original text if AI fails
- Handles API errors (invalid key, quota exceeded, rate limits, safety filters)
- Logs errors for debugging
- Never blocks user workflow

---

## Notes
- All AI features are optional - system works without AI if API key is not configured
- Free tier has rate limits (15 requests/minute)
- AI output length is proportional to input length
- All AI-generated content can be manually edited by users

