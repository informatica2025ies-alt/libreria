import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedBookDetails } from "../types";

// Ensure API key is available
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateBookMetadata = async (title: string, author: string): Promise<GeneratedBookDetails> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return { description: "Descripción no disponible (Falta API Key)", category: "General" };
  }

  try {
    const prompt = `Generate a concise summary (max 300 chars) and a primary genre category for the book titled "${title}" by "${author}". The summary must be in Spanish.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
          description: "A short summary of the book in Spanish.",
        },
        category: {
          type: Type.STRING,
          description: "The main genre of the book in Spanish (e.g., Ficción, Ciencia, Historia).",
        },
      },
      required: ["description", "category"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3, // Lower temperature for more factual results
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as GeneratedBookDetails;
    return data;

  } catch (error) {
    console.error("Error generating book metadata:", error);
    // Fallback in case of error
    return {
      description: "No se pudo generar la descripción automáticamente.",
      category: "Sin Categoría"
    };
  }
};
