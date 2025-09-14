import { AgentRegistry, agentGraph, runAgent } from './index';

export type PlanResult = {
  text: string;
  model?: string;
  provider?: string;
  source: 'api' | 'openai' | 'anthropic' | 'local';
};

const registry = new AgentRegistry(agentGraph);

function normalizeModelId(model?: string) {
  if (!model) return undefined;
  // Accept values like 'openai/gpt-4.1-mini-2025-04-14' and return provider + bare model id
  const parts = model.split('/');
  if (parts.length === 2) return { provider: parts[0], model: parts[1] };
  return { provider: 'openai', model }; // best effort
}

export async function planWithAgent(idea: string, agentId = 'planner'): Promise<PlanResult> {
  const agent = registry.get(agentId);
  if (!agent) {
    return { text: 'Agent not found.', source: 'local' };
  }

  // First, use our runner to build the combined prompt and select model/provider
  const prep = await runAgent(agent, idea, { mode: 'base' });
  const { model, provider } = (() => {
    const norm = normalizeModelId(prep.model);
    return { model: norm?.model || prep.model, provider: norm?.provider || prep.provider };
  })();

  const apiUrl = import.meta.env.VITE_AGENT_API_URL as string | undefined;
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, userInput: idea, mode: 'base' }),
      });
      if (res.ok) {
        const data = await res.json();
        return { text: data.text || String(data), model: data.model || model, provider: data.provider || provider, source: 'api' };
      }
    } catch (e) {
      // fallthrough
    }
  }

  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (openaiKey && provider === 'openai') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: (model || 'gpt-4.1-mini').replace(/-\d{4}-\d{2}-\d{2}$/,'').replace(/^openai\//,''),
          messages: [
            { role: 'system', content: prep.preparedPrompt.split('\n\n[User]\n')[0] },
            { role: 'user', content: idea },
          ],
          temperature: 0.2,
        }),
      });
      if (response.ok) {
        const data: any = await response.json();
        const text = data.choices?.[0]?.message?.content || JSON.stringify(data);
        return { text, model, provider, source: 'openai' };
      }
    } catch (_) {}
  }

  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (anthropicKey && provider === 'anthropic') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: (model || 'claude-3-5-sonnet-20240620').replace(/^anthropic\//,''),
          max_tokens: 800,
          system: prep.preparedPrompt.split('\n\n[User]\n')[0],
          messages: [ { role: 'user', content: idea } ],
        }),
      });
      if (response.ok) {
        const data: any = await response.json();
        const text = data?.content?.[0]?.text || JSON.stringify(data);
        return { text, model, provider, source: 'anthropic' };
      }
    } catch (_) {}
  }

  // Local fallback: simple deterministic draft using the prompt.
  const fallback = `Plan Outline\n\n1) Clarify constraints (budget, time, location).\n2) Generate 3 options relevant to: "${idea}".\n3) Compare pros/cons, pick a lead.\n4) Propose date/time and rough budget.\n5) Next steps: confirm attendees, book venue.`;
  return { text: fallback, model, provider, source: 'local' };
}

