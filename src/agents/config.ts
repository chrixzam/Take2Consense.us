import type { AgentGraphConfig } from './types';

// Graph-level prompt is injected into each agent's system prompt
const graphPrompt = `You are part of a small team of planning agents.
Be concise, kind, and specific. Prefer actionable next steps.
Share assumptions and ask for missing context.`;

export const agentGraph: AgentGraphConfig = {
  graphPrompt,
  // You can put graph-level model overrides here; leaving empty to inherit project defaults
  models: undefined,
  agents: [
    {
      id: 'planner',
      name: 'Planner Agent',
      description: 'Turns user ideas into concrete planning steps and options.',
      prompt:
        'Generate a short, prioritized plan with 3–5 concrete steps. Include any dependencies and suggested order. Prefer local venues and budget-friendly ideas when applicable.',
      // Example of per-agent override (commented):
      // models: { base: { provider: 'anthropic', model: 'anthropic/claude-4-sonnet-20250514' } },
    },
    {
      id: 'summarizer',
      name: 'Summarizer Agent',
      description: 'Summarizes sessions or event lists into digestible updates.',
      prompt:
        'Summarize the content into a brief, friendly update with bullet points and a clear CTA.',
    },
  ],
};

export default agentGraph;

