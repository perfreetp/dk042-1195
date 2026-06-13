import { create } from 'zustand';
import type { Inspiration, Comment, SimilarCase, Product, Experiment, RetrospectiveData, Anchor, HypothesisItem, HypothesisVerdict, MaterialImageItem } from '@/types';
import { mockInspirations, mockComments, mockSimilarCases, mockProducts, mockExperiments, mockRetrospectives, mockAnchors } from '@/data/mockData';
import { generateId, normalizeMaterialImages } from '@/utils/helpers';

const STORAGE_KEY = 'inspiration-hub-data';

function toMaterialImages(arr: any): MaterialImageItem[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (typeof item === 'string') {
      return { id: `img-${generateId()}`, url: item, caption: '' };
    }
    return { id: item.id || `img-${generateId()}`, url: item.url || '', caption: item.caption || '' };
  });
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.inspirations) {
        parsed.inspirations = parsed.inspirations.map((ins: any) => ({
          ...ins,
          materialImages: toMaterialImages(ins.materialImages),
        }));
      }
      return parsed;
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

const MOCK_IDS = new Set(mockInspirations.map((i) => i.id));

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

  addInspiration: (data: Partial<Inspiration> & { materialImages?: Array<string | MaterialImageItem> }) => void;
  updateInspiration: (id: string, data: Partial<Inspiration> & { materialImages?: Array<string | MaterialImageItem> }) => void;
  deleteInspiration: (id: string) => void;
  restoreInspiration: (id: string) => void;
  permanentlyDeleteInspiration: (id: string) => void;
  convertDraftToFormal: (id: string) => void;

  updateImageCaption: (inspirationId: string, imageId: string, caption: string) => void;

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
        materialImages: toMaterialImages(data.materialImages || []),
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
      const patch: any = { ...data, updatedAt: new Date().toISOString() };
      if (data.materialImages) {
        patch.materialImages = toMaterialImages(data.materialImages);
      }
      const inspirations = state.inspirations.map((ins) => (ins.id === id ? { ...ins, ...patch } : ins));
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  deleteInspiration: (id) =>
    set((state) => {
      const inspirations = state.inspirations.map((ins) =>
        ins.id === id ? { ...ins, isDeleted: true, deletedAt: new Date().toISOString() } : ins
      );
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  restoreInspiration: (id) =>
    set((state) => {
      const inspirations = state.inspirations.map((ins) =>
        ins.id === id ? { ...ins, isDeleted: false, deletedAt: undefined } : ins
      );
      saveToStorage({ ...state, inspirations });
      return { inspirations };
    }),

  permanentlyDeleteInspiration: (id) =>
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

  updateImageCaption: (inspirationId, imageId, caption) =>
    set((state) => {
      const inspirations = state.inspirations.map((ins) =>
        ins.id === inspirationId
          ? {
              ...ins,
              materialImages: ins.materialImages.map((m) => (m.id === imageId ? { ...m, caption } : m)),
              updatedAt: new Date().toISOString(),
            }
          : ins
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
      const experiments = state.experiments.map((exp) => (exp.id === id ? { ...exp, ...data } : exp));
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
      const retrospectives = state.retrospectives.map((retro) => (retro.id === id ? { ...retro, ...data } : retro));
      saveToStorage({ ...state, retrospectives });
      return { retrospectives };
    }),

  toggleActionItem: (retrospectiveId, actionItemId) =>
    set((state) => {
      const retrospectives = state.retrospectives.map((retro) =>
        retro.id === retrospectiveId
          ? { ...retro, actionItems: retro.actionItems.map((ai) => (ai.id === actionItemId ? { ...ai, completed: !ai.completed } : ai)) }
          : retro
      );
      saveToStorage({ ...state, retrospectives });
      return { retrospectives };
    }),

  resetToMockData: () =>
    set((state) => {
      const currentUserInspirations = state.inspirations.filter((i) => !MOCK_IDS.has(i.id));
      const restoredMockInspirations = mockInspirations.map((mi) => {
        const existing = state.inspirations.find((i) => i.id === mi.id);
        if (existing) {
          return {
            ...mi,
            isLiked: existing.isLiked,
            likes: existing.likes,
            isFavorited: existing.isFavorited,
            favorites: existing.favorites,
            ...(existing.isDeleted ? {} : { isDeleted: undefined, deletedAt: undefined }),
          };
        }
        return mi;
      });
      const inspirations = [...restoredMockInspirations, ...currentUserInspirations];
      const comments = [
        ...mockComments,
        ...state.comments.filter((c) => !mockComments.find((mc) => mc.id === c.id)),
      ];
      const similarCases = [
        ...mockSimilarCases,
        ...state.similarCases.filter((s) => !mockSimilarCases.find((ms) => ms.id === s.id)),
      ];
      const experiments = [
        ...mockExperiments,
        ...state.experiments.filter((e) => !mockExperiments.find((me) => me.id === e.id)),
      ];
      const retrospectives = [
        ...mockRetrospectives,
        ...state.retrospectives.filter((r) => !mockRetrospectives.find((mr) => mr.id === r.id)),
      ];
      const newState = { ...state, inspirations, comments, similarCases, experiments, retrospectives };
      saveToStorage(newState);
      return newState;
    }),

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
