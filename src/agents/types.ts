export type ProviderName = 'anthropic' | 'openai' | string;

export interface ProviderOptions {
  temperature?: number; // 0.0 - 1.0
  maxTokens?: number; // maximum tokens
  timeout?: number; // ms
  // Allow provider-specific options without tight coupling
  [key: string]: unknown;
}

export interface ModelConfig {
  provider: ProviderName;
  model: string; // e.g., 'anthropic/claude-4-sonnet-20250514'
  providerOptions?: ProviderOptions;
}

export interface ModelsSettings {
  base?: ModelConfig; // conversational + reasoning
  structuredOutput?: ModelConfig; // JSON-only tasks
  summarizer?: ModelConfig; // summaries + status updates
}

export interface AgentOptions {
  id: string; // required, stable id
  name: string; // required
  description: string; // required
  prompt: string; // required
  models?: ModelsSettings; // optional; inherits from graph/project defaults
  tools?: Record<string, unknown>; // MCP tool configs (placeholder)
  dataComponents?: unknown[]; // structured output components (placeholder)
  artifactComponents?: unknown[]; // artifact handlers (placeholder)
  canTransferTo?: () => string[]; // agent ids
  canDelegateTo?: () => string[]; // agent ids
}

export interface AgentGraphConfig {
  graphPrompt?: string; // injected into each agent's system prompt
  models?: ModelsSettings; // graph-level default models
  agents: AgentOptions[];
}

export interface ProjectDefaults {
  models?: ModelsSettings; // project-level defaults
}

export interface ResolvedModels extends Required<ModelsSettings> {}

