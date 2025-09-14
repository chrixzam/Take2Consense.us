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
      canTransferTo: () => ['booking'],
      canDelegateTo: () => ['booking'],
    },
    {
      id: 'booking',
      name: 'Booking Agent',
      description: 'Handles reservations, bookings, and follow-up actions for planned activities.',
      prompt:
        'You are a booking specialist who helps users make reservations and bookings for their planned activities. When given a plan or list of venues/events, provide specific booking instructions, contact information, reservation tips, and alternative options. Focus on actionable next steps like phone numbers, websites, booking platforms, and optimal timing for reservations. Include backup options and practical advice for securing bookings.',
      canTransferTo: () => ['planner', 'summarizer'],
      canDelegateTo: () => ['summarizer'],
    },
    {
      id: 'summarizer',
      name: 'Summarizer Agent',
      description: 'Summarizes sessions or event lists into digestible updates.',
      prompt:
        'Summarize the content into a brief, friendly update with bullet points and a clear CTA.',
      canTransferTo: () => ['planner', 'booking'],
    },
  ],
};

export default agentGraph;
