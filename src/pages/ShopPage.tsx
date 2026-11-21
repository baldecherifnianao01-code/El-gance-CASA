import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../lib/api';
import type { GenderFilter, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

interface ShopPageProps {
  initialCategory?: string;
  initialPromoOnly?: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
}

export function ShopPage({
  initialCategory = 'all',
  initialPromoOnly = false,
  pageTitle = 'La Boutique',
  pageSubtitle = 'Montures optiques et solaires façonnées avec exigence pour le climat et le style marocains.',
}: ShopPageProps) {
  const { categories, currentPath } = useStore();

  const urlParams = useMemo(() => {
    const qIndex = currentPath.indexOf('?');
    return new URLSearchParams(qIndex >= 0 ? currentPath.slice(qIndex + 1) : '');
  }, [currentPath]);

  const [category, setCategory] = useState<string>(initialCategory);
  const [gender, setGender] = useState<GenderFilter | 'Tous'>('Tous');
  const [promoOnly, setPromoOnly] = useState<boolean>(initialPromoOnly);
  const [newOnly, setNewOnly] = useState<boolean>(urlParams.get('isNew') === '1');
  const [sort, setSort] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');
  const [search, setSearch] = useState<string>(urlParams.get('search') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCategory(initialCategory);
    setPromoOnly(initialPromoOnly);
  }, [initialCategory, initialPromoOnly]);

  useEffect(() => {
    const qSearch = urlParams.get('search');
    if (qSearch !== null) setSearch(qSearch);
    if (urlParams.get('isNew') === '1') setNewOnly(true);
  }, [urlParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (gender !== 'Tous') params.set('gender', gender);
    if (promoOnly) params.set('promo', '1');
    if (newOnly) params.set('isNew', '1');
    if (search.trim()) params.set('search', search.trim());
    if (sort !== 'featured') params.set('sort', sort);

    apiRequest<Product[]>(`/api/products?${params.toString()}`)
      .then((list) => {
        if (active) setProducts(list);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, gender, promoOnly, newOnly, sort, search]);

  const resetFilters = () => {
    setCategory(initialCategory);
    setGender('Tous');
    setPromoOnly(initialPromoOnly);
    setNewOnly(false);
    setSort('featured');
    setSearch('');
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[70vh]">
      {/* Page Header */}
      <div className="border-b border-[#E6DFD3] bg-[#F2EDE4]/50">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium mb-2">
            Collection ÉLÉGANCE CASA
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#111111]">
            {pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-[#27272A]/80 mt-3 max-w-2xl">
            {pageSubtitle}
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="border-b border-[#E6DFD3] bg-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category & Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === 'all'
                    ? 'bg-[#111111] text-[#FAF8F5]'
                    : 'bg-[#FAF8F5] text-[#27272A] border border-[#E6DFD3] hover:border-[#111111]'
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.slug)}
                  className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    category === cat.slug
                      ? 'bg-[#111111] text-[#FAF8F5]'
                      : 'bg-[#FAF8F5] text-[#27272A] border border-[#E6DFD3] hover:border-[#111111]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#27272A]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un modèle..."
                  className="w-full pl-9 pr-8 py-2 bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#27272A]/60 hover:text-[#111111] cursor-pointer"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                aria-label="Trier les produits"
                className="px-3.5 py-2 bg-[#FAF8F5] border border-[#E6DFD3] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
              >
                <option value="featured">Trier : Sélection</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="newest">Nouveautés d’abord</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Row: Gender + Nouveautés + Promotions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E6DFD3]/70">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#27272A]/70 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Genre :</span>
              </span>
              {(['Tous', 'Homme', 'Femme', 'Unisexe'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    gender === g
                      ? 'bg-[#B68D40]/15 text-[#946F2B] border border-[#B68D40]'
                      : 'text-[#27272A] border border-transparent hover:border-[#E6DFD3]'
                  }`}
                >
                  {g}
                </button>
              ))}

              <span className="text-[#E6DFD3] mx-1">|</span>

              <button
                type="button"
                onClick={() => setNewOnly((v) => !v)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  newOnly
                    ? 'bg-[#111111] text-[#FAF8F5] border-[#111111]'
                    : 'border-[#E6DFD3] text-[#27272A] hover:border-[#111111]'
                }`}
              >
                Nouveautés
              </button>

              <button
                type="button"
                onClick={() => setPromoOnly((v) => !v)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  promoOnly
                    ? 'bg-[#946F2B] text-[#FAF8F5] border-[#946F2B]'
                    : 'border-[#E6DFD3] text-[#27272A] hover:border-[#111111]'
                }`}
              >
                Promotions
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#27272A]/70">
              <span className="tabular-nums">
                {products.length} {products.length > 1 ? 'modèles trouvés' : 'modèle trouvé'}
              </span>
              {(category !== initialCategory ||
                gender !== 'Tous' ||
                promoOnly !== initialPromoOnly ||
                newOnly ||
                search) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[#946F2B] hover:underline font-medium cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-[400px] bg-[#F2EDE4]/60 border border-[#E6DFD3] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#E6DFD3] p-8 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#111111]">
              Aucune monture ne correspond à vos critères
            </h2>
            <p className="text-sm text-[#27272A]/75 max-w-md mx-auto">
              Essayez d’élargir vos filtres ou explorez l’ensemble de notre collection optique et solaire.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 bg-[#111111] text-[#FAF8F5] text-xs font-medium tracking-wide hover:bg-[#946F2B] cursor-pointer"
            >
              Afficher tout le catalogue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
