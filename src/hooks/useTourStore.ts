
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Tour, TourStep, Annotation, MediaType } from '@/lib/types';
import { inferIsVideoUrl } from '@/lib/utils'; // Import the helper

interface TourState {
  tours: Tour[];
  addTour: (newTourData: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'steps' | 'shareableLink' | 'isPublic'> & { steps?: Partial<TourStep>[] }) => Tour;
  updateTour: (tourId: string, updates: Partial<Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteTour: (tourId: string) => void;
  getTourById: (tourId: string) => Tour | undefined;
  addStepToTour: (tourId: string, newStepData: Omit<TourStep, 'id' | 'order' | 'annotations'>) => void;
  updateStepInTour: (tourId: string, stepId: string, updates: Partial<Omit<TourStep, 'id'>>) => void;
  deleteStepFromTour: (tourId: string, stepId: string) => void;
  // Basic annotation functions (can be expanded)
  addAnnotationToStep: (tourId: string, stepId: string, newAnnotationData: Omit<Annotation, 'id'>) => void;
  updateAnnotationInStep: (tourId: string, stepId: string, annotationId: string, updates: Partial<Omit<Annotation, 'id'>>) => void;
  deleteAnnotationFromStep: (tourId: string, stepId: string, annotationId: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      tours: [],
      addTour: (newTourData) => {
        const now = new Date().toISOString();
        const newTour: Tour = {
          id: generateId(),
          title: newTourData.title,
          description: newTourData.description || '',
          thumbnailUrl: newTourData.thumbnailUrl || `https://placehold.co/600x400.png`,
          steps: (newTourData.steps || []).map((step, index) => {
            const imageUrl = step.imageUrl || `https://placehold.co/800x600.png`;
            return {
              id: step.id || generateId(),
              imageUrl: imageUrl,
              mediaType: step.mediaType || (inferIsVideoUrl(imageUrl) ? 'video' : 'image'),
              title: step.title || `Step ${index + 1}`,
              description: step.description || '',
              order: step.order !== undefined ? step.order : index,
              annotations: (step.annotations || []).map(ann => ({ ...ann, id: ann.id || generateId() })),
            };
          }),
          isPublic: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ tours: [...state.tours, newTour] }));
        return newTour;
      },
      updateTour: (tourId, updates) => {
        set((state) => ({
          tours: state.tours.map((tour) =>
            tour.id === tourId ? { ...tour, ...updates, updatedAt: new Date().toISOString() } : tour
          ),
        }));
      },
      deleteTour: (tourId) => {
        set((state) => ({
          tours: state.tours.filter((tour) => tour.id !== tourId),
        }));
      },
      getTourById: (tourId) => {
        return get().tours.find((tour) => tour.id === tourId);
      },
      addStepToTour: (tourId, newStepData) => {
        set((state) => ({
          tours: state.tours.map((tour) => {
            if (tour.id === tourId) {
              const imageUrl = newStepData.imageUrl || `https://placehold.co/800x600.png`;
              const newStep: TourStep = {
                id: generateId(),
                ...newStepData,
                imageUrl: imageUrl,
                mediaType: newStepData.mediaType || (inferIsVideoUrl(imageUrl) ? 'video' : 'image'),
                order: tour.steps.length,
                annotations: [],
              };
              return { ...tour, steps: [...tour.steps, newStep], updatedAt: new Date().toISOString() };
            }
            return tour;
          }),
        }));
      },
      updateStepInTour: (tourId, stepId, updates) => {
        set((state) => ({
          tours: state.tours.map((tour) => {
            if (tour.id === tourId) {
              return {
                ...tour,
                steps: tour.steps.map((step) => {
                  if (step.id === stepId) {
                    let finalUpdates = { ...updates };
                    if (updates.imageUrl && typeof updates.mediaType === 'undefined') {
                      finalUpdates.mediaType = inferIsVideoUrl(updates.imageUrl) ? 'video' : 'image';
                    }
                    return { ...step, ...finalUpdates };
                  }
                  return step;
                }).sort((a, b) => a.order - b.order), // Re-sort if order changes
                updatedAt: new Date().toISOString(),
              };
            }
            return tour;
          }),
        }));
      },
      deleteStepFromTour: (tourId, stepId) => {
        set((state) => ({
          tours: state.tours.map((tour) => {
            if (tour.id === tourId) {
              const updatedSteps = tour.steps.filter((step) => step.id !== stepId)
                .map((step, index) => ({ ...step, order: index })); // Re-index order
              return { ...tour, steps: updatedSteps, updatedAt: new Date().toISOString() };
            }
            return tour;
          }),
        }));
      },
       addAnnotationToStep: (tourId, stepId, newAnnotationData) => {
        set(state => ({
          tours: state.tours.map(tour => 
            tour.id === tourId ? {
              ...tour,
              steps: tour.steps.map(step => 
                step.id === stepId ? {
                  ...step,
                  annotations: [...(step.annotations || []), { ...newAnnotationData, id: generateId() }]
                } : step
              ),
              updatedAt: new Date().toISOString()
            } : tour
          )
        }));
      },
      updateAnnotationInStep: (tourId, stepId, annotationId, updates) => {
        set(state => ({
          tours: state.tours.map(tour => 
            tour.id === tourId ? {
              ...tour,
              steps: tour.steps.map(step =>
                step.id === stepId ? {
                  ...step,
                  annotations: (step.annotations || []).map(ann => 
                    ann.id === annotationId ? { ...ann, ...updates } : ann
                  )
                } : step
              ),
              updatedAt: new Date().toISOString()
            } : tour
          )
        }));
      },
      deleteAnnotationFromStep: (tourId, stepId, annotationId) => {
        set(state => ({
          tours: state.tours.map(tour =>
            tour.id === tourId ? {
              ...tour,
              steps: tour.steps.map(step =>
                step.id === stepId ? {
                  ...step,
                  annotations: (step.annotations || []).filter(ann => ann.id !== annotationId)
                } : step
              ),
              updatedAt: new Date().toISOString()
            } : tour
          )
        }));
      }
    }),
    {
      name: 'storyflow-tours-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // Partialize to avoid storing functions if any, though typically not an issue with simple state
      // partialize: (state) => ({ tours: state.tours }),
    }
  )
);

    