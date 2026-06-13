import { create } from 'zustand';
import type { Inspiration, Comment, SimilarCase, Product, Experiment, RetrospectiveData, Anchor } from '@/types';
import { mockInspirations, mockComments, mockSimilarCases, mockProducts, mockExperiments, mockRetrospectives, mockAnchors } from '@/data/mockData';

interface AppState {
  inspirations: Inspiration[];
  comments: Comment[];
  similarCases: SimilarCase[];
  products: Product[];
  experiments: Experiment[];
  retrospectives: RetrospectiveData[];
  anchors: Anchor[];

  searchQuery: string;
  selectedTags: string[];
  sortBy: string;

  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  setSortBy: (sort: string) => void;

  toggleLike: (id: string) => void;
  toggleFavorite: (id: string) => void;

  addInspiration: (data: Partial<Inspiration>) => void;
  updateInspiration: (id: string, data: Partial<Inspiration>) => void;
  deleteInspiration: (id: string) => void;

  addComment: (inspirationId: string, content: string) => void;
  addSimilarCase: (inspirationId: string, data: Omit<SimilarCase, 'id' | 'inspirationId'>) => void;

  addExperiment: (data: Partial<Experiment>) => void;
  updateExperiment: (id: string, data: Partial<Experiment>) => void;

  addRetrospective: (experimentId: string, data: Partial<RetrospectiveData>) => void;
  updateRetrospective: (id: string, data: Partial<RetrospectiveData>) => void;

  toggleActionItem: (retrospectiveId: string, actionItemId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAppStore = create<AppState>((set) => ({
  inspirations: mockInspirations,
  comments: mockComments,
  similarCases: mockSimilarCases,
  products: mockProducts,
  experiments: mockExperiments,
  retrospectives: mockRetrospectives,
  anchors: mockAnchors,

  searchQuery: '',
  selectedTags: [],
  sortBy: 'latest',

  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),
  setSortBy: (sort) => set({ sortBy: sort }),

  toggleLike: (id) =>
    set((state) => ({
      inspirations: state.inspirations.map((ins) =>
        ins.id === id
          ? {
              ...ins,
              isLiked: !ins.isLiked,
              likes: ins.isLiked ? ins.likes - 1 : ins.likes + 1,
            }
          : ins
      ),
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      inspirations: state.inspirations.map((ins) =>
        ins.id === id
          ? {
              ...ins,
              isFavorited: !ins.isFavorited,
              favorites: ins.isFavorited ? ins.favorites - 1 : ins.favorites + 1,
            }
          : ins
      ),
    })),

  addInspiration: (data) =>
    set((state) => ({
      inspirations: [
        {
          id: generateId(),
          title: data.title || '',
          description: data.description || '',
          coverImage: data.coverImage || '',
          festival: data.festival || '',
          targetAudience: data.targetAudience || '',
          referenceLinks: data.referenceLinks || [],
          materialImages: data.materialImages || [],
          estimatedCost: data.estimatedCost || 0,
          status: data.status || 'draft',
          feasibilityScore: data.feasibilityScore || null,
          tags: data.tags || [],
          relatedProducts: data.relatedProducts || [],
          hypotheses: data.hypotheses || [],
          likes: 0,
          isLiked: false,
          favorites: 0,
          isFavorited: false,
          creatorId: 'u1',
          creatorName: '当前用户',
          creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...state.inspirations,
      ],
    })),

  updateInspiration: (id, data) =>
    set((state) => ({
      inspirations: state.inspirations.map((ins) =>
        ins.id === id ? { ...ins, ...data, updatedAt: new Date().toISOString() } : ins
      ),
    })),

  deleteInspiration: (id) =>
    set((state) => ({
      inspirations: state.inspirations.filter((ins) => ins.id !== id),
    })),

  addComment: (inspirationId, content) =>
    set((state) => ({
      comments: [
        {
          id: generateId(),
          inspirationId,
          userId: 'u1',
          userName: '当前用户',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
          content,
          createdAt: new Date().toISOString(),
        },
        ...state.comments,
      ],
    })),

  addSimilarCase: (inspirationId, data) =>
    set((state) => ({
      similarCases: [
        {
          id: generateId(),
          inspirationId,
          ...data,
        },
        ...state.similarCases,
      ],
    })),

  addExperiment: (data) =>
    set((state) => ({
      experiments: [
        {
          id: generateId(),
          inspirationId: data.inspirationId || '',
          title: data.title || '',
          scheduledTime: data.scheduledTime || new Date().toISOString(),
          anchorId: data.anchorId || '',
          anchorName: data.anchorName || '',
          expectedMetrics: data.expectedMetrics || { views: 0, engagement: 0, conversion: 0, gmv: 0 },
          actualMetrics: data.actualMetrics,
          status: data.status || 'scheduled',
          createdAt: new Date().toISOString(),
        },
        ...state.experiments,
      ],
    })),

  updateExperiment: (id, data) =>
    set((state) => ({
      experiments: state.experiments.map((exp) =>
        exp.id === id ? { ...exp, ...data } : exp
      ),
    })),

  addRetrospective: (experimentId, data) =>
    set((state) => ({
      retrospectives: [
        {
          id: generateId(),
          experimentId,
          issues: data.issues || [],
          actionItems: data.actionItems || [],
          summary: data.summary || '',
          createdAt: new Date().toISOString(),
        },
        ...state.retrospectives,
      ],
    })),

  updateRetrospective: (id, data) =>
    set((state) => ({
      retrospectives: state.retrospectives.map((retro) =>
        retro.id === id ? { ...retro, ...data } : retro
      ),
    })),

  toggleActionItem: (retrospectiveId, actionItemId) =>
    set((state) => ({
      retrospectives: state.retrospectives.map((retro) =>
        retro.id === retrospectiveId
          ? {
              ...retro,
              actionItems: retro.actionItems.map((ai) =>
                ai.id === actionItemId ? { ...ai, completed: !ai.completed } : ai
              ),
            }
          : retro
      ),
    })),
}));
