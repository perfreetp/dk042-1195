import { create } from 'zustand';
import type { Inspiration, Comment, SimilarCase, Product, Experiment, RetrospectiveData, Anchor, HypothesisItem, HypothesisVerdict } from '@/types';
import { mockInspirations, mockComments, mockSimilarCases, mockProducts, mockExperiments, mockRetrospectives, mockAnchors } from '@/data/mockData';

const STORAGE_KEY = 'inspiration-hub-data';

const generateId = () => Math.random().toString(36).substring(2, 11);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function saveToStorage(state: Partial<AppState>) {
  try {
    const data = {
      inspirations: state.inspirations,
      comments: state.comments,
      similarCases: state.similarCases,
      experiments: state.experiments,
      retrospectives: state.retrospectives,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

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
  convertDraftToFormal: (id: string) => void;

  addComment: (inspirationId: string, content: string) => void;
  addSimilarCase: (inspirationId: string, data: Omit<SimilarCase, 'id' | 'inspirationId'>) => void;

  addExperiment: (data: Partial<Experiment>) => void;
  updateExperiment: (id: string, data: Partial<Experiment>) => void;

  addRetrospective: (experimentId: string, data: Partial<RetrospectiveData>) => void;
  updateRetrospective: (id: string, data: Partial<RetrospectiveData>) => void;

  toggleActionItem: (retrospectiveId: string, actionItemId: string) => void;

  resetToMockData: () => void;
  clearAllData: () => void;
}

const saved = loadFromStorage();

const defaultState = {
  inspirations: mockInspirations,
  comments: mockComments,
  similarCases: mockSimilarCases,
  products: mockProducts,
  experiments: mockExperiments,
  retrospectives: mockRetrospectives,
  anchors: mockAnchors,
};

const initialState = saved
  ? {
      ...defaultState,
      inspirations: saved.inspirations ?? mockInspirations,
      comments: saved.comments ?? mockComments,
      similarCases: saved.similarCases ?? mockSimilarCases,
      experiments: saved.experiments ?? mockExperiments,
      retrospectives: saved.retrospectives ?? mockRetrospectives,
    }
  : defaultState;

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

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
    set((state) => {
      const inspirations = state.inspirations.map((ins) =>
        ins.id === id ? { ...ins, isLiked: !ins.isLiked, likes: ins.isLiked ? ins.likes - 1 : ins.likes + 1 } : ins
      );
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  toggleFavorite: (id) =>
    set((state) => {
      const inspirations = state.inspirations.map((ins) =>
        ins.id === id ? { ...ins, isFavorited: !ins.isFavorited, favorites: ins.isFavorited ? ins.favorites - 1 : ins.favorites + 1 } : ins
      );
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  addInspiration: (data) =>
    set((state) => {
      const hItems: HypothesisItem[] = (data.hypotheses || []).map((h) => ({
        id: generateId(),
        text: typeof h === 'string' ? h : '',
        verdict: 'pending' as HypothesisVerdict,
        verdictNote: '',
      }));
      const ins: Inspiration = {
        id: generateId(),
        title: data.title || '',
        description: data.description || '',
        coverImage: data.coverImage || '',
        festival: data.festival || '',
        targetAudience: data.targetAudience || '',
        referenceLinks: data.referenceLinks || [],
        materialImages: data.materialImages || [],
        estimatedCost: data.estimatedCost || 0,
        status: data.status || (data.isDraft ? 'incomplete' : 'draft'),
        feasibilityScore: data.feasibilityScore || null,
        tags: data.tags || [],
        relatedProducts: data.relatedProducts || [],
        hypotheses: data.hypotheses || [],
        hypothesisItems: data.hypothesisItems || hItems,
        sourceUrl: data.sourceUrl || '',
        isDraft: data.isDraft || false,
        likes: 0,
        isLiked: false,
        favorites: 0,
        isFavorited: false,
        creatorId: 'u1',
        creatorName: '当前用户',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const inspirations = [ins, ...state.inspirations];
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  updateInspiration: (id, data) =>
    set((state) => {
      const inspirations = state.inspirations.map((ins) =>
        ins.id === id ? { ...ins, ...data, updatedAt: new Date().toISOString() } : ins
      );
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  deleteInspiration: (id) =>
    set((state) => {
      const inspirations = state.inspirations.filter((ins) => ins.id !== id);
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  convertDraftToFormal: (id) =>
    set((state) => {
      const inspirations = state.inspirations.map((ins) =>
        ins.id === id ? { ...ins, isDraft: false, status: 'draft' as const, updatedAt: new Date().toISOString() } : ins
      );
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  addComment: (inspirationId, content) =>
    set((state) => {
      const comments = [
        { id: generateId(), inspirationId, userId: 'u1', userName: '当前用户', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current', content, createdAt: new Date().toISOString() },
        ...state.comments,
      ];
      saveToStorage({ ...state, comments });
      return { comments };
    }),

  addSimilarCase: (inspirationId, data) =>
    set((state) => {
      const similarCases = [{ id: generateId(), inspirationId, ...data }, ...state.similarCases];
      saveToStorage({ ...state, similarCases });
      return { similarCases };
    }),

  addExperiment: (data) =>
    set((state) => {
      const experiments = [
        {
          id: generateId(),
          inspirationId: data.inspirationId || '',
          title: data.title || '',
          scheduledTime: data.scheduledTime || new Date().toISOString(),
          anchorId: data.anchorId || '',
          anchorName: data.anchorName || '',
          hypothesisIds: data.hypothesisIds || [],
          expectedMetrics: data.expectedMetrics || { views: 0, engagement: 0, conversion: 0, gmv: 0 },
          actualMetrics: data.actualMetrics,
          status: data.status || 'scheduled',
          createdAt: new Date().toISOString(),
        },
        ...state.experiments,
      ];
      saveToStorage({ ...state, experiments });
      return { experiments };
    }),

  updateExperiment: (id, data) =>
    set((state) => {
      const experiments = state.experiments.map((exp) => exp.id === id ? { ...exp, ...data } : exp);
      saveToStorage({ ...state, experiments });
      return { experiments };
    }),

  addRetrospective: (experimentId, data) =>
    set((state) => {
      const retrospectives = [
        {
          id: generateId(),
          experimentId,
          issues: data.issues || [],
          actionItems: data.actionItems || [],
          hypothesisVerdicts: data.hypothesisVerdicts || [],
          summary: data.summary || '',
          createdAt: new Date().toISOString(),
        },
        ...state.retrospectives,
      ];
      saveToStorage({ ...state, retrospectives });
      return { retrospectives };
    }),

  updateRetrospective: (id, data) =>
    set((state) => {
      const retrospectives = state.retrospectives.map((retro) => retro.id === id ? { ...retro, ...data } : retro);
      saveToStorage({ ...state, retrospectives });
      return { retrospectives };
    }),

  toggleActionItem: (retrospectiveId, actionItemId) =>
    set((state) => {
      const retrospectives = state.retrospectives.map((retro) =>
        retro.id === retrospectiveId
          ? { ...retro, actionItems: retro.actionItems.map((ai) => ai.id === actionItemId ? { ...ai, completed: !ai.completed } : ai) }
          : retro
      );
      saveToStorage({ ...state, retrospectives });
      return { retrospectives };
    }),

  resetToMockData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ ...defaultState });
  },

  clearAllData: () => {
    const emptyState = {
      inspirations: [],
      comments: [],
      similarCases: [],
      experiments: [],
      retrospectives: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
    set({ ...emptyState });
  },
}));
