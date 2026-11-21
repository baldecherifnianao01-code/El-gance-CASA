import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import type { CartItem, Category, Product, SiteSettings, UserSession } from '../types';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface StoreContextValue {
  settings: SiteSettings | null;
  categories: Category[];
  refreshSettings: () => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  updateCartQty: (productId: number, selectedColor: string, selectedSize: string, quantity: number) => void;
  removeFromCart: (productId: number, selectedColor: string, selectedSize: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotalMad: number;
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  customerUser: UserSession | null;
  customerToken: string | null;
  setCustomerSession: (user: UserSession | null, token: string | null) => void;
  adminUser: UserSession | null;
  adminToken: string | null;
  setAdminSession: (user: UserSession | null, token: string | null) => void;
  toast: ToastState | null;
  showToast: (message: string, tone?: 'success' | 'error' | 'info') => void;
  currentPath: string;
  navigate: (to: string) => void;
  serverError: boolean;
  setServerError: (err: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'elegance_casa_cart_v1';
const FAVORITES_STORAGE_KEY = 'elegance_casa_favorites_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });

  // Auth tokens are strictly held in React memory (never localStorage/sessionStorage)
  const [customerUser, setCustomerUser] = useState<UserSession | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<UserSession | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [isCartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
      setServerError(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', to);
      setCurrentPath(to);
    }
    setServerError(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = useCallback((message: string, tone: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3600);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const [s, cats] = await Promise.all([
        apiRequest<SiteSettings>('/api/settings'),
        apiRequest<Category[]>('/api/categories'),
      ]);
      setSettings(s);
      setCategories(cats);
    } catch {
      setServerError(true);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, selectedColor?: string, selectedSize?: string) => {
      if (product.stock <= 0) {
        showToast('Ce modèle est actuellement en rupture de stock.', 'error');
        return;
      }
      const color = selectedColor || product.colors[0] || product.color;
      const size = selectedSize || product.sizes[0] || 'Standard';

      setCart((prev) => {
        const idx = prev.findIndex(
          (i) =>
            i.product.id === product.id &&
            i.selectedColor === color &&
            i.selectedSize === size
        );
        if (idx >= 0) {
          const next = [...prev];
          const updatedQty = Math.min(product.stock, next[idx].quantity + quantity);
          next[idx] = { ...next[idx], product, quantity: updatedQty };
          return next;
        }
        return [...prev, { product, quantity: Math.min(product.stock, quantity), selectedColor: color, selectedSize: size }];
      });

      showToast(`« ${product.name} » ajouté au panier`, 'success');
      setCartDrawerOpen(true);
    },
    [showToast]
  );

  const updateCartQty = useCallback(
    (productId: number, selectedColor: string, selectedSize: string, quantity: number) => {
      setCart((prev) =>
        prev
          .map((item) => {
            if (
              item.product.id === productId &&
              item.selectedColor === selectedColor &&
              item.selectedSize === selectedSize
            ) {
              if (quantity <= 0) return null;
              return { ...item, quantity: Math.min(item.product.stock, quantity) };
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null)
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: number, selectedColor: string, selectedSize: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
          )
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleFavorite = useCallback(
    (productId: number) => {
      setFavorites((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        showToast(
          exists ? 'Retiré de vos favoris' : 'Ajouté à vos favoris',
          'info'
        );
        return next;
      });
    },
    [showToast]
  );

  const isFavorite = useCallback((productId: number) => favorites.includes(productId), [favorites]);

  const setCustomerSession = useCallback((user: UserSession | null, token: string | null) => {
    setCustomerUser(user);
    setCustomerToken(token);
  }, []);

  const setAdminSession = useCallback((user: UserSession | null, token: string | null) => {
    setAdminUser(user);
    setAdminToken(token);
  }, []);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotalMad = cart.reduce((sum, i) => {
    const unit =
      i.product.promoPriceMad !== null && i.product.promoPriceMad < i.product.priceMad
        ? i.product.promoPriceMad
        : i.product.priceMad;
    return sum + unit * i.quantity;
  }, 0);

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        refreshSettings,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotalMad,
        favorites,
        toggleFavorite,
        isFavorite,
        isCartDrawerOpen,
        setCartDrawerOpen,
        isSearchOpen,
        setSearchOpen,
        customerUser,
        customerToken,
        setCustomerSession,
        adminUser,
        adminToken,
        setAdminSession,
        toast,
        showToast,
        currentPath,
        navigate,
        serverError,
        setServerError,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
