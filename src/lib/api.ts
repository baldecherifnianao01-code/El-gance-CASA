export function formatMad(amount: number): string {
  return `${new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))} DH`;
}

export const MOROCCAN_CITIES: readonly string[] = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Agadir',
  'Fès',
  'Meknès',
  'Kénitra',
  'Oujda',
  'Tétouan',
  'Mohammédia',
  'El Jadida',
  'Bouskoura',
  'Dar Bouazza',
  'Salé',
  'Témara',
  'Essaouira',
  'Béni Mellal',
  'Nador',
  'Autre ville au Maroc',
] as const;

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };
  if (token) {
    mergedHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errMsg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Erreur serveur (${res.status})`;
    throw new Error(errMsg);
  }

  return data as T;
}

// Structure prête pour une extension multilingue ultérieure (FR -> AR)
export const SUPPORTED_LOCALES = ['fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
