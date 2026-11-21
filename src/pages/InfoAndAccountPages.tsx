import React, { useEffect, useState } from 'react';
import { ChevronDown, LogOut, Mail, MapPin, MessageCircle, Package, Phone, Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiRequest, buildWhatsAppUrl, formatMad } from '../lib/api';
import { ORDER_STATUSES, type Order, type Product, type UserSession } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';

export function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTrackedOrder(null);
    try {
      const res = await apiRequest<{ order: Order }>(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      setTrackedOrder(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commande introuvable.');
    } finally {
      setLoading(false);
    }
  };

  const progressSteps: string[] = ORDER_STATUSES.filter((s) => s !== 'Annulée');
  const activeStepIdx = trackedOrder ? progressSteps.indexOf(trackedOrder.status) : -1;

  return (
    <div className="bg-[#FAF8F5] min-h-[70vh] py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
            Suivi en temps réel
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[#111111]">
            Suivre ma commande
          </h1>
          <p className="text-sm text-[#27272A]/75">
            Saisissez votre numéro de commande (ex : EC-2026-1002) et votre numéro de téléphone marocain.
          </p>
        </div>

        <form onSubmit={handleTrack} className="bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1.5">
                Numéro de commande
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="EC-2026-1002"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm font-mono uppercase focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1.5">
                Téléphone utilisé lors de l’achat
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0662987654"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {error && <p className="text-xs text-[#991B1B]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Recherche...' : 'Consulter l’avancement'}</span>
          </button>
        </form>

        {trackedOrder && (
          <div className="bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
              <div>
                <p className="text-xs text-[#27272A]/65">Commande</p>
                <p className="font-mono text-lg font-semibold text-[#111111]">
                  {trackedOrder.orderNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#27272A]/65">Destination</p>
                <p className="text-sm font-medium text-[#111111]">{trackedOrder.city}</p>
              </div>
              <div>
                <p className="text-xs text-[#27272A]/65">Montant total</p>
                <p className="text-base font-semibold tabular-nums text-[#111111]">
                  {formatMad(trackedOrder.totalMad)}
                </p>
              </div>
            </div>

            {trackedOrder.status === 'Annulée' ? (
              <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
                Cette commande a été annulée. Contactez notre boutique si vous souhaitez passer une nouvelle commande.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {progressSteps.map((step, idx) => {
                  const done = idx <= activeStepIdx;
                  return (
                    <div
                      key={step}
                      className={`p-3 border text-center ${
                        done
                          ? 'border-[#111111] bg-[#111111] text-[#FAF8F5]'
                          : 'border-[#E6DFD3] bg-[#FAF8F5] text-[#27272A]/55'
                      }`}
                    >
                      <span className="text-[11px] font-medium block">{step}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[#E6DFD3]">
              <h3 className="text-xs uppercase tracking-[0.12em] text-[#27272A]/70 font-semibold">
                Articles commandés
              </h3>
              {trackedOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {it.productName} × {it.quantity} ({it.selectedColor})
                  </span>
                  <span className="tabular-nums font-medium">{formatMad(it.lineTotalMad)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AccountPage() {
  const {
    customerUser,
    customerToken,
    setCustomerSession,
    favorites,
    currentPath,
    navigate,
    showToast,
  } = useStore();

  const initialTab = currentPath.includes('tab=favoris') ? 'favoris' : 'commandes';
  const [activeTab, setActiveTab] = useState<'commandes' | 'favoris'>(initialTab);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [favProducts, setFavProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (currentPath.includes('tab=favoris')) {
      setActiveTab('favoris');
    }
  }, [currentPath]);

  useEffect(() => {
    if (customerToken) {
      apiRequest<{ orders: Order[] }>('/api/auth/orders', { token: customerToken })
        .then((res) => setOrders(res.orders))
        .catch(() => setOrders([]));
    } else {
      setOrders([]);
    }
  }, [customerToken]);

  useEffect(() => {
    if (favorites.length === 0) {
      setFavProducts([]);
      return;
    }
    apiRequest<Product[]>('/api/products')
      .then((all) => setFavProducts(all.filter((p) => favorites.includes(p.id))))
      .catch(() => setFavProducts([]));
  }, [favorites]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        authMode === 'login'
          ? { email, password }
          : { fullName, email, phone, password };
      const res = await apiRequest<{ token: string; user: UserSession }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCustomerSession(res.user, res.token);
      showToast(`Bienvenue, ${res.user.fullName}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur d’authentification', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[70vh] py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DFD3] pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
              Espace Personnel
            </p>
            <h1 className="font-serif text-4xl font-semibold text-[#111111]">
              {customerUser ? `Bonjour, ${customerUser.fullName}` : 'Mon Compte & Favoris'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('commandes')}
              className={`px-4 py-2 text-xs font-medium border cursor-pointer ${
                activeTab === 'commandes'
                  ? 'bg-[#111111] text-[#FAF8F5] border-[#111111]'
                  : 'bg-white text-[#27272A] border-[#E6DFD3]'
              }`}
            >
              Historique des commandes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favoris')}
              className={`px-4 py-2 text-xs font-medium border cursor-pointer ${
                activeTab === 'favoris'
                  ? 'bg-[#111111] text-[#FAF8F5] border-[#111111]'
                  : 'bg-white text-[#27272A] border-[#E6DFD3]'
              }`}
            >
              Mes favoris ({favorites.length})
            </button>
            {customerUser && (
              <button
                type="button"
                onClick={() => {
                  setCustomerSession(null, null);
                  showToast('Déconnexion effectuée.', 'info');
                }}
                className="p-2 border border-[#E6DFD3] bg-white text-[#27272A] hover:text-[#991B1B] cursor-pointer"
                aria-label="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {activeTab === 'favoris' ? (
          favProducts.length === 0 ? (
            <div className="bg-white border border-[#E6DFD3] p-12 text-center space-y-4">
              <p className="font-serif text-2xl text-[#111111]">Aucun favori enregistré</p>
              <p className="text-sm text-[#27272A]/75">
                Cliquez sur l’icône cœur sur nos montures pour les retrouver facilement ici.
              </p>
              <button
                type="button"
                onClick={() => navigate('/boutique')}
                className="px-6 py-2.5 bg-[#111111] text-[#FAF8F5] text-xs font-medium uppercase tracking-wider cursor-pointer"
              >
                Découvrir le catalogue
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {favProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )
        ) : !customerUser ? (
          <div className="max-w-md mx-auto bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-5">
            <div className="flex border-b border-[#E6DFD3]">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 cursor-pointer ${
                  authMode === 'login' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#27272A]/60'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 cursor-pointer ${
                  authMode === 'register' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#27272A]/60'
                }`}
              >
                Créer un compte
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-3.5">
              {authMode === 'register' && (
                <>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Téléphone marocain (06...)"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                </>
              )}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse e-mail"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] cursor-pointer"
              >
                {submitting
                  ? 'Chargement...'
                  : authMode === 'login'
                    ? 'Se connecter'
                    : 'Créer mon compte'}
              </button>
            </form>

            <div className="pt-3 border-t border-[#E6DFD3] text-center">
              <button
                type="button"
                onClick={() => navigate('/suivi-commande')}
                className="text-xs text-[#946F2B] hover:underline cursor-pointer"
              >
                Suivre une commande sans compte →
              </button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#E6DFD3] p-12 text-center space-y-4">
            <Package className="w-8 h-8 mx-auto text-[#946F2B]" />
            <p className="font-serif text-2xl text-[#111111]">Aucune commande pour le moment</p>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="px-6 py-2.5 bg-[#111111] text-[#FAF8F5] text-xs font-medium uppercase tracking-wider cursor-pointer"
            >
              Découvrir la collection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-white border border-[#E6DFD3] p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E6DFD3]">
                  <span className="font-mono text-sm font-semibold text-[#111111]">
                    {ord.orderNumber}
                  </span>
                  <span className="text-xs text-[#27272A]/70">
                    {new Date(ord.createdAt).toLocaleDateString('fr-MA')}
                  </span>
                  <span className="text-xs font-semibold text-[#946F2B]">{ord.status}</span>
                  <span className="text-sm font-semibold tabular-nums text-[#111111]">
                    {formatMad(ord.totalMad)}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[#27272A]">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {it.productName} × {it.quantity} ({it.selectedColor})
                      </span>
                      <span className="tabular-nums">{formatMad(it.lineTotalMad)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutPage() {
  const { settings, navigate } = useStore();
  return (
    <div className="bg-[#FAF8F5] py-14">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
              Notre Maison à Casablanca
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#111111]">
              À propos d’{settings?.brandName || 'ÉLÉGANCE CASA'}
            </h1>
            <p className="text-base text-[#27272A]/85 leading-relaxed">
              {settings?.aboutText}
            </p>
            <p className="text-sm text-[#27272A]/75 leading-relaxed">
              Née d’une passion pour les silhouettes architecturales et l’optique de haute précision, notre boutique sélectionne des acétates italiens Mazzucchelli, du titane japonais hypoallergénique et des verres solaires haute protection adaptés à la luminosité marocaine.
            </p>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="px-7 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] cursor-pointer"
            >
              Découvrir nos créations
            </button>
          </div>
          <div className="lg:col-span-6 aspect-[4/3] bg-[#F2EDE4] border border-[#E6DFD3] overflow-hidden">
            <SmartImage
              src="/src/assets/images/atelier_casablanca_1795271508487.jpg"
              alt="Salon ÉLÉGANCE CASA Casablanca"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { settings, showToast } = useStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiRequest<{ ok: boolean; message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone, subject, message, website }),
      });
      setSent(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur d’envoi', 'error');
    } finally {
      setSending(false);
    }
  };

  const whatsappUrl = buildWhatsAppUrl(
    settings?.whatsappNumber || '212661482090',
    'Bonjour ÉLÉGANCE CASA, je souhaite prendre contact avec votre boutique à Casablanca.'
  );

  return (
    <div className="bg-[#FAF8F5] py-14">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
            Service Client & Rendez-vous
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#111111]">
            Contacter ÉLÉGANCE CASA
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-2xl font-semibold text-[#111111]">
              Boutique Triangle d’Or
            </h2>
            <div className="space-y-4 text-sm text-[#27272A]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#946F2B] shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-[#111111]">Adresse</p>
                  <p className="text-[#27272A]/80">{settings?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#946F2B] shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-[#111111]">Téléphone</p>
                  <p className="text-[#27272A]/80">{settings?.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#946F2B] shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-[#111111]">E-mail</p>
                  <p className="text-[#27272A]/80">{settings?.email}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E6DFD3] text-xs text-[#27272A]/75">
                {settings?.hours}
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 inline-flex items-center justify-center gap-2 bg-[#166534] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#14532D] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Discuter sur WhatsApp</span>
            </a>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E6DFD3] p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold text-[#111111] mb-5">
              Écrire à nos opticiens
            </h2>
            {sent ? (
              <div className="p-6 bg-[#F2EDE4] border border-[#E6DFD3] space-y-3">
                <p className="font-serif text-xl text-[#111111]">Message transmis avec succès</p>
                <p className="text-sm text-[#27272A]/80">
                  Notre équipe de Casablanca vous répondra dans les plus brefs délais.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs font-medium text-[#946F2B] hover:underline cursor-pointer"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nom complet *"
                    className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Téléphone marocain"
                    className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Adresse e-mail *"
                    className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Objet *"
                    className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                  />
                </div>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E6DFD3] text-sm focus:outline-none focus:border-[#111111]"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-7 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] cursor-pointer"
                >
                  {sending ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const items = [
    {
      q: 'Quels sont les délais et frais de livraison au Maroc ?',
      a: 'Les livraisons à Casablanca sont assurées sous 24 heures ouvrées, et sous 24 à 48 heures vers Rabat, Marrakech, Tanger, Agadir, Fès et l’ensemble des villes du Royaume. La livraison est offerte dès 1 200 DH d’achat.',
    },
    {
      q: 'Comment fonctionne le paiement à la livraison (Cash on Delivery) ?',
      a: 'Vous réglez le montant exact de votre commande en Dirhams marocains directement au livreur lors de la réception de votre colis, après vérification visuelle du coffret.',
    },
    {
      q: 'Vos montures optiques peuvent-elles recevoir des verres correcteurs ?',
      a: 'Oui. Toutes nos lunettes de vue et montures optiques sont équipées de cerclages ou rainures optiques standard et peuvent être montées avec des verres unifocaux, anti-lumière bleue ou progressifs chez votre opticien ou dans notre boutique du Boulevard d’Anfa.',
    },
    {
      q: 'Quelle est votre politique de retour et d’échange ?',
      a: 'Vous disposez de 7 jours après réception pour demander un échange ou un retour si la monture est intacte, non portée et accompagnée de son étui d’origine.',
    },
  ];

  return (
    <div className="bg-[#FAF8F5] py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-medium">
            Aide & Informations
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[#111111]">
            Questions Fréquentes
          </h1>
        </div>

        <div className="bg-white border border-[#E6DFD3] divide-y divide-[#E6DFD3]">
          {items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <span className="font-serif text-xl font-semibold text-[#111111]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm text-[#27272A]/80 leading-relaxed">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LegalPage({ type }: { type: 'cgv' | 'confidentialite' | 'livraison' }) {
  const content = {
    cgv: {
      title: 'Conditions Générales de Vente',
      sections: [
        {
          h: '1. Identification du vendeur',
          p: 'Le présent site est édité par la maison d’optique ÉLÉGANCE CASA, établie au 42 Boulevard d’Anfa, Triangle d’Or, Casablanca, Maroc.',
        },
        {
          h: '2. Prix et Devise',
          p: 'Tous les prix sont affichés en Dirhams marocains (MAD / DH) toutes taxes comprises. Les promotions affichées s’appliquent automatiquement dans la limite des stocks disponibles.',
        },
        {
          h: '3. Commandes et Paiement',
          p: 'Les commandes sont confirmées après vérification des stocks côté serveur. Le paiement s’effectue à la livraison en espèces ou par passerelle bancaire marocaine lorsqu’elle est activée.',
        },
      ],
    },
    confidentialite: {
      title: 'Politique de Confidentialité',
      sections: [
        {
          h: '1. Données collectées',
          p: 'ÉLÉGANCE CASA collecte uniquement les coordonnées strictement nécessaires au traitement et à l’expédition de vos commandes au Maroc (nom, téléphone, ville, adresse, e-mail).',
        },
        {
          h: '2. Protection des accès',
          p: 'Les mots de passe des comptes clients et administrateurs sont chiffrés de façon irréversible (hachage cryptographique salé côté serveur) et aucune donnée bancaire n’est conservée sur nos serveurs.',
        },
      ],
    },
    livraison: {
      title: 'Politique de Livraison & Retours',
      sections: [
        {
          h: '1. Expédition au Maroc',
          p: 'Expédition sous 24h à Casablanca et 24 à 48h vers toutes les régions du Royaume. La livraison est offerte dès 1 200 DH d’achat.',
        },
        {
          h: '2. Retours et Échanges',
          p: 'Tout article neuf dans son coffret d’origine peut être échangé ou retourné sous 7 jours ouvrables en boutique ou via notre service client.',
        },
      ],
    },
  }[type];

  return (
    <div className="bg-[#FAF8F5] py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <h1 className="font-serif text-4xl font-semibold text-[#111111]">{content.title}</h1>
        <div className="bg-white border border-[#E6DFD3] p-6 sm:p-8 space-y-6">
          {content.sections.map((s) => (
            <div key={s.h} className="space-y-2">
              <h2 className="font-serif text-2xl font-semibold text-[#111111]">{s.h}</h2>
              <p className="text-sm text-[#27272A]/85 leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ErrorPage({ code }: { code: 404 | 500 }) {
  const { navigate } = useStore();
  return (
    <div className="bg-[#FAF8F5] py-24 px-4 text-center space-y-5">
      <p className="font-mono text-sm tracking-[0.2em] text-[#946F2B]">ERREUR {code}</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#111111]">
        {code === 404 ? 'Page introuvable' : 'Incident technique temporaire'}
      </h1>
      <p className="text-sm text-[#27272A]/75 max-w-md mx-auto">
        {code === 404
          ? 'La page que vous recherchez n’existe pas ou a été déplacée.'
          : 'Une erreur serveur est survenue. Veuillez réessayer dans quelques instants.'}
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-7 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[#946F2B] cursor-pointer"
      >
        Retour à l’accueil
      </button>
    </div>
  );
}
