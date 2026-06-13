export type InspirationStatus = 'draft' | 'reviewing' | 'approved' | 'experimenting' | 'completed' | 'archived' | 'incomplete' | 'bundle';

export type ExperimentStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export type Severity = 'low' | 'medium' | 'high';

export type HypothesisVerdict = 'confirmed' | 'refuted' | 'inconclusive' | 'pending';

export type AnnotationStatus = 'pending' | 'resolved';

export type AnnotationTargetType = 'image' | 'link';

export interface HypothesisItem {
  id: string;
  text: string;
  verdict: HypothesisVerdict;
  verdictNote: string;
}

export interface MaterialImageItem {
  id: string;
  url: string;
  caption: string;
}

export interface Annotation {
  id: string;
  inspirationId: string;
  targetType: AnnotationTargetType;
  targetId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  assigneeName: string;
  status: AnnotationStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface Inspiration {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  festival: string;
  targetAudience: string;
  referenceLinks: string[];
  materialImages: MaterialImageItem[];
  estimatedCost: number;
  status: InspirationStatus;
  feasibilityScore: number | null;
  tags: string[];
  relatedProducts: string[];
  hypotheses: string[];
  hypothesisItems: HypothesisItem[];
  sourceUrl: string;
  isDraft: boolean;
  isBundle?: boolean;
  bundleChildIds?: string[];
  likes: number;
  isLiked: boolean;
  favorites: number;
  isFavorited: boolean;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Comment {
  id: string;
  inspirationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface SimilarCase {
  id: string;
  inspirationId: string;
  title: string;
  description: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

export interface Metrics {
  views: number;
  engagement: number;
  conversion: number;
  gmv: number;
}

export interface Experiment {
  id: string;
  inspirationId: string;
  title: string;
  scheduledTime: string;
  anchorId: string;
  anchorName: string;
  hypothesisIds: string[];
  expectedMetrics: Metrics;
  actualMetrics?: Metrics;
  status: ExperimentStatus;
  createdAt: string;
}

export interface Issue {
  id: string;
  description: string;
  severity: Severity;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

export interface RetrospectiveData {
  id: string;
  experimentId: string;
  issues: Issue[];
  actionItems: ActionItem[];
  hypothesisVerdicts: Array<{
    hypothesisId: string;
    hypothesisText: string;
    verdict: HypothesisVerdict;
    note: string;
  }>;
  summary: string;
  createdAt: string;
}

export interface Anchor {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
}
