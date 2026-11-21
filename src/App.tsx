/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage, CheckoutPage } from './pages/CartAndCheckoutPages';
import {
  AboutPage,
  AccountPage,
  ContactPage,
  ErrorPage,
  FaqPage,
  LegalPage,
  OrderTrackingPage,
} from './pages/InfoAndAccountPages';
import { AdminPage } from './pages/AdminPage';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-[#946F2B]">ERREUR 500</p>
            <h1 className="font-serif text-4xl font-semibold text-[#111111]">
              Incident technique temporaire
            </h1>
            <p className="text-sm text-[#27272A]/80">
              Veuillez recharger la page pour rétablir l’affichage de la boutique.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#111111] text-[#FAF8F5] text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouterView() {
  const { currentPath, toast, serverError } = useStore();
  const pathname = currentPath.split('?')[0];

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  const renderPage = () => {
    if (serverError && !isAdminRoute) {
      return <ErrorPage code={500} />;
    }
    if (pathname === '/' || pathname === '') return <HomePage />;
    if (pathname === '/boutique') return <ShopPage />;
    if (pathname === '/lunettes-de-soleil') {
      return (
        <ShopPage
          initialCategory="lunettes-de-soleil"
          pageTitle="Lunettes de soleil"
          pageSubtitle="Verres solaires UV400 et polarisés, sculptés dans les meilleurs acétates italiens et titanes japonais."
        />
      );
    }
    if (pathname === '/lunettes-de-vue') {
      return (
        <ShopPage
          initialCategory="lunettes-de-vue"
          pageTitle="Lunettes de vue"
          pageSubtitle="Montures optiques de précision adaptables à toute correction visuelle dans notre atelier casablancais."
        />
      );
    }
    if (pathname === '/promotions') {
      return (
        <ShopPage
          initialPromoOnly
          pageTitle="Promotions Privilèges"
          pageSubtitle="Sélection exclusive de montures solaires et optiques à tarifs privilégiés pour une durée limitée."
        />
      );
    }
    if (pathname.startsWith('/produit/')) {
      const slug = pathname.replace('/produit/', '').replace(/\/$/, '');
      return <ProductDetailPage slugOrId={slug} />;
    }
    if (pathname === '/panier') return <CartPage />;
    if (pathname === '/commande') return <CheckoutPage />;
    if (pathname === '/suivi-commande') return <OrderTrackingPage />;
    if (pathname === '/compte') return <AccountPage />;
    if (pathname === '/a-propos') return <AboutPage />;
    if (pathname === '/contact') return <ContactPage />;
    if (pathname === '/faq') return <FaqPage />;
    if (pathname === '/cgv') return <LegalPage type="cgv" />;
    if (pathname === '/confidentialite') return <LegalPage type="confidentialite" />;
    if (pathname === '/livraison-retours') return <LegalPage type="livraison" />;
    if (isAdminRoute) return <AdminPage />;
    return <ErrorPage code={404} />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">{renderPage()}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <CartDrawer />}
      {!isAdminRoute && <WhatsAppFloatingButton />}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 left-5 z-50 px-5 py-3 text-xs font-medium shadow-lg border ${
            toast.tone === 'error'
              ? 'bg-[#991B1B] text-white border-[#7F1D1D]'
              : toast.tone === 'info'
                ? 'bg-[#111111] text-[#FAF8F5] border-[#27272A]'
                : 'bg-[#111111] text-[#FAF8F5] border-[#B68D40]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <StoreProvider>
        <RouterView />
      </StoreProvider>
    </AppErrorBoundary>
  );
}
