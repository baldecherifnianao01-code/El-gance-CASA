import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'elegance_casa.db');

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin', 'customer')),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('Homme', 'Femme', 'Unisexe')),
      price_mad REAL NOT NULL,
      promo_price_mad REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL,
      material TEXT NOT NULL,
      frame_type TEXT NOT NULL,
      sizes_json TEXT NOT NULL DEFAULT '["Standard"]',
      colors_json TEXT NOT NULL DEFAULT '[]',
      images_json TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_new INTEGER NOT NULL DEFAULT 0,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      orders_count INTEGER NOT NULL DEFAULT 0,
      total_spent_mad REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(phone, email),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      idempotency_key TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      user_id INTEGER,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      items_json TEXT NOT NULL,
      subtotal_mad REAL NOT NULL,
      discount_mad REAL NOT NULL DEFAULT 0,
      promo_code TEXT,
      shipping_mad REAL NOT NULL DEFAULT 0,
      total_mad REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cod', 'electronic')),
      payment_status TEXT NOT NULL DEFAULT 'À payer à la livraison',
      status TEXT NOT NULL DEFAULT 'En attente' CHECK(status IN ('En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      discount_percent INTEGER NOT NULL CHECK(discount_percent > 0 AND discount_percent <= 90),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      author_name TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'Casablanca',
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      brand_name TEXT NOT NULL,
      slogan TEXT NOT NULL,
      logo_url TEXT NOT NULL DEFAULT '',
      hero_title TEXT NOT NULL,
      hero_subtitle TEXT NOT NULL,
      hero_banner_url TEXT NOT NULL,
      about_text TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      hours TEXT NOT NULL,
      instagram_url TEXT NOT NULL,
      facebook_url TEXT NOT NULL,
      tiktok_url TEXT NOT NULL,
      shipping_fee_mad REAL NOT NULL DEFAULT 40,
      free_shipping_threshold_mad REAL NOT NULL DEFAULT 1200,
      electronic_payment_provider_name TEXT NOT NULL DEFAULT 'CMI Maroc (Passerelle Bancaire)',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  // If ADMIN_PASSWORD is supplied via environment Secrets, bootstrap admin hash securely
  const envAdminPass = process.env.ADMIN_PASSWORD?.trim();
  const envAdminUser = (process.env.ADMIN_USERNAME?.trim() || 'admin').toLowerCase();
  if (envAdminPass && envAdminPass.length >= 6) {
    const existingAdmin = db
      .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
      .get() as { id: number } | undefined;
    if (!existingAdmin) {
      db.prepare(
        `INSERT INTO users (username, email, full_name, phone, role, password_hash)
         VALUES (?, ?, ?, ?, 'admin', ?)`
      ).run(
        envAdminUser,
        'admin@elegancecasa.ma',
        'Administrateur ÉLÉGANCE CASA',
        '+212600000000',
        hashPassword(envAdminPass)
      );
    }
  }

  const settingsCount = db.prepare('SELECT COUNT(*) AS cnt FROM settings').get() as { cnt: number };
  if (settingsCount.cnt === 0) {
    db.prepare(`
      INSERT INTO settings (
        id, brand_name, slogan, logo_url, hero_title, hero_subtitle, hero_banner_url,
        about_text, phone, whatsapp_number, email, address, hours,
        instagram_url, facebook_url, tiktok_url, shipping_fee_mad, free_shipping_threshold_mad,
        electronic_payment_provider_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      'ÉLÉGANCE CASA',
      '« Le style dans chaque regard. »',
      '',
      'Révélez votre élégance, un regard à la fois.',
      'Maison d’optique contemporaine au cœur du Triangle d’Or de Casablanca. Montures d’artisanat en acétate italien et titane japonais, pensées pour sublimer chaque visage.',
      '/src/assets/images/hero_elegance_casa_1795271503079.jpg',
      'Fondée à Casablanca, ÉLÉGANCE CASA incarne l’alliance du savoir-faire optique de précision et d’une esthétique architecturale intemporelle. Chaque monture est rigoureusement sélectionnée et ajustée dans notre atelier du Boulevard d’Anfa.',
      '+212 522 39 48 10',
      '212661482090',
      'contact@elegancecasa.ma',
      '42 Boulevard d’Anfa, Triangle d’Or, Casablanca 20060, Maroc',
      'Lun – Sam : 09h30 – 20h00 · Dimanche : Sur rendez-vous',
      'https://instagram.com/elegancecasa.optique',
      'https://facebook.com/elegancecasa.optique',
      'https://tiktok.com/@elegancecasa',
      45,
      1200,
      'CMI Maroc / Carte Bancaire (En cours d’activation)'
    );
  }

  const catCount = db.prepare('SELECT COUNT(*) AS cnt FROM categories').get() as { cnt: number };
  if (catCount.cnt === 0) {
    const insertCat = db.prepare(
      'INSERT INTO categories (slug, name, description, display_order) VALUES (?, ?, ?, ?)'
    );
    insertCat.run('lunettes-de-soleil', 'Lunettes de soleil', 'Protection UV400 et verres polarisés haute définition', 1);
    insertCat.run('lunettes-de-vue', 'Lunettes de vue', 'Montures optiques de précision adaptables à votre correction', 2);
    insertCat.run('montures-optiques', 'Montures optiques', 'Titane japonais et acétate sculpté à la main', 3);
    insertCat.run('accessoires', 'Accessoires', 'Étuis en cuir pleine fleur et coffrets d’entretien', 4);
  }

  const prodCount = db.prepare('SELECT COUNT(*) AS cnt FROM products').get() as { cnt: number };
  if (prodCount.cnt === 0) {
    const categories = db.prepare('SELECT id, slug FROM categories').all() as { id: number; slug: string }[];
    const catMap = new Map(categories.map((c) => [c.slug, c.id]));

    const insertProd = db.prepare(`
      INSERT INTO products (
        slug, name, brand, category_id, gender, price_mad, promo_price_mad, stock,
        color, material, frame_type, sizes_json, colors_json, images_json,
        description, is_active, is_featured, is_new, is_bestseller, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demoProducts = [
      {
        slug: 'lunettes-soleil-classic-black',
        name: 'Lunettes de soleil Classic Black',
        brand: 'Édition Anfa',
        cat: 'lunettes-de-soleil',
        gender: 'Unisexe',
        price: 1450,
        promo: null,
        stock: 18,
        color: 'Noir Obsidienne & Or',
        material: 'Acétate Mazzucchelli poli à la main',
        frameType: 'Cerclée — Forme Carrée Sculptée',
        sizes: ['M (50-21-145)', 'L (53-21-148)'],
        colors: ['Noir Obsidienne & Or', 'Noir Mat'],
        images: [
          '/src/assets/images/hero_elegance_casa_1795271503079.jpg',
          '/src/assets/images/lunettes_urban_style_1795271509737.jpg',
        ],
        desc: 'Pièce signature d’ÉLÉGANCE CASA, la Classic Black marie un acétate noir profond de 8 mm à des inserts dorés brossés sur les branches. Verres organiques CR-39 filtrant 100 % des rayons UVA/UVB.',
        featured: 1,
        isNew: 1,
        bestseller: 1,
      },
      {
        slug: 'lunettes-aviator-gold',
        name: 'Lunettes Aviator Gold',
        brand: 'Atelier Corniche',
        cat: 'lunettes-de-soleil',
        gender: 'Homme',
        price: 1890,
        promo: 1490,
        stock: 14,
        color: 'Or Brossé 18K & Ambre',
        material: 'Acier inoxydable chirurgical plaqué or',
        frameType: 'Double Pont — Aviateur',
        sizes: ['M (55-16-145)', 'L (58-16-148)'],
        colors: ['Or Brossé 18K & Ambre', 'Or Champagne'],
        images: [
          '/src/assets/images/lunettes_aviator_gold_1795271507799.jpg',
          '/src/assets/images/lunettes_ocean_titanium_1795271508406.jpg',
        ],
        desc: 'Silhouette aviateur revisitée avec un double pont ultra-fin et des verres dégradés ambre offrant une vision chaude et reposante sous le soleil de Casablanca.',
        featured: 1,
        isNew: 0,
        bestseller: 1,
      },
      {
        slug: 'lunettes-vintage-brown',
        name: 'Lunettes Vintage Brown',
        brand: 'Maison Dar El Beïda',
        cat: 'lunettes-de-soleil',
        gender: 'Unisexe',
        price: 1350,
        promo: null,
        stock: 12,
        color: 'Écaille Havane & Vert Minéral',
        material: 'Acétate de cellulose bio-sourcé',
        frameType: 'Pantos Rond — Pont Clé',
        sizes: ['S (46-22-142)', 'M (48-22-145)'],
        colors: ['Écaille Havane & Vert Minéral', 'Miel Ambré'],
        images: [
          '/src/assets/images/lunettes_vintage_brown_1795271508196.jpg',
          '/src/assets/images/monture_tortoise_optical_1795271507883.jpg',
        ],
        desc: 'Inspirée des archives optiques des années 60, cette monture ronde à pont en trou de serrure allie charme rétro et verres minéraux teintés vert bouteille.',
        featured: 0,
        isNew: 1,
        bestseller: 1,
      },
      {
        slug: 'lunettes-urban-style',
        name: 'Lunettes Urban Style',
        brand: 'Édition Maarif',
        cat: 'lunettes-de-soleil',
        gender: 'Homme',
        price: 1650,
        promo: null,
        stock: 9,
        color: 'Noir Mat & Titane Fumée',
        material: 'Acétate haute densité & Branches en titane',
        frameType: 'Géométrique Double Barre',
        sizes: ['M (52-19-145)', 'L (54-19-148)'],
        colors: ['Noir Mat & Titane Fumée', 'Anthracite'],
        images: [
          '/src/assets/images/lunettes_urban_style_1795271509737.jpg',
          '/src/assets/images/hero_elegance_casa_1795271503079.jpg',
        ],
        desc: 'Lignes architecturales franches et branches en titane brossé pour un maintien ultraléger. Verres polarisés anti-reflets parfaits pour la conduite urbaine et côtière.',
        featured: 1,
        isNew: 1,
        bestseller: 0,
      },
      {
        slug: 'monture-optical-premium',
        name: 'Monture Optical Premium',
        brand: 'Atelier Casablanca',
        cat: 'lunettes-de-vue',
        gender: 'Unisexe',
        price: 1790,
        promo: null,
        stock: 20,
        color: 'Cristal Champagne & Or',
        material: 'Acétate Cristal & Branches Titane Bêta',
        frameType: 'Pantos Mixte — Optique',
        sizes: ['S (47-21-145)', 'M (49-21-145)'],
        colors: ['Cristal Champagne & Or', 'Beige Translucide'],
        images: [
          '/src/assets/images/monture_optical_premium_1795271508878.jpg',
          '/src/assets/images/lunettes_minimalist_gold_1795271507997.jpg',
        ],
        desc: 'Équilibre lumineux entre face en acétate cristal champagne et branches sculptées en titane doré. Livrée avec verres neutres anti-lumière bleue, prête pour votre opticien.',
        featured: 1,
        isNew: 1,
        bestseller: 1,
      },
      {
        slug: 'lunettes-cat-eye',
        name: 'Lunettes Cat Eye Anfa',
        brand: 'Maison Anfa',
        cat: 'lunettes-de-soleil',
        gender: 'Femme',
        price: 1590,
        promo: 1250,
        stock: 11,
        color: 'Noir Laqué & Liseré Or',
        material: 'Acétate japonais & Alliage doré',
        frameType: 'Œil-de-Chat Sculpté',
        sizes: ['S (50-18-140)', 'M (52-18-142)'],
        colors: ['Noir Laqué & Liseré Or', 'Écaille Foncée'],
        images: [
          '/src/assets/images/lunettes_cat_eye_1795271508603.jpg',
          '/src/assets/images/hero_elegance_casa_1795271503079.jpg',
        ],
        desc: 'Courbe féline élancée soulignée par un fin pont supérieur doré. Offre un port altier et une protection solaire intégrale avec dégradé fumé.',
        featured: 1,
        isNew: 0,
        bestseller: 1,
      },
      {
        slug: 'lunettes-sport-vision',
        name: 'Lunettes Sport Vision',
        brand: 'Casablanca Tech',
        cat: 'lunettes-de-soleil',
        gender: 'Homme',
        price: 1420,
        promo: null,
        stock: 15,
        color: 'Titane Graphite & Gris Polarisé',
        material: 'Titane aéronautique & Embouts élastomère',
        frameType: 'Enveloppante Dynamique',
        sizes: ['L (57-17-145)'],
        colors: ['Titane Graphite & Gris Polarisé'],
        images: [
          '/src/assets/images/lunettes_urban_style_1795271509737.jpg',
          '/src/assets/images/lunettes_ocean_titanium_1795271508406.jpg',
        ],
        desc: 'Conçue pour les activités extérieures et le golf, avec verres polarisés haute acuité supprimant l’éblouissement maritime et routier.',
        featured: 0,
        isNew: 1,
        bestseller: 0,
      },
      {
        slug: 'lunettes-minimalist-gold',
        name: 'Lunettes Minimalist Gold',
        brand: 'Atelier Casablanca',
        cat: 'lunettes-de-vue',
        gender: 'Femme',
        price: 1950,
        promo: null,
        stock: 8,
        color: 'Or Satiné',
        material: 'Titane japonais pur 100 % hypoallergénique',
        frameType: 'Octogonale Fine — Optique',
        sizes: ['S (48-20-142)', 'M (50-20-145)'],
        colors: ['Or Satiné', 'Or Rose Pâle'],
        images: [
          '/src/assets/images/lunettes_minimalist_gold_1795271507997.jpg',
          '/src/assets/images/monture_optical_premium_1795271508878.jpg',
        ],
        desc: 'Géométrie octogonale aérienne ne pesant que 11 grammes. Plaquettes en titane gravées et charnières de haute précision pour un confort du matin au soir.',
        featured: 1,
        isNew: 1,
        bestseller: 1,
      },
      {
        slug: 'monture-tortoise-heritage',
        name: 'Monture Tortoise Héritage',
        brand: 'Maison Dar El Beïda',
        cat: 'lunettes-de-vue',
        gender: 'Homme',
        price: 1290,
        promo: 990,
        stock: 16,
        color: 'Écaille Miel & Rivets Or',
        material: 'Acétate poli à la cire naturelle',
        frameType: 'Rectangulaire Classique',
        sizes: ['M (51-19-145)', 'L (53-19-148)'],
        colors: ['Écaille Miel & Rivets Or', 'Brun Tabac'],
        images: [
          '/src/assets/images/monture_tortoise_optical_1795271507883.jpg',
          '/src/assets/images/lunettes_vintage_brown_1795271508196.jpg',
        ],
        desc: 'Monture rectangulaire intemporelle dotée de triples rivets dorés et charnières à cinq barillets. Idéale pour verres unifocaux ou progressifs.',
        featured: 0,
        isNew: 0,
        bestseller: 1,
      },
      {
        slug: 'monture-noir-architecte',
        name: 'Monture Noir Architecte',
        brand: 'Édition Anfa',
        cat: 'montures-optiques',
        gender: 'Unisexe',
        price: 1680,
        promo: null,
        stock: 10,
        color: 'Noir Mat & Pont Or Brossé',
        material: 'Acétate mat & Pont en titane gravé',
        frameType: 'Pantos Hybride',
        sizes: ['M (49-21-145)'],
        colors: ['Noir Mat & Pont Or Brossé'],
        images: [
          '/src/assets/images/monture_noir_architect_1795271508585.jpg',
          '/src/assets/images/monture_optical_premium_1795271508878.jpg',
        ],
        desc: 'Contraste affirmé entre l’acétate noir mat velouté et un pont métallique doré travaillé au tour. Un classique contemporain adopté par les créatifs casablancais.',
        featured: 0,
        isNew: 1,
        bestseller: 0,
      },
      {
        slug: 'lunettes-ocean-titanium',
        name: 'Lunettes Océan Titanium',
        brand: 'Atelier Corniche',
        cat: 'lunettes-de-soleil',
        gender: 'Unisexe',
        price: 2150,
        promo: 1790,
        stock: 7,
        color: 'Argent Champenois & Bleu Atlantique',
        material: 'Titane brossé haute résilience',
        frameType: 'Ronde Minimaliste',
        sizes: ['M (49-21-145)'],
        colors: ['Argent Champenois & Bleu Atlantique'],
        images: [
          '/src/assets/images/lunettes_ocean_titanium_1795271508406.jpg',
          '/src/assets/images/lunettes_aviator_gold_1795271507799.jpg',
        ],
        desc: 'Hommage à la côte atlantique marocaine : cercle fin en titane argenté et verres solaires teintés bleu océan catégorie 3 à traitement oléophobe.',
        featured: 1,
        isNew: 1,
        bestseller: 0,
      },
      {
        slug: 'monture-solaire-riviera-femme',
        name: 'Monture Solaire Riviera Prestige',
        brand: 'Maison Anfa',
        cat: 'montures-optiques',
        gender: 'Femme',
        price: 1540,
        promo: null,
        stock: 0,
        color: 'Noir Brillant & Or',
        material: 'Acétate premium sculpté',
        frameType: 'Papillon Doux',
        sizes: ['S (50-19-140)', 'M (52-19-142)'],
        colors: ['Noir Brillant & Or'],
        images: [
          '/src/assets/images/lunettes_cat_eye_1795271508603.jpg',
          '/src/assets/images/lunettes_minimalist_gold_1795271507997.jpg',
        ],
        desc: 'Édition limitée temporairement épuisée en atelier — monture papillon aux lignes adoucies compatible verres solaires correcteurs.',
        featured: 0,
        isNew: 0,
        bestseller: 0,
      },
      {
        slug: 'coffret-cuir-atelier-casa',
        name: 'Coffret & Étui Cuir Casablanca',
        brand: 'ÉLÉGANCE CASA',
        cat: 'accessoires',
        gender: 'Unisexe',
        price: 390,
        promo: 290,
        stock: 25,
        color: 'Beige Travertin & Dorure à chaud',
        material: 'Cuir de veau pleine fleur & Microfibre japonaise',
        frameType: 'Accessoire d’entretien',
        sizes: ['Unique'],
        colors: ['Beige Travertin & Dorure à chaud', 'Noir Grainé'],
        images: [
          '/src/assets/images/atelier_casablanca_1795271508487.jpg',
          '/src/assets/images/lunettes_ocean_titanium_1795271508406.jpg',
        ],
        desc: 'Étui rigide gainé cuir, spray nettoyant sans alcool pour verres traités anti-reflets et chamoisine haute densité signée ÉLÉGANCE CASA.',
        featured: 0,
        isNew: 1,
        bestseller: 0,
      },
    ];

    for (const p of demoProducts) {
      insertProd.run(
        p.slug,
        p.name,
        p.brand,
        catMap.get(p.cat) ?? 1,
        p.gender,
        p.price,
        p.promo,
        p.stock,
        p.color,
        p.material,
        p.frameType,
        JSON.stringify(p.sizes),
        JSON.stringify(p.colors),
        JSON.stringify(p.images),
        p.desc,
        1,
        p.featured,
        p.isNew,
        p.bestseller,
        1
      );
    }
  }

  const promoCount = db.prepare('SELECT COUNT(*) AS cnt FROM promotions').get() as { cnt: number };
  if (promoCount.cnt === 0) {
    const insertPromo = db.prepare(
      'INSERT INTO promotions (code, description, discount_percent, start_date, end_date, is_active, usage_count) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertPromo.run('CASA15', 'Offre Privilège Casablanca (-15%)', 15, '2026-01-01', '2027-12-31', 1, 14);
    insertPromo.run('BIENVENUE10', 'Remise première commande (-10%)', 10, '2026-01-01', '2027-12-31', 1, 29);
  }

  const reviewCount = db.prepare('SELECT COUNT(*) AS cnt FROM reviews').get() as { cnt: number };
  if (reviewCount.cnt === 0) {
    const insertReview = db.prepare(
      'INSERT INTO reviews (product_id, author_name, city, rating, comment, verified) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertReview.run(
      1,
      'Salma Bennani',
      'Casablanca · Anfa',
      5,
      'Qualité d’acétate exceptionnelle. Livrée le lendemain à Anfa dans un écrin somptueux, les verres sont d’une netteté remarquable.',
      1
    );
    insertReview.run(
      2,
      'Karim El Mansouri',
      'Rabat · Souissi',
      5,
      'Les Aviator Gold ont une finition irréprochable et un confort incomparable au volant. Paiement à la livraison fluide et sérieux.',
      1
    );
    insertReview.run(
      5,
      'Yasmine Tazi',
      'Marrakech · Guéliz',
      5,
      'J’ai commandé la Monture Optical Premium pour mes verres correcteurs : légèreté bluffante et design digne des plus grandes maisons.',
      1
    );
  }

  // Seed realistic initial orders & customers so the Admin Dashboard displays meaningful Moroccan commerce analytics immediately
  const orderCount = db.prepare('SELECT COUNT(*) AS cnt FROM orders').get() as { cnt: number };
  if (orderCount.cnt === 0) {
    const insertCust = db.prepare(
      'INSERT INTO customers (full_name, phone, email, city, address, orders_count, total_spent_mad, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const c1 = insertCust.run(
      'Salma Bennani',
      '0661234567',
      'salma.bennani@example.ma',
      'Casablanca',
      '18 Rue d’Alger, Quartier Gautier, Casablanca',
      1,
      1450,
      "2026-11-16 11:20:00"
    );
    const c2 = insertCust.run(
      'Karim El Mansouri',
      '0662987654',
      'karim.elmansouri@example.ma',
      'Rabat',
      '7 Avenue Mohammed VI, Souissi, Rabat',
      1,
      1490,
      "2026-11-18 15:45:00"
    );
    const c3 = insertCust.run(
      'Yasmine Tazi',
      '0663554433',
      'yasmine.tazi@example.ma',
      'Marrakech',
      '124 Avenue Mohammed V, Guéliz, Marrakech',
      1,
      1790,
      "2026-11-20 09:30:00"
    );

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, idempotency_key, customer_id, full_name, phone, email, city, address, notes,
        items_json, subtotal_mad, discount_mad, promo_code, shipping_mad, total_mad,
        payment_method, payment_status, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      'EC-2026-1001',
      'seed-order-1001',
      Number(c1.lastInsertRowid),
      'Salma Bennani',
      '0661234567',
      'salma.bennani@example.ma',
      'Casablanca',
      '18 Rue d’Alger, Quartier Gautier, Casablanca',
      'Appeler 15 min avant la livraison svp.',
      JSON.stringify([
        {
          productId: 1,
          productName: 'Lunettes de soleil Classic Black',
          image: '/src/assets/images/hero_elegance_casa_1795271503079.jpg',
          unitPriceMad: 1450,
          quantity: 1,
          selectedColor: 'Noir Obsidienne & Or',
          selectedSize: 'M (50-21-145)',
          lineTotalMad: 1450,
        },
      ]),
      1450,
      0,
      null,
      0,
      1450,
      'cod',
      'Payée à la livraison',
      'Livrée',
      '2026-11-16 11:25:00',
      '2026-11-17 16:00:00'
    );

    insertOrder.run(
      'EC-2026-1002',
      'seed-order-1002',
      Number(c2.lastInsertRowid),
      'Karim El Mansouri',
      '0662987654',
      'karim.elmansouri@example.ma',
      'Rabat',
      '7 Avenue Mohammed VI, Souissi, Rabat',
      '',
      JSON.stringify([
        {
          productId: 2,
          productName: 'Lunettes Aviator Gold',
          image: '/src/assets/images/lunettes_aviator_gold_1795271507799.jpg',
          unitPriceMad: 1490,
          quantity: 1,
          selectedColor: 'Or Brossé 18K & Ambre',
          selectedSize: 'L (58-16-148)',
          lineTotalMad: 1490,
        },
      ]),
      1490,
      0,
      null,
      0,
      1490,
      'cod',
      'À payer à la livraison',
      'Expédiée',
      '2026-11-18 15:50:00',
      '2026-11-19 10:15:00'
    );

    insertOrder.run(
      'EC-2026-1003',
      'seed-order-1003',
      Number(c3.lastInsertRowid),
      'Yasmine Tazi',
      '0663554433',
      'yasmine.tazi@example.ma',
      'Marrakech',
      '124 Avenue Mohammed V, Guéliz, Marrakech',
      'Livraison en après-midi souhaitée.',
      JSON.stringify([
        {
          productId: 5,
          productName: 'Monture Optical Premium',
          image: '/src/assets/images/monture_optical_premium_1795271508878.jpg',
          unitPriceMad: 1790,
          quantity: 1,
          selectedColor: 'Cristal Champagne & Or',
          selectedSize: 'M (49-21-145)',
          lineTotalMad: 1790,
        },
      ]),
      1790,
      0,
      null,
      0,
      1790,
      'cod',
      'À payer à la livraison',
      'En attente',
      '2026-11-20 09:35:00',
      '2026-11-20 09:35:00'
    );
  }
}
