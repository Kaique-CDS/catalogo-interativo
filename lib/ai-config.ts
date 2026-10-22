/**
 * Configuração estática de Governança de IA (Google Gemini Free Tier).
 * Arquivo isomórfico (compatível com Browser e Node.js).
 */
export const AI_CONFIG = {
  DAILY_LIMIT: Number(process.env.AI_MAX_DAILY_REQUESTS) || 1000,
  RPM_LIMIT: Number(process.env.AI_MAX_RPM) || 10,
  DEFAULT_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
}
