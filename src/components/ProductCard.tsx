import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad } from '../lib/api';
import type { Product } from '../types';
import { SmartImage } from './SmartImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleFavorite, isFavorite, navigate } = useStore();
  const fav = isFavorite(product.id);
  const hasPromo = product.promoPriceMad !== null && product.promoPriceMad < product.priceMad;
  const discountPct = hasPromo
    ? Math.round(((product.priceMad - (product.promoPriceMad ?? product.priceMad)) / product.priceMad) * 100)
    : 0;

  let statusText: string | null = null;
  if (product.stock <= 0) {
    statusText = 'Rupture de stock';
  } else if (hasPromo) {
    statusText = `Offre -${discountPct}%`;
  } else if (product.isNew) {
    statusText = 'Nouvelle édition';
  }

  return (
    <article className="group flex flex-col bg-white border border-[#E6DFD3] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(17,17,17,0.06)]">
      {/* Image showcase (65-75% visual focus) */}
      <div className="relative aspect-[4/3] bg-[#F2EDE4] overflow-hidden">
        <a
          href={`/produit/${product.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/produit/${product.slug}`);
          }}
          className="block w-full h-full"
        >
          <SmartImage
            src={product.images[0]}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </a>

        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-label={fav ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-[#FAF8F5]/90 backdrop-blur-sm border border-[#E6DFD3] transition-colors cursor-pointer ${
            fav ? 'text-[#946F2B]' : 'text-[#27272A]/70 hover:text-[#111111]'
          }`}
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-[#B68D40] text-[#B68D40]' : ''}`} />
        </button>
      </div>

      {/* Product body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          {/* Quiet unboxed metadata line */}
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.08em] text-[#27272A]/65">
            <span className="truncate">
              {product.categoryName} · {product.gender}
            </span>
            {statusText && (
              <span
                className={`shrink-0 font-medium ${
                  product.stock <= 0 ? 'text-[#991B1B]' : 'text-[#946F2B]'
                }`}
              >
                {statusText}
              </span>
            )}
          </div>

          <a
            href={`/produit/${product.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/produit/${product.slug}`);
            }}
            className="block"
          >
            <h3 className="font-serif text-xl font-semibold text-[#111111] leading-snug group-hover:text-[#946F2B] transition-colors">
              {product.name}
            </h3>
          </a>

          <p className="text-xs text-[#27272A]/70 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#E6DFD3]/70 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-base font-semibold text-[#111111]">
              {formatMad(hasPromo ? product.promoPriceMad! : product.priceMad)}
            </span>
            {hasPromo && (
              <span className="text-xs text-[#27272A]/50 line-through">
                {formatMad(product.priceMad)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => addToCart(product, 1)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors ${
              product.stock > 0
                ? 'bg-[#111111] text-[#FAF8F5] hover:bg-[#946F2B] cursor-pointer'
                : 'bg-[#E6DFD3] text-[#27272A]/50 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{product.stock > 0 ? 'Ajouter' : 'Épuisé'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
