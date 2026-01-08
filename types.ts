
export type ContentType = 'title' | 'thumbnail' | 'facebook' | 'youtube';

export interface GeneratedData {
  title: string[];
  thumbnail: string[];
  facebook: string;
  youtube: string;
}

export interface ProcessingState {
  isTranscribing: boolean;
  isGenerating: Record<ContentType, boolean>;
  generationProgress: Record<ContentType, number>; // Track progress for each section
  progress: number; // Global progress (for transcription)
}
