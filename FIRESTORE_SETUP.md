# Firestore Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `vaquitapp`
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains

## 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select location closest to your users

## 4. Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon
4. Register app with name "Vaquitapp"
5. Copy the configuration object

## 5. Add Environment Variables

Create a `.env.local` file in your project root:

\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

## 6. Set up Firestore Security Rules

Run the setup script:
\`\`\`bash
node scripts/setup-firestore-rules.js
\`\`\`

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Try to sign in with Google
3. Check if data is being saved to Firestore

## Collections Structure

- `users/` - User profiles and settings
- `groups/` - Expense groups
- `expenses/` - Individual expenses
- `notifications/` - User notifications
- `friends/` - Friend relationships
