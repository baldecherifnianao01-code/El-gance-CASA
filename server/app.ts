import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, initDatabase } from './db.ts';
import {
  attachOptionalAuth,
  hashPassword,
  rateLimit,
  requireAdmin,
  requireAuth,
  signToken,
  verifyPassword,
  type AuthenticatedRequest,
} from './auth.ts';
import type { OrderItem, OrderStatus } from '../src/types.ts';
import { ORDER_STATUSES } from '../src/types.ts';

initDatabase();

export const app = express();
const IS_VERCEL = Boolean(process.env.VERCEL);
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!IS_VERCEL && !fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json({ limit: '6mb' }));
if (!IS_VERCEL) {
  app.use('/uploads', express.static(UPLOADS_DIR));
}

function isValidMoroccanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^(\+212|00212|0)[5-7]\d{8}$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && email.length <= 160;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface ProductRow {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category_id: number;
  category_slug: string;
  category_name: string;
  gender: 'Homme' | 'Femme' | 'Unisexe';
  price_mad: number;
  promo_price_mad: number | null;
  stock: number;
  color: string;
  material: string;
  frame_type: string;
  sizes_json: string;
  colors_json: string;
  images_json: string;
  description: string;
  is_active: number;
  is_featured: number;
  is_new: number;
  is_bestseller: number;
  is_demo: number;
  created_at: string;
}

function mapProductRow(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    gender: row.gender,
    priceMad: row.price_mad,
    promoPriceMad: row.promo_price_mad,
    stock: row.stock,
    color: row.color,
    material: row.material,
    frameType: row.frame_type,
    sizes: safeJsonParse<string[]>(row.sizes_json, ['Standard']),
    colors: safeJsonParse<string[]>(row.colors_json, [row.color]),
    images: safeJsonParse<string[]>(row.images_json, []),
    description: row.description,
    isActive: row.is_active === 1,
    isFeatured: row.is_featured === 1,
    isNew: row.is_new === 1,
    isBestseller: row.is_bestseller === 1,
    isDemo: row.is_demo === 1,
    createdAt: row.created_at,
  };
}

interface OrderRow {
  id: number;
  order_number: string;
  customer_id: number | null;
  user_id: number | null;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
  items_json: string;
  subtotal_mad: number;
  discount_mad: number;
  promo_code: string | null;
  shipping_mad: number;
  total_mad: number;
  payment_method: 'cod' | 'electronic';
  payment_status: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

function mapOrderRow(row: OrderRow) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    address: row.address,
    notes: row.notes,
    items: safeJsonParse<OrderItem[]>(row.items_json, []),
    subtotalMad: row.subtotal_mad,
    discountMad: row.discount_mad,
    promoCode: row.promo_code,
    shippingMad: row.shipping_mad,
    totalMad: row.total_mad,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isElectronicGatewayConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_GATEWAY_URL?.trim() &&
      process.env.PAYMENT_GATEWAY_MERCHANT_ID?.trim() &&
      process.env.PAYMENT_GATEWAY_SECRET_KEY?.trim()
  );
}

interface SettingsRow {
  brand_name: string;
  slogan: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  hero_banner_url: string;
  about_text: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  hours: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  shipping_fee_mad: number;
  free_shipping_threshold_mad: number;
  electronic_payment_provider_name: string;
}

function getPublicSettings() {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get() as unknown as SettingsRow;
  return {
    brandName: row.brand_name,
    slogan: row.slogan,
    logoUrl: row.logo_url,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    heroBannerUrl: row.hero_banner_url,
    aboutText: row.about_text,
    phone: row.phone,
    whatsappNumber: row.whatsapp_number,
    email: row.email,
    address: row.address,
    hours: row.hours,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    tiktokUrl: row.tiktok_url,
    shippingFeeMad: row.shipping_fee_mad,
    freeShippingThresholdMad: row.free_shipping_threshold_mad,
    electronicPaymentConfigured: isElectronicGatewayConfigured(),
    electronicPaymentProviderName: row.electronic_payment_provider_name,
  };
}

// ==========================================
// PUBLIC STOREFRONT API
// ==========================================

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'elegance-casa-api' });
});

app.get('/api/settings', (_req, res) => {
  res.json(getPublicSettings());
});

app.get('/api/categories', (_req, res) => {
  const rows = db
    .prepare('SELECT id, slug, name, description, display_order FROM categories ORDER BY display_order ASC')
    .all() as { id: number; slug: string; name: string; description: string; display_order: number }[];
  res.json(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      displayOrder: r.display_order,
    }))
  );
});

app.get('/api/products', (req, res) => {
  const { category, gender, search, promo, isNew, bestseller, featured, sort } = req.query;

  const conditions: string[] = ['p.is_active = 1'];
  const params: (string | number)[] = [];

  if (typeof category === 'string' && category && category !== 'all') {
    conditions.push('c.slug = ?');
    params.push(category);
  }
  if (typeof gender === 'string' && ['Homme', 'Femme', 'Unisexe'].includes(gender)) {
    conditions.push('p.gender = ?');
    params.push(gender);
  }
  if (promo === 'true' || promo === '1') {
    conditions.push('p.promo_price_mad IS NOT NULL AND p.promo_price_mad < p.price_mad');
  }
  if (isNew === 'true' || isNew === '1') {
    conditions.push('p.is_new = 1');
  }
  if (bestseller === 'true' || bestseller === '1') {
    conditions.push('p.is_bestseller = 1');
  }
  if (featured === 'true' || featured === '1') {
    conditions.push('p.is_featured = 1');
  }
  if (typeof search === 'string' && search.trim()) {
    const q = `%${search.trim().slice(0, 80)}%`;
    conditions.push('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.color LIKE ? OR p.material LIKE ?)');
    params.push(q, q, q, q, q);
  }

  let orderBy = 'p.is_featured DESC, p.id ASC';
  if (sort === 'price_asc') {
    orderBy = 'COALESCE(p.promo_price_mad, p.price_mad) ASC';
  } else if (sort === 'price_desc') {
    orderBy = 'COALESCE(p.promo_price_mad, p.price_mad) DESC';
  } else if (sort === 'newest') {
    orderBy = 'p.is_new DESC, p.id DESC';
  }

  const sql = `
    SELECT p.*, c.slug AS category_slug, c.name AS category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
  `;

  const rows = db.prepare(sql).all(...params) as unknown as ProductRow[];
  res.json(rows.map(mapProductRow));
});

