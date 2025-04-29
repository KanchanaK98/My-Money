# MoneyWise - Personal Finance App

A user-friendly personal finance mobile application designed to help users manage their income, expenses, and budgeting. Built with React Native, Expo, and Supabase.

## Features

- 🔐 Secure authentication with email/password
- 💸 Track income and expenses
- 📊 Visual dashboard with spending insights
- 💰 Budget management with category tracking
- 🤖 AI-powered transaction entry
- 🔄 Cloud sync across devices
- 🌙 Dark mode support

## Tech Stack

- **Frontend:** React Native with TypeScript
- **Framework:** Expo
- **Navigation:** Expo Router
- **UI Components:** React Native Paper
- **Backend:** Supabase
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **Icons:** Material Community Icons

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/moneywise.git
   cd moneywise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

## Project Structure

```
/
├── app/                      # Expo Router screens
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Welcome screen
│   ├── sign-in.tsx          # Sign in screen
│   ├── sign-up.tsx          # Sign up screen
│   └── (authenticated)/     # Protected routes
│       ├── _layout.tsx      # Authenticated layout
│       ├── dashboard.tsx    # Dashboard screen
│       ├── transactions/    # Transaction screens
│       ├── budget.tsx       # Budget screen
│       └── settings.tsx     # Settings screen
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication context
├── lib/                     # Utility functions
│   └── supabase.ts          # Supabase client
└── components/              # Reusable components
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 