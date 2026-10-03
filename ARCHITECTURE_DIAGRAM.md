# English Learning App - Architecture Diagram

## Overview
This is a progressive web app (PWA) for learning English vocabulary and irregular verbs with gamification elements.

## File Structure
```
learnenglish/
├── index.html              # Main hub/landing page with onboarding
├── vocabulaire.html        # Vocabulary learning interface
├── vocabulaire.css         # Vocabulary styling
├── vocabulaire.js          # Vocabulary game logic
├── verbes.html             # Irregular verbs interface
├── tuto-anglais.html       # Tutorial/help page
├── manifest.json           # PWA manifest
├── data/                   # Learning data
│   ├── A1.json - C2.json   # Vocabulary by CEFR levels (cumulative)
│   ├── delta/              # Exclusive words per level
│   ├── verbes.json         # Irregular verbs with progress
│   └── jurons.json         # Swear words collection feature
└── scripts/                # Data processing utilities
    ├── build-vocab-deltas.mjs
    ├── add-word-guides.mjs
    └── fix-json-encoding.mjs
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   index.html │  │vocabulaire.h│  │  verbes.html │      │
│  │   (Hub)      │  │   (Vocab)    │  │  (Verbs)     │      │
│  │              │  │              │  │              │      │
│  │ • Onboarding │  │ • Quiz UI    │  │ • Verb Quiz  │      │
│  │ • Navigation │  │ • Progress   │  │ • 3 Forms    │      │
│  │ • Cards      │  │ • Gamification│ │ • XP System  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                  ┌────────▼────────┐                       │
│                  │  tuto-anglais   │                       │
│                  │  (Tutorial)     │                       │
│                  └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GAME LOGIC LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              vocabulaire.js (IIFE)                   │   │
│  │                                                      │   │
│  │  • State Management (localStorage)                  │   │
│  │  • Spaced Repetition Algorithm                       │   │
│  │  • Badge System (combos, word counts)                │   │
│  │  • XP & Level System                                 │   │
│  │  • Theme Engine (7 skins)                            │   │
│  │  • Text-to-Speech Integration                        │   │
│  │  • Import/Export Functions                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              verbes.html (Embedded JS)                │   │
│  │                                                      │   │
│  │  • Verb Progress Tracking                            │   │
│  │  • Session Combo System                              │   │
│  │  • XP & Player Level                                 │   │
│  │  • Streak Tracking (days, perfect, volume)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              localStorage (Browser)                    │   │
│  │                                                      │   │
│  │  • EM_ULTIMATE_TIME_V1 (Dictionary)                  │   │
│  │  • EM_ULTIMATE_TIME_V1_STATS (User Progress)         │   │
│  │  • Onboarding keys                                   │   │
│  │  • Theme preferences                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              JSON Data Files                          │   │
│  │                                                      │   │
│  │  • A1.json → C2.json (Cumulative vocab)              │   │
│  │  • delta/A1.json → delta/C2.json (Exclusive words)   │   │
│  │  • verbes.json (Irregular verbs + progress)          │   │
│  │  • jurons.json (Swear words collection)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • BBC Learning English (6 Minute English)                  │
│  • News in Levels (Graded reading)                          │
│  • Web Speech API (Text-to-Speech)                          │
│  • Web Audio API (Sound effects)                            │
│  • Google Fonts (Press Start 2P for gaming skin)           │
└─────────────────────────────────────────────────────────────┘
```

## Core Systems

### 1. Onboarding System
- **Hub**: 5-screen introduction flow (`index.html`)
- **Vocabulary**: Separate onboarding for vocab features
- **Verbs**: Separate onboarding for verb features
- **Storage**: `localStorage` keys track completion
- **Replay**: Users can replay onboarding via footer link

### 2. Spaced Repetition System (Vocabulary)
- **Levels**: 0-7 mastery levels per word
- **Progression**: 
  - Correct answer → level up
  - Wrong answer → level down (soft reset)
  - Level 7 = "Master" status
- **Scheduling**: Words scheduled based on mastery level
- **Review Queue**: "À corriger" for failed words

### 3. Gamification System
- **XP & Levels**: Global player progression
- **Combos**: Session streaks with badges (x2 to x100)
- **Daily Goals**: Word count targets with progress tracking
- **Badges**: 
  - Combo badges (x2, x3, x5, x10, x20, x30, x50, x75, x100)
  - Word count badges (5, 10, 30, 50, 100, 150, 200, 300, 500)
- **Streaks**: Daily consecutive practice tracking
- **Juron Collection**: Swear words unlock every 50 correct words

### 4. Theme System
- **Default**: Grimoire (Dark mode)
- **Skins**: Studio Ghibli, So British, Canadian, Rap Français, Barbiecore, Windows 95, Cyberpunk/Arcade
- **Implementation**: CSS variables with dynamic switching
- **Persistence**: Theme preference saved in localStorage

### 5. Audio System
- **Text-to-Speech**: Web Speech API for pronunciation
- **Sound Effects**: Web Audio API for game sounds
- **Voices**: en-US for English words
- **Feedback**: Different sounds for success/error/level-up

### 6. Data Management
- **Import/Export**: JSON format for progress backup
- **CEFR Levels**: A1 → A2 → B1 → B2 → C1 → C2 (cumulative)
- **Delta Packs**: Exclusive words per level (new feature v4.10)
- **Word Guides**: Optional French hints for learning context

## User Flow

```
First Launch:
┌─────────────┐
│ Open App    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Hub Onboard │ (5 screens)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Choose      │
│ Activity    │
└──────┬──────┘
       │
   ┌───┴────┬──────────┐
   │        │          │
   ▼        ▼          ▼
┌──────┐ ┌──────┐ ┌──────────┐
│Vocab │ │Verbs │ │External  │
│Quiz  │ │Quiz  │ │Resources │
└───┬──┘ └───┬──┘ └──────────┘
    │        │
    │        │
    ▼        ▼
┌─────────────────────┐
│ Progress Saved      │
│ (localStorage)      │
└─────────────────────┘
```

## Key Features by Version

- **v4.10**: Delta vocabulary packs, improved objectives UI, juron box enhancements
- **v4.9**: Code refactoring, juron collection feature, mobile quiz improvements
- **v4.8**: Compact objectives UI, daily mastery tracking, reset confirmation
- **v4.7**: Word guides (French hints), improved onboarding
- **v4.6**: Hub onboarding, PWA improvements
- **v4.5**: Dark theme default, encoding fixes
- **v4.4**: Dynamic objectives, badge unlock feedback
- **v4.3**: Badge system improvements
- **v4.1**: Mobile-first design, dual-view (mobile/desktop)
- **v3.2**: Theme system with 7 skins
- **v3.1**: XP system, hints, shields, combo protection
- **v2.3**: Soft-reset progression, badge system
- **v2.2**: Streak tracking, UI improvements

## Technology Stack
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Storage**: localStorage for persistence
- **Audio**: Web Speech API + Web Audio API
- **PWA**: manifest.json for installability
- **Data**: JSON files loaded via fetch
- **Build**: Node.js scripts for data processing