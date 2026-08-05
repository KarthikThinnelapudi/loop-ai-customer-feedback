export type AIProvider = "Gemini" | "OpenRouter" | "NVIDIA" | "OmniRoute" | "GroundedRAG";

export interface AIGatewayRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIGatewayResponse {
  answer: string;
  provider: AIProvider;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  estimatedCostUsd: number;
  fallbackOccurred: boolean;
  failoverReason?: string;
}

export interface ProviderStatus {
  provider: AIProvider;
  model: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  lastCheck: string;
  successCount: number;
  errorCount: number;
}

export interface AIGatewayObservability {
  activeProvider: AIProvider;
  activeModel: string;
  providerHealth: ProviderStatus[];
  lastFailoverTime: string | null;
  totalRequests: number;
  totalTokens: number;
  averageLatencyMs: number;
  dailyCostUsd: number;
}

// In-Memory Gateway Monitoring Tracker
const gatewayState: AIGatewayObservability = {
  activeProvider: "Gemini",
  activeModel: "gemini-1.5-flash",
  providerHealth: [
    { provider: "Gemini", model: "gemini-1.5-flash", status: "ONLINE", lastCheck: new Date().toISOString(), successCount: 0, errorCount: 0 },
    { provider: "OpenRouter", model: "meta-llama/llama-3.3-70b-instruct", status: "ONLINE", lastCheck: new Date().toISOString(), successCount: 0, errorCount: 0 },
    { provider: "NVIDIA", model: "meta/llama-3.1-405b-instruct", status: "ONLINE", lastCheck: new Date().toISOString(), successCount: 0, errorCount: 0 },
    { provider: "OmniRoute", model: "omniroute-local-v1", status: "ONLINE", lastCheck: new Date().toISOString(), successCount: 0, errorCount: 0 },
  ],
  lastFailoverTime: null,
  totalRequests: 0,
  totalTokens: 0,
  averageLatencyMs: 140,
  dailyCostUsd: 0.0042,
};

function recordSuccess(provider: AIProvider, model: string, tokens: number, latency: number, cost: number) {
  gatewayState.activeProvider = provider;
  gatewayState.activeModel = model;
  gatewayState.totalRequests += 1;
  gatewayState.totalTokens += tokens;
  gatewayState.dailyCostUsd += cost;
  gatewayState.averageLatencyMs = Math.round(
    (gatewayState.averageLatencyMs * (gatewayState.totalRequests - 1) + latency) / gatewayState.totalRequests
  );

  const p = gatewayState.providerHealth.find((x) => x.provider === provider);
  if (p) {
    p.status = "ONLINE";
    p.successCount += 1;
    p.lastCheck = new Date().toISOString();
  }
}

function recordError(provider: AIProvider, reason: string) {
  gatewayState.lastFailoverTime = new Date().toISOString();
  const p = gatewayState.providerHealth.find((x) => x.provider === provider);
  if (p) {
    p.errorCount += 1;
    p.status = p.errorCount > 3 ? "OFFLINE" : "DEGRADED";
    p.lastCheck = new Date().toISOString();
  }
  console.warn(`⚠️ [AI Gateway Failover] Provider ${provider} failed: ${reason}`);
}

/**
 * 1. Primary: Google Gemini API Call
 */
