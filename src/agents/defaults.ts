import type { ModelsSettings, ResolvedModels } from './types';

// Defaults described in the provided doc
const DEFAULTS: Required<ModelsSettings> = {
  base: {
    provider: 'anthropic',
    model: 'anthropic/claude-4-sonnet-20250514',
    providerOptions: { temperature: 0.2, timeout: 30000 },
  },
  structuredOutput: {
    provider: 'openai',
    model: 'openai/gpt-4.1-mini-2025-04-14',
    providerOptions: { temperature: 0, timeout: 30000 },
  },
  summarizer: {
    provider: 'openai',
    model: 'openai/gpt-4.1-nano-2025-04-14',
    providerOptions: { temperature: 0.2, timeout: 20000 },
  },
};

export function getProjectDefaults(): ModelsSettings {
  // You can override via env if desired later
  return DEFAULTS;
}

export function resolveModels(
  agent?: ModelsSettings,
  graph?: ModelsSettings,
  project?: ModelsSettings,
): ResolvedModels {
  const pick = (key: keyof ModelsSettings) =>
    agent?.[key] || graph?.[key] || project?.[key] || DEFAULTS[key]!;

  return {
    base: pick('base'),
    structuredOutput: pick('structuredOutput'),
    summarizer: pick('summarizer'),
  } as ResolvedModels;
}

