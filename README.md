# Smart Waste Management System

A web-based system to streamline the reporting and monitoring of waste collection activities.

- **Frontend:** React.js (Vite)
- **Backend:** Node.js and Express.js
- **Database:** MongoDB (Mongoose)
- **API:** RESTful endpoints, plus Server-Sent Events for real-time updates

## What it does

- **Accounts and login:** people create an account and sign in. Passwords are hashed with bcrypt and the login is a signed JWT kept in an httpOnly cookie.
- **Report waste:** signed-in users report waste by type and area and get a tracking ID such as `WM-1043`.
- **Real-time status tracking:** every report moves through Reported, Assigned, On the way and Collected. Changes appear in the browser instantly, without refreshing. Users see only their own reports.
- **Admin role:** an admin sees every report and can advance its status.
- **Dashboard (public):** a live map of Ward 7 with bin fill levels and Truck 12, open reports, bins at 80% or more, collections today, average pickup time, a 7-day chart and reports by waste type.
- **Smart collection:** bins under 40% full are skipped by the truck to save trips.

Bin levels and Truck 12 are simulated by the server (`server/src/simulator.js`). Reports, collections and bins are stored in MongoDB.

## Project layout

```
smart-waste-management/
  server/                 Express API
    src/
      index.js            starts MongoDB, the simulator and the server
      app.js              Express app, CORS, JSON, static client build
      constants.js        waste types, statuses, bins and route positions
      logic.js            small pure functions (tested in test/)
      simulator.js        bin filling, Truck 12, report progress
      seed.js             sample data (runs automatically on an empty database)
      auth.js             JWT cookie, requireAuth, requireRole, admin account
      validators.js       sign-up checks
      rateLimit.js        per-IP request limiter
      models/             User, Bin, Report, Pickup, Counter (Mongoose)
      routes/             auth.js, reports.js (REST), live.js (state, stats, SSE stream)
      services/           reports.js (create and status changes), stats.js
  client/                 React app (Vite)
    src/
      App.jsx             pages, toast messages, hash routing
      useAuth.js          who is signed in
      useLive.js          first load + live updates from /api/stream
      components/         Header, AuthPage, Dashboard, MapView, ReportForm, TrackList, Toast
```

## Run it

You need **Node.js 18.11 or newer** and **MongoDB** (local install, or a free MongoDB Atlas cluster).

1. Install packages for both parts:

   ```
   npm run install:all
   ```

2. Configure the server:

   ```
   cd server
   cp .env.example .env
   ```

   Open `.env` and set:
   - `MONGODB_URI` (the default is `mongodb://127.0.0.1:27017/smart_waste`)
   - `JWT_SECRET`, a long random string. Create one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the admin account (created on first start)

3. Start the API (terminal 1):

   ```
   npm run dev:server
   ```

   On the first start it fills the empty database with sample data.

4. Start the website (terminal 2):

   ```
   npm run dev:client
   ```

5. Open http://localhost:5173, create an account, and report some waste. Sign in with the admin email to advance statuses.

To reset the sample data at any time: `npm run seed`.

### One server for everything (production style)

```
npm run build      # builds client/dist
npm start          # Express serves the API and the built site on http://localhost:5000
```

## Put it online (free)

1. **Database:** create a free cluster on MongoDB Atlas. Add a database user, allow network access from `0.0.0.0/0`, and copy the connection string. Put the database name in it, for example `.../smart_waste?retryWrites=true&w=majority`.
2. **Code:** push this folder to a GitHub repository. `.env` is ignored, so your password is not uploaded.
3. **Hosting:** on Render, choose New, then Web Service (or Blueprint, which reads `render.yaml`), and connect the repository.
   - Build command: `npm run render-build`
   - Start command: `npm start`
   - Environment variables: `MONGODB_URI` (your Atlas connection string), `JWT_SECRET` (a long random string), `NODE_ENV` = `production`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. With the Blueprint, `JWT_SECRET` is generated for you and Render asks for the rest.
4. Open the `onrender.com` link Render gives you. Express serves the API and the built site from the same address, so nothing else needs configuring.

On Render's free plan the service sleeps after about 15 minutes without visitors and takes around a minute to wake up. Bin levels and the truck restart from their saved values when it wakes.

## REST API

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/health` | Server check |
| POST | `/api/auth/register` | Create an account. Body: `{ "name", "email", "password" }` (password 8 to 72 characters). Signs you in |
| POST | `/api/auth/login` | Sign in. Body: `{ "email", "password" }` |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | The signed-in user |
| GET | `/api/state` | Bins, truck position, activity feed and stats in one call |
| GET | `/api/bins` | Current bins and fill levels |
| GET | `/api/stats` | Open reports, bins at 80% or more, collected today, average pickup time, 7-day counts, reports by type |
| GET | `/api/reports?status=open&q=text` | **Sign-in required.** List your reports (admins get all). `status` can be `open`, `reported`, `assigned`, `onway` or `collected`. `q` searches ID and area |
| POST | `/api/reports` | **Sign-in required.** Create a report. Body: `{ "type": "Wet", "area": "Bus Stand", "note": "Bin is overflowing" }` |
| GET | `/api/reports/:code` | **Sign-in required.** One of your reports with its timeline (admins can open any) |
| PATCH | `/api/reports/:code/status` | **Admin only.** Move a report one step forward |
| GET | `/api/stream` | Server-Sent Events: `tick`, `activity`, `stats` for everyone, and `report` updates only for the report's owner and admins |

Waste types: `Wet`, `Dry`, `Mixed`, `Hazardous`, `E-waste`.

## Tests

```
npm test
```

Runs the unit tests for the route and status logic, report visibility rules, cookie parsing, sign-up checks and the rate limiter (`server/test/logic.test.js`).

## Notes

- Login uses an httpOnly, SameSite=Lax cookie (Secure in production), so page scripts cannot read the token. Sign-up and sign-in are rate limited per IP. The limiter keeps its counts in memory, so use a shared store such as Redis if you run more than one server.
- Accounts have no email verification or password reset yet. Add both before opening the site to the public.
- Sample reports created by the seed script have no owner, so only admins see them.
- Bins and the truck are simulated. To use real sensors or GPS, replace `simulator.js` with a service that receives readings and updates the `Bin` documents and the truck position.
- The map is a drawn diagram of a sample ward, not real map tiles. Bin positions are fractions (0 to 1) along the route in `server/src/constants.js`.
