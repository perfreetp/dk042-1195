export type InspirationStatus = 'draft' | 'reviewing' | 'approved' | 'experimenting' | 'completed' | 'archived';

export type ExperimentStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export type Severity = 'low' | 'medium' | 'high';

export interface Inspiration {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  festival: string;
  targetAudience: string;
  referenceLinks: string[];
  materialImages: string[];
  estimatedCost: number;
  status: InspirationStatus;
  feasibilityScore: number | null;
  tags: string[];
  relatedProducts: string[];
  hypotheses: string[];
  likes: number;
  isLiked: boolean;
  favorites: number;
  isFavorited: boolean;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  createdAt: string;
  updatedAt: string;
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
  summary: string;
  createdAt: string;
}

export interface Anchor {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
}
