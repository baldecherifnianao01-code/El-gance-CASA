import React, { useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Navbar() {
  const {
    settings,
    cartCount,
    favorites,
    setCartDrawerOpen,
    isSearchOpen,
    setSearchOpen,
    currentPath,
    navigate,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pathname = currentPath.split('?')[0];

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Boutique', href: '/boutique' },
    { label: 'Lunettes de soleil', href: '/lunettes-de-soleil' },
    { label: 'Lunettes de vue', href: '/lunettes-de-vue' },
    { label: 'Promotions', href: '/promotions' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate(q ? `/boutique?search=${encodeURIComponent(q)}` : '/boutique');
  };

  const brandName = settings?.brandName || 'ÉLÉGANCE CASA';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E6DFD3]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark (single line) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-[#111111] hover:text-[#946F2B] transition-colors cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              navigate('/');
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#B68D40]"
          >
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={brandName}
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain"
              />
            ) : null}
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-[0.12em] text-[#111111]">
              {brandName}
            </span>
          </a>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium tracking-wide text-[#27272A]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.href);
                }}
                className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors ${
                  isActive
                    ? 'text-[#111111] border-[#B68D40]'
                    : 'border-transparent hover:text-[#111111] hover:border-[#111111]/40'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Search, Favorites, Account, Bag) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(!isSearchOpen)}
            className="p-2 text-[#27272A] hover:text-[#111111] transition-colors cursor-pointer"
            aria-label="Rechercher une monture"
          >
            <Search className="w-[18px] h-[18px] stroke-[1.75]" />
          </button>

          <a
            href="/compte?tab=favoris"
            onClick={(e) => {
              e.preventDefault();
              navigate('/compte?tab=favoris');
            }}
            className="hidden sm:inline-flex items-center gap-1 p-2 text-[#27272A] hover:text-[#111111] transition-colors relative"
            aria-label="Mes favoris"
          >
            <Heart className="w-[18px] h-[18px] stroke-[1.75]" />
            {favorites.length > 0 && (
              <span className="text-[11px] font-mono tabular-nums text-[#946F2B]">
                {favorites.length}
              </span>
            )}
          </a>

          <a
            href="/compte"
            onClick={(e) => {
              e.preventDefault();
              navigate('/compte');
            }}
            className="hidden sm:inline-flex p-2 text-[#27272A] hover:text-[#111111] transition-colors"
            aria-label="Mon compte et commandes"
          >
            <User className="w-[18px] h-[18px] stroke-[1.75]" />
          </a>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-[#FAF8F5] text-xs font-medium tracking-wide hover:bg-[#27272A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
            <span>Panier</span>
            <span className="font-mono tabular-nums text-[#E6DFD3]">({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="border-t border-[#E6DFD3] bg-[#FAF8F5] px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex items-center gap-3">
            <Search className="w-4 h-4 text-[#27272A]/60 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un modèle, une matière, une couleur (ex : Aviator, Titane, Cat Eye)..."
              className="w-full bg-transparent text-sm text-[#111111] placeholder:text-[#27272A]/50 focus:outline-none py-1.5"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#111111] text-[#FAF8F5] text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#27272A]"
            >
              Rechercher
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1.5 text-[#27272A]/70 hover:text-[#111111] cursor-pointer"
              aria-label="Fermer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E6DFD3] bg-[#FAF8F5] px-4 py-5 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  navigate(link.href);
                }}
                className={`text-base font-medium py-1 ${
                  pathname === link.href ? 'text-[#946F2B]' : 'text-[#111111]'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#E6DFD3] flex flex-wrap gap-4 text-sm text-[#27272A]">
            <a
              href="/compte"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                navigate('/compte');
              }}
              className="hover:text-[#111111]"
            >
              Mon compte
            </a>
            <a
              href="/compte?tab=favoris"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                navigate('/compte?tab=favoris');
              }}
              className="hover:text-[#111111]"
            >
              Favoris ({favorites.length})
            </a>
            <a
              href="/suivi-commande"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                navigate('/suivi-commande');
              }}
              className="hover:text-[#111111]"
            >
              Suivi de commande
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
