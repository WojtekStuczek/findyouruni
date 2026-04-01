import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, destinationName, destinationCountry, nearestAirport, nearestTrainStation } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
  I am planning to travel from ${origin} to ${destinationName}, ${destinationCountry}.
  Nearest major airport: ${nearestAirport}. Nearest train station: ${nearestTrainStation}.

  Find the CHEAPEST realistic route. 
  CRITICAL TRANSPORT PREFERENCE: Prioritize low-cost airlines (Ryanair, Wizz Air, easyJet, etc.) and trains. Avoid long-distance buses unless absolutely necessary or if there are no other viable options.
  All flights MUST be direct (no layovers/connections). Always check low-cost airline hubs even if further from the destination, if they offer meaningfully cheaper direct fares with reasonable train transfers.

  IMPORTANT PRICING INSTRUCTION: Provide realistic average market prices for a ticket booked a few weeks in advance. Do not artificially inflate or overestimate prices, especially for trains. Give a fair, typical price (not the absolute lowest promotional fare, nor the most expensive last-minute fare).

  Break the route into segments with estimated cost and duration for each leg, plus total cost and total travel time.
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
      res.status(200).json(JSON.parse(response.text));
    } else {
      res.status(500).json({ error: "No estimate available." });
    }
  } catch (error) {
    console.error("Error estimating travel:", error);
    res.status(500).json({ error: "Failed to generate transport options" });
  }
}