app.get('/api/products/:slugOrId', (req, res) => {
  const param = req.params.slugOrId;
  const isNumeric = /^\d+$/.test(param);
  const row = db
    .prepare(
      `SELECT p.*, c.slug AS category_slug, c.name AS category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND ${isNumeric ? 'p.id = ?' : 'p.slug = ?'}
       LIMIT 1`
    )
    .get(isNumeric ? Number(param) : param) as unknown as ProductRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  const reviews = db
    .prepare(
      'SELECT id, product_id, author_name, city, rating, comment, verified, created_at FROM reviews WHERE product_id = ? ORDER BY id DESC'
    )
    .all(row.id) as {
    id: number;
    product_id: number;
    author_name: string;
    city: string;
    rating: number;
    comment: string;
    verified: number;
    created_at: string;
  }[];

  res.json({
    product: mapProductRow(row),
    reviews: reviews.map((r) => ({
      id: r.id,
      productId: r.product_id,
      authorName: r.author_name,
      city: r.city,
      rating: r.rating,
      comment: r.comment,
      verified: r.verified === 1,
      createdAt: r.created_at,
    })),
  });
});

app.get('/api/reviews', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, product_id, author_name, city, rating, comment, verified, created_at FROM reviews ORDER BY id DESC LIMIT 12'
    )
    .all() as {
    id: number;
    product_id: number | null;
    author_name: string;
    city: string;
    rating: number;
    comment: string;
    verified: number;
    created_at: string;
  }[];
  res.json(
    rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      authorName: r.author_name,
      city: r.city,
      rating: r.rating,
      comment: r.comment,
      verified: r.verified === 1,
      createdAt: r.created_at,
    }))
  );
});

app.post('/api/reviews', rateLimit('review', 8, 60_000), (req, res) => {
  const { productId, authorName, city, rating, comment, website } = req.body ?? {};
  if (typeof website === 'string' && website.trim() !== '') {
    res.status(400).json({ error: 'Requête rejetée.' });
    return;
  }
  if (typeof authorName !== 'string' || authorName.trim().length < 2 || authorName.length > 80) {
    res.status(400).json({ error: 'Veuillez indiquer votre nom.' });
    return;
  }
  if (typeof comment !== 'string' || comment.trim().length < 8 || comment.length > 600) {
    res.status(400).json({ error: 'Votre avis doit contenir entre 8 et 600 caractères.' });
    return;
  }
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400).json({ error: 'Note invalide (1 à 5).' });
    return;
  }
  const pid = productId ? Number(productId) : null;
  if (pid !== null) {
    const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(pid);
    if (!exists) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }
  }
  const cityStr = typeof city === 'string' && city.trim() ? city.trim().slice(0, 60) : 'Casablanca';
  const result = db
    .prepare(
      'INSERT INTO reviews (product_id, author_name, city, rating, comment, verified) VALUES (?, ?, ?, ?, ?, 0)'
    )
    .run(pid, authorName.trim(), cityStr, numericRating, comment.trim());

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    productId: pid,
    authorName: authorName.trim(),
    city: cityStr,
    rating: numericRating,
    comment: comment.trim(),
    verified: false,
    createdAt: new Date().toISOString(),
  });
});

app.post('/api/promotions/validate', rateLimit('promo', 25, 60_000), (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!code || code.length > 40) {
    res.status(400).json({ error: 'Code promotionnel invalide.' });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const promo = db
    .prepare(
      `SELECT id, code, description, discount_percent, start_date, end_date, is_active
       FROM promotions
       WHERE UPPER(code) = ? AND is_active = 1 AND start_date <= ? AND end_date >= ?
       LIMIT 1`
    )
    .get(code, today, today) as
    | {
        id: number;
        code: string;
        description: string;
        discount_percent: number;
        start_date: string;
        end_date: string;
      }
    | undefined;

  if (!promo) {
    res.status(404).json({ error: 'Ce code promotionnel est invalide ou expiré.' });
    return;
  }
  res.json({
    code: promo.code,
    description: promo.description,
    discountPercent: promo.discount_percent,
  });
});

