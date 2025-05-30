export interface Annotation {
  id: string;
  text: string;
  position: { x: number; y: number }; // Relative to image: 0.0 to 1.0
}

export type MediaType = 'image' | 'video';

export interface TourStep {
  id: string;
  imageUrl: string; // URL or data URI for image OR video
  mediaType?: MediaType; // To explicitly distinguish between image and video
  title: string;
  description: string;
  order: number;
  annotations: Annotation[];
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string; // URL or data URI for the tour's cover image
  steps: TourStep[];
  isPublic: boolean;
  shareableLink?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
