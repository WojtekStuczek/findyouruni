import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/transport", async (req, res) => {
    try {
      const { origin, destinationName, destinationCountry, nearestAirport, nearestTrainStation } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        I am planning to travel from ${origin} to ${destinationName} located in ${destinationCountry}.
        While the nearest major airport is ${nearestAirport} and the nearest train station is ${nearestTrainStation}, YOU MUST PRIORITIZE THE ABSOLUTE CHEAPEST ROUTE.
        
        CRITICAL INSTRUCTION: Actively consider alternative low-cost airline hubs (like Ryanair, Wizz Air, easyJet) that might be slightly further away but offer significantly cheaper flights. For example, if traveling to Delft or Amsterdam, strongly consider Eindhoven airport if it's cheaper. If traveling to London, consider Stansted or Luton, etc.
        
        Provide the single best travel option that prioritizes LOW COST above all, while keeping the total travel time reasonable. Include the train/bus transfers from the low-cost airport to the final destination.
        Break it down into stops and segments.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              stops: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of stops/locations along the route, starting with the origin and ending with the destination."
              },
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    mode: { type: Type.STRING, description: "Mode of transport (e.g., Flight, Train, Bus)" },
                    time: { type: Type.STRING, description: "Estimated time for this segment (e.g., '2h 15m')" },
                    cost: { type: Type.NUMBER, description: "Estimated cost for this segment in EUR" }
                  },
                  required: ["mode", "time", "cost"]
                },
                description: "List of travel segments connecting the stops. Must have exactly one less item than the stops array."
              },
              totalTime: { type: Type.STRING, description: "Total estimated travel time" },
              totalCost: { type: Type.NUMBER, description: "Total estimated cost in EUR" }
            },
            required: ["stops", "segments", "totalTime", "totalCost"]
          }
        }
      });

      if (response.text) {
        res.json(JSON.parse(response.text));
      } else {
        res.status(500).json({ error: "No estimate available." });
      }
    } catch (error) {
      console.error("Error estimating travel:", error);
      res.status(500).json({ error: "Failed to generate transport options" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const accessKey = process.env.WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY;
      
      if (!accessKey) {
        return res.status(500).json({ success: false, message: "WEB3FORMS_ACCESS_KEY is not set on the server." });
      }

      const body = {
        ...req.body,
        access_key: accessKey
      };

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      res.status(response.status).json(result);
    } catch (error) {
      console.error("Error submitting to Web3Forms:", error);
      res.status(500).json({ success: false, message: "Failed to submit form" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