app.post('/api/orders', attachOptionalAuth, rateLimit('order', 12, 60_000), (req: AuthenticatedRequest, res) => {
  const body = req.body ?? {};
  // Honeypot anti-spam protection
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    res.status(400).json({ error: 'Soumission rejetée.' });
    return;
  }

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const city = typeof body.city === 'string' ? body.city.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';
  const paymentMethod = body.paymentMethod === 'electronic' ? 'electronic' : 'cod';
  const promoCodeInput = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : '';
  const idempotencyKey =
    typeof body.idempotencyKey === 'string' && body.idempotencyKey.trim().length >= 8
      ? body.idempotencyKey.trim().slice(0, 100)
      : crypto.randomUUID();

  if (fullName.length < 3 || fullName.length > 100) {
    res.status(400).json({ error: 'Veuillez saisir votre nom complet (minimum 3 caractères).' });
    return;
  }
  if (!isValidMoroccanPhone(phone)) {
    res.status(400).json({
      error: 'Numéro de téléphone marocain invalide (ex. 06 61 48 20 90 ou +212 6 61 48 20 90).',
    });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Adresse e-mail invalide.' });
    return;
  }
  if (city.length < 2 || city.length > 60) {
    res.status(400).json({ error: 'Veuillez sélectionner votre ville au Maroc.' });
    return;
  }
  if (address.length < 6 || address.length > 240) {
    res.status(400).json({ error: 'Veuillez préciser votre adresse complète de livraison.' });
    return;
  }

  // Strictly refuse simulating electronic payment if no real gateway is connected
  if (paymentMethod === 'electronic' && !isElectronicGatewayConfigured()) {
    res.status(400).json({
      error:
        'La passerelle de paiement électronique (CMI / Carte Bancaire) n’est pas encore connectée. Veuillez sélectionner le Paiement à la livraison.',
    });
    return;
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 30) {
    res.status(400).json({ error: 'Votre panier est vide ou contient trop d’articles.' });
    return;
  }

  // Duplicate order protection via idempotencyKey
  const existingOrder = db
    .prepare('SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1')
    .get(idempotencyKey) as unknown as OrderRow | undefined;
  if (existingOrder) {
    res.status(200).json({ order: mapOrderRow(existingOrder), deduplicated: true });
    return;
  }

  try {
    db.exec('BEGIN IMMEDIATE');

    const verifiedItems: OrderItem[] = [];
    let subtotalMad = 0;

    for (const item of rawItems) {
      const productId = Number(item?.productId);
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        throw new Error('VALIDATION:Article ou quantité invalide.');
      }

      const prod = db
        .prepare('SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1')
        .get(productId) as unknown as ProductRow | undefined;
      if (!prod) {
        throw new Error('VALIDATION:Un produit de votre panier n’est plus disponible.');
      }
      if (prod.stock < quantity) {
        throw new Error(`VALIDATION:Stock insuffisant pour « ${prod.name} » (${prod.stock} restant).`);
      }

      const unitPrice =
        prod.promo_price_mad !== null && prod.promo_price_mad < prod.price_mad
          ? prod.promo_price_mad
          : prod.price_mad;
      const lineTotal = Math.round(unitPrice * quantity);
      subtotalMad += lineTotal;

      const images = safeJsonParse<string[]>(prod.images_json, []);
      verifiedItems.push({
        productId: prod.id,
        productName: prod.name,
        image: images[0] || '',
        unitPriceMad: unitPrice,
        quantity,
        selectedColor:
          typeof item.selectedColor === 'string' && item.selectedColor.trim()
            ? item.selectedColor.trim().slice(0, 60)
            : prod.color,
        selectedSize:
          typeof item.selectedSize === 'string' && item.selectedSize.trim()
            ? item.selectedSize.trim().slice(0, 40)
            : 'Standard',
        lineTotalMad: lineTotal,
      });

      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, prod.id);
    }

    let discountMad = 0;
    let appliedPromoCode: string | null = null;

    if (promoCodeInput) {
      const today = new Date().toISOString().slice(0, 10);
      const promo = db
        .prepare(
          'SELECT * FROM promotions WHERE UPPER(code) = ? AND is_active = 1 AND start_date <= ? AND end_date >= ? LIMIT 1'
        )
        .get(promoCodeInput, today, today) as
        | { id: number; code: string; discount_percent: number }
        | undefined;
      if (!promo) {
        throw new Error('VALIDATION:Le code promotionnel saisi est invalide ou expiré.');
      }
      discountMad = Math.round((subtotalMad * promo.discount_percent) / 100);
      appliedPromoCode = promo.code;
      db.prepare('UPDATE promotions SET usage_count = usage_count + 1 WHERE id = ?').run(promo.id);
    }

    const settings = getPublicSettings();
    const afterDiscount = Math.max(0, subtotalMad - discountMad);
    const shippingMad = afterDiscount >= settings.freeShippingThresholdMad ? 0 : settings.shippingFeeMad;
    const totalMad = afterDiscount + shippingMad;

    // Upsert customer record
    const existingCustomer = db
      .prepare('SELECT id FROM customers WHERE phone = ? OR LOWER(email) = LOWER(?) LIMIT 1')
      .get(phone, email) as { id: number } | undefined;

    let customerId: number;
    const authUserId = req.authUser?.role === 'customer' ? req.authUser.uid : null;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      db.prepare(
        `UPDATE customers
         SET full_name = ?, city = ?, address = ?, orders_count = orders_count + 1, total_spent_mad = total_spent_mad + ?, user_id = COALESCE(user_id, ?)
         WHERE id = ?`
      ).run(fullName, city, address, totalMad, authUserId, customerId);
    } else {
      const custRes = db
        .prepare(
          `INSERT INTO customers (user_id, full_name, phone, email, city, address, orders_count, total_spent_mad)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
        )
        .run(authUserId, fullName, phone, email.toLowerCase(), city, address, totalMad);
      customerId = Number(custRes.lastInsertRowid);
    }

    const countRow = db.prepare('SELECT COUNT(*) AS cnt FROM orders').get() as { cnt: number };
    const seq = 1001 + countRow.cnt;
    const orderNumber = `EC-${new Date().getFullYear()}-${seq}`;

    const insertRes = db
      .prepare(
        `INSERT INTO orders (
          order_number, idempotency_key, customer_id, user_id, full_name, phone, email, city, address, notes,
          items_json, subtotal_mad, discount_mad, promo_code, shipping_mad, total_mad,
          payment_method, payment_status, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        orderNumber,
        idempotencyKey,
        customerId,
        authUserId,
        fullName,
        phone,
        email.toLowerCase(),
        city,
        address,
        notes,
        JSON.stringify(verifiedItems),
        subtotalMad,
        discountMad,
        appliedPromoCode,
        shippingMad,
        totalMad,
        paymentMethod,
        'À payer à la livraison',
        'En attente'
      );

    const createdOrder = db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(Number(insertRes.lastInsertRowid)) as unknown as OrderRow;

    db.exec('COMMIT');
    res.status(201).json({ order: mapOrderRow(createdOrder), deduplicated: false });
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback errors if transaction wasn't active
    }
    const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement de la commande.';
    if (msg.startsWith('VALIDATION:')) {
      res.status(400).json({ error: msg.replace('VALIDATION:', '') });
      return;
    }
    res.status(500).json({ error: 'Impossible de finaliser la commande pour le moment.' });
  }
});

