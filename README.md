# 🚇 Delhi Metro - Smart Route Planner

A modern, sleek web application for planning Delhi Metro journeys. Find the optimal route between any two stations with real-time information on travel time, distance, fare, and transfers.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)

## ✨ Features

- **🔍 Smart Route Finding** - Find the optimal route between any two Delhi Metro stations
- **⏱️ Journey Details** - View travel time, distance, fare estimate, and number of transfers
- **🔄 Easy Station Swap** - Quickly swap origin and destination with one click
- **❤️ Favorite Routes** - Save frequently used routes for quick access
- **🕐 Recent Searches** - Access your recent route searches instantly
- **🔗 Shareable Links** - Share route links with friends and family
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices
- **🎨 Modern UI** - Beautiful glassmorphism design with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd delhi_metro_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project Structure

```
delhi_metro_app/
├── src/
│   ├── app/
│   │   ├── api/route/      # Route planning API endpoint
│   │   ├── page.tsx        # Main application page
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   └── data/
│       └── stations.ts     # Delhi Metro station data
├── public/                  # Static assets
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: react-select for station dropdowns
- **State Management**: React hooks with localStorage persistence

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🎯 Usage

1. **Select Origin** - Choose your starting station from the dropdown
2. **Select Destination** - Choose where you want to go
3. **Plan Journey** - Click "Plan My Journey" to find the best route
4. **View Results** - See detailed route information including:
   - Total travel time
   - Distance covered
   - Estimated fare
   - Number of transfers
   - Step-by-step station list with line changes

## 💾 Data Persistence

The app uses localStorage to persist:
- **Recent Searches** - Last 5 route searches
- **Favorites** - Saved favorite routes for quick access

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and not licensed for public distribution.

---

Made with ❤️ for Delhi Metro commuters
