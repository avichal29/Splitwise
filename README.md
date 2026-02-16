# Splitwise Clone

A full-stack expense sharing and tracking application built with React and Express.js.

## Features

- **User Authentication** — Register, login, JWT-based sessions
- **Groups** — Create groups, add members, track shared expenses
- **Expenses** — Add expenses with equal, exact, or percentage splits
- **Balances** — Real-time balance calculation showing who owes whom
- **Settlements** — Record payments to settle debts
- **Friends** — Add friends for quick expense splitting
- **Activity Feed** — View all expenses and settlements in one place

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, React Router, Lucide Icons
- **Backend:** Express.js, SQLite (better-sqlite3), JWT, bcrypt
- **API:** RESTful JSON API with token-based auth

## Getting Started

### Prerequisites
- Node.js 18+

### Install & Run

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Start the backend (from /server)
cd ../server && npm run dev

# In another terminal, start the frontend (from /client)
cd client && npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### Quick Start

1. Register a new account
2. Add friends by searching for their name or email
3. Create a group and add members
4. Add expenses and choose how to split them
5. View balances on the dashboard
6. Settle up when ready

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users/search` | Search users |
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create group |
| GET | `/api/groups/:id` | Group detail with expenses |
| POST | `/api/groups/:id/members` | Add member to group |
| DELETE | `/api/groups/:id` | Delete group |
| GET | `/api/expenses` | List user's expenses |
| POST | `/api/expenses` | Create expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/balances` | Get user's balances |
| GET | `/api/settlements` | List settlements |
| POST | `/api/settlements` | Record settlement |
| GET | `/api/friends` | List friends |
| POST | `/api/friends` | Add friend |
| DELETE | `/api/friends/:id` | Remove friend |
