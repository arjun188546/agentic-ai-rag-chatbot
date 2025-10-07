import { KNOWLEDGE_BASE_PROMPTS } from './versions/v1/knowledge';
import { REASONING_PROMPTS } from './versions/v1/reasoning';
import { SEARCH_PROMPTS } from './versions/v1/search';
import { PromptTemplate, PromptCategory, PromptVersion } from './types';

export class PromptManager {
  private static instance: PromptManager;
  private currentVersion: PromptVersion = "v1";
  
  private promptLibrary = {
    v1: {
      knowledge: KNOWLEDGE_BASE_PROMPTS,
      reasoning: REASONING_PROMPTS, 
      search: SEARCH_PROMPTS
    }
    // v2: { ... } // Future versions
  };

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  // Get a specific prompt template
  getPrompt(category: PromptCategory, promptName: string, version?: PromptVersion): PromptTemplate | null {
    const ver = version || this.currentVersion;
    const categoryPrompts = this.promptLibrary[ver]?.[category];
    return categoryPrompts?.[promptName] || null;
  }

  // Render a prompt with variables
  renderPrompt(category: PromptCategory, promptName: string, variables: Record<string, string>, version?: PromptVersion): string {
    const prompt = this.getPrompt(category, promptName, version);
    if (!prompt) {
      throw new Error(`Prompt not found: ${category}.${promptName} (version: ${version || this.currentVersion})`);
    }

    // Validate required variables
    const missing = prompt.requiredVariables.filter(var_ => !(var_ in variables));
    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }

    // Replace variables in template
    let rendered = prompt.template;
    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return rendered;
  }

  // List all available prompts
  listPrompts(version?: PromptVersion): Record<PromptCategory, string[]> {
    const ver = version || this.currentVersion;
    const versionPrompts = this.promptLibrary[ver];
    
    const result: Record<PromptCategory, string[]> = {} as any;
    Object.entries(versionPrompts).forEach(([category, prompts]) => {
      result[category as PromptCategory] = Object.keys(prompts);
    });
    
    return result;
  }

  // Get prompt statistics
  getPromptStats(version?: PromptVersion) {
    const ver = version || this.currentVersion;
    const prompts = this.listPrompts(ver);
    
    return {
      version: ver,
      totalPrompts: Object.values(prompts).flat().length,
      categories: Object.keys(prompts).length,
      promptsByCategory: Object.fromEntries(
        Object.entries(prompts).map(([cat, prompts]) => [cat, prompts.length])
      )
    };
  }

  // Switch version
  setVersion(version: PromptVersion): void {
    if (!(version in this.promptLibrary)) {
      throw new Error(`Version ${version} not available`);
    }
    this.currentVersion = version;
  }

  // Get current version
  getCurrentVersion(): PromptVersion {
    return this.currentVersion;
  }

  // Validate prompt template
  validatePrompt(template: PromptTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.template || template.template.trim().length === 0) {
      errors.push("Template content is required");
    }

    if (!template.requiredVariables || template.requiredVariables.length === 0) {
      errors.push("At least one required variable must be specified");
    }

    if (!template.category || template.category.trim().length === 0) {
      errors.push("Category is required");
    }

    if (!template.version || template.version.trim().length === 0) {
      errors.push("Version is required");
    }

    // Check if required variables are actually used in template
    template.requiredVariables?.forEach(variable => {
      if (!template.template.includes(`{${variable}}`)) {
        errors.push(`Required variable '${variable}' is not used in template`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get prompt usage analytics (placeholder for future implementation)
  getPromptAnalytics(timeRange?: { start: Date; end: Date }) {
    // This would integrate with a logging system in production
    return {
      message: "Analytics not implemented yet",
      timeRange,
      suggestion: "Implement logging in your LLM calls to track prompt usage"
    };
  }
}

// Export singleton instance
export const promptManager = PromptManager.getInstance();

// Export prompt categories for easy access
export { KNOWLEDGE_BASE_PROMPTS, REASONING_PROMPTS, SEARCH_PROMPTS };

// Convenience functions for common operations
export const renderKnowledgePrompt = (promptName: string, variables: Record<string, string>, version?: PromptVersion) => {
  return promptManager.renderPrompt('knowledge', promptName, variables, version);
};

export const renderReasoningPrompt = (promptName: string, variables: Record<string, string>, version?: PromptVersion) => {
  return promptManager.renderPrompt('reasoning', promptName, variables, version);
};

export const renderSearchPrompt = (promptName: string, variables: Record<string, string>, version?: PromptVersion) => {
  return promptManager.renderPrompt('search', promptName, variables, version);
};

// Export types
export type { PromptTemplate, PromptCategory, PromptVersion } from './types';