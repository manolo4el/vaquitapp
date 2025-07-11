# Vaquitapp - Expense Splitter

A modern expense splitting app built with Next.js, Firebase, and Tailwind CSS.

## Features

- 🔐 Google Authentication
- 👥 Create and manage expense groups
- 💰 Add and split expenses
- 📱 Mobile-first responsive design
- 🔔 Real-time notifications
- 💸 Debt consolidation
- 👫 Friend management
- 📊 Expense analytics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Auth, Firestore)
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase (see FIRESTORE_SETUP.md)
4. Add environment variables
5. Run development server: `npm run dev`

## Environment Variables

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
\`\`\`

## Project Structure

\`\`\`
├── app/                 # Next.js app directory
├── components/          # React components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/                # Utility functions
├── public/             # Static assets
└── styles/             # Global styles
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
