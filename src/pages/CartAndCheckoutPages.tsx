import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Lock, Minus, Plus, ShieldCheck, Tag, Trash2, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiRequest, formatMad, MOROCCAN_CITIES } from '../lib/api';
import type { Order, PaymentMethod } from '../types';
import { SmartImage } from '../components/SmartImage';

export function CartPage() {
  const {
    cart,
    cartSubtotalMad,
    settings,
    updateCartQty,
    removeFromCart,
    navigate,
    showToast,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number; description: string } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const freeThreshold = settings?.freeShippingThresholdMad ?? 1200;
  const baseShipping = settings?.shippingFeeMad ?? 45;
  const discountMad = appliedPromo ? Math.round((cartSubtotalMad * appliedPromo.discountPercent) / 100) : 0;
  const afterDiscount = Math.max(0, cartSubtotalMad - discountMad);
  const shippingMad = cart.length === 0 ? 0 : afterDiscount >= freeThreshold ? 0 : baseShipping;
  const totalMad = afterDiscount + shippingMad;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    try {
      const res = await apiRequest<{ code: string; discountPercent: number; description: string }>(
        '/api/promotions/validate',
        {
          method: 'POST',
          body: JSON.stringify({ code: promoInput.trim() }),
        }
      );
      setAppliedPromo(res);
      showToast(`Code ${res.code} appliqué (-${res.discountPercent}%)`, 'success');
    } catch (err) {
      setAppliedPromo(null);
      showToast(err instanceof Error ? err.message : 'Code invalide', 'error');
    } finally {
      setValidatingPromo(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[70vh] py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-semibold text-[#111111] mb-8">Votre Panier</h1>

        {cart.length === 0 ? (
          <div className="bg-white border border-[#E6DFD3] p-12 text-center space-y-4">
            <p className="font-serif text-2xl text-[#111111]">Votre panier est actuellement vide</p>
            <p className="text-sm text-[#27272A]/75">
              Découvrez nos lunettes de soleil et montures optiques façonnées pour vous.
            </p>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="px-7 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] cursor-pointer"
            >
              Parcourir la boutique
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 bg-white border border-[#E6DFD3] divide-y divide-[#E6DFD3]">
              {cart.map((item) => {
                const unitPrice =
                  item.product.promoPriceMad !== null && item.product.promoPriceMad < item.product.priceMad
                    ? item.product.promoPriceMad
                    : item.product.priceMad;

                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                    className="p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                  >
                    <div className="w-28 h-22 bg-[#F2EDE4] shrink-0 overflow-hidden">
                      <SmartImage
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <a
                        href={`/produit/${item.product.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/produit/${item.product.slug}`);
                        }}
                        className="font-serif text-xl font-semibold text-[#111111] hover:text-[#946F2B]"
                      >
                        {item.product.name}
                      </a>
                      <p className="text-xs text-[#27272A]/70">
                        Coloris : {item.selectedColor} · Taille : {item.selectedSize}
                      </p>
                      <p className="text-xs font-medium tabular-nums text-[#111111]">
                        {formatMad(unitPrice)} / unité
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="inline-flex items-center border border-[#E6DFD3] bg-[#FAF8F5]">
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
                          className="p-2 text-[#27272A] hover:text-[#111111] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-mono tabular-nums">{item.quantity}</span>
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
                          className="p-2 text-[#27272A] hover:text-[#111111] disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="w-24 text-right text-sm font-semibold tabular-nums text-[#111111]">
                        {formatMad(unitPrice * item.quantity)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.product.id, item.selectedColor, item.selectedSize)
                        }
                        className="p-2 text-[#27272A]/50 hover:text-[#991B1B] cursor-pointer"
                        aria-label="Supprimer l'article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4 bg-white border border-[#E6DFD3] p-6 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#111111]">Récapitulatif</h2>

              <form onSubmit={handleApplyPromo} className="space-y-2">
                <label className="text-xs font-medium text-[#27272A] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#946F2B]" />
                  <span>Code promotionnel</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Ex: CASA15"
                    className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#E6DFD3] text-xs font-mono uppercase focus:outline-none focus:border-[#111111]"
                  />
                  <button
                    type="submit"
                    disabled={validatingPromo}
                    className="px-4 py-2 bg-[#111111] text-[#FAF8F5] text-xs font-medium hover:bg-[#946F2B] cursor-pointer"
                  >
                    Appliquer
                  </button>
                </div>
                {appliedPromo && (
                  <p className="text-xs text-[#166534]">
                    {appliedPromo.code} appliqué (-{appliedPromo.discountPercent}%)
                  </p>
                )}
              </form>

              <div className="space-y-2.5 pt-4 border-t border-[#E6DFD3] text-sm">
                <div className="flex justify-between text-[#27272A]">
                  <span>Sous-total</span>
                  <span className="tabular-nums">{formatMad(cartSubtotalMad)}</span>
                </div>
                {discountMad > 0 && (
                  <div className="flex justify-between text-[#166534]">
                    <span>Remise ({appliedPromo?.code})</span>
                    <span className="tabular-nums">-{formatMad(discountMad)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#27272A]">
                  <span>Livraison au Maroc</span>
                  <span className="tabular-nums">
                    {shippingMad === 0 ? 'Gratuite' : formatMad(shippingMad)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-[#111111] pt-3 border-t border-[#E6DFD3]">
                  <span>Total TTC</span>
                  <span className="tabular-nums">{formatMad(totalMad)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    appliedPromo
                      ? `/commande?promo=${encodeURIComponent(appliedPromo.code)}`
                      : '/commande'
                  )
                }
                className="w-full py-3.5 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] transition-colors cursor-pointer"
              >
                Passer commande
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const {
    cart,
    cartSubtotalMad,
    settings,
    customerUser,
    customerToken,
    clearCart,
    navigate,
    showToast,
    currentPath,
  } = useStore();

  const initialPromo = useMemo(() => {
    const idx = currentPath.indexOf('?');
    if (idx < 0) return '';
    return new URLSearchParams(currentPath.slice(idx + 1)).get('promo') || '';
  }, [currentPath]);

  const [fullName, setFullName] = useState(customerUser?.fullName || '');
  const [phone, setPhone] = useState(customerUser?.phone || '');
  const [email, setEmail] = useState(customerUser?.email || '');
  const [city, setCity] = useState('Casablanca');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [promoCode, setPromoCode] = useState(initialPromo);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [honeypot, setHoneypot] = useState('');

  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  React.useEffect(() => {
    if (initialPromo) {
      apiRequest<{ code: string; discountPercent: number }>('/api/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({ code: initialPromo }),
      })
        .then((res) => {
          setPromoCode(res.code);
          setDiscountPercent(res.discountPercent);
        })
        .catch(() => {
          setDiscountPercent(0);
        });
    }
  }, [initialPromo]);

  const validatePromo = async () => {
    if (!promoCode.trim()) {
      setDiscountPercent(0);
      return;
    }
    try {
      const res = await apiRequest<{ code: string; discountPercent: number }>('/api/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      setPromoCode(res.code);
      setDiscountPercent(res.discountPercent);
      showToast(`Code ${res.code} validé (-${res.discountPercent}%)`, 'success');
    } catch (err) {
      setDiscountPercent(0);
      showToast(err instanceof Error ? err.message : 'Code invalide', 'error');
    }
  };

  const freeThreshold = settings?.freeShippingThresholdMad ?? 1200;
  const baseShipping = settings?.shippingFeeMad ?? 45;
  const discountMad = discountPercent > 0 ? Math.round((cartSubtotalMad * discountPercent) / 100) : 0;
  const afterDiscount = Math.max(0, cartSubtotalMad - discountMad);
  const shippingMad = cart.length === 0 ? 0 : afterDiscount >= freeThreshold ? 0 : baseShipping;
  const totalMad = afterDiscount + shippingMad;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'electronic' && !settings?.electronicPaymentConfigured) {
      showToast(
        'Aucune passerelle de paiement électronique n’est connectée. Sélectionnez le Paiement à la livraison.',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ order: Order }>('/api/orders', {
        method: 'POST',
        token: customerToken,
        body: JSON.stringify({
          fullName,
          phone,
          email,
          city,
          address,
          notes,
          paymentMethod,
          promoCode: discountPercent > 0 ? promoCode : '',
          idempotencyKey,
          website: honeypot,
          items: cart.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            selectedColor: i.selectedColor,
            selectedSize: i.selectedSize,
          })),
        }),
      });
      setConfirmedOrder(res.order);
      clearCart();
      showToast(`Commande ${res.order.orderNumber} confirmée !`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Impossible de valider la commande.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="bg-[#FAF8F5] py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white border border-[#E6DFD3] p-8 sm:p-10 space-y-6">
            <div className="flex items-center gap-3 text-[#166534]">
              <CheckCircle2 className="w-7 h-7" />
              <div>
                <p className="text-xs uppercase tracking-[0.14em] font-semibold">
                  Commande enregistrée
                </p>
                <h1 className="font-serif text-3xl font-semibold text-[#111111]">
                  Merci, {confirmedOrder.fullName}
                </h1>
              </div>
            </div>

            <div className="p-4 bg-[#F2EDE4] border border-[#E6DFD3] flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <span className="text-xs text-[#27272A]/70 block">Numéro de commande</span>
                <strong className="font-mono text-base text-[#111111]">
                  {confirmedOrder.orderNumber}
                </strong>
              </div>
              <div>
                <span className="text-xs text-[#27272A]/70 block">Statut</span>
                <strong className="text-[#946F2B]">{confirmedOrder.status}</strong>
              </div>
              <div>
                <span className="text-xs text-[#27272A]/70 block">Total à régler</span>
                <strong className="tabular-nums text-[#111111]">
                  {formatMad(confirmedOrder.totalMad)}
                </strong>
              </div>
            </div>

            <div className="space-y-2 text-sm text-[#27272A]">
              <p>
                <strong>Adresse de livraison :</strong> {confirmedOrder.address}, {confirmedOrder.city}
              </p>
              <p>
                <strong>Téléphone :</strong> {confirmedOrder.phone}
              </p>
              <p>
                <strong>Mode de paiement :</strong> {confirmedOrder.paymentStatus}
              </p>
            </div>

            <div className="border-t border-[#E6DFD3] pt-4 space-y-2">
              {confirmedOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {it.productName} × {it.quantity} ({it.selectedColor})
                  </span>
                  <span className="tabular-nums font-medium">{formatMad(it.lineTotalMad)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/suivi-commande')}
                className="px-6 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] cursor-pointer"
              >
                Suivre ma commande
              </button>
              <button
                type="button"
                onClick={() => navigate('/boutique')}
                className="px-6 py-3 border border-[#111111] text-[#111111] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#F2EDE4] cursor-pointer"
              >
                Continuer mes achats
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-[#FAF8F5] py-20 text-center px-4 space-y-4">
        <h1 className="font-serif text-4xl font-semibold text-[#111111]">Finaliser la commande</h1>
        <p className="text-sm text-[#27272A]/75">Votre panier est vide.</p>
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="px-6 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
            Livraison partout au Maroc
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[#111111]">
            Finalisation de commande
          </h1>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#111111]">
                Coordonnées de livraison
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#111111] mb-1.5">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex : Nadia Benjelloun"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111111] mb-1.5">
                    Téléphone marocain *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 61 48 20 90"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#111111] mb-1.5">
                    Adresse e-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nadia@exemple.ma"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111111] mb-1.5">
                    Ville *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  >
                    {MOROCCAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1.5">
                  Adresse de livraison complète *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Numéro, rue, quartier, résidence ou bureau"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1.5">
                  Informations complémentaires (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Créneau horaire souhaité, indications d’accès..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-2xl font-semibold text-[#111111]">
                Mode de paiement
              </h2>

              <label
                className={`flex items-start gap-3.5 p-4 border cursor-pointer transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#111111] bg-[#FAF8F5]'
                    : 'border-[#E6DFD3] hover:border-[#111111]/40'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-[#111111]"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                    <Truck className="w-4 h-4 text-[#946F2B]" />
                    <span>Paiement à la livraison (Cash on Delivery)</span>
                  </div>
                  <p className="text-xs text-[#27272A]/75">
                    Réglez en espèces directement auprès du livreur lors de la remise de votre coffret ÉLÉGANCE CASA.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3.5 p-4 border transition-colors ${
                  settings?.electronicPaymentConfigured
                    ? 'cursor-pointer border-[#E6DFD3]'
                    : 'opacity-70 cursor-not-allowed border-[#E6DFD3] bg-[#F2EDE4]/40'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  disabled={!settings?.electronicPaymentConfigured}
                  checked={paymentMethod === 'electronic'}
                  onChange={() => setPaymentMethod('electronic')}
                  className="mt-1 accent-[#111111]"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                    <CreditCard className="w-4 h-4 text-[#946F2B]" />
                    <span>
                      Paiement électronique ({settings?.electronicPaymentProviderName || 'CMI Maroc'})
                    </span>
                  </div>
                  {settings?.electronicPaymentConfigured ? (
                    <p className="text-xs text-[#27272A]/75">
                      Paiement sécurisé par carte bancaire marocaine ou internationale.
                    </p>
                  ) : (
                    <p className="text-xs text-[#946F2B]">
                      Passerelle en cours d’intégration (CMI / Payzone) — Aucune simulation de paiement par carte n’est autorisée tant que le terminal marchand réel n’est pas connecté.
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-5 lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl font-semibold text-[#111111]">
              Récapitulatif de commande
            </h2>

            <div className="divide-y divide-[#E6DFD3] max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => {
                const unitPrice =
                  item.product.promoPriceMad !== null && item.product.promoPriceMad < item.product.priceMad
                    ? item.product.promoPriceMad
                    : item.product.priceMad;
                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                    className="py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#111111] truncate">{item.product.name}</p>
                      <p className="text-xs text-[#27272A]/65">
                        Qté {item.quantity} · {item.selectedColor}
                      </p>
                    </div>
                    <span className="tabular-nums font-semibold shrink-0">
                      {formatMad(unitPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Code promo (ex: CASA15)"
                className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#E6DFD3] text-xs font-mono uppercase focus:outline-none focus:border-[#111111]"
              />
              <button
                type="button"
                onClick={validatePromo}
                className="px-4 py-2 border border-[#111111] text-xs font-medium hover:bg-[#F2EDE4] cursor-pointer"
              >
                Valider
              </button>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#E6DFD3] text-sm">
              <div className="flex justify-between text-[#27272A]">
                <span>Sous-total</span>
                <span className="tabular-nums">{formatMad(cartSubtotalMad)}</span>
              </div>
              {discountMad > 0 && (
                <div className="flex justify-between text-[#166534]">
                  <span>Remise ({promoCode})</span>
                  <span className="tabular-nums">-{formatMad(discountMad)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#27272A]">
                <span>Frais de livraison</span>
                <span className="tabular-nums">
                  {shippingMad === 0 ? 'Gratuite' : formatMad(shippingMad)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-[#111111] pt-3 border-t border-[#E6DFD3]">
                <span>Total à payer</span>
                <span className="tabular-nums">{formatMad(totalMad)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Enregistrement sécurisé...' : 'Confirmer la commande'}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#27272A]/65">
              <Lock className="w-3.5 h-3.5 text-[#946F2B]" />
              <span>Montants & stocks vérifiés côté serveur · Protection anti-doublon</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#27272A]/65">
              <ShieldCheck className="w-3.5 h-3.5 text-[#946F2B]" />
              <span>Contrôle qualité avant expédition depuis Casablanca</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