app.get('/api/orders/track', rateLimit('track', 20, 60_000), (req, res) => {
  const orderNumber = typeof req.query.orderNumber === 'string' ? req.query.orderNumber.trim().toUpperCase() : '';
  const phone = typeof req.query.phone === 'string' ? req.query.phone.replace(/[\s\-().]/g, '') : '';

  if (!orderNumber || !phone) {
    res.status(400).json({ error: 'Veuillez renseigner le numéro de commande et votre numéro de téléphone.' });
    return;
  }

  const row = db
    .prepare('SELECT * FROM orders WHERE UPPER(order_number) = ? LIMIT 1')
    .get(orderNumber) as unknown as OrderRow | undefined;

  if (!row || row.phone.replace(/[\s\-().]/g, '') !== phone) {
    res.status(404).json({ error: 'Aucune commande trouvée avec ces coordonnées.' });
    return;
  }

  res.json({ order: mapOrderRow(row) });
});

app.post('/api/newsletter', rateLimit('newsletter', 10, 60_000), (req, res) => {
  const { email, website } = req.body ?? {};
  if (typeof website === 'string' && website.trim() !== '') {
    res.status(400).json({ error: 'Requête rejetée.' });
    return;
  }
  if (typeof email !== 'string' || !isValidEmail(email)) {
    res.status(400).json({ error: 'Veuillez saisir une adresse e-mail valide.' });
    return;
  }
  try {
    db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(email.trim().toLowerCase());
    res.status(201).json({ ok: true, message: 'Merci. Vous êtes inscrit(e) aux éditions privées ÉLÉGANCE CASA.' });
  } catch {
    res.status(500).json({ error: 'Erreur lors de l’inscription.' });
  }
});

app.post('/api/contact', rateLimit('contact', 8, 60_000), (req, res) => {
  const { fullName, email, phone, subject, message, website } = req.body ?? {};
  if (typeof website === 'string' && website.trim() !== '') {
    res.status(400).json({ error: 'Requête rejetée.' });
    return;
  }
  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.length > 100) {
    res.status(400).json({ error: 'Veuillez indiquer votre nom complet.' });
    return;
  }
  if (typeof email !== 'string' || !isValidEmail(email)) {
    res.status(400).json({ error: 'Adresse e-mail invalide.' });
    return;
  }
  if (typeof subject !== 'string' || subject.trim().length < 2 || subject.length > 140) {
    res.status(400).json({ error: 'Veuillez indiquer l’objet de votre demande.' });
    return;
  }
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 2000) {
    res.status(400).json({ error: 'Votre message doit contenir au moins 10 caractères.' });
    return;
  }

  db.prepare(
    'INSERT INTO contact_messages (full_name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
  ).run(
    fullName.trim(),
    email.trim().toLowerCase(),
    typeof phone === 'string' ? phone.trim().slice(0, 30) : '',
    subject.trim(),
    message.trim()
  );

  res.status(201).json({ ok: true, message: 'Votre message a bien été transmis à notre boutique de Casablanca.' });
});

// ==========================================
// CUSTOMER AUTHENTICATION & ORDER HISTORY
// ==========================================

