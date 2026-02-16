# Web3 Casino Game

A Next.js-based Web3 casino gaming platform with **QUBIC token** wallet integration, featuring multiple casino games including Crash, Mines, Slots, and more.

## Features

- 🎰 Multiple casino games (Crash, Slide, Mines, Video Poker, etc.)
- 🔗 **QUBIC Wallet Integration** (MetaMask Snap, WalletConnect)
- 🔌 Real-time game updates via Socket.io
- 🎨 Modern UI with Tailwind CSS and HeroUI
- 🎵 Sound effects and background music
- 📱 Responsive design

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager

To check your versions:
```bash
node --version
npm --version
```

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Web3-Casino-Game
   ```

2. **Quick Setup (Windows)**:
   
   Simply run the setup script:
   ```bash
   setup.bat
   ```
   
   Or manually install dependencies:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=https://casino.qdogeonqubic.com
   ```
   
   **Note:** If you're running a local backend, update the URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
   
   ⚠️ **Important:** Some QUBIC packages (`@qubic-lib/*`) might not be publicly available. If installation fails, the app will still run but wallet features may be limited.

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

Or with yarn:
```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

To create a production build:

```bash
npm run build
npm start
```

## Project Structure

```
Web3-Casino-Game/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── crash/       # Crash game page
│   │   ├── mine/        # Mines game page
│   │   ├── landing/     # Landing page
│   │   └── ...
│   ├── components/      # React components
│   ├── context/         # React contexts (Socket, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── layout/          # Layout components
│   ├── providers/       # App providers (Solana, Socket, etc.)
│   └── util/            # Utility functions
├── public/              # Static assets
│   └── assets/          # Images, audio, video files
├── package.json         # Dependencies and scripts
└── next.config.ts       # Next.js configuration
```

## Configuration

### API Configuration

The application connects to a backend API for game data and Socket.io for real-time updates. The API URL is configured in:
- `src/config.ts` - Main configuration file
- `.env.local` - Environment variables (optional)

### QUBIC Wallet Configuration

The QUBIC wallet connection is configured in `src/components/CONNECT/`. Supports:
- **MetaMask Snap** - Requires MetaMask Flask with QUBIC snap installed
- **WalletConnect** - Connect via QR code with Qubic Wallet mobile app
- **Private Key** - Direct private key connection (for development)
- **Vault File** - Import from Qubic vault file

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **HeroUI** - UI component library
- **QUBIC Libraries** - QUBIC blockchain integration
- **WalletConnect** - Wallet connection protocol
- **Socket.io Client** - Real-time communication
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Jotai** - State management

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

### Module Not Found Errors

If you encounter module not found errors:

1. Delete `node_modules` folder:
   ```bash
   rm -rf node_modules
   ```

2. Clear package lock file:
   ```bash
   rm package-lock.json
   ```

3. Reinstall dependencies:
   ```bash
   npm install
   ```

### Socket Connection Issues

If you're experiencing Socket.io connection issues:

1. Verify the API URL in `src/config.ts` or `.env.local`
2. Check if the backend server is running and accessible
3. Check browser console for connection errors

### Build Errors

If you encounter build errors:

1. Ensure all dependencies are installed
2. Check TypeScript errors: `npm run lint`
3. Clear Next.js cache: `rm -rf .next`

## Development Tips

- The application uses Next.js App Router
- All pages are in `src/app/` directory
- Client components should have `'use client'` directive
- Static assets go in `public/` directory
- Environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.


