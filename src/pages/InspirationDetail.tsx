import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Bookmark, Calendar, Users, DollarSign, Link, Image,
  Star, Tag, ShoppingBag, Lightbulb, MessageCircle, Send, Plus, X,
  ExternalLink, Clock, CheckCircle, User, TrendingUp
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  formatCurrency, formatDateTime, getStatusText, getStatusColor,
  getRelativeTime, cn
} from '@/utils/helpers';

export function InspirationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    inspirations, comments, similarCases, products, experiments,
    toggleLike, toggleFavorite, addComment, addSimilarCase, updateInspiration
  } = useAppStore();

  const [commentText, setCommentText] = useState('');
  const [newCase, setNewCase] = useState({ title: '', description: '', url: '' });
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [hypothesisInput, setHypothesisInput] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);

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
    updateInspiration(inspiration.id, { hypotheses: [...inspiration.hypotheses, hypothesisInput.trim()] });
    setHypothesisInput('');
  };

  const handleRemoveHypothesis = (idx: number) => {
    updateInspiration(inspiration.id, {
      hypotheses: inspiration.hypotheses.filter((_, i) => i !== idx),
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

          {inspiration.materialImages.length > 0 && (
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                <Image className="w-5 h-5 text-indigo-500" />
                素材图片
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inspiration.materialImages.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img src={img} alt={`素材${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {inspiration.referenceLinks.length > 0 && (
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                <Link className="w-5 h-5 text-indigo-500" />
                参考链接
              </h3>
              <div className="space-y-2">
                {inspiration.referenceLinks.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-brand-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

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

          {inspiration.hypotheses.length > 0 && (
            <div className="card p-6">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                待验证假设
              </h3>
              <div className="space-y-2">
                {inspiration.hypotheses.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-600">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-slate-700">{h}</p>
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
              {inspiration.hypotheses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">暂无假设</p>
              ) : (
                inspiration.hypotheses.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50">
                    <p className="text-xs text-slate-600 flex-1">{h}</p>
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
    </div>
  );
}
