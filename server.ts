import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google GenAI on the server only
// Always use process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Satellite Orbital & Mission Analysis using Gemini
  app.post('/api/analyze-satellite', async (req, res) => {
    try {
      const { name, tle1, tle2, inclination, eccentricity, meanMotion, alt } = req.body;

      if (!tle1 || !tle2) {
        return res.status(400).json({ error: 'Missing TLE elements' });
      }

      // Construct a detailed orbital parameter description
      const prompt = `You are a Senior Satellite Mission Director and Astrophysicist. 
Provide a high-quality, professional, and engaging briefing about the satellite: "${name || 'Unknown Satellite'}" based on the following physical and Keplerian parameters:
- NORAD ID / Name: ${name}
- Orbital Inclination: ${inclination}°
- Eccentricity: ${eccentricity}
- Mean Motion (Revolutions per Day): ${meanMotion} rev/day
- Estimated Orbit Altitude: ${alt ? alt.toFixed(1) : 'LEO'} km
- Line 1: ${tle1}
- Line 2: ${tle2}

Please provide:
1. **Orbital Classification**: What kind of orbit is this (LEO, MEO, GEO, HEO, Sun-Synchronous, Polar, etc.)? Explain why its inclination of ${inclination}° and altitude of ${alt ? alt.toFixed(1) : 'LEO'} km determines this.
2. **Mission Capabilities & Use Case**: Based on these orbital mechanics, what are the primary mission capabilities of this satellite (e.g. continuous regional imagery, global navigation, high-latitude climate observation, telecommunications)?
3. **Observational Guidelines**: What are the best guidelines for a hobbyist at a ground station trying to visually spot or radio-track this satellite?
4. **Historical Context / Trivia**: If this NORAD ID/Name is known (such as ISS, Hubble, NOAA, GOES), share a fascinating real-world fact or mission context! Otherwise, describe typical payloads for this orbital profile.

Keep your response extremely clear, styled in clean Markdown with bold headers, professional and educational, with zero clinical jargon, and focused on the real-world utility of the spacecraft.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error('Gemini Mission Analysis Error:', err);
      res.status(500).json({ error: err.message || 'Error executing Gemini analysis' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
