import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Box,
  Edit3,
  Eye,
  Lock,
  LogOut,
  Mail,
  Plus,
  Settings,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiRequest, formatMad } from '../lib/api';
import {
  ORDER_STATUSES,
  type AdminDashboardStats,
  type Customer,
  type Order,
  type OrderStatus,
  type Product,
  type Promotion,
  type SiteSettings,
  type UserSession,
} from '../types';
import { SmartImage } from '../components/SmartImage';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'customers' | 'promotions' | 'settings';

export function AdminPage() {
  const { adminUser, adminToken, setAdminSession, refreshSettings, categories, showToast, navigate } =
    useStore();

  const [authStatus, setAuthStatus] = useState<{
    needsInitialSetup: boolean;
    envConfigured: boolean;
    defaultUsername: string;
  } | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [contactMessages, setContactMessages] = useState<
    { id: number; full_name: string; email: string; phone: string; subject: string; message: string; created_at: string }[]
  >([]);
  const [newsletterCount, setNewsletterCount] = useState(0);

  // Order detail & filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Tous');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Customer order history modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: 'ÉLÉGANCE CASA',
    categoryId: 1,
    gender: 'Unisexe' as 'Homme' | 'Femme' | 'Unisexe',
    priceMad: '1490',
    promoPriceMad: '',
    stock: '10',
    color: 'Noir & Or',
    material: 'Acétate italien',
    frameType: 'Cerclée',
    sizesText: 'M (50-21-145), L (53-21-148)',
    colorsText: 'Noir & Or',
    images: [] as string[],
    description: '',
    isActive: true,
    isFeatured: false,
    isNew: true,
    isBestseller: false,
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Promotion form
  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discountPercent: '15',
    startDate: '2026-01-01',
    endDate: '2027-12-31',
  });

  // Change password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');

  useEffect(() => {
    apiRequest<{ needsInitialSetup: boolean; envConfigured: boolean; defaultUsername: string }>(
      '/api/admin/auth/status'
    )
      .then((res) => {
        setAuthStatus(res);
        setUsername(res.defaultUsername || 'admin');
      })
      .catch(() => {
        setAuthStatus({ needsInitialSetup: false, envConfigured: false, defaultUsername: 'admin' });
      });
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!adminToken) return;
    try {
      const [d, p, o, c, pr, st, msg] = await Promise.all([
        apiRequest<AdminDashboardStats>('/api/admin/dashboard', { token: adminToken }),
        apiRequest<Product[]>('/api/admin/products', { token: adminToken }),
        apiRequest<Order[]>('/api/admin/orders', { token: adminToken }),
        apiRequest<Customer[]>('/api/admin/customers', { token: adminToken }),
        apiRequest<Promotion[]>('/api/admin/promotions', { token: adminToken }),
        apiRequest<SiteSettings>('/api/admin/settings', { token: adminToken }),
        apiRequest<{ messages: typeof contactMessages; newsletterCount: number }>('/api/admin/messages', {
          token: adminToken,
        }),
      ]);
      setStats(d);
      setProducts(p);
      setOrders(o);
      setCustomers(c);
      setPromotions(pr);
      setSiteSettings(st);
      setContactMessages(msg.messages);
      setNewsletterCount(msg.newsletterCount);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de chargement admin', 'error');
    }
  }, [adminToken, showToast]);

  useEffect(() => {
    if (adminToken) {
      loadAdminData();
    }
  }, [adminToken, loadAdminData]);

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserSession }>('/api/admin/auth/setup', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAdminSession(res.user, res.token);
      setPassword('');
      setConfirmPassword('');
      showToast('Compte administrateur configuré et connecté.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de configuration', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserSession }>('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAdminSession(res.user, res.token);
      setPassword('');
      showToast('Connexion administrateur réussie.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Identifiants invalides', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      brand: 'ÉLÉGANCE CASA',
      categoryId: categories[0]?.id ?? 1,
      gender: 'Unisexe',
      priceMad: '1490',
      promoPriceMad: '',
      stock: '12',
      color: 'Noir & Or',
      material: 'Acétate Mazzucchelli',
      frameType: 'Cerclée',
      sizesText: 'M (50-21-145), L (53-21-148)',
      colorsText: 'Noir & Or',
      images: ['/src/assets/images/hero_elegance_casa_1795271503079.jpg'],
      description: '',
      isActive: true,
      isFeatured: false,
      isNew: true,
      isBestseller: false,
    });
    setProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      brand: p.brand,
      categoryId: p.categoryId,
      gender: p.gender,
      priceMad: String(p.priceMad),
      promoPriceMad: p.promoPriceMad !== null ? String(p.promoPriceMad) : '',
      stock: String(p.stock),
      color: p.color,
      material: p.material,
      frameType: p.frameType,
      sizesText: p.sizes.join(', '),
      colorsText: p.colors.join(', '),
      images: p.images,
      description: p.description,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isNew: p.isNew,
      isBestseller: p.isBestseller,
    });
    setProductModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
        reader.readAsDataURL(file);
      });
      const res = await apiRequest<{ url: string }>('/api/admin/upload', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          dataBase64: base64,
        }),
      });
      setProdForm((prev) => ({ ...prev, images: [...prev.images, res.url] }));
      showToast('Photo téléversée avec succès.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de téléversement', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    const payload = {
      name: prodForm.name,
      brand: prodForm.brand,
      categoryId: Number(prodForm.categoryId),
      gender: prodForm.gender,
      priceMad: Number(prodForm.priceMad),
      promoPriceMad: prodForm.promoPriceMad.trim() ? Number(prodForm.promoPriceMad) : null,
      stock: Number(prodForm.stock),
      color: prodForm.color,
      material: prodForm.material,
      frameType: prodForm.frameType,
      sizes: prodForm.sizesText.split(',').map((s) => s.trim()).filter(Boolean),
      colors: prodForm.colorsText.split(',').map((s) => s.trim()).filter(Boolean),
      images: prodForm.images,
      description: prodForm.description,
      isActive: prodForm.isActive,
      isFeatured: prodForm.isFeatured,
      isNew: prodForm.isNew,
      isBestseller: prodForm.isBestseller,
    };

    try {
      if (editingProduct) {
        await apiRequest(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          token: adminToken,
          body: JSON.stringify(payload),
        });
        showToast('Produit mis à jour.', 'success');
      } else {
        await apiRequest('/api/admin/products', {
          method: 'POST',
          token: adminToken,
          body: JSON.stringify(payload),
        });
        showToast('Nouveau produit ajouté au catalogue.', 'success');
      }
      setProductModalOpen(false);
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur d’enregistrement', 'error');
    }
  };

  const handleToggleProductActive = async (p: Product) => {
    if (!adminToken) return;
    try {
      await apiRequest(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleToggleProductFeatured = async (p: Product) => {
    if (!adminToken) return;
    try {
      await apiRequest(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ isFeatured: !p.isFeatured }),
      });
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!adminToken) return;
    try {
      await apiRequest(`/api/admin/products/${p.id}`, {
        method: 'DELETE',
        token: adminToken,
      });
      showToast(`« ${p.name} » supprimé.`, 'info');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de suppression', 'error');
    }
  };

  const handleOrderStatusChange = async (orderId: number, status: OrderStatus) => {
    if (!adminToken) return;
    try {
      const updated = await apiRequest<Order>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      showToast(`Statut mis à jour : ${status}`, 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de statut', 'error');
    }
  };

  const handleInspectCustomer = async (c: Customer) => {
    if (!adminToken) return;
    setSelectedCustomer(c);
    try {
      const list = await apiRequest<Order[]>(`/api/admin/customers/${c.id}/orders`, {
        token: adminToken,
      });
      setCustomerOrders(list);
    } catch {
      setCustomerOrders([]);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      await apiRequest('/api/admin/promotions', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          code: promoForm.code,
          description: promoForm.description,
          discountPercent: Number(promoForm.discountPercent),
          startDate: promoForm.startDate,
          endDate: promoForm.endDate,
        }),
      });
      setPromoForm({
        code: '',
        description: '',
        discountPercent: '15',
        startDate: '2026-01-01',
        endDate: '2027-12-31',
      });
      showToast('Code promotionnel créé.', 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleTogglePromo = async (promo: Promotion) => {
    if (!adminToken) return;
    await apiRequest(`/api/admin/promotions/${promo.id}`, {
      method: 'PUT',
      token: adminToken,
      body: JSON.stringify({ isActive: !promo.isActive }),
    });
    await loadAdminData();
  };

  const handleDeletePromo = async (promoId: number) => {
    if (!adminToken) return;
    await apiRequest(`/api/admin/promotions/${promoId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    await loadAdminData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !siteSettings) return;
    try {
      const updated = await apiRequest<SiteSettings>('/api/admin/settings', {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify(siteSettings),
      });
      setSiteSettings(updated);
      await refreshSettings();
      showToast('Paramètres de la boutique enregistrés.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur d’enregistrement', 'error');
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      const res = await apiRequest<{ ok: boolean; message: string }>('/api/admin/auth/change-password', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      setCurrentPw('');
      setNewPw('');
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de mise à jour', 'error');
    }
  };

  // =====================================
  // AUTHENTICATION / INITIAL SETUP GATE
  // =====================================
  if (!adminToken || !adminUser) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#946F2B] font-semibold">
              ÉLÉGANCE CASA · Administration
            </p>
            <h1 className="font-serif text-3xl font-semibold text-slate-900">
              {authStatus?.needsInitialSetup
                ? 'Configuration initiale Administrateur'
                : 'Connexion Back-Office'}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {authStatus?.needsInitialSetup
                ? 'Définissez le mot de passe initial de votre compte administrateur. Il sera chiffré (scrypt salé) côté serveur.'
                : 'Authentification sécurisée requise pour gérer les produits, commandes et clients.'}
            </p>
          </div>

          {authStatus?.needsInitialSetup ? (
            <form onSubmit={handleInitialSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Identifiant</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mot de passe initial (min. 8 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#946F2B] transition-colors cursor-pointer"
              >
                {authLoading ? 'Initialisation...' : 'Créer le compte administrateur'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Identifiant</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#946F2B] transition-colors cursor-pointer"
              >
                {authLoading ? 'Vérification...' : 'Se connecter'}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hover:text-slate-900 cursor-pointer"
            >
              ← Retour à la boutique
            </button>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Accès chiffré</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =====================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =====================================
  const filteredOrders =
    orderStatusFilter === 'Tous' ? orders : orders.filter((o) => o.status === orderStatusFilter);

  const maxChartRev = Math.max(1, ...(stats?.salesSeries.map((s) => s.revenueMad) || [1]));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#0F172A] text-slate-100 shrink-0 flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-slate-800">
            <p className="font-serif text-xl font-semibold tracking-wider text-white">
              ÉLÉGANCE CASA
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Console Administrateur</p>
          </div>

          <nav className="p-3 space-y-1 text-sm">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
              { id: 'products', label: `Produits (${products.length})`, icon: Box },
              { id: 'orders', label: `Commandes (${orders.length})`, icon: ShoppingCart },
              { id: 'customers', label: `Clients (${customers.length})`, icon: Users },
              { id: 'promotions', label: 'Promotions', icon: Tag },
              { id: 'settings', label: 'Site & Sécurité', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#B68D40] text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 px-3 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-left cursor-pointer"
          >
            Voir la boutique →
          </button>
          <button
            type="button"
            onClick={() => {
              setAdminSession(null, null);
              showToast('Session administrateur fermée.', 'info');
            }}
            className="w-full py-2 px-3 flex items-center gap-2 text-slate-400 hover:text-red-400 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion ({adminUser.username})</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Administration / <strong className="text-slate-900 capitalize">{activeTab}</strong>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <button
                type="button"
                onClick={openNewProductModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-[#946F2B] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un produit</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Chiffre d’affaires', val: formatMad(stats.revenueMad) },
                  { label: 'Total commandes', val: String(stats.totalOrders) },
                  { label: 'En attente', val: String(stats.pendingOrders) },
                  { label: 'Confirmées', val: String(stats.confirmedOrders) },
                  { label: 'Expédiées', val: String(stats.shippedOrders) },
                  { label: 'Clients enregistrés', val: String(stats.totalCustomers) },
                  { label: 'Produits actifs', val: String(stats.totalProducts) },
                  { label: 'Ruptures de stock', val: String(stats.outOfStockProducts) },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white border border-slate-200 p-4 space-y-1">
                    <p className="text-xs text-slate-500">{kpi.label}</p>
                    <p className="text-2xl font-semibold text-slate-900 tabular-nums font-mono">
                      {kpi.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sales Chart */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">
                    Évolution des ventes (MAD)
                  </h2>
                  <span className="text-xs text-slate-500">Commandes hors annulations</span>
                </div>

                {stats.salesSeries.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    Aucune vente enregistrée pour le moment.
                  </p>
                ) : (
                  <div className="h-52 flex items-end gap-4 pt-6 border-b border-slate-200 pb-2 overflow-x-auto">
                    {stats.salesSeries.map((pt) => {
                      const heightPct = Math.max(12, Math.round((pt.revenueMad / maxChartRev) * 100));
                      return (
                        <div key={pt.date} className="flex-1 min-w-[64px] flex flex-col items-center gap-2">
                          <span className="text-[11px] font-mono tabular-nums text-slate-700">
                            {formatMad(pt.revenueMad)}
                          </span>
                          <div className="w-full max-w-[48px] bg-slate-100 h-32 flex items-end">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full bg-[#B68D40] transition-all"
                              title={`${pt.date}: ${formatMad(pt.revenueMad)} (${pt.ordersCount} cmd)`}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{pt.date}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">Dernières commandes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-4">N° Commande</th>
                        <th className="py-2 pr-4">Client</th>
                        <th className="py-2 pr-4">Ville</th>
                        <th className="py-2 pr-4">Statut</th>
                        <th className="py-2 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-4 font-mono font-medium">{o.orderNumber}</td>
                          <td className="py-2.5 pr-4">{o.fullName}</td>
                          <td className="py-2.5 pr-4">{o.city}</td>
                          <td className="py-2.5 pr-4 font-medium">{o.status}</td>
                          <td className="py-2.5 text-right font-mono tabular-nums font-semibold">
                            {formatMad(o.totalMad)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-3 px-4">Produit</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Prix</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Visibilité</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 bg-slate-100 shrink-0 overflow-hidden">
                              <SmartImage src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{p.name}</p>
                              <p className="text-[11px] text-slate-500">
                                {p.brand} · {p.gender} {p.isDemo ? '· Démo' : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.categoryName}</td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          {p.promoPriceMad ? (
                            <div>
                              <span className="font-semibold text-[#946F2B]">
                                {formatMad(p.promoPriceMad)}
                              </span>
                              <span className="block text-[11px] text-slate-400 line-through">
                                {formatMad(p.priceMad)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold">{formatMad(p.priceMad)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          <span className={p.stock <= 0 ? 'text-red-600 font-semibold' : 'text-slate-900'}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(p)}
                            className={`px-2 py-1 text-[11px] font-medium border cursor-pointer ${
                              p.isActive
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-slate-300 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.isActive ? 'Actif' : 'Inactif'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleProductFeatured(p)}
                            className={`px-2 py-1 text-[11px] font-medium border cursor-pointer ${
                              p.isFeatured
                                ? 'border-amber-300 bg-amber-50 text-amber-800'
                                : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {p.isFeatured ? 'En avant' : 'Standard'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                            aria-label="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-red-600 cursor-pointer"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {['Tous', ...ORDER_STATUSES].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium border cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-3 px-4">N° Commande</th>
                      <th className="py-3 px-4">Client & Téléphone</th>
                      <th className="py-3 px-4">Ville</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-semibold">
                          {o.orderNumber}
                          <span className="block text-[11px] font-normal text-slate-500">
                            {new Date(o.createdAt).toLocaleDateString('fr-MA')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900 block">{o.fullName}</span>
                          <span className="text-slate-500">{o.phone}</span>
                        </td>
                        <td className="py-3 px-4">{o.city}</td>
                        <td className="py-3 px-4 font-mono tabular-nums font-semibold">
                          {formatMad(o.totalMad)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              handleOrderStatusChange(o.id, e.target.value as OrderStatus)
                            }
                            className="px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-medium cursor-pointer"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Consulter</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Téléphone & E-mail</th>
                    <th className="py-3 px-4">Ville</th>
                    <th className="py-3 px-4">Commandes</th>
                    <th className="py-3 px-4 text-right">Total achats</th>
                    <th className="py-3 px-4 text-right">Historique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {c.fullName}
                        <span className="block text-[11px] font-normal text-slate-500">
                          Inscrit le {new Date(c.createdAt).toLocaleDateString('fr-MA')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="block">{c.phone}</span>
                        <span className="text-slate-500">{c.email}</span>
                      </td>
                      <td className="py-3 px-4">{c.city}</td>
                      <td className="py-3 px-4 font-mono tabular-nums">{c.ordersCount}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {formatMad(c.totalSpentMad)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleInspectCustomer(c)}
                          className="text-[#946F2B] hover:underline font-medium cursor-pointer"
                        >
                          Voir commandes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: PROMOTIONS */}
          {activeTab === 'promotions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleCreatePromo}
                className="lg:col-span-4 bg-white border border-slate-200 p-6 space-y-4"
              >
                <h2 className="text-base font-semibold text-slate-900">Nouveau code promo</h2>
                <input
                  type="text"
                  required
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="Code (ex: RAMADAN20)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-mono uppercase"
                />
                <input
                  type="text"
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="Libellé de l’offre"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                />
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Réduction (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={promoForm.discountPercent}
                    onChange={(e) => setPromoForm({ ...promoForm, discountPercent: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Date début</label>
                    <input
                      type="date"
                      required
                      value={promoForm.startDate}
                      onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Date fin</label>
                    <input
                      type="date"
                      required
                      value={promoForm.endDate}
                      onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#946F2B] cursor-pointer"
                >
                  Créer la promotion
                </button>
              </form>

              <div className="lg:col-span-8 bg-white border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Réduction</th>
                      <th className="py-3 px-4">Validité</th>
                      <th className="py-3 px-4">Utilisations</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Supprimer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {promotions.map((pr) => (
                      <tr key={pr.id}>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {pr.code}
                          <span className="block font-sans font-normal text-slate-500">
                            {pr.description}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#946F2B]">
                          -{pr.discountPercent}%
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {pr.startDate} → {pr.endDate}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">{pr.usageCount}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePromo(pr)}
                            className={`px-2 py-1 text-[11px] border cursor-pointer ${
                              pr.isActive
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-slate-300 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {pr.isActive ? 'Actif' : 'Désactivé'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePromo(pr.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SITE SETTINGS, MESSAGES & ADMIN PASSWORD */}
          {activeTab === 'settings' && siteSettings && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleSaveSettings}
                className="lg:col-span-7 bg-white border border-slate-200 p-6 space-y-4"
              >
                <h2 className="text-base font-semibold text-slate-900">
                  Identité, Bannières, Coordonnées & Livraison
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Nom de la boutique</label>
                    <input
                      type="text"
                      value={siteSettings.brandName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, brandName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Slogan</label>
                    <input
                      type="text"
                      value={siteSettings.slogan}
                      onChange={(e) => setSiteSettings({ ...siteSettings, slogan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">URL du Logo (optionnel)</label>
                  <input
                    type="text"
                    value={siteSettings.logoUrl}
                    onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                    placeholder="Laisser vide pour le logotype typographique ÉLÉGANCE CASA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Titre principal Hero</label>
                  <input
                    type="text"
                    value={siteSettings.heroTitle}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Sous-titre Hero</label>
                  <textarea
                    rows={2}
                    value={siteSettings.heroSubtitle}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">URL Bannière Hero</label>
                  <input
                    type="text"
                    value={siteSettings.heroBannerUrl}
                    onChange={(e) => setSiteSettings({ ...siteSettings, heroBannerUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Téléphone boutique</label>
                    <input
                      type="text"
                      value={siteSettings.phone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Numéro WhatsApp (format international)</label>
                    <input
                      type="text"
                      value={siteSettings.whatsappNumber}
                      onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Frais de livraison (DH)</label>
                    <input
                      type="number"
                      min={0}
                      value={siteSettings.shippingFeeMad}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, shippingFeeMad: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Seuil livraison gratuite (DH)</label>
                    <input
                      type="number"
                      min={0}
                      value={siteSettings.freeShippingThresholdMad}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          freeShippingThresholdMad: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Adresse & Horaires</label>
                  <input
                    type="text"
                    value={siteSettings.address}
                    onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs mb-2"
                  />
                  <input
                    type="text"
                    value={siteSettings.hours}
                    onChange={(e) => setSiteSettings({ ...siteSettings, hours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="url"
                    value={siteSettings.instagramUrl}
                    onChange={(e) => setSiteSettings({ ...siteSettings, instagramUrl: e.target.value })}
                    placeholder="Instagram URL"
                    className="px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                  />
                  <input
                    type="url"
                    value={siteSettings.facebookUrl}
                    onChange={(e) => setSiteSettings({ ...siteSettings, facebookUrl: e.target.value })}
                    placeholder="Facebook URL"
                    className="px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                  />
                  <input
                    type="url"
                    value={siteSettings.tiktokUrl}
                    onChange={(e) => setSiteSettings({ ...siteSettings, tiktokUrl: e.target.value })}
                    placeholder="TikTok URL"
                    className="px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#946F2B] cursor-pointer"
                >
                  Enregistrer les paramètres
                </button>
              </form>

              <div className="lg:col-span-5 space-y-6">
                {/* Change Password */}
                <form
                  onSubmit={handleChangeAdminPassword}
                  className="bg-white border border-slate-200 p-6 space-y-4"
                >
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#946F2B]" />
                    <span>Modifier le mot de passe administrateur</span>
                  </h2>
                  {authStatus?.envConfigured ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3">
                      Le mot de passe est actuellement piloté par la variable d’environnement{' '}
                      <code className="font-mono">ADMIN_PASSWORD</code> dans vos Secrets.
                    </p>
                  ) : (
                    <>
                      <input
                        type="password"
                        required
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="Mot de passe actuel"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Nouveau mot de passe (min. 8 caractères)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 text-xs"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#946F2B] cursor-pointer"
                      >
                        Mettre à jour le mot de passe
                      </button>
                    </>
                  )}
                </form>

                {/* Messages & Newsletter */}
                <div className="bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#946F2B]" />
                      <span>Messages & Newsletter</span>
                    </h2>
                    <span className="text-xs font-mono text-slate-600">
                      {newsletterCount} inscrit(s) newsletter
                    </span>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {contactMessages.length === 0 ? (
                      <p className="text-xs text-slate-500">Aucun message reçu.</p>
                    ) : (
                      contactMessages.map((m) => (
                        <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between font-semibold text-slate-900">
                            <span>{m.full_name}</span>
                            <span className="font-normal text-slate-500">{m.email}</span>
                          </div>
                          <p className="font-medium text-[#946F2B]">{m.subject}</p>
                          <p className="text-slate-700">{m.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-serif text-2xl font-semibold text-slate-900">
                {editingProduct ? `Modifier : ${editingProduct.name}` : 'Nouvelle monture'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Nom du produit *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Catégorie</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Genre</label>
                  <select
                    value={prodForm.gender}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        gender: e.target.value as 'Homme' | 'Femme' | 'Unisexe',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300"
                  >
                    <option value="Unisexe">Unisexe</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Prix normal (MAD) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={prodForm.priceMad}
                    onChange={(e) => setProdForm({ ...prodForm, priceMad: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Prix promotionnel (MAD, optionnel)</label>
                  <input
                    type="number"
                    min={1}
                    value={prodForm.promoPriceMad}
                    onChange={(e) => setProdForm({ ...prodForm, promoPriceMad: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Couleur principale</label>
                  <input
                    type="text"
                    value={prodForm.color}
                    onChange={(e) => setProdForm({ ...prodForm, color: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Matière</label>
                  <input
                    type="text"
                    value={prodForm.material}
                    onChange={(e) => setProdForm({ ...prodForm, material: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Type de monture</label>
                  <input
                    type="text"
                    value={prodForm.frameType}
                    onChange={(e) => setProdForm({ ...prodForm, frameType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Tailles (séparées par virgule)</label>
                  <input
                    type="text"
                    value={prodForm.sizesText}
                    onChange={(e) => setProdForm({ ...prodForm, sizesText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Coloris (séparés par virgule)</label>
                  <input
                    type="text"
                    value={prodForm.colorsText}
                    onChange={(e) => setProdForm({ ...prodForm, colorsText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300"
                />
              </div>

              {/* Multi-photo manager */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <label className="block font-medium text-slate-800">Photos du produit</label>
                <div className="flex flex-wrap gap-2">
                  {prodForm.images.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-16 border border-slate-300 bg-slate-100">
                      <SmartImage src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setProdForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx),
                          }))
                        }
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Envoi...' : 'Téléverser une photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Ou coller une URL d’image..."
                    className="flex-1 px-3 py-2 border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setProdForm((prev) => ({
                          ...prev,
                          images: [...prev.images, newImageUrl.trim()],
                        }));
                        setNewImageUrl('');
                      }
                    }}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    Ajouter URL
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { key: 'isActive', label: 'Produit actif' },
                  { key: 'isFeatured', label: 'Mettre en avant' },
                  { key: 'isNew', label: 'Nouveauté' },
                  { key: 'isBestseller', label: 'Meilleure vente' },
                ].map((flag) => (
                  <label key={flag.key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(prodForm[flag.key as keyof typeof prodForm])}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, [flag.key]: e.target.checked })
                      }
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white font-semibold cursor-pointer hover:bg-[#946F2B]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-mono text-base font-semibold text-slate-900">
                Commande {selectedOrder.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-700">
              <p>
                <strong>Client :</strong> {selectedOrder.fullName} ({selectedOrder.phone})
              </p>
              <p>
                <strong>E-mail :</strong> {selectedOrder.email}
              </p>
              <p>
                <strong>Livraison :</strong> {selectedOrder.address}, {selectedOrder.city}
              </p>
              {selectedOrder.notes && (
                <p>
                  <strong>Note :</strong> {selectedOrder.notes}
                </p>
              )}
              <p>
                <strong>Paiement :</strong> {selectedOrder.paymentStatus}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
              {selectedOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {it.productName} × {it.quantity} ({it.selectedColor}, {it.selectedSize})
                  </span>
                  <span className="font-mono tabular-nums font-medium">
                    {formatMad(it.lineTotalMad)}
                  </span>
                </div>
              ))}
              {selectedOrder.discountMad > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Remise ({selectedOrder.promoCode})</span>
                  <span className="font-mono tabular-nums">-{formatMad(selectedOrder.discountMad)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Livraison</span>
                <span className="font-mono tabular-nums">{formatMad(selectedOrder.shippingMad)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatMad(selectedOrder.totalMad)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedCustomer.fullName}</h3>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.phone} · {selectedCustomer.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {customerOrders.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune commande trouvée.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
                {customerOrders.map((ord) => (
                  <div key={ord.id} className="p-3 border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-mono font-semibold">{ord.orderNumber}</span>
                      <span className="block text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString('fr-MA')} · {ord.status}
                      </span>
                    </div>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatMad(ord.totalMad)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
