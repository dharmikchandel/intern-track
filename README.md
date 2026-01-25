# InternTrack or TRACKr

> **The Job Application Tracker That Actually Looks Good.**

![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)

## 📌 Usage

**Stop using spreadsheets.**

Job hunting is chaotic enough without having to manage a 50-column Excel sheet that you hate looking at. **InternTrack (or TRACKr)** is a unified, visually distinct dashboard designed to bring sanity to your job search.

We built this because we believe your tools should be as ambitious as your career goals. With a **Neo-Brutalist** design language, it's bold, high-contrast, and impossible to ignore—just like your application should be.

---

## ✨ Features

*   **Unified Dashboard**: View all your applications in one place.
*   **Kanban-Style Tracking**: Move applications from "Applied" to "Interviewing" to "Offer" (and yes, "Rejected").
*   **Neo-Brutalist Design**: A unique, high-contrast UI that stands out from the sea of generic Material Design dashboards.
*   **Secure & Fast**: Built with modern best practices for security and performance.

---

## 🛠️ The Tech Stack

This project works on a modern full-stack architecture, split into two core services:

### 🎨 Frontend (`/frontend`)
*   **Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Neo-Brutalist Theme)
*   **State**: [TanStack Query](https://tanstack.com/query/latest)
*   **Routing**: [React Router v7](https://reactrouter.com/)

### ⚙️ Backend (`/backend`)
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: PostgreSQL (managed via [Prisma ORM](https://www.prisma.io/))
*   **Caching**: [Redis](https://redis.io/)
*   **Validation**: [Zod](https://zod.dev/)

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites
*   **Node.js** (v18+)
*   **PostgreSQL** (Running locally or via Docker)
*   **Redis** (Running locally or via Docker)

### Installation

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/dharmikchandel/intern-track.git
    cd intern-track
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    # Install dependencies
    npm install
    
    # Setup Environment Variables
    cp .env.example .env
    # Update .env with your PostgreSQL and Redis credentials
    
    # Run Database Migrations
    npx prisma migrate dev
    
    # Start the Server
    npm run dev
    ```

3.  **Setup Frontend**
    Open a new terminal window:
    ```bash
    cd frontend
    # Install dependencies
    npm install
    
    # Start the Dev Server
    npm run dev
    ```

4.  **Open the App**
    Visit `http://localhost:5173` to see the frontend.
    The backend API will be running at `http://localhost:3000` (default).

---

## 📂 Project Structure

```text
root/
├── backend/            # Express, Prisma, Node.js API
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── frontend/           # React, Vite, Tailwind App
│   ├── src/
│   ├── index.html
│   └── package.json
│
└── README.md           # You are here
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

<p align="center">
  Built with ❤️ by dc
</p>
