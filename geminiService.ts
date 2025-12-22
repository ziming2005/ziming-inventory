
import { GoogleGenAI, Type } from "@google/genai";
import { Room, PurchaseHistory } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getInventoryInsights(rooms: Room[], history: PurchaseHistory[]) {
  const inventorySummary = rooms.map(r => ({
    room: r.name,
    items: r.items.map(i => ({ name: i.name, qty: i.quantity, category: i.category }))
  }));

  const prompt = `
    Analyze this dental clinic inventory and purchase history.
    Provide 3-5 actionable insights regarding:
    1. Low stock items that need reordering based on past usage.
    2. Overstocked items that are sitting idle.
    3. Potential cost savings based on vendors or categories.
    
    Inventory Data: ${JSON.stringify(inventorySummary)}
    History Data (Last 20 entries): ${JSON.stringify(history.slice(0, 20))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              urgency: { type: Type.STRING, description: "low, medium, high" }
            },
            required: ["title", "description", "urgency"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}
