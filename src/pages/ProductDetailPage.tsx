import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Heart, MessageCircle, Minus, Plus, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiRequest, buildWhatsAppUrl, formatMad } from '../lib/api';
import type { Product, Review } from '../types';
import { SmartImage } from '../components/SmartImage';

interface ProductDetailPageProps {
  slugOrId: string;
}

export function ProductDetailPage({ slugOrId }: ProductDetailPageProps) {
  const { settings, addToCart, toggleFavorite, isFavorite, navigate, showToast } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Review submission form
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewCity, setReviewCity] = useState('Casablanca');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBot, setReviewBot] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    apiRequest<{ product: Product; reviews: Review[] }>(`/api/products/${encodeURIComponent(slugOrId)}`)
      .then((res) => {
        if (!active) return;
        setProduct(res.product);
        setReviews(res.reviews);
        setSelectedColor(res.product.colors[0] || res.product.color);
        setSelectedSize(res.product.sizes[0] || 'Standard');
        setActiveImageIdx(0);
        setQuantity(1);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 aspect-[4/3] bg-[#F2EDE4] animate-pulse" />
          <div className="lg:col-span-5 h-96 bg-[#F2EDE4]/60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-serif text-4xl font-semibold text-[#111111]">Modèle introuvable</h1>
        <p className="text-sm text-[#27272A]/75">
          Cette monture n’est plus disponible ou a été déplacée dans notre catalogue.
        </p>
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="px-6 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-medium uppercase tracking-wider cursor-pointer"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  const hasPromo = product.promoPriceMad !== null && product.promoPriceMad < product.priceMad;
  const activePrice = hasPromo ? product.promoPriceMad! : product.priceMad;
  const fav = isFavorite(product.id);
  const whatsappHref = buildWhatsAppUrl(
    settings?.whatsappNumber || '212661482090',
    `Bonjour ÉLÉGANCE CASA, je souhaite obtenir des renseignements sur le modèle « ${product.name} » (${formatMad(activePrice)}).`
  );

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
    navigate('/commande');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const created = await apiRequest<Review>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          authorName: reviewAuthor,
          city: reviewCity,
          rating: reviewRating,
          comment: reviewComment,
          website: reviewBot,
        }),
      });
      setReviews((prev) => [created, ...prev]);
      setReviewAuthor('');
      setReviewComment('');
      showToast('Merci ! Votre avis a été publié.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la publication.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#27272A]/75 hover:text-[#111111] mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </button>

        {/* Contiguous PDP Layout: Sticky Gallery Left / Purchase Module Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
            <div className="aspect-[4/3] bg-[#F2EDE4] border border-[#E6DFD3] overflow-hidden">
              <SmartImage
                src={product.images[activeImageIdx] || product.images[0]}
                alt={`${product.name} — vue ${activeImageIdx + 1}`}
                fallbackTitle={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`aspect-[4/3] bg-[#F2EDE4] border overflow-hidden cursor-pointer transition-all ${
                      activeImageIdx === idx
                        ? 'border-[#111111] ring-1 ring-[#111111]'
                        : 'border-[#E6DFD3] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SmartImage
                      src={imgUrl}
                      alt={`${product.name} miniature ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contiguous Purchase Module */}
          <div className="lg:col-span-5 bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[#946F2B]">
                <span>{product.brand}</span>
                <span>{product.categoryName}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#111111] leading-tight">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3 pt-1 tabular-nums">
                <span className="text-2xl font-semibold text-[#111111]">
                  {formatMad(activePrice)}
                </span>
                {hasPromo && (
                  <span className="text-base text-[#27272A]/50 line-through">
                    {formatMad(product.priceMad)}
                  </span>
                )}
                <span className="text-xs text-[#27272A]/65 ml-auto">
                  {product.stock > 0 ? (
                    <span className="text-[#166534] font-medium">
                      En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})
                    </span>
                  ) : (
                    <span className="text-[#991B1B] font-medium">Rupture de stock</span>
                  )}
                </span>
              </div>
            </div>

            <p className="text-sm text-[#27272A]/85 leading-relaxed">
              {product.description}
            </p>

            {/* Technical Specs */}
            <dl className="grid grid-cols-2 gap-y-2.5 gap-x-4 py-4 border-y border-[#E6DFD3] text-xs">
              <div>
                <dt className="text-[#27272A]/60">Marque</dt>
                <dd className="font-medium text-[#111111] mt-0.5">{product.brand}</dd>
              </div>
              <div>
                <dt className="text-[#27272A]/60">Genre</dt>
                <dd className="font-medium text-[#111111] mt-0.5">{product.gender}</dd>
              </div>
              <div>
                <dt className="text-[#27272A]/60">Matière</dt>
                <dd className="font-medium text-[#111111] mt-0.5">{product.material}</dd>
              </div>
              <div>
                <dt className="text-[#27272A]/60">Type de monture</dt>
                <dd className="font-medium text-[#111111] mt-0.5">{product.frameType}</dd>
              </div>
            </dl>

            {/* Color & Size Selectors */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-2">
                  Coloris : <span className="text-[#27272A]/75 font-normal">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3.5 py-2 text-xs border transition-colors cursor-pointer ${
                        selectedColor === c
                          ? 'border-[#111111] bg-[#111111] text-[#FAF8F5]'
                          : 'border-[#E6DFD3] bg-[#FAF8F5] text-[#27272A] hover:border-[#111111]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-2">
                  Taille / Calibre : <span className="text-[#27272A]/75 font-normal">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3.5 py-2 text-xs border font-mono transition-colors cursor-pointer ${
                        selectedSize === s
                          ? 'border-[#111111] bg-[#111111] text-[#FAF8F5]'
                          : 'border-[#E6DFD3] bg-[#FAF8F5] text-[#27272A] hover:border-[#111111]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity & Primary CTAs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-[#E6DFD3] bg-[#FAF8F5] h-11">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 h-full text-[#27272A] hover:text-[#111111] cursor-pointer"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-mono tabular-nums text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 h-full text-[#27272A] hover:text-[#111111] disabled:opacity-40 cursor-pointer"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product, quantity, selectedColor, selectedSize)}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] transition-colors disabled:bg-[#E6DFD3] disabled:text-[#27272A]/50 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  aria-label="Ajouter aux favoris"
                  className="h-11 w-11 flex items-center justify-center border border-[#E6DFD3] hover:border-[#111111] cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${fav ? 'fill-[#B68D40] text-[#B68D40]' : 'text-[#27272A]'}`} />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
                className="w-full h-11 bg-[#B68D40] text-[#111111] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] hover:text-[#FAF8F5] transition-colors disabled:opacity-40 cursor-pointer"
              >
                Acheter maintenant (Paiement à la livraison)
              </button>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 inline-flex items-center justify-center gap-2 border border-[#166534]/35 text-[#166534] text-xs font-medium hover:bg-[#166534]/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Demander un renseignement sur WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 space-y-2 text-xs text-[#27272A]/75">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#946F2B]" />
                <span>Expédition sous 24h depuis Casablanca · Étui & chamoisine offerts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#946F2B]" />
                <span>Échange facile sous 7 jours partout au Maroc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews Section */}
        <section className="mt-16 pt-12 border-t border-[#E6DFD3] grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif text-3xl font-semibold text-[#111111]">
              Avis clients ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-[#27272A]/75">
                Soyez le premier client à partager votre retour sur « {product.name} ».
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-5 bg-white border border-[#E6DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#111111]">
                        {r.authorName} · <span className="font-normal text-[#27272A]/70">{r.city}</span>
                      </span>
                      <span className="text-[#B68D40] text-xs">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-sm text-[#27272A]/85">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-[#E6DFD3] p-6 space-y-4">
            <h3 className="font-serif text-2xl font-semibold text-[#111111]">
              Laisser un avis
            </h3>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <input
                type="text"
                value={reviewBot}
                onChange={(e) => setReviewBot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="Votre nom"
                  className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                />
                <input
                  type="text"
                  value={reviewCity}
                  onChange={(e) => setReviewCity(e.target.value)}
                  placeholder="Ville (ex: Casablanca)"
                  className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#27272A]/75 mb-1">Note</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                >
                  <option value={5}>5 / 5 — Excellent</option>
                  <option value={4}>4 / 5 — Très satisfait</option>
                  <option value={3}>3 / 5 — Satisfait</option>
                  <option value={2}>2 / 5 — Moyen</option>
                  <option value={1}>1 / 5 — À améliorer</option>
                </select>
              </div>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Partagez votre impression sur le confort, la finition et la livraison..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] transition-colors cursor-pointer disabled:opacity-60"
              >
                {submittingReview ? 'Publication...' : 'Publier mon avis'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
