import { GoogleGenerativeAI, Part } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export const GEMINI_MODEL = 'gemini-2.5-pro'

// Procesa planos técnicos: acepta buffers de PDF o imágenes en base64
export async function geminiVision(
  prompt: string,
  attachments: Array<{ data: string; mimeType: string }>
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const parts: Part[] = [
    ...attachments.map((att) => ({
      inlineData: { data: att.data, mimeType: att.mimeType },
    })),
    { text: prompt },
  ]

  const result = await model.generateContent(parts)
  return result.response.text()
}

// Helper para convertir un buffer a base64 con mimeType
export function bufferToBase64Part(buffer: Buffer, mimeType: string) {
  return {
    data: buffer.toString('base64'),
    mimeType,
  }
}
