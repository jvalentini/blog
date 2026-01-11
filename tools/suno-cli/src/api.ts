import type { GenerateRequest, GenerateResponse, TaskStatus, SunoConfig } from './types.js';
import { configManager } from './config.js';
import { authManager } from './auth.js';
import { withRetry, createRetryOptions } from './utils/retry.js';

export class SunoAPI {
  private config: SunoConfig;

  constructor() {
    this.config = configManager.getConfig();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await authManager.ensureValidToken();
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
    }

    return response.json();
  }

  async generateMusic(request: GenerateRequest): Promise<GenerateResponse> {
    const operation = () => this.makeRequest<GenerateResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return withRetry(operation, createRetryOptions());
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const operation = () => this.makeRequest<TaskStatus>(`/generate/status?task_id=${taskId}`);

    return withRetry(operation, createRetryOptions());
  }

  async addInstrumental(request: {
    uploadUrl: string;
    title?: string;
    negativeTags?: string;
    tags?: string;
    callBackUrl?: string;
    vocalGender?: 'm' | 'f';
    styleWeight?: number;
    weirdnessConstraint?: number;
    audioWeight?: number;
    model?: string;
  }): Promise<GenerateResponse> {
    const operation = () => this.makeRequest<GenerateResponse>('/generate/add-instrumental', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return withRetry(operation, createRetryOptions());
  }

  async extendMusic(request: {
    defaultParamFlag?: boolean;
    audioId: string;
    model?: string;
    callBackUrl?: string;
    prompt?: string;
    style?: string;
    title?: string;
    continueAt?: number;
    personaId?: string;
    negativeTags?: string;
    vocalGender?: 'm' | 'f';
    styleWeight?: number;
    weirdnessConstraint?: number;
    audioWeight?: number;
  }): Promise<GenerateResponse> {
    const operation = () => this.makeRequest<GenerateResponse>('/generate/extend', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return withRetry(operation, createRetryOptions());
  }
}

export const sunoAPI = new SunoAPI();
