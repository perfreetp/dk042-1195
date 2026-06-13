import { useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Calendar, Users, DollarSign, Star, ExternalLink } from 'lucide-react';
import type { Inspiration } from '@/types';
import { useAppStore } from '@/store';
import { formatCurrency, getStatusText, getStatusColor, getRelativeTime } from '@/utils/helpers';

interface InspirationCardProps {
  inspiration: Inspiration;
  delay?: number;
}

export function InspirationCard({ inspiration, delay = 0 }: InspirationCardProps) {
  const navigate = useNavigate();
  const toggleLike = useAppStore((state) => state.toggleLike);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(inspiration.id);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(inspiration.id);
  };

  return (
    <div
      className="card overflow-hidden group cursor-pointer animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => navigate(`/inspiration/${inspiration.id}`)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {inspiration.coverImage ? (
          <img
            src={inspiration.coverImage}
            alt={inspiration.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span className="text-4xl">💡</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {inspiration.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag-indigo backdrop-blur-sm bg-white/80">
                {tag}
              </span>
            ))}
          </div>
          <span className={`${getStatusColor(inspiration.status)} backdrop-blur-sm bg-white/80`}>
            {getStatusText(inspiration.status)}
          </span>
        </div>
        {inspiration.feasibilityScore !== null && (
          <div className="absolute top-3 right-3 hidden">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400/90 backdrop-blur-sm">
              <Star className="w-3 h-3 text-white fill-white" />
              <span className="text-xs font-bold text-white">{inspiration.feasibilityScore}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-base mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
          {inspiration.title}
        </h3>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{inspiration.description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {inspiration.festival && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-brand-secondary" />
              <span>{inspiration.festival}</span>
            </div>
          )}
          {inspiration.targetAudience && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate max-w-[120px]">{inspiration.targetAudience}</span>
            </div>
          )}
          {inspiration.estimatedCost > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>{formatCurrency(inspiration.estimatedCost)}</span>
            </div>
          )}
        </div>

        {inspiration.feasibilityScore !== null && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-slate-700">可行性评分 {inspiration.feasibilityScore}/10</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${inspiration.feasibilityScore * 10}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <img
              src={inspiration.creatorAvatar}
              alt={inspiration.creatorName}
              className="w-7 h-7 rounded-full bg-indigo-100"
            />
            <div>
              <p className="text-xs font-medium text-slate-700">{inspiration.creatorName}</p>
              <p className="text-xs text-slate-400">{getRelativeTime(inspiration.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                inspiration.isLiked
                  ? 'text-rose-500 bg-rose-50'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${inspiration.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{inspiration.likes}</span>
            </button>
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                inspiration.isFavorited
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${inspiration.isFavorited ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{inspiration.favorites}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
