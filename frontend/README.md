# InternTrack or TRACKr - Frontend

**InternTrack** or **TRACKr** is a modern, Neo-Brutalist designed application for tracking job applications. This repository contains the client-side code built with React, TypeScript, and Vite.

## 🚀 Project Overview

The frontend of InternTrack or TRACKr is designed to provide users with a seamless and visually distinct experience for managing their job search. It leverages a high-contrast, "Neo-Brutalist" design language to stand out, while maintaining robust functionality for data management.

## 🛠️ Tech Stack

- **Core Framework**: [React](https://react.dev/) (v19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Routing**: [React Router](https://reactrouter.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## ✨ Key Features

- **Neo-Brutalist Design System**: Custom UI components (`NeoButton`, `NeoCard`, etc.) with sharp borders and high contrast.
- **Authentication**: Secure login and registration flows (JWT based).
- **Dashboard**: Overview of application stats and recent activities.
- **Application Tracking**: Create, read, update, and delete job applications.
- **Responsive Layout**: Optimized for desktop and mobile viewing.

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd intern-track/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Running the App

Start the development server:
```bash
npm run dev
```

The application will be available at imports `http://localhost:5173` (or the next available port).

### Building for Production

To create a production-ready build:
```bash
npm run build
```

This will generate static assets in the `dist` directory.

### Linting

To check for code quality issues:
```bash
npm run lint
```

## 📂 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── layout/        # Layout components (Header, Footer, MainLayout)
│   └── ui/            # Generic UI elements (NeoButton, NeoCard, etc.)
├── features/          # Feature-specific logic (Auth, Applications)
├── pages/             # Route components (LoginPage, DashboardPage, etc.)
├── App.tsx            # Main application component & Routing setup
└── main.tsx           # Entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
