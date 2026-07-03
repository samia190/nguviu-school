import * as OllamaProvider from "./ollamaProvider.js";
import * as OpenAIProvider from "./openaiProvider.js";

const DEFAULT_PROVIDER = (process.env.AI_PROVIDER || "ollama").toLowerCase();
const providers = {
  ollama: OllamaProvider,
  openai: OpenAIProvider,
};

export const getProvider = (providerName) => {
  const name = (providerName || DEFAULT_PROVIDER).toLowerCase();
  return providers[name] || providers[DEFAULT_PROVIDER];
};

export const getDefaultProviderName = () => DEFAULT_PROVIDER;

export const listProviders = () => Object.keys(providers);

export default {
  getProvider,
  getDefaultProviderName,
  listProviders,
};