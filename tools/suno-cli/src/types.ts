export interface SunoConfig {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  usePlaywright: boolean;
  playwrightConfig?: {
    headless: boolean;
    timeout: number;
  };
}

export interface GenerateRequest {
  prompt: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: string;
  callBackUrl?: string;
  style?: string;
  title?: string;
  personaId?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface GenerateResponse {
  code: number;
  msg: string;
  data?: {
    task_id: string;
    data?: Array<{
      id: string;
      audio_url: string;
      stream_audio_url: string;
      image_url: string;
      prompt: string;
      model_name: string;
      title: string;
      tags: string;
      createTime: string;
      duration: number;
    }>;
  };
}

export interface TaskStatus {
  code: number;
  msg: string;
  data?: {
    callbackType: 'complete' | 'progress';
    task_id: string;
    data?: Array<{
      id: string;
      audio_url: string;
      stream_audio_url: string;
      source_audio_url?: string;
      image_url: string;
      source_image_url?: string;
      prompt: string;
      model_name: string;
      title: string;
      tags: string;
      createTime: string;
      duration: number;
    }>;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}
