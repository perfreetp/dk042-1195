import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Bookmark, Calendar, Users, DollarSign, Link, Image,
  Star, Tag, ShoppingBag, Lightbulb, MessageCircle, Send, Plus, X,
  ExternalLink, Clock, CheckCircle, User, TrendingUp, FlaskConical, Link2,
  Upload, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  formatCurrency, formatDateTime, getStatusText, getStatusColor,
  getRelativeTime, cn, getVerdictText, getVerdictColor, fileToDataUrl, generateId
} from '@/utils/helpers';
import type { MaterialImageItem } from '@/types';

function ImageFallback() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-12 h-12 text-slate-300"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function ThumbnailImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);
  return hasError ? (
    <div className="w-full h-full flex items-center justify-center bg-slate-50">
      <ImageFallback />
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function LargeImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);
  return hasError ? (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
      <ImageFallback />
      <p className="text-sm">图片加载失败</p>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className="max-w-full max-h-full object-contain"
      onError={() => setHasError(true)}
    />
  );
}

export function InspirationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    inspirations, comments, similarCases, products, experiments,
    toggleLike, toggleFavorite, addComment, addSimilarCase, updateInspiration,
    updateImageCaption
  } = useAppStore();

  const [commentText, setCommentText] = useState('');
  const [newCase, setNewCase] = useState({ title: '', description: '', url: '' });
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [hypothesisInput, setHypothesisInput] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inspiration = useMemo(
    () => inspirations.find((i) => i.id === id),
    [inspirations, id]
  );

  const inspirationComments = useMemo(
    () => comments.filter((c) => c.inspirationId === id),
    [comments, id]
  );

  const inspirationCases = useMemo(
    () => similarCases.filter((c) => c.inspirationId === id),
    [similarCases, id]
  );

  const relatedExperiments = useMemo(
    () => experiments.filter((e) => e.inspirationId === id),
    [experiments, id]
  );

  const relatedProducts = useMemo(
    () => products.filter((p) => inspiration?.relatedProducts.includes(p.id)),
    [products, inspiration]
  );

  const materialImages: MaterialImageItem[] = useMemo(() => {
    if (!inspiration) return [];
    return inspiration.materialImages.map((item) => {
      if (typeof item === 'string') {
        return { id: `img-${generateId()}`, url: item, caption: '' };
      }
      return item;
    });
  }, [inspiration]);

  const isGalleryOpen = galleryIndex !== null;

  useEffect(() => {
    if (!isGalleryOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGalleryIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setGalleryIndex((prev) => {
          if (prev === null) return prev;
          return prev > 0 ? prev - 1 : materialImages.length - 1;
        });
      } else if (e.key === 'ArrowRight') {
        setGalleryIndex((prev) => {
          if (prev === null) return prev;
          return prev < materialImages.length - 1 ? prev + 1 : 0;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, materialImages.length]);

  useEffect(() => {
    if (galleryIndex !== null && materialImages[galleryIndex]) {
      setEditingCaption(materialImages[galleryIndex].caption);
    }
  }, [galleryIndex, materialImages]);

  useEffect(() => {
    if (isGalleryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isGalleryOpen]);

  if (!inspiration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-2">灵感不存在</h2>
          <button onClick={() => navigate('/')} className="btn-secondary">返回灵感广场</button>
        </div>
      </div>
    );
  }

  const hypothesisList = inspiration.hypothesisItems.length > 0
    ? inspiration.hypothesisItems.map((h, idx) => ({
        id: h.id || `h-${idx}`,
        text: h.text,
        verdict: h.verdict as string | undefined,
      }))
    : inspiration.hypotheses.map((h, idx) => ({
        id: `h-${idx}`,
        text: h,
        verdict: undefined as string | undefined,
      }));

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addComment(inspiration.id, commentText);
    setCommentText('');
  };

  const handleAddCase = () => {
    if (!newCase.title.trim()) return;
    addSimilarCase(inspiration.id, newCase);
    setNewCase({ title: '', description: '', url: '' });
    setShowCaseForm(false);
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || inspiration.tags.includes(tagInput.trim())) return;
    updateInspiration(inspiration.id, { tags: [...inspiration.tags, tagInput.trim()] });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    updateInspiration(inspiration.id, { tags: inspiration.tags.filter((t) => t !== tag) });
  };

  const handleAddHypothesis = () => {
    if (!hypothesisInput.trim()) return;
    const newId = `h-${Date.now()}`;
    updateInspiration(inspiration.id, {
      hypotheses: [...inspiration.hypotheses, hypothesisInput.trim()],
      hypothesisItems: [...inspiration.hypothesisItems, { id: newId, text: hypothesisInput.trim(), verdict: 'pending' as const, verdictNote: '' }],
    });
    setHypothesisInput('');
  };

  const handleRemoveHypothesis = (idx: number) => {
    updateInspiration(inspiration.id, {
      hypotheses: inspiration.hypotheses.filter((_, i) => i !== idx),
      hypothesisItems: inspiration.hypothesisItems.length > idx
        ? inspiration.hypothesisItems.filter((_, i) => i !== idx)
        : inspiration.hypothesisItems,
    });
  };

  const handleSaveScore = () => {
    if (score !== null) {
      updateInspiration(inspiration.id, { feasibilityScore: score });
    }
  };

  const handleToggleProduct = (productId: string) => {
    const newSelected = selectedProducts.includes(productId)
      ? selectedProducts.filter((id) => id !== productId)
      : [...selectedProducts, productId];
    setSelectedProducts(newSelected);
  };

  const handleSaveProducts = () => {
    updateInspiration(inspiration.id, { relatedProducts: selectedProducts });
    setShowProductPicker(false);
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    updateInspiration(inspiration.id, { referenceLinks: [...inspiration.referenceLinks, linkInput.trim()] });
    setLinkInput('');
  };

  const handleRemoveLink = (idx: number) => {
    updateInspiration(inspiration.id, { referenceLinks: inspiration.referenceLinks.filter((_, i) => i !== idx) });
  };

  const handleAddImage = () => {
    if (!imageInput.trim()) return;
    const newImages: MaterialImageItem[] = [
      ...materialImages,
      { id: `img-${generateId()}`, url: imageInput.trim(), caption: '' }
    ];
    updateInspiration(inspiration.id, { materialImages: newImages });
    setImageInput('');
  };

  const handleRemoveImage = (imageId: string) => {
    const newImages = materialImages.filter((m) => m.id !== imageId);
    updateInspiration(inspiration.id, { materialImages: newImages });
    if (galleryIndex !== null) {
      const idx = materialImages.findIndex((m) => m.id === imageId);
      if (idx === galleryIndex) {
        setGalleryIndex(null);
      } else if (idx < galleryIndex) {
        setGalleryIndex(galleryIndex - 1);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems: MaterialImageItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        newItems.push({
          id: `img-${generateId()}`,
          url: dataUrl,
          caption: ''
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }
    if (newItems.length > 0) {
      const updatedImages: MaterialImageItem[] = [...materialImages, ...newItems];
      updateInspiration(inspiration.id, { materialImages: updatedImages });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openGallery = (idx: number) => {
    setGalleryIndex(idx);
    setEditingCaption(materialImages[idx]?.caption ?? '');
  };

  const closeGallery = () => {
    setGalleryIndex(null);
  };

  const prevImage = () => {
    if (galleryIndex === null) return;
    setGalleryIndex(galleryIndex > 0 ? galleryIndex - 1 : materialImages.length - 1);
  };

  const nextImage = () => {
    if (galleryIndex === null) return;
    setGalleryIndex(galleryIndex < materialImages.length - 1 ? galleryIndex + 1 : 0);
  };

  const handleCaptionBlur = () => {
    if (galleryIndex === null) return;
    const currentImage = materialImages[galleryIndex];
    if (!currentImage) return;
    if (currentImage.caption !== editingCaption) {
      updateImageCaption(inspiration.id, currentImage.id, editingCaption);
    }
  };

  const handleCaptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCaptionBlur();
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const currentGalleryImage = galleryIndex !== null ? materialImages[galleryIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">{inspiration.title}</h1>
                <span className={getStatusColor(inspiration.status)}>{getStatusText(inspiration.status)}</span>
              </div>
              <p className="text-xs text-slate-500">创建于 {formatDateTime(inspiration.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLike(inspiration.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200',
                inspiration.isLiked
                  ? 'text-rose-500 bg-rose-50'
                  : 'text-slate-600 hover:bg-rose-50 hover:text-rose-500'
              )}
            >
              <Heart className={`w-5 h-5 ${inspiration.isLiked ? 'fill-current' : ''}`} />
              {inspiration.likes}
            </button>
            <button
              onClick={() => toggleFavorite(inspiration.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200',
                inspiration.isFavorited
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-500'
              )}
            >
              <Bookmark className={`w-5 h-5 ${inspiration.isFavorited ? 'fill-current' : ''}`} />
              {inspiration.favorites}
            </button>
            {relatedExperiments.length === 0 && (
              <button
                onClick={() => navigate('/experiments')}
                className="btn-primary gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                创建实验
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="aspect-[21/9] bg-slate-100 relative">
              {inspiration.coverImage ? (
                <img src={inspiration.coverImage} alt={inspiration.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <Lightbulb className="w-20 h-20 text-white/80" />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {inspiration.tags.map((tag) => (
                  <span key={tag} className="tag-indigo">{tag}</span>
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed text-base mb-6">{inspiration.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inspiration.festival && (
                  <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                    <Calendar className="w-5 h-5 text-brand-secondary mb-2" />
                    <p className="text-xs text-slate-500">适用节日</p>
                    <p className="font-semibold text-slate-700 text-sm">{inspiration.festival}</p>
                  </div>
                )}
                {inspiration.targetAudience && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <Users className="w-5 h-5 text-indigo-500 mb-2" />
                    <p className="text-xs text-slate-500">目标人群</p>
                    <p className="font-semibold text-slate-700 text-sm line-clamp-2">{inspiration.targetAudience}</p>
                  </div>
                )}
                {inspiration.estimatedCost > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <DollarSign className="w-5 h-5 text-emerald-500 mb-2" />
                    <p className="text-xs text-slate-500">预估成本</p>
                    <p className="font-semibold text-slate-700 text-sm">{formatCurrency(inspiration.estimatedCost)}</p>
                  </div>
                )}
                {inspiration.feasibilityScore !== null && (
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500 mb-2" />
                    <p className="text-xs text-slate-500">可行性评分</p>
                    <p className="font-bold text-slate-700 text-lg">{inspiration.feasibilityScore}<span className="text-xs font-normal">/10</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <Image className="w-5 h-5 text-indigo-500" />
                素材图片
                {materialImages.length > 0 && (
                  <span className="text-sm font-normal text-slate-400">({materialImages.length})</span>
                )}
              </h3>
              <button
                onClick={handleUploadClick}
                className="btn-ghost text-sm py-1.5 gap-1.5"
              >
                <Upload className="w-4 h-4" />
                上传图片
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            {materialImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {materialImages.map((img, idx) => (
                  <div key={img.id} className="group">
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer ring-2 ring-transparent hover:ring-indigo-300 transition-all"
                      onClick={() => openGallery(idx)}
                    >
                      <ThumbnailImage src={img.url} alt={img.caption || `素材${idx + 1}`} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(img.id);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {img.caption && (
                      <p
                        className="mt-1.5 text-xs text-slate-500 truncate"
                        title={img.caption}
                      >
                        {img.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                placeholder="输入图片 URL"
                className="input-field text-sm py-2"
              />
              <button onClick={handleAddImage} className="btn-ghost px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <Link2 className="w-5 h-5 text-indigo-500" />
                参考链接
              </h3>
            </div>
            <div className="space-y-2 mb-4">
              {inspiration.referenceLinks.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4">暂无参考链接，点击下方添加</p>
              ) : (
                inspiration.referenceLinks.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 group transition-colors">
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-slate-600 hover:text-brand-primary truncate flex-1"
                    >
                      {url}
                    </a>
                    <button
                      onClick={() => handleRemoveLink(idx)}
                      className="text-slate-300 hover:text-rose-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                placeholder="输入参考链接 URL"
                className="input-field text-sm py-2"
              />
              <button onClick={handleAddLink} className="btn-ghost px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                关联商品 ({relatedProducts.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((product) => (
                  <div key={product.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="aspect-square rounded-lg bg-white mb-2 overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.category}</p>
                    <p className="text-sm font-bold text-brand-secondary mt-1">{formatCurrency(product.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hypothesisList.length > 0 && (
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                待验证假设
              </h3>
              <div className="space-y-2">
                {hypothesisList.map((h, idx) => (
                  <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-slate-700">{h.text}</p>
                        {h.verdict && (
                          <span className={getVerdictColor(h.verdict)}>{getVerdictText(h.verdict)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate('/experiments', { state: { inspirationId: inspiration.id, hypothesisText: h.text, hypothesisId: h.id } })}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <FlaskConical className="w-3.5 h-3.5" /> 创建实验
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <MessageCircle className="w-5 h-5 text-indigo-500" />
              团队讨论 ({inspirationComments.length})
            </h3>

            <div className="flex gap-3 mb-6">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=current"
                alt="我"
                className="w-10 h-10 rounded-full bg-indigo-100 shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="说说你的看法，补充案例或提出建议..."
                  rows={3}
                  className="input-field resize-none mb-2"
                />
                <div className="flex justify-end">
                  <button onClick={handleSubmitComment} className="btn-secondary gap-2">
                    <Send className="w-4 h-4" />
                    发表评论
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {inspirationComments.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">还没有评论，来发表第一条吧~</p>
              ) : (
                inspirationComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 animate-slide-up">
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className="w-10 h-10 rounded-full bg-indigo-100 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-700 text-sm">{comment.userName}</span>
                        <span className="text-xs text-slate-400">{getRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <Link className="w-5 h-5 text-indigo-500" />
                相似案例参考
              </h3>
              <button
                onClick={() => setShowCaseForm(!showCaseForm)}
                className="btn-ghost text-sm py-1.5 gap-1"
              >
                <Plus className="w-4 h-4" />
                补充案例
              </button>
            </div>

            {showCaseForm && (
              <div className="p-4 rounded-2xl bg-slate-50 mb-4 animate-slide-up">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="案例标题"
                    className="input-field"
                  />
                  <textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    placeholder="案例描述"
                    rows={2}
                    className="input-field resize-none"
                  />
                  <input
                    type="text"
                    value={newCase.url}
                    onChange={(e) => setNewCase({ ...newCase, url: e.target.value })}
                    placeholder="案例链接"
                    className="input-field"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCaseForm(false)} className="btn-ghost text-sm py-1.5">取消</button>
                    <button onClick={handleAddCase} className="btn-secondary text-sm py-1.5">添加</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {inspirationCases.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">暂无相似案例，欢迎补充</p>
              ) : (
                inspirationCases.map((sc) => (
                  <a
                    key={sc.id}
                    href={sc.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-700 text-sm">{sc.title}</p>
                      {sc.url && <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{sc.description}</p>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={inspiration.creatorAvatar}
                alt={inspiration.creatorName}
                className="w-12 h-12 rounded-full bg-indigo-100"
              />
              <div>
                <p className="font-semibold text-slate-700">{inspiration.creatorName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getRelativeTime(inspiration.createdAt)} 创建
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              可行性评分
            </h4>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-bold transition-all',
                    (score ?? inspiration.feasibilityScore ?? 0) >= n
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-soft'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            {(score !== null && score !== inspiration.feasibilityScore) && (
              <button onClick={handleSaveScore} className="btn-secondary w-full text-sm py-2">
                保存评分
              </button>
            )}
          </div>

          <div className="card p-5">
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <Tag className="w-5 h-5 text-indigo-500" />
              标签管理
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {inspiration.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="添加标签"
                className="input-field text-sm py-2"
              />
              <button onClick={handleAddTag} className="btn-ghost px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <ShoppingBag className="w-5 h-5 text-indigo-500" />
              关联商品池
            </h4>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">已关联 {relatedProducts.length} 个商品</span>
              <button
                onClick={() => {
                  setSelectedProducts([...inspiration.relatedProducts]);
                  setShowProductPicker(!showProductPicker);
                }}
                className="text-xs font-medium text-brand-primary hover:underline"
              >
                {showProductPicker ? '收起' : '编辑'}
              </button>
            </div>
            {showProductPicker && (
              <div className="space-y-3 animate-slide-up">
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all',
                        selectedProducts.includes(product.id)
                          ? 'bg-indigo-50 border-2 border-indigo-300'
                          : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{product.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(product.price)}</p>
                      </div>
                      {selectedProducts.includes(product.id) && (
                        <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <button onClick={handleSaveProducts} className="btn-secondary w-full text-sm py-2">
                  保存商品
                </button>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              待验证假设
            </h4>
            <div className="space-y-2 mb-3">
              {hypothesisList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">暂无假设</p>
              ) : (
                hypothesisList.map((h, idx) => (
                  <div key={h.id} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs text-slate-600">{h.text}</p>
                        {h.verdict && (
                          <span className={getVerdictColor(h.verdict)}>{getVerdictText(h.verdict)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate('/experiments', { state: { inspirationId: inspiration.id, hypothesisText: h.text, hypothesisId: h.id } })}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <FlaskConical className="w-3 h-3" /> 创建实验
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveHypothesis(idx)}
                      className="text-slate-400 hover:text-rose-500 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={hypothesisInput}
                onChange={(e) => setHypothesisInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHypothesis())}
                placeholder="添加待验证假设"
                className="input-field text-sm py-2"
              />
              <button onClick={handleAddHypothesis} className="btn-ghost px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {relatedExperiments.length > 0 && (
            <div className="card p-5">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                关联实验
              </h4>
              <div className="space-y-3">
                {relatedExperiments.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() =>
                      exp.status === 'completed'
                        ? navigate(`/retrospective/${exp.id}`)
                        : navigate('/experiments')
                    }
                    className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-700 text-sm">{exp.title}</p>
                      <span className={getStatusColor(exp.status)}>{getStatusText(exp.status)}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {exp.anchorName} · {formatDateTime(exp.scheduledTime)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isGalleryOpen && currentGalleryImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeGallery}
        >
          <button
            onClick={closeGallery}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {materialImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div
            className="flex flex-col items-center w-full h-full px-20 py-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
              <LargeImage
                src={currentGalleryImage.url}
                alt={currentGalleryImage.caption || '大图'}
              />
            </div>

            <div className="w-full max-w-2xl mt-6 space-y-3">
              <div className="text-center text-white/90 text-sm">
                {galleryIndex !== null && (
                  <span className="text-white/60 font-medium">
                    {galleryIndex + 1} / {materialImages.length}
                  </span>
                )}
              </div>

              {currentGalleryImage.caption && (
                <p className="text-center text-white/80 text-base font-medium">
                  {currentGalleryImage.caption}
                </p>
              )}

              <div className="flex justify-center">
                <input
                  type="text"
                  value={editingCaption}
                  onChange={(e) => setEditingCaption(e.target.value)}
                  onBlur={handleCaptionBlur}
                  onKeyDown={handleCaptionKeyDown}
                  placeholder="添加图片说明... (按 Enter 保存)"
                  className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
