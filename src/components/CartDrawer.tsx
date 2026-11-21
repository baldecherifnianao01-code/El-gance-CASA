import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad } from '../lib/api';
import { SmartImage } from './SmartImage';

export function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotalMad,
    settings,
    isCartDrawerOpen,
    setCartDrawerOpen,
    updateCartQty,
    removeFromCart,
    navigate,
  } = useStore();

  if (!isCartDrawerOpen) return null;

  const freeThreshold = settings?.freeShippingThresholdMad ?? 1200;
  const shippingFee = settings?.shippingFeeMad ?? 45;
  const qualifiesForFree = cartSubtotalMad >= freeThreshold || cartSubtotalMad === 0;
  const remainingForFree = Math.max(0, freeThreshold - cartSubtotalMad);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#111111]/45 backdrop-blur-[2px]"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside
        className="relative z-10 w-full max-w-md bg-[#FAF8F5] h-full flex flex-col border-l border-[#E6DFD3] shadow-2xl"
        aria-label="Panier"
      >
        <div className="px-6 py-5 border-b border-[#E6DFD3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#946F2B]" />
            <h2 className="font-serif text-2xl font-semibold text-[#111111]">
              Votre Panier ({cartCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            className="p-2 text-[#27272A]/70 hover:text-[#111111] cursor-pointer"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress note */}
        <div className="px-6 py-3 bg-[#F2EDE4] border-b border-[#E6DFD3] text-xs text-[#27272A]">
          {qualifiesForFree && cartCount > 0 ? (
            <span className="font-medium text-[#111111]">
              Livraison offerte partout au Maroc incluse avec votre commande.
            </span>
          ) : (
            <span>
              Plus que <strong className="tabular-nums">{formatMad(remainingForFree)}</strong> pour bénéficier de la livraison gratuite au Maroc.
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="font-serif text-2xl text-[#111111]">Votre panier est vide</p>
              <p className="text-sm text-[#27272A]/70 max-w-xs mx-auto">
                Explorez nos lunettes de soleil et montures optiques façonnées pour révéler votre style.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/boutique');
                }}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[#111111] text-[#FAF8F5] text-xs font-medium tracking-wide hover:bg-[#946F2B] transition-colors cursor-pointer"
              >
                Découvrir la boutique
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice =
                item.product.promoPriceMad !== null && item.product.promoPriceMad < item.product.priceMad
                  ? item.product.promoPriceMad
                  : item.product.priceMad;

              return (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-4 pb-5 border-b border-[#E6DFD3]"
                >
                  <div className="w-24 h-20 bg-[#F2EDE4] shrink-0 overflow-hidden">
                    <SmartImage
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={`/produit/${item.product.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setCartDrawerOpen(false);
                            navigate(`/produit/${item.product.slug}`);
                          }}
                          className="font-serif text-lg font-semibold text-[#111111] leading-tight hover:text-[#946F2B]"
                        >
                          {item.product.name}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.product.id, item.selectedColor, item.selectedSize)
                          }
                          className="p-1 text-[#27272A]/50 hover:text-[#991B1B] cursor-pointer"
                          aria-label={`Supprimer ${item.product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#27272A]/65 mt-0.5">
                        {item.selectedColor} · {item.selectedSize}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-[#E6DFD3] bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(
                              item.product.id,
                              item.selectedColor,
                              item.selectedSize,
                              item.quantity - 1
                            )
                          }
                          className="p-1.5 text-[#27272A] hover:text-[#111111] cursor-pointer"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-mono tabular-nums text-[#111111]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(
                              item.product.id,
                              item.selectedColor,
                              item.selectedSize,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.product.stock}
                          className="p-1.5 text-[#27272A] hover:text-[#111111] disabled:opacity-35 cursor-pointer"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-semibold tabular-nums text-[#111111]">
                        {formatMad(unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-[#E6DFD3] bg-white space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#27272A]">
                <span>Sous-total</span>
                <span className="tabular-nums font-medium">{formatMad(cartSubtotalMad)}</span>
              </div>
              <div className="flex justify-between text-[#27272A]">
                <span>Livraison Maroc</span>
                <span className="tabular-nums font-medium">
                  {qualifiesForFree ? 'Gratuite' : formatMad(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#111111] pt-2 border-t border-[#E6DFD3]">
                <span>Total estimé</span>
                <span className="tabular-nums">
                  {formatMad(cartSubtotalMad + (qualifiesForFree ? 0 : shippingFee))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/panier');
                }}
                className="px-4 py-3 border border-[#111111] text-[#111111] text-xs font-medium tracking-wide hover:bg-[#F2EDE4] transition-colors cursor-pointer"
              >
                Voir le panier
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/commande');
                }}
                className="px-4 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-medium tracking-wide hover:bg-[#946F2B] transition-colors cursor-pointer"
              >
                Passer commande
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