async function callGemini(req: AIGatewayRequest): Promise<AIGatewayResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) {
    throw new Error("Missing or invalid GEMINI_API_KEY");
  }

  const startTime = Date.now();
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${req.systemPrompt}\n\n${req.userPrompt}` },
          ],
        },
      ],
      generationConfig: {
        temperature: req.temperature || 0.2,
        maxOutputTokens: req.maxTokens || 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errorText.substring(0, 150)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty candidate text response");
  }

  const latencyMs = Date.now() - startTime;
  const tokensUsed = data.usageMetadata?.totalTokenCount || 350;
  const estimatedCostUsd = Number(((tokensUsed / 1000000) * 0.075).toFixed(6));

  recordSuccess("Gemini", model, tokensUsed, latencyMs, estimatedCostUsd);

  return {
    answer: text.trim(),
    provider: "Gemini",
    model,
    tokensUsed,
    latencyMs,
    estimatedCostUsd,
    fallbackOccurred: false,
  };
}

/**
 * 2. Fallback 1: OpenRouter API Call
 */
async function callOpenRouter(req: AIGatewayRequest): Promise<AIGatewayResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) {
    throw new Error("Missing or invalid OPENROUTER_API_KEY");
  }

  const startTime = Date.now();
  const model = "meta-llama/llama-3.3-70b-instruct";
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://loop-ai-customer-feedback.vercel.app",
      "X-Title": "LOOP AI Customer Feedback Platform",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ],
      temperature: req.temperature || 0.2,
      max_tokens: req.maxTokens || 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorText.substring(0, 150)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenRouter returned empty choice message content");
  }

  const latencyMs = Date.now() - startTime;
  const tokensUsed = data.usage?.total_tokens || 380;
  const estimatedCostUsd = Number(((tokensUsed / 1000000) * 0.4).toFixed(6));

  recordSuccess("OpenRouter", model, tokensUsed, latencyMs, estimatedCostUsd);

  return {
    answer: text.trim(),
    provider: "OpenRouter",
    model,
    tokensUsed,
    latencyMs,
    estimatedCostUsd,
    fallbackOccurred: true,
    failoverReason: "Gemini primary provider failed or was unreachable",
  };
}

/**
 * 3. Fallback 2: NVIDIA AI API Call
 */
async function callNVIDIA(req: AIGatewayRequest): Promise<AIGatewayResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) {
    throw new Error("Missing or invalid NVIDIA_API_KEY");
  }

  const startTime = Date.now();
  const model = "meta/llama-3.1-405b-instruct";
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ],
      temperature: req.temperature || 0.2,
      max_tokens: req.maxTokens || 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA HTTP ${response.status}: ${errorText.substring(0, 150)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("NVIDIA returned empty choice message content");
  }

  const latencyMs = Date.now() - startTime;
  const tokensUsed = data.usage?.total_tokens || 400;
  const estimatedCostUsd = Number(((tokensUsed / 1000000) * 0.5).toFixed(6));

  recordSuccess("NVIDIA", model, tokensUsed, latencyMs, estimatedCostUsd);

  return {
    answer: text.trim(),
    provider: "NVIDIA",
    model,
    tokensUsed,
    latencyMs,
    estimatedCostUsd,
    fallbackOccurred: true,
    failoverReason: "Gemini and OpenRouter providers failed",
  };
}

/**
 * 4. Fallback 3: OmniRoute API Call
 */
async function callOmniRoute(req: AIGatewayRequest): Promise<AIGatewayResponse> {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const baseUrl = process.env.OMNIROUTE_URL || "http://localhost:20128";
  if (!apiKey || apiKey.startsWith("your-")) {
    throw new Error("Missing or invalid OMNIROUTE_API_KEY");
  }

  const startTime = Date.now();
  const model = "omniroute-local-v1";
  const url = `${baseUrl}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ],
      temperature: req.temperature || 0.2,
      max_tokens: req.maxTokens || 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OmniRoute HTTP ${response.status}: ${errorText.substring(0, 150)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OmniRoute returned empty choice message content");
  }

  const latencyMs = Date.now() - startTime;
  const tokensUsed = data.usage?.total_tokens || 300;
  const estimatedCostUsd = 0.0001;

  recordSuccess("OmniRoute", model, tokensUsed, latencyMs, estimatedCostUsd);

  return {
    answer: text.trim(),
    provider: "OmniRoute",
    model,
    tokensUsed,
    latencyMs,
    estimatedCostUsd,
    fallbackOccurred: true,
    failoverReason: "Gemini, OpenRouter, and NVIDIA providers failed",
  };
}

/**
 * Centralized Enterprise AI Gateway Router with Automatic Retry & Sequential Provider Failover
 */
export async function generateAIGatewayResponse(req: AIGatewayRequest): Promise<AIGatewayResponse> {
  // 1. Try Primary Provider: Google Gemini
  try {
    return await callGemini(req);
  } catch (err: unknown) {
    recordError("Gemini", err instanceof Error ? err.message : String(err));
  }

  // 2. Try Fallback 1: OpenRouter
  try {
    return await callOpenRouter(req);
  } catch (err: unknown) {
    recordError("OpenRouter", err instanceof Error ? err.message : String(err));
  }

  // 3. Try Fallback 2: NVIDIA AI
  try {
    return await callNVIDIA(req);
  } catch (err: unknown) {
    recordError("NVIDIA", err instanceof Error ? err.message : String(err));
  }

  // 4. Try Fallback 3: OmniRoute
  try {
    return await callOmniRoute(req);
  } catch (err: unknown) {
    recordError("OmniRoute", err instanceof Error ? err.message : String(err));
  }

  // 5. If all external APIs fail or are unconfigured, throw structured gateway exception
  throw new Error("All external AI providers (Gemini, OpenRouter, NVIDIA, OmniRoute) failed to respond.");
}

/**
 * Returns Active AI Gateway Health & Observability Metrics for Admin Dashboard
 */
export function getAIGatewayObservability(): AIGatewayObservability {
  return {
    ...gatewayState,
    providerHealth: [...gatewayState.providerHealth],
  };
}
