import { MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppUrl } from '../lib/api';

export function WhatsAppFloatingButton() {
  const { settings } = useStore();
  const href = buildWhatsAppUrl(
    settings?.whatsappNumber || '212661482090',
    'Bonjour ÉLÉGANCE CASA, je souhaite obtenir un conseil optique.'
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter la boutique ÉLÉGANCE CASA sur WhatsApp"
      className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-3 bg-[#166534] text-white text-xs font-semibold shadow-lg hover:bg-[#14532D] transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline">WhatsApp Boutique</span>
    </a>
  );
}
