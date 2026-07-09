# 🛰️ GaganDrishti: Swadeshi Satellite Trajectory Predictor

A high-fidelity, real-time Swadeshi orbital tracking and trajectory prediction dashboard. Designed for satellite tracking enthusiasts, Indian space flight operators, and amateur radio operators, this full-stack application calculates and visualizes satellite pathways, relative look-angles, attitudes, and ground passes utilizing industry-standard **Two-Line Element (TLE)** sets and the **SGP4 orbital propagation** model.  

**Cooked to Perfection**

---

## 🌌 Core Features

### 1. **Interactive 2D Mercator Ground Track Projection**
- Displays the real-time position of satellites on a responsive vector world map.
- Projects the orbital ground track (showing past 45 and future 90 minutes) with color gradients indicating height/altitude.
- Highlights the ground station location along with its relative **Radio Horizon Footprint** (elevation coverage circle).

### 2. **Polar Sky Plot (Local Horizon View)**
- Plots the satellite's current Azimuth and Elevation relative to the selected ground station.
- Traces the transit path across the sky dome with active, dashed, and visible acquisition indicator trails.
- Displays relative signal tracking details and elevation rings ($30^\circ$, $60^\circ$).

### 3. **Satellite Attitude & Orientation Dial**
- Visualizes real-time satellite orientation, displaying relative **Roll, Pitch, and Yaw (Attitude)** telemetry.
- Dynamic compass ticks and indicators respond instantly to time warps and real-time movement.

### 4. **Pass Predictor & Orbital Lookahead**
- Scans orbital flight paths for **12-hour, 24-hour, or 48-hour** windows.
- Predicts precise **Rise Time, Peak/Max Elevation, Set Time, and Cardinal Bearings** ($N$, $SE$, $SW$, etc.).
- Includes a **"Peak View Jump"** shortcut that updates the active simulation timing to inspect specific pass states.
- Stabilized with a minute-grounded lookup baseline to eliminate second-by-second calculation jitter.

### 5. **CSV Pass Export Engine**
- One-click export of predicted pass parameters into standard CSV format.
- Includes metadata like satellite name, station coordinates, UTC & local timestamps, maximum elevations, duration, and trajectory cardinal directions.

### 6. **Local Storage Session Saver**
- Save your custom TLE inputs and ground station coordinates directly to your browser's `localStorage` with the **Save Session** action.
- Automatically restores your previous setup when reloading the application.

### 7. **AI Mission Briefing Engine**
- Employs **Gemini 2.5 Flash** server-side processing to interpret current telemetry and generate instant mission status reports.

---

## 🛠️ Project Architecture & File Structure

```bash
├── .env.example            # Sample environment configurations for API keys
├── metadata.json           # Application name, description, and permission manifest
├── package.json            # Node.js dependencies and run scripts
├── server.ts               # Full-stack Express server + Vite middleware proxy
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build and asset pipeline setup
└── src
    ├── App.tsx             # Main Dashboard UI & React State hub
    ├── main.tsx            # Main Application entrypoint
    ├── index.css           # Tailwind CSS imports & global typography theme
    ├── types.ts            # Type definitions (SatellitePass, TleInfo, ObserverLocation)
    ├── components
    │   ├── PassPredictor.tsx        # Pass predictions panel, CSV exports, & window selectors
    │   ├── SkyPlot.tsx              # Vector polar horizon canvas visualizer
    │   ├── OrientationVisualizer.tsx # Roll, Pitch, and Yaw direction dial
    │   ├── WorldMap.tsx             # 2D Canvas-based world coordinate path projector
    │   └── TleInput.tsx             # Preset and manual TLE parser & form validator
    └── utils
        └── satelliteCalc.ts         # Math engine using SGP4 (satellite.js) to calculate ECI/ECF states
```

---

## 📦 Getting Started & Running Locally

Follow these instructions to run the **Satellite Trajectory Predictor** on your local machine:

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) and **npm** installed.

### 2. Install Dependencies
Clone your exported repository and run:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```
Provide your **Gemini API Key**:
```env
GEMINI_API_KEY="your-google-api-key"
```

### 4. Run Development Server
Start the development server with hot-reloading:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Production Build & Execution
Build the client bundle and compile the TypeScript Express backend into a single, optimized bundle:
```bash
npm run build
npm start
```

---

## 📤 How to Export & Upload this Project to GitHub

Because this workspace runs in a secure sandbox, **you** can export this entire codebase directly to your own GitHub account or download a `.zip` archive via the Google AI Studio interface.

### Step-by-Step Instructions:

1. **Locate the Settings Menu**:
   - In the Google AI Studio Build UI (top right-hand corner), find the **Settings** gear icon or **Export** option.

2. **Select "Export to GitHub"**:
   - Click **Export to GitHub**. 
   - If prompted, authorize Google AI Studio with your GitHub account.
   - Choose whether you want to export to a **New Repository** or update an existing one.
   - Set the repository name (e.g., `satellite-trajectory-predictor`) and privacy level (Public or Private).

3. **Alternative: Download as ZIP**:
   - If you prefer to manually initialize your git repository or run it on a local IDE, click **Download ZIP**.
   - Extract the files, open a terminal in the folder, and run:
     ```bash
     git init
     git add .
     git commit -m "Initial commit of Satellite Trajectory Predictor"
     git branch -M main
     git remote add origin https://github.com/your-username/your-repo-name.git
     git push -u origin main
     ```

---

## 🧬 Physics & SGP4 Calculations

The mathematical engine in `satelliteCalc.ts` leverages Keplerian orbital elements provided by standard NORAD TLE lines:
- **Satellite Propagation**: Calculates raw Earth-Centered Inertial (ECI) position and velocity vectors using standard time differences.
- **Sidereal Time Conversion**: Maps ECI coordinates to Earth-Centered, Earth-Fixed (ECEF) coordinates based on Greenwhich Mean Sidereal Time (GMST).
- **Look Angles**: Converts ECEF coordinates relative to the ground observer’s geodetic Latitude, Longitude, and Altitude into local Horizon horizontal coordinates (**Azimuth** and **Elevation**).
