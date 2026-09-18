// app/api/middleware/rateLimit.ts
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(ip: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const windowData = rateLimitMap.get(ip);

  if (!windowData || now - windowData.lastReset > windowMs) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (windowData.count >= limit) {
    return false; // 🛑 លើសកម្រិតកំណត់ (Rate Limit Exceeded)
  }

  windowData.count++;
  return true;
}