import React, { useEffect, useState } from 'react';
import { ArrowRight, Award, Check, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../lib/api';
import type { Product, Review } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';

export function HomePage() {
  const { settings, navigate, showToast } = useStore();
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestProducts, setBestProducts] = useState<Product[]>([]);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'bestsellers' | 'promotions'>('bestsellers');
  const [loading, setLoading] = useState(true);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterBotField, setNewsletterBotField] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      apiRequest<Product[]>('/api/products?isNew=1'),
      apiRequest<Product[]>('/api/products?bestseller=1'),
      apiRequest<Product[]>('/api/products?promo=1'),
      apiRequest<Review[]>('/api/reviews'),
    ])
      .then(([n, b, p, r]) => {
        if (!active) return;
        setNewProducts(n.slice(0, 3));
        setBestProducts(b.slice(0, 3));
        setPromoProducts(p.slice(0, 3));
        setReviews(r.slice(0, 3));
      })
      .catch(() => {
        // graceful fallback
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubmitting(true);
    try {
      const res = await apiRequest<{ ok: boolean; message: string }>('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail.trim(), website: newsletterBotField }),
      });
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur d’inscription', 'error');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  const showcaseList = activeShowcaseTab === 'bestsellers' ? bestProducts : promoProducts;

  return (
    <div className="bg-[#FAF8F5]">
      {/* 1. Hero Split Editorial Showcase */}
      <section className="border-b border-[#E6DFD3]">
        <div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 px-4 sm:px-8 lg:px-12 py-14 lg:py-24 flex flex-col justify-center space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#946F2B] font-medium">
              Casablanca · {settings?.slogan || '« Le style dans chaque regard. »'}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#111111] leading-[1.08] tracking-tight [text-wrap:balance]">
              {settings?.heroTitle || 'Révélez votre élégance, un regard à la fois.'}
            </h1>
            <p className="text-base text-[#27272A]/80 leading-relaxed max-w-xl">
              {settings?.heroSubtitle ||
                'Maison d’optique contemporaine au cœur du Triangle d’Or de Casablanca. Montures d’artisanat en acétate italien et titane japonais.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/boutique')}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Découvrir la collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/promotions')}
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#111111]/25 text-[#111111] text-xs font-semibold uppercase tracking-[0.12em] hover:border-[#111111] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Offres privilèges</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#F2EDE4] min-h-[340px] lg:min-h-[540px] relative overflow-hidden">
            <SmartImage
              src={settings?.heroBannerUrl || '/src/assets/images/hero_elegance_casa_1795271503079.jpg'}
              alt="Collection ÉLÉGANCE CASA à Casablanca"
              className="w-full h-full lg:h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Section Nouveautés */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium mb-2">
              Arrivages de saison
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#111111]">
              Nouveautés de l’Atelier
            </h2>
          </div>
          <a
            href="/boutique?isNew=1"
            onClick={(e) => {
              e.preventDefault();
              navigate('/boutique?isNew=1');
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111] hover:text-[#946F2B] whitespace-nowrap shrink-0"
          >
            <span>Voir toutes les nouveautés</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-[400px] bg-[#F2EDE4]/60 border border-[#E6DFD3] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Section Meilleures Ventes & Promotions */}
      <section className="bg-[#F2EDE4]/55 border-y border-[#E6DFD3]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium mb-2">
                Sélection ÉLÉGANCE CASA
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#111111]">
                {activeShowcaseTab === 'bestsellers'
                  ? 'Meilleures Ventes'
                  : 'Promotions Privilèges'}
              </h2>
            </div>

            <div className="inline-flex items-center p-1 bg-[#FAF8F5] border border-[#E6DFD3]">
              <button
                type="button"
                onClick={() => setActiveShowcaseTab('bestsellers')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeShowcaseTab === 'bestsellers'
                    ? 'bg-[#111111] text-[#FAF8F5]'
                    : 'text-[#27272A] hover:text-[#111111]'
                }`}
              >
                Meilleures ventes
              </button>
              <button
                type="button"
                onClick={() => setActiveShowcaseTab('promotions')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeShowcaseTab === 'promotions'
                    ? 'bg-[#111111] text-[#FAF8F5]'
                    : 'text-[#27272A] hover:text-[#111111]'
                }`}
              >
                Promotions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {showcaseList.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() =>
                navigate(activeShowcaseTab === 'promotions' ? '/promotions' : '/boutique')
              }
              className="inline-flex items-center gap-2 px-7 py-3 border border-[#111111] text-[#111111] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#111111] hover:text-[#FAF8F5] transition-colors cursor-pointer"
            >
              <span>
                {activeShowcaseTab === 'promotions'
                  ? 'Explorer toutes les promotions'
                  : 'Parcourir tout le catalogue'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Avantages de la boutique & Atelier Casablanca */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 bg-[#F2EDE4] overflow-hidden min-h-[320px]">
            <SmartImage
              src="/src/assets/images/atelier_casablanca_1795271508487.jpg"
              alt="Boutique ÉLÉGANCE CASA Boulevard d'Anfa"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
                Savoir-faire & Engagements
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#111111]">
                L’exigence optique au cœur de Casablanca
              </h2>
              <p className="text-sm sm:text-base text-[#27272A]/80 leading-relaxed">
                {settings?.aboutText}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="p-5 bg-white border border-[#E6DFD3] space-y-2">
                <Truck className="w-5 h-5 text-[#946F2B]" />
                <h3 className="font-serif text-lg font-semibold text-[#111111]">
                  Livraison Express Maroc
                </h3>
                <p className="text-xs text-[#27272A]/75 leading-relaxed">
                  24h à Casablanca et 24–48h partout au Maroc. Offerte dès{' '}
                  <span className="tabular-nums font-medium">
                    {settings?.freeShippingThresholdMad ?? 1200} DH
                  </span>
                  .
                </p>
              </div>

              <div className="p-5 bg-white border border-[#E6DFD3] space-y-2">
                <ShieldCheck className="w-5 h-5 text-[#946F2B]" />
                <h3 className="font-serif text-lg font-semibold text-[#111111]">
                  Paiement à la livraison
                </h3>
                <p className="text-xs text-[#27272A]/75 leading-relaxed">
                  Vérifiez votre monture à réception et réglez en toute sérénité au livreur.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#E6DFD3] space-y-2">
                <Award className="w-5 h-5 text-[#946F2B]" />
                <h3 className="font-serif text-lg font-semibold text-[#111111]">
                  Matériaux Certifiés
                </h3>
                <p className="text-xs text-[#27272A]/75 leading-relaxed">
                  Acétate italien, titane japonais et verres filtrant 100 % des UV400.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#E6DFD3] space-y-2">
                <Check className="w-5 h-5 text-[#946F2B]" />
                <h3 className="font-serif text-lg font-semibold text-[#111111]">
                  Ajustage en Boutique
                </h3>
                <p className="text-xs text-[#27272A]/75 leading-relaxed">
                  Réglage personnalisé offert dans notre salon du Boulevard d’Anfa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Avis Clients & Newsletter */}
      <section className="border-t border-[#E6DFD3] bg-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-16">
          <div>
            <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
                Témoignages vérifiés
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#111111]">
                La confiance de nos clients au Maroc
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((rev) => (
                <blockquote
                  key={rev.id}
                  className="p-6 bg-[#FAF8F5] border border-[#E6DFD3] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="text-[#B68D40] text-sm tracking-widest" aria-label={`${rev.rating} sur 5`}>
                      {'★'.repeat(rev.rating)}
                    </div>
                    <p className="text-sm text-[#27272A] leading-relaxed">« {rev.comment} »</p>
                  </div>
                  <footer className="text-xs text-[#27272A]/70 pt-3 border-t border-[#E6DFD3]">
                    <strong className="text-[#111111] font-semibold">{rev.authorName}</strong> · {rev.city}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-[#111111] text-[#FAF8F5] px-6 sm:px-12 py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-lg space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-[#B68D40]">
                Cercle Privé ÉLÉGANCE CASA
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold">
                Recevez nos avant-premières & éditions limitées
              </h3>
              <p className="text-xs text-[#E6DFD3]/75">
                Nouvelles collections casablancaises et invitations privées, sans courrier indésirable.
              </p>
            </div>

            {newsletterSuccess ? (
              <div className="text-sm text-[#B68D40] font-medium">
                Inscription confirmée. Bienvenue dans le cercle ÉLÉGANCE CASA.
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 min-w-0 lg:min-w-[420px]">
                <input
                  type="text"
                  name="website"
                  value={newsletterBotField}
                  onChange={(e) => setNewsletterBotField(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="votre@email.ma"
                  className="flex-1 px-4 py-3 bg-[#27272A] border border-[#27272A] text-sm text-[#FAF8F5] placeholder:text-[#E6DFD3]/45 focus:outline-none focus:border-[#B68D40]"
                />
                <button
                  type="submit"
                  disabled={newsletterSubmitting}
                  className="px-6 py-3 bg-[#B68D40] text-[#111111] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {newsletterSubmitting ? 'Envoi...' : 'S’inscrire'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
