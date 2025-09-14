import { getProjectDefaults, resolveModels } from './defaults';
import type { AgentGraphConfig, AgentOptions, ResolvedModels } from './types';

export interface RegisteredAgent extends AgentOptions {
  __resolvedModels: ResolvedModels;
}

export class AgentRegistry {
  private graph: AgentGraphConfig;
  private projectDefaults = getProjectDefaults();

  constructor(graph: AgentGraphConfig) {
    this.graph = graph;
  }

  list(): RegisteredAgent[] {
    return this.graph.agents.map(a => ({
      ...a,
      __resolvedModels: resolveModels(a.models, this.graph.models, this.projectDefaults),
    }));
  }

  get(id: string): RegisteredAgent | undefined {
    const a = this.graph.agents.find(x => x.id === id);
    if (!a) return undefined;
    return {
      ...a,
      __resolvedModels: resolveModels(a.models, this.graph.models, this.projectDefaults),
    };
  }
}

// Very small runner stub that demonstrates how one might prepare a prompt.
export async function runAgent(
  agent: RegisteredAgent,
  userInput: string,
  opts?: { mode?: 'base' | 'structuredOutput' | 'summarizer' }
): Promise<{ preparedPrompt: string; model: string; provider: string }> {
  const { __resolvedModels, prompt } = agent;
  const mode = opts?.mode || 'base';
  const selected = __resolvedModels[mode];

  // Compose the full system prompt with graphPrompt if desired.
  const systemPrompt = [
    '[Graph Prompt]\n' + (import.meta.env.VITE_AGENT_GRAPH_PROMPT || ''),
    '[Agent Prompt]\n' + prompt,
  ].filter(Boolean).join('\n\n');

  // This runner only returns the prep info; wire to your LLM client as needed.
  return {
    preparedPrompt: `${systemPrompt}\n\n[User]\n${userInput}`,
    model: selected.model,
    provider: selected.provider,
  };
}

