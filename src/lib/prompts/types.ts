export type PromptVersion = "v1" | "v2" | "v3";
export type PromptCategory = "knowledge" | "reasoning" | "search";

export interface PromptTemplate {
  version: string;
  template: string;
  requiredVariables: string[];
  category: string;
  description?: string;
  author?: string;
  created?: string;
  lastModified?: string;
}

export interface PromptUsage {
  promptName: string;
  category: PromptCategory;
  version: PromptVersion;
  variables: Record<string, string>;
  timestamp: string;
  responseTime?: number;
  success: boolean;
  error?: string;
}

export interface PromptMetrics {
  totalUsage: number;
  successRate: number;
  averageResponseTime: number;
  mostUsedPrompts: { name: string; category: string; usage: number }[];
  errorRate: number;
}