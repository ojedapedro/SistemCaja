import { GoogleGenAI, Chat } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize the client only if the key exists, but handle missing key gracefully in calls
const ai = new GoogleGenAI({ apiKey });

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `Eres "CajaBot", un asistente inteligente experto en gestión administrativa y soporte técnico para la plataforma "SistemCaja".
      
      Tus funciones son:
      1. Ayudar a los usuarios a navegar por la aplicación.
      2. Explicar conceptos contables básicos (Ticket promedio, ROI, margen de ganancia).
      3. Analizar datos si el usuario te los proporciona en texto.
      4. Ser amable, profesional y conciso.
      
      La aplicación tiene las siguientes secciones (el acceso depende del rol del usuario: Admin, Vendedor, Almacén):
      - Dashboard: Métricas clave y gráficos.
      - Ventas: Registrar nuevas ventas (permite asociar Clientes).
      - Compras: Registrar ingresos de mercadería.
      - Inventario: Ver y editar stock.
      - Devoluciones: Gestión de garantías.
      - Clientes: Gestión de cartera de clientes (CRM básico).
      - Usuarios: Gestión de usuarios y roles (Solo Admin).
      - Aplicaciones: Un lanzador para herramientas externas.
      
      Responde siempre en español.`,
      thinkingConfig: { thinkingBudget: 1024 } // Enable thinking for better reasoning on business questions
    },
  });
};

export const sendMessageToGemini = async (chat: Chat, message: string) => {
  try {
    const result = await chat.sendMessageStream({ message });
    return result