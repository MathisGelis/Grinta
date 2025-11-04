# 📱 Grinta Mobile App — Project Architecture

> **Tech stack:** React Native (Expo) + TypeScript + Zustand + Axios  
> **Architecture style:** Modular (Feature-Based Clean Architecture)

---

## 🧭 Overview

The **Grinta App** is designed with a **feature-based architecture** that follows clean code and scalability principles.  
Each feature (e.g., Auth, Profile, Social, Workout) is self-contained and includes its own API, components, hooks, store, and types.  
This makes the project easy to navigate, maintain, and scale as new modules are added.

---

## ⚙️ Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/grinta-app.git
cd grinta-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create an `.env` file
```
EXPO_PUBLIC_API_URL=https://your-api-url.com
```

### 4. Run the app
```bash
npx expo start
```

Then scan the QR code with **Expo Go** or open it on your emulator (Android/iOS).

---

## 🧱 Folder Structure

```
src/
├── core/                       # Global utilities, shared UI, services, and constants
│   ├── components/              # Shared UI components (Button, Input, etc.)
│   ├── constants/               # Colors, spacing, typography, theme, etc.
│   ├── hooks/                   # Generic reusable hooks (useTheme, useFetch, etc.)
│   ├── services/                # External services (API client, notifications, storage)
│   ├── types/                   # Global/shared TypeScript types
│   └── utils/                   # Helper functions and formatters
│
├── navigation/                  # App navigation setup
│   ├── AppNavigator.tsx         # Main Tab/Stack navigation
│   ├── AuthNavigator.tsx        # Authentication flow
│   └── RootNavigator.tsx        # Handles switching between Auth and App flows
│
├── features/                    # Feature-based modules
│   ├── auth/
│   │   ├── api/                 # API calls related to authentication
│   │   ├── components/          # Auth-specific UI elements (LoginForm, etc.)
│   │   ├── hooks/               # Auth-related logic (useLogin, useRegister)
│   │   ├── screens/             # Screens (LoginScreen, RegisterScreen)
│   │   ├── store/               # Zustand store (user state, tokens, etc.)
│   │   └── types/               # Interfaces and data types
│   │
│   ├── profile/
│   │   ├── api/                 # Profile API (update user info, etc.)
│   │   ├── components/          # UI components (ProfileCard, EditForm, etc.)
│   │   ├── screens/             # ProfileScreen, EditProfileScreen
│   │   ├── store/               # Zustand store for profile state
│   │   └── types/               # Profile-specific interfaces
│   │
│   ├── social/
│   │   ├── api/                 # Friends, social feed, etc.
│   │   ├── components/          # FriendCard, FeedItem, etc.
│   │   ├── screens/             # FriendsScreen, FeedScreen
│   │   └── store/               # Zustand store for social interactions
│   │
│   └── workout/
│       ├── api/                 # Workout-related requests (create, get, track)
│       ├── components/          # WorkoutCard, ExerciseItem, etc.
│       ├── screens/             # WorkoutList, WorkoutTracker, etc.
│       ├── store/               # Workout progress store
│       └── types/               # Workout-related types (Exercise, Session, etc.)
│
└── App.tsx                      # Root of the app (entry point managed by Expo)
```

---

## 🧩 TypeScript Path Aliases

To simplify imports and avoid long relative paths, the following aliases are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@core/*": ["core/*"],
      "@navigation/*": ["navigation/*"],
      "@features/*": ["features/*"]
    }
  }
}
```

✅ Example:
```ts
import { Button } from "@core/components/Button";
import { login } from "@features/auth/api/auth.api";
```

---

## 🧱 Development Standards

### 🧠 Code Conventions
- Use **TypeScript** everywhere.
- Follow **functional component structure** with hooks.
- Use **Zustand** for local and global state.
- Reuse UI components from `core/components`.

### 🧰 Linting & Formatting
- **ESLint** for syntax rules.
- **Prettier** for consistent formatting.
- Configure auto-format on save in VSCode.

### 🧪 Testing
- Use **Jest + React Native Testing Library**.
- Keep tests close to the feature (`features/auth/__tests__/`).

### 💾 Git Standards
| Type | Example |
|------|----------|
| **Feature** | `feature/auth-login` |
| **Fix** | `fix/login-validation` |
| **Refactor** | `refactor/workout-store` |
| **Chore** | `chore/update-dependencies` |

Commit messages follow the **Conventional Commits** format:
```
feat: add user login flow
fix: resolve profile update bug
refactor: simplify workout tracker logic
docs: update folder structure section
```

---

## 🎯 Project Goals & Vision

- 🏋️ Build an **all-in-one fitness companion app**
- 🤝 Connect athletes through **social and motivational features**
- 🧠 Integrate **AI recommendations** for personalized workouts
- 🔒 Ensure **data security**, **performance**, and **accessibility** across all platforms

---

## 🧠 Guiding Principles

- Keep **features isolated** and **modular**.
- Avoid deep relative imports → use path aliases.
- Prioritize **readability and maintainability**.
- Document every major addition or architectural change.

---

