# InternTrack or TRACKr - Backend API Setup

Welcome to the backend server documentation! This guide will help you understand how the server works and how to set it up locally.

## Overview

This is the backend API for our application, built with **Node.js** and **TypeScript**. It serves as the bridge between our database and the frontend user interface, handling data processing, authentication, and business logic.

## Technologies Used

We use a modern and robust technology stack to ensure performance and maintainability:

- **Node.js & Express**: The core framework used to build our API server.
- **TypeScript**: Adds type safety to our code, making it easier to catch errors early.
- **Prisma**: A powerful ORM (Object-Relational Mapper) that makes interacting with our Database easy and intuitive.
- **PostgreSQL**: The relational database where we store all our persistent data (users, applications, etc.).
- **Zod**: Used for validating incoming data to ensure it meets our requirements before processing.
- **JWT (JSON Web Tokens)**: Securely handles user authentication and sessions.

## Project Structure

Here is a quick look at how the code is organized to make it easy to navigate:

- **`src/server.ts`**: The entry point of the application. This starts the server.
- **`src/app.ts`**: Configures the Express application, sets up middleware (like security and logging), and connects routes.
- **`src/modules/`**: Contains the core logic for different features of the app:
  - **Auth**: Handles user registration and login.
  - **Applications**: Manages job application data.
  - **Analytics**: Provides data insights and stats.
- **`src/middlewares/`**: Functions that run before our main logic, handling things like error checking and rate limiting.
- **`prisma/`**: Contains our database schema and configuration.

## Getting Started

Follow these steps to get the server running on your machine.

### 1. Prerequisites

Make sure you have the following installed:
- **Node.js** (Version 18 or higher recommended)
- **PostgreSQL** (Running locally or accessible via URL)

### 2. Installation

Install the project dependencies using your package manager:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root of the `backend` folder to store your secret configuration keys. You can use `.env.example` as a template.

Your `.env` file should include:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/interntrack?schema=public"
JWT_SECRET="your_secure_random_secret_string"
```

> **Note**: Replace the `DATABASE_URL` values with your actual local PostgreSQL credentials.

### 4. Database Setup

Once your `.env` is ready, run the following command to sync your database with our schema:

```bash
npx prisma generate
npx prisma db push
```

### 5. Running the API

You can now start the server!

**For Development** (restarts automatically when you save changes):
```bash
npm run dev
```

**For Production**:
```bash
npm run build
npm start
```

## Useful Commands

- `npm run dev`: Starts the development server.
- `npm run build`: Compiles TypeScript code to JavaScript.
- `npm run start`: Runs the compiled JavaScript code.
- `npm run prisma:studio`: Opens a visual editor for your database in the browser.

---

*This documentation is intended to help contributors and new developers get up to speed quickly. If you have questions, please reach out to the team!*