app.post('/api/auth/register', rateLimit('register', 8, 60_000), (req, res) => {
  const { fullName, email, phone, password } = req.body ?? {};
  if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.length > 100) {
    res.status(400).json({ error: 'Nom complet requis.' });
    return;
  }
  if (typeof email !== 'string' || !isValidEmail(email)) {
    res.status(400).json({ error: 'Adresse e-mail invalide.' });
    return;
  }
  if (typeof phone !== 'string' || !isValidMoroccanPhone(phone)) {
    res.status(400).json({ error: 'Téléphone marocain invalide.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 120) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db
    .prepare('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1')
    .get(normalizedEmail, normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO users (username, email, full_name, phone, role, password_hash)
       VALUES (?, ?, ?, ?, 'customer', ?)`
    )
    .run(normalizedEmail, normalizedEmail, fullName.trim(), phone.trim(), hashPassword(password));

  const uid = Number(result.lastInsertRowid);
  const token = signToken({ uid, username: normalizedEmail, role: 'customer' });
  const user = db
    .prepare('SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?')
    .get(uid) as {
    id: number;
    username: string;
    email: string;
    full_name: string;
    phone: string;
    role: 'customer';
    created_at: string;
  };

  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

app.post('/api/auth/login', rateLimit('login', 12, 60_000), (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Identifiants requis.' });
    return;
  }
  const user = db
    .prepare("SELECT * FROM users WHERE LOWER(email) = ? AND role = 'customer' LIMIT 1")
    .get(email.trim().toLowerCase()) as
    | {
        id: number;
        username: string;
        email: string;
        full_name: string;
        phone: string;
        role: 'customer';
        password_hash: string;
        created_at: string;
      }
    | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' });
    return;
  }

  const token = signToken({ uid: user.id, username: user.username, role: 'customer' });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db
    .prepare('SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?')
    .get(req.authUser!.uid) as
    | {
        id: number;
        username: string;
        email: string;
        full_name: string;
        phone: string;
        role: 'admin' | 'customer';
        created_at: string;
      }
    | undefined;
  if (!user) {
    res.status(401).json({ error: 'Utilisateur introuvable.' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

app.get('/api/auth/orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db
    .prepare('SELECT id, email, phone FROM users WHERE id = ?')
    .get(req.authUser!.uid) as { id: number; email: string; phone: string } | undefined;
  if (!user) {
    res.status(401).json({ error: 'Utilisateur introuvable.' });
    return;
  }
  const rows = db
    .prepare(
      'SELECT * FROM orders WHERE user_id = ? OR LOWER(email) = LOWER(?) ORDER BY id DESC'
    )
    .all(user.id, user.email) as unknown as OrderRow[];
  res.json({ orders: rows.map(mapOrderRow) });
});

// ==========================================
// ADMIN AUTHENTICATION & SETUP
// ==========================================

app.get('/api/admin/auth/status', (_req, res) => {
  const envConfigured = Boolean(process.env.ADMIN_PASSWORD?.trim());
  const existingAdmin = db
    .prepare("SELECT id, username FROM users WHERE role = 'admin' LIMIT 1")
    .get() as { id: number; username: string } | undefined;

  res.json({
    needsInitialSetup: !envConfigured && !existingAdmin,
    envConfigured,
    defaultUsername: (process.env.ADMIN_USERNAME?.trim() || existingAdmin?.username || 'admin').toLowerCase(),
  });
});

app.post('/api/admin/auth/setup', rateLimit('admin-setup', 6, 60_000), (req, res) => {
  if (process.env.ADMIN_PASSWORD?.trim()) {
    res.status(403).json({
      error: 'Un mot de passe administrateur est déjà défini via les variables d’environnement.',
    });
    return;
  }

  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    .get();
  if (existingAdmin) {
    res.status(409).json({ error: 'Le compte administrateur initial a déjà été configuré.' });
    return;
  }

  const username =
    typeof req.body?.username === 'string' && req.body.username.trim()
      ? req.body.username.trim().toLowerCase()
      : 'admin';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!/^[a-z0-9_.-]{3,40}$/.test(username)) {
    res.status(400).json({ error: 'Identifiant administrateur invalide (3 à 40 caractères alphanumériques).' });
    return;
  }
  if (password.length < 8 || password.length > 128) {
    res.status(400).json({ error: 'Le mot de passe initial doit contenir au moins 8 caractères.' });
    return;
  }

  const hashed = hashPassword(password);
  const resInsert = db
    .prepare(
      `INSERT INTO users (username, email, full_name, phone, role, password_hash)
       VALUES (?, ?, ?, ?, 'admin', ?)`
    )
    .run(username, 'admin@elegancecasa.ma', 'Administrateur ÉLÉGANCE CASA', '+212600000000', hashed);

  const uid = Number(resInsert.lastInsertRowid);
  const token = signToken({ uid, username, role: 'admin' });

  res.status(201).json({
    token,
    user: {
      id: uid,
      username,
      email: 'admin@elegancecasa.ma',
      fullName: 'Administrateur ÉLÉGANCE CASA',
      phone: '+212600000000',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  });
});

app.post('/api/admin/auth/login', rateLimit('admin-login', 10, 60_000), (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
    return;
  }

  const envUsername = (process.env.ADMIN_USERNAME?.trim() || 'admin').toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();

  // Check environment secret override first if configured
  if (envPassword) {
    const userMatch =
      username.length === envUsername.length &&
      crypto.timingSafeEqual(Buffer.from(username), Buffer.from(envUsername));
    const passBufA = crypto.createHash('sha256').update(password).digest();
    const passBufB = crypto.createHash('sha256').update(envPassword).digest();
    const passMatch = crypto.timingSafeEqual(passBufA, passBufB);

    if (!userMatch || !passMatch) {
      res.status(401).json({ error: 'Identifiants administrateur invalides.' });
      return;
    }

    let adminUser = db
      .prepare("SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE role = 'admin' LIMIT 1")
      .get() as
      | {
          id: number;
          username: string;
          email: string;
          full_name: string;
          phone: string;
          role: 'admin';
          created_at: string;
        }
      | undefined;

    if (!adminUser) {
      const ins = db
        .prepare(
          `INSERT INTO users (username, email, full_name, phone, role, password_hash)
           VALUES (?, ?, ?, ?, 'admin', ?)`
        )
        .run(
          envUsername,
          'admin@elegancecasa.ma',
          'Administrateur ÉLÉGANCE CASA',
          '+212600000000',
          hashPassword(envPassword)
        );
      adminUser = db
        .prepare('SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?')
        .get(Number(ins.lastInsertRowid)) as typeof adminUser;
    }

    const token = signToken({ uid: adminUser!.id, username: adminUser!.username, role: 'admin' });
    res.json({
      token,
      user: {
        id: adminUser!.id,
        username: adminUser!.username,
        email: adminUser!.email,
        fullName: adminUser!.full_name,
        phone: adminUser!.phone,
        role: adminUser!.role,
        createdAt: adminUser!.created_at,
      },
    });
    return;
  }

  // Otherwise verify against salted scrypt hash in SQLite
  const adminUser = db
    .prepare("SELECT * FROM users WHERE LOWER(username) = ? AND role = 'admin' LIMIT 1")
    .get(username) as
    | {
        id: number;
        username: string;
        email: string;
        full_name: string;
        phone: string;
        role: 'admin';
        password_hash: string;
        created_at: string;
      }
    | undefined;

  if (!adminUser || !verifyPassword(password, adminUser.password_hash)) {
    res.status(401).json({ error: 'Identifiants administrateur invalides.' });
    return;
  }

  const token = signToken({ uid: adminUser.id, username: adminUser.username, role: 'admin' });
  res.json({
    token,
    user: {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      fullName: adminUser.full_name,
      phone: adminUser.phone,
      role: adminUser.role,
      createdAt: adminUser.created_at,
    },
  });
});

app.post('/api/admin/auth/change-password', requireAdmin, (req: AuthenticatedRequest, res) => {
  if (process.env.ADMIN_PASSWORD?.trim()) {
    res.status(400).json({
      error:
        'Le mot de passe administrateur est actuellement piloté par la variable d’environnement ADMIN_PASSWORD. Modifiez-la dans vos Secrets pour le changer.',
    });
    return;
  }

  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis.' });
    return;
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    return;
  }

  const adminUser = db
    .prepare("SELECT id, password_hash FROM users WHERE id = ? AND role = 'admin' LIMIT 1")
    .get(req.authUser!.uid) as { id: number; password_hash: string } | undefined;

  if (!adminUser || !verifyPassword(currentPassword, adminUser.password_hash)) {
    res.status(401).json({ error: 'Le mot de passe actuel est incorrect.' });
    return;
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    hashPassword(newPassword),
    adminUser.id
  );

  res.json({ ok: true, message: 'Mot de passe administrateur mis à jour avec succès.' });
});

// ==========================================
// ADMIN PROTECTED API ROUTES
// ==========================================

app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  const revenueRow = db
    .prepare("SELECT COALESCE(SUM(total_mad), 0) AS total FROM orders WHERE status != 'Annulée'")
    .get() as { total: number };
  const countsRow = db
    .prepare(
      `SELECT
         COUNT(*) AS totalOrders,
         SUM(CASE WHEN status = 'En attente' THEN 1 ELSE 0 END) AS pendingOrders,
         SUM(CASE WHEN status = 'Confirmée' THEN 1 ELSE 0 END) AS confirmedOrders,
         SUM(CASE WHEN status = 'Expédiée' THEN 1 ELSE 0 END) AS shippedOrders,
         SUM(CASE WHEN status = 'Livrée' THEN 1 ELSE 0 END) AS deliveredOrders
       FROM orders`
    )
    .get() as {
    totalOrders: number;
    pendingOrders: number | null;
    confirmedOrders: number | null;
    shippedOrders: number | null;
    deliveredOrders: number | null;
  };
  const custRow = db.prepare('SELECT COUNT(*) AS cnt FROM customers').get() as { cnt: number };
  const prodStats = db
    .prepare(
      `SELECT
         COUNT(*) AS totalProducts,
         SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) AS outOfStockProducts
       FROM products`
    )
    .get() as { totalProducts: number; outOfStockProducts: number | null };

  const salesSeries = db
    .prepare(
      `SELECT
         substr(created_at, 1, 10) AS date,
         COALESCE(SUM(total_mad), 0) AS revenueMad,
         COUNT(*) AS ordersCount
       FROM orders
       WHERE status != 'Annulée'
       GROUP BY substr(created_at, 1, 10)
       ORDER BY date ASC
       LIMIT 30`
    )
    .all() as { date: string; revenueMad: number; ordersCount: number }[];

  const recentOrders = (
    db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 6').all() as unknown as OrderRow[]
  ).map(mapOrderRow);

  res.json({
    revenueMad: revenueRow.total,
    totalOrders: countsRow.totalOrders,
    pendingOrders: countsRow.pendingOrders ?? 0,
    confirmedOrders: countsRow.confirmedOrders ?? 0,
    shippedOrders: countsRow.shippedOrders ?? 0,
    deliveredOrders: countsRow.deliveredOrders ?? 0,
    totalCustomers: custRow.cnt,
    totalProducts: prodStats.totalProducts,
    outOfStockProducts: prodStats.outOfStockProducts ?? 0,
    salesSeries,
    recentOrders,
  });
});

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.slug AS category_slug, c.name AS category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.id DESC`
    )
    .all() as unknown as ProductRow[];
  res.json(rows.map(mapProductRow));
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const b = req.body ?? {};
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const brand = typeof b.brand === 'string' && b.brand.trim() ? b.brand.trim() : 'ÉLÉGANCE CASA';
  const categoryId = Number(b.categoryId);
  const gender = ['Homme', 'Femme', 'Unisexe'].includes(b.gender) ? b.gender : 'Unisexe';
  const priceMad = Number(b.priceMad);
  const promoPriceMad =
    b.promoPriceMad !== null && b.promoPriceMad !== '' && b.promoPriceMad !== undefined
      ? Number(b.promoPriceMad)
      : null;
  const stock = Number(b.stock ?? 0);
  const color = typeof b.color === 'string' ? b.color.trim() : 'Noir';
  const material = typeof b.material === 'string' ? b.material.trim() : 'Acétate';
  const frameType = typeof b.frameType === 'string' ? b.frameType.trim() : 'Cerclée';
  const description = typeof b.description === 'string' ? b.description.trim() : '';

  if (name.length < 2 || !Number.isFinite(priceMad) || priceMad <= 0 || !Number.isInteger(stock) || stock < 0) {
    res.status(400).json({ error: 'Nom, prix valide et stock entier positif requis.' });
    return;
  }
  if (promoPriceMad !== null && (!Number.isFinite(promoPriceMad) || promoPriceMad <= 0 || promoPriceMad >= priceMad)) {
    res.status(400).json({ error: 'Le prix promotionnel doit être inférieur au prix normal.' });
    return;
  }
  const catExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
  if (!catExists) {
    res.status(400).json({ error: 'Catégorie invalide.' });
    return;
  }

  const baseSlug = slugify(name) || `monture-${Date.now()}`;
  const slugConflict = db.prepare('SELECT id FROM products WHERE slug = ?').get(baseSlug);
  const finalSlug = slugConflict ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const sizes = Array.isArray(b.sizes) && b.sizes.length ? b.sizes.map(String) : ['Standard'];
  const colors = Array.isArray(b.colors) && b.colors.length ? b.colors.map(String) : [color];
  const images = Array.isArray(b.images) ? b.images.map(String).filter(Boolean) : [];

  const ins = db
    .prepare(
      `INSERT INTO products (
        slug, name, brand, category_id, gender, price_mad, promo_price_mad, stock,
        color, material, frame_type, sizes_json, colors_json, images_json, description,
        is_active, is_featured, is_new, is_bestseller, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .run(
      finalSlug,
      name,
      brand,
      categoryId,
      gender,
      priceMad,
      promoPriceMad,
      stock,
      color,
      material,
      frameType,
      JSON.stringify(sizes),
      JSON.stringify(colors),
      JSON.stringify(images),
      description,
      b.isActive === false ? 0 : 1,
      b.isFeatured ? 1 : 0,
      b.isNew ? 1 : 0,
      b.isBestseller ? 1 : 0
    );

  const created = db
    .prepare(
      `SELECT p.*, c.slug AS category_slug, c.name AS category_name
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`
    )
    .get(Number(ins.lastInsertRowid)) as unknown as ProductRow;

  res.status(201).json(mapProductRow(created));
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  const b = req.body ?? {};
  const name = typeof b.name === 'string' && b.name.trim() ? b.name.trim() : existing.name;
  const brand = typeof b.brand === 'string' && b.brand.trim() ? b.brand.trim() : existing.brand;
  const categoryId = b.categoryId ? Number(b.categoryId) : existing.category_id;
  const gender = ['Homme', 'Femme', 'Unisexe'].includes(b.gender) ? b.gender : existing.gender;
  const priceMad = b.priceMad !== undefined ? Number(b.priceMad) : existing.price_mad;
  const promoPriceMad =
    b.promoPriceMad === null || b.promoPriceMad === ''
      ? null
      : b.promoPriceMad !== undefined
        ? Number(b.promoPriceMad)
        : existing.promo_price_mad;
  const stock = b.stock !== undefined ? Number(b.stock) : existing.stock;
  const color = typeof b.color === 'string' ? b.color.trim() : existing.color;
  const material = typeof b.material === 'string' ? b.material.trim() : existing.material;
  const frameType = typeof b.frameType === 'string' ? b.frameType.trim() : existing.frame_type;
  const description = typeof b.description === 'string' ? b.description.trim() : existing.description;

  if (!Number.isFinite(priceMad) || priceMad <= 0 || !Number.isInteger(stock) || stock < 0) {
    res.status(400).json({ error: 'Prix ou stock invalide.' });
    return;
  }
  if (promoPriceMad !== null && (!Number.isFinite(promoPriceMad) || promoPriceMad <= 0 || promoPriceMad >= priceMad)) {
    res.status(400).json({ error: 'Le prix promotionnel doit être inférieur au prix normal.' });
    return;
  }

  const sizes = Array.isArray(b.sizes) ? JSON.stringify(b.sizes.map(String)) : existing.sizes_json;
  const colors = Array.isArray(b.colors) ? JSON.stringify(b.colors.map(String)) : existing.colors_json;
  const images = Array.isArray(b.images) ? JSON.stringify(b.images.map(String).filter(Boolean)) : existing.images_json;

  db.prepare(
    `UPDATE products SET
       name = ?, brand = ?, category_id = ?, gender = ?, price_mad = ?, promo_price_mad = ?, stock = ?,
       color = ?, material = ?, frame_type = ?, sizes_json = ?, colors_json = ?, images_json = ?, description = ?,
       is_active = ?, is_featured = ?, is_new = ?, is_bestseller = ?, is_demo = 0
     WHERE id = ?`
  ).run(
    name,
    brand,
    categoryId,
    gender,
    priceMad,
    promoPriceMad,
    stock,
    color,
    material,
    frameType,
    sizes,
    colors,
    images,
    description,
    b.isActive === undefined ? existing.is_active : b.isActive ? 1 : 0,
    b.isFeatured === undefined ? existing.is_featured : b.isFeatured ? 1 : 0,
    b.isNew === undefined ? existing.is_new : b.isNew ? 1 : 0,
    b.isBestseller === undefined ? existing.is_bestseller : b.isBestseller ? 1 : 0,
    id
  );

  const updated = db
    .prepare(
      `SELECT p.*, c.slug AS category_slug, c.name AS category_name
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`
    )
    .get(id) as unknown as ProductRow;

  res.json(mapProductRow(updated));
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.post('/api/admin/upload', requireAdmin, (req, res) => {
  const { filename, mimeType, dataBase64 } = req.body ?? {};
  const allowedMimes = new Map<string, string>([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
  ]);

  if (typeof mimeType !== 'string' || !allowedMimes.has(mimeType)) {
    res.status(400).json({ error: 'Format d’image non pris en charge (JPG, PNG ou WebP uniquement).' });
    return;
  }
  if (typeof dataBase64 !== 'string' || !dataBase64) {
    res.status(400).json({ error: 'Contenu image manquant.' });
    return;
  }

  const cleanBase64 = dataBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0 || buffer.length > 3 * 1024 * 1024) {
    res.status(400).json({ error: 'L’image doit peser moins de 3 Mo.' });
    return;
  }

  if (IS_VERCEL) {
    res.status(201).json({ url: `data:${mimeType};base64,${buffer.toString('base64')}` });
    return;
  }

  const ext = allowedMimes.get(mimeType)!;
  const safeBase = slugify(typeof filename === 'string' ? filename.replace(/\.\w+$/, '') : 'visuel') || 'visuel';
  const finalName = `${safeBase}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}${ext}`;
  const targetPath = path.resolve(UPLOADS_DIR, finalName);

  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    res.status(400).json({ error: 'Chemin de fichier invalide.' });
    return;
  }

  fs.writeFileSync(targetPath, buffer);
  res.status(201).json({ url: `/uploads/${finalName}` });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all() as unknown as OrderRow[];
  res.json(rows.map(mapOrderRow));
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) {
    res.status(400).json({ error: 'Statut de commande invalide.' });
    return;
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as unknown as OrderRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return;
  }

  try {
    db.exec('BEGIN IMMEDIATE');
    const items = safeJsonParse<OrderItem[]>(existing.items_json, []);

    // Restore stock when moving to Annulée from a non-cancelled status
    if (existing.status !== 'Annulée' && status === 'Annulée') {
      for (const item of items) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.productId);
      }
    } else if (existing.status === 'Annulée' && status !== 'Annulée') {
      for (const item of items) {
        const p = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(item.productId) as
          | { stock: number; name: string }
          | undefined;
        if (!p || p.stock < item.quantity) {
          throw new Error(`VALIDATION:Stock insuffisant pour réactiver « ${item.productName} ».`);
        }
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.productId);
      }
    }

    const paymentStatus =
      status === 'Livrée'
        ? 'Payée à la livraison'
        : status === 'Annulée'
          ? 'Annulée'
          : 'À payer à la livraison';

    db.prepare(
      "UPDATE orders SET status = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(status, paymentStatus, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as unknown as OrderRow;
    db.exec('COMMIT');
    res.json(mapOrderRow(updated));
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore
    }
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg.startsWith('VALIDATION:')) {
      res.status(400).json({ error: msg.replace('VALIDATION:', '') });
      return;
    }
    res.status(500).json({ error: 'Impossible de mettre à jour le statut.' });
  }
});

app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM customers ORDER BY total_spent_mad DESC, id DESC')
    .all() as {
    id: number;
    user_id: number | null;
    full_name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    orders_count: number;
    total_spent_mad: number;
    created_at: string;
  }[];
  res.json(
    rows.map((c) => ({
      id: c.id,
      userId: c.user_id,
      fullName: c.full_name,
      phone: c.phone,
      email: c.email,
      city: c.city,
      address: c.address,
      ordersCount: c.orders_count,
      totalSpentMad: c.total_spent_mad,
      createdAt: c.created_at,
    }))
  );
});

app.get('/api/admin/customers/:id/orders', requireAdmin, (req, res) => {
  const customerId = Number(req.params.id);
  const rows = db
    .prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC')
    .all(customerId) as unknown as OrderRow[];
  res.json(rows.map(mapOrderRow));
});

app.get('/api/admin/promotions', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM promotions ORDER BY id DESC').all() as {
    id: number;
    code: string;
    description: string;
    discount_percent: number;
    start_date: string;
    end_date: string;
    is_active: number;
    usage_count: number;
    created_at: string;
  }[];
  res.json(
    rows.map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description,
      discountPercent: p.discount_percent,
      startDate: p.start_date,
      endDate: p.end_date,
      isActive: p.is_active === 1,
      usageCount: p.usage_count,
      createdAt: p.created_at,
    }))
  );
});

app.post('/api/admin/promotions', requireAdmin, (req, res) => {
  const { code, description, discountPercent, startDate, endDate, isActive } = req.body ?? {};
  const cleanCode = typeof code === 'string' ? code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : '';
  const pct = Number(discountPercent);
  if (cleanCode.length < 3 || cleanCode.length > 30) {
    res.status(400).json({ error: 'Le code promo doit contenir 3 à 30 caractères alphanumériques.' });
    return;
  }
  if (!Number.isInteger(pct) || pct < 1 || pct > 90) {
    res.status(400).json({ error: 'Pourcentage de réduction invalide (1% à 90%).' });
    return;
  }
  if (typeof startDate !== 'string' || typeof endDate !== 'string' || endDate < startDate) {
    res.status(400).json({ error: 'Plage de dates invalide.' });
    return;
  }

  try {
    const ins = db
      .prepare(
        'INSERT INTO promotions (code, description, discount_percent, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        cleanCode,
        typeof description === 'string' ? description.trim().slice(0, 140) : '',
        pct,
        startDate,
        endDate,
        isActive === false ? 0 : 1
      );
    res.status(201).json({
      id: Number(ins.lastInsertRowid),
      code: cleanCode,
      description: typeof description === 'string' ? description.trim() : '',
      discountPercent: pct,
      startDate,
      endDate,
      isActive: isActive !== false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    });
  } catch {
    res.status(409).json({ error: 'Ce code promotionnel existe déjà.' });
  }
});

app.put('/api/admin/promotions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id) as
    | { id: number; is_active: number; description: string; discount_percent: number; start_date: string; end_date: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Promotion introuvable.' });
    return;
  }
  const { description, discountPercent, startDate, endDate, isActive } = req.body ?? {};
  const pct = discountPercent !== undefined ? Number(discountPercent) : existing.discount_percent;
  if (!Number.isInteger(pct) || pct < 1 || pct > 90) {
    res.status(400).json({ error: 'Pourcentage invalide.' });
    return;
  }
  db.prepare(
    'UPDATE promotions SET description = ?, discount_percent = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?'
  ).run(
    typeof description === 'string' ? description.trim() : existing.description,
    pct,
    typeof startDate === 'string' ? startDate : existing.start_date,
    typeof endDate === 'string' ? endDate : existing.end_date,
    isActive === undefined ? existing.is_active : isActive ? 1 : 0,
    id
  );
  res.json({ ok: true });
});

app.delete('/api/admin/promotions/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM promotions WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json(getPublicSettings());
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const b = req.body ?? {};
  const current = getPublicSettings();
  const shippingFee = Number(b.shippingFeeMad ?? current.shippingFeeMad);
  const freeThreshold = Number(b.freeShippingThresholdMad ?? current.freeShippingThresholdMad);

  if (!Number.isFinite(shippingFee) || shippingFee < 0 || !Number.isFinite(freeThreshold) || freeThreshold < 0) {
    res.status(400).json({ error: 'Frais de livraison invalides.' });
    return;
  }

  db.prepare(
    `UPDATE settings SET
       brand_name = ?, slogan = ?, logo_url = ?, hero_title = ?, hero_subtitle = ?, hero_banner_url = ?,
       about_text = ?, phone = ?, whatsapp_number = ?, email = ?, address = ?, hours = ?,
       instagram_url = ?, facebook_url = ?, tiktok_url = ?, shipping_fee_mad = ?, free_shipping_threshold_mad = ?,
       updated_at = datetime('now')
     WHERE id = 1`
  ).run(
    typeof b.brandName === 'string' && b.brandName.trim() ? b.brandName.trim() : current.brandName,
    typeof b.slogan === 'string' ? b.slogan.trim() : current.slogan,
    typeof b.logoUrl === 'string' ? b.logoUrl.trim() : current.logoUrl,
    typeof b.heroTitle === 'string' && b.heroTitle.trim() ? b.heroTitle.trim() : current.heroTitle,
    typeof b.heroSubtitle === 'string' ? b.heroSubtitle.trim() : current.heroSubtitle,
    typeof b.heroBannerUrl === 'string' && b.heroBannerUrl.trim() ? b.heroBannerUrl.trim() : current.heroBannerUrl,
    typeof b.aboutText === 'string' ? b.aboutText.trim() : current.aboutText,
    typeof b.phone === 'string' ? b.phone.trim() : current.phone,
    typeof b.whatsappNumber === 'string' ? b.whatsappNumber.replace(/[^0-9]/g, '') : current.whatsappNumber,
    typeof b.email === 'string' ? b.email.trim() : current.email,
    typeof b.address === 'string' ? b.address.trim() : current.address,
    typeof b.hours === 'string' ? b.hours.trim() : current.hours,
    typeof b.instagramUrl === 'string' ? b.instagramUrl.trim() : current.instagramUrl,
    typeof b.facebookUrl === 'string' ? b.facebookUrl.trim() : current.facebookUrl,
    typeof b.tiktokUrl === 'string' ? b.tiktokUrl.trim() : current.tiktokUrl,
    shippingFee,
    freeThreshold
  );

  res.json(getPublicSettings());
});

app.get('/api/admin/messages', requireAdmin, (_req, res) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 50').all();
  const newsletter = db.prepare('SELECT COUNT(*) AS cnt FROM newsletter_subscribers').get() as { cnt: number };
  res.json({ messages, newsletterCount: newsletter.cnt });
});

export function attachApiFallbacks(): void {
  // Unknown /api routes return clean 404 JSON
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Point d’accès API introuvable.' });
  });

  // Global Express error handler
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Une erreur interne est survenue sur le serveur.' });
  });
}
