import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { settings, navigate } = useStore();

  const linkTo = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <footer className="bg-[#111111] text-[#FAF8F5] border-t border-[#27272A]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold tracking-[0.12em] text-[#FAF8F5]">
              {settings?.brandName || 'ÉLÉGANCE CASA'}
            </h2>
            <p className="text-sm text-[#E6DFD3]/80 italic font-serif">
              {settings?.slogan || '« Le style dans chaque regard. »'}
            </p>
            <p className="text-xs text-[#E6DFD3]/70 leading-relaxed">
              Maison d’optique et lunetterie haut de gamme à Casablanca. Montures d’exception et verres de précision livrés partout au Maroc.
            </p>
          </div>

          {/* Collections */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B68D40]">
              Collections
            </h3>
            <ul className="space-y-2.5 text-sm text-[#E6DFD3]/85">
              <li>
                <a href="/boutique" onClick={linkTo('/boutique')} className="hover:text-[#FAF8F5]">
                  Toute la boutique
                </a>
              </li>
              <li>
                <a
                  href="/lunettes-de-soleil"
                  onClick={linkTo('/lunettes-de-soleil')}
                  className="hover:text-[#FAF8F5]"
                >
                  Lunettes de soleil
                </a>
              </li>
              <li>
                <a
                  href="/lunettes-de-vue"
                  onClick={linkTo('/lunettes-de-vue')}
                  className="hover:text-[#FAF8F5]"
                >
                  Lunettes de vue
                </a>
              </li>
              <li>
                <a href="/promotions" onClick={linkTo('/promotions')} className="hover:text-[#FAF8F5]">
                  Offres & Promotions
                </a>
              </li>
              <li>
                <a href="/suivi-commande" onClick={linkTo('/suivi-commande')} className="hover:text-[#FAF8F5]">
                  Suivi de commande
                </a>
              </li>
            </ul>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B68D40]">
              Maison & Services
            </h3>
            <ul className="space-y-2.5 text-sm text-[#E6DFD3]/85">
              <li>
                <a href="/a-propos" onClick={linkTo('/a-propos')} className="hover:text-[#FAF8F5]">
                  À propos d’ÉLÉGANCE CASA
                </a>
              </li>
              <li>
                <a href="/faq" onClick={linkTo('/faq')} className="hover:text-[#FAF8F5]">
                  Questions fréquentes (FAQ)
                </a>
              </li>
              <li>
                <a
                  href="/livraison-retours"
                  onClick={linkTo('/livraison-retours')}
                  className="hover:text-[#FAF8F5]"
                >
                  Livraison & Retours
                </a>
              </li>
              <li>
                <a href="/cgv" onClick={linkTo('/cgv')} className="hover:text-[#FAF8F5]">
                  Conditions générales de vente
                </a>
              </li>
              <li>
                <a
                  href="/confidentialite"
                  onClick={linkTo('/confidentialite')}
                  className="hover:text-[#FAF8F5]"
                >
                  Politique de confidentialité
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Casablanca */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B68D40]">
              Boutique Casablanca
            </h3>
            <ul className="space-y-3 text-sm text-[#E6DFD3]/85">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B68D40] shrink-0 mt-0.5" />
                <span>{settings?.address || '42 Boulevard d’Anfa, Triangle d’Or, Casablanca'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B68D40] shrink-0" />
                <span>{settings?.phone || '+212 522 39 48 10'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B68D40] shrink-0" />
                <span>{settings?.email || 'contact@elegancecasa.ma'}</span>
              </li>
              <li className="text-xs text-[#E6DFD3]/65">
                {settings?.hours || 'Lun – Sam : 09h30 – 20h00'}
              </li>
            </ul>

            <div className="pt-2 flex items-center gap-4 text-xs">
              {settings?.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#E6DFD3]/80 hover:text-[#B68D40]"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              )}
              {settings?.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E6DFD3]/80 hover:text-[#B68D40]"
                >
                  Facebook
                </a>
              )}
              {settings?.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E6DFD3]/80 hover:text-[#B68D40]"
                >
                  TikTok
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E6DFD3]/60">
          <p>© {new Date().getFullYear()} ÉLÉGANCE CASA — Casablanca, Maroc. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <a href="/contact" onClick={linkTo('/contact')} className="hover:text-[#FAF8F5]">
              Service Client
            </a>
            <a href="/admin" onClick={linkTo('/admin')} className="hover:text-[#B68D40]">
              Espace Administrateur
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
