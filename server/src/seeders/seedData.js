import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sequelize, User, Product, Exchange, ChatRoom, Message, Review } from '../models/index.js';

export async function seedDatabase(force = false) {
  console.log('--- Starting Database Seeding ---');

  if (!force) {
    const existingCount = await Product.count();
    if (existingCount >= 25) {
      console.log(`Database already populated with ${existingCount} products. Skipping.`);
      return;
    }
  }

  const hashedPassword = await bcrypt.hash('Admin2026!SV', 12);
  const userPassword = await bcrypt.hash('Pass1234!', 12);

  // 1. Create Admin
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@segundavuelta.com' },
    defaults: {
      id: uuidv4(),
      email: 'admin@segundavuelta.com',
      password_hash: hashedPassword,
      display_name: 'Administrador General',
      role: 'admin',
      bio: 'Administración y moderación general de la plataforma Segunda Vuelta.',
      location_city: 'CABA',
      location_province: 'Buenos Aires',
      rating_avg: 5.0,
      rating_count: 15,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
  });

  // 2. Create Argentine Community Users
  const usersData = [
    {
      email: 'lucas.rodriguez@gmail.com',
      display_name: 'Lucas Rodríguez',
      bio: 'Coleccionista de camisetas de fútbol y fanático del streetwear vintage. Cuido mucho cada prenda.',
      location_city: 'Palermo, CABA',
      location_province: 'Buenos Aires',
      location_lat: -34.5885,
      location_lng: -58.4305,
      rating_avg: 4.9,
      rating_count: 11,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      email: 'valentina.rossi@gmail.com',
      display_name: 'Valentina Rossi',
      bio: 'Diseñadora textil y promotora de moda circular sustentable. Me encantan las camperas y prendas oversized.',
      location_city: 'Recoleta, CABA',
      location_province: 'Buenos Aires',
      location_lat: -34.5875,
      location_lng: -58.3974,
      rating_avg: 5.0,
      rating_count: 16,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    {
      email: 'matias.fer@hotmail.com',
      display_name: 'Matías Fernández',
      bio: 'Cambio zapatillas y buzos que compré y me quedaron chicos o que casi no usé.',
      location_city: 'Caballito, CABA',
      location_province: 'Buenos Aires',
      location_lat: -34.6186,
      location_lng: -58.4429,
      rating_avg: 4.8,
      rating_count: 7,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
    {
      email: 'camila.benitez@yahoo.com.ar',
      display_name: 'Camila Benítez',
      bio: 'Fan del estilo urbano y vintage noventero. Siempre busco remeras gráficas, bombers y denim wide leg.',
      location_city: 'Belgrano, CABA',
      location_province: 'Buenos Aires',
      location_lat: -34.5627,
      location_lng: -58.4564,
      rating_avg: 5.0,
      rating_count: 10,
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
    {
      email: 'nicolas.gomez@gmail.com',
      display_name: 'Nicolás Gómez',
      bio: 'Zona norte. Canjeo indumentaria deportiva, camisetas y calzado original con comprobante.',
      location_city: 'Vicente López',
      location_province: 'Buenos Aires',
      location_lat: -34.5273,
      location_lng: -58.4816,
      rating_avg: 4.9,
      rating_count: 6,
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    },
    {
      email: 'sofia.martinez@outlook.com',
      display_name: 'Sofía Martínez',
      bio: 'Amante del thrifting y la estética Y2K. Ropa en excelente estado lista para seguir rodando.',
      location_city: 'San Telmo, CABA',
      location_province: 'Buenos Aires',
      location_lat: -34.6212,
      location_lng: -58.3731,
      rating_avg: 5.0,
      rating_count: 9,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const [user] = await User.findOrCreate({
      where: { email: u.email },
      defaults: {
        id: uuidv4(),
        ...u,
        password_hash: userPassword,
        role: 'user',
      },
    });
    createdUsers.push(user);
  }

  // Clear products if force
  if (force) {
    const isPg = sequelize.getDialect() === 'postgres';
    if (isPg) {
      await sequelize.query("SET session_replication_role = 'replica';");
    } else {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    }
    await Review.destroy({ where: {} });
    await Exchange.destroy({ where: {} });
    await Product.destroy({ where: {} });
    if (isPg) {
      await sequelize.query("SET session_replication_role = 'origin';");
    } else {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    }
    console.log('Cleared existing products for fresh accurate seed.');
  }

  // 3. Realistic, Authentic Garment Catalog
  // Guaranteed minimum 3 garments per category AND per gender (hombre, mujer, unisex)
  const productsData = [
    // ==========================================
    // SECCIÓN 1: CAMISETAS DE FÚTBOL
    // ==========================================
    // HOMBRE
    {
      userIndex: 0,
      title: 'Camiseta River Plate Titular Clásica Banda Roja Oficial',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'deportivo',
      gender: 'hombre',
      size: 'L',
      condition: 'como_nuevo',
      description: 'Camiseta oficial de River Plate con la histórica banda roja cruzada. Comprada en local oficial Adidas de River Camp. Escudo bordado en alta definición y tecnología Aeroready.',
      location_city: 'Palermo, CABA',
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Camiseta_River_de_Am%C3%A9rico_Gallego_1985_%281%29.jpg/800px-Camiseta_River_de_Am%C3%A9rico_Gallego_1985_%281%29.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/e/eb/Camiseta_River_de_Ermindo_Onega_1961.jpg',
      ],
    },
    {
      userIndex: 4,
      title: 'Camiseta Boca Juniors Titular Azul y Oro Oficial 2023/24',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'deportivo',
      gender: 'hombre',
      size: 'XL',
      condition: 'nuevo',
      description: 'Camiseta titular de Boca Juniors con la clásica franja dorada en el pecho. Comprada en La Bombonera oficial. Nueva con etiquetas puestas, talle XL.',
      location_city: 'Vicente López',
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Remera_local_Boca_2013_-_2014.jpg/800px-Remera_local_Boca_2013_-_2014.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Uniforme_tercero_Boca_Juniors_2021-2022.jpg/800px-Uniforme_tercero_Boca_Juniors_2021-2022.jpg',
      ],
    },
    {
      userIndex: 2,
      title: 'Camiseta Selección Argentina 3 Estrellas Campeón del Mundo',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'deportivo',
      gender: 'hombre',
      size: 'M',
      condition: 'nuevo',
      description: 'Camiseta oficial de la Selección Argentina con el parche dorado FIFA World Champions 2022 y las tres estrellas bordadas. Impecable estado sin detalles.',
      location_city: 'Caballito, CABA',
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Lionel_Messi_20180626.jpg/800px-Lionel_Messi_20180626.jpg',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // MUJER
    {
      userIndex: 1,
      title: 'Camiseta Selección Argentina Edición Femenina Oficial',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'deportivo',
      gender: 'mujer',
      size: 'S',
      condition: 'como_nuevo',
      description: 'Camiseta oficial de Argentina para mujer, corte entallado y tela fresca climacool. Utilizada una sola vez en el fan fest.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 3,
      title: 'Camiseta River Plate Mujer Titular Banda Roja',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'deportivo',
      gender: 'mujer',
      size: 'M',
      condition: 'muy_bueno',
      description: 'Camiseta titular de River Plate corte dama con banda roja icónica. Excelente caída y estado impecable.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Camiseta_River_de_Am%C3%A9rico_Gallego_1985_%281%29.jpg/800px-Camiseta_River_de_Am%C3%A9rico_Gallego_1985_%281%29.jpg',
      ],
    },
    {
      userIndex: 5,
      title: 'Camiseta Boca Juniors Dama Suplente Amarilla y Azul',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'deportivo',
      gender: 'mujer',
      size: 'S',
      condition: 'como_nuevo',
      description: 'Camiseta alternativa de Boca Juniors para mujer en color amarillo con vivos azules. Ideal para verano o ir a la cancha.',
      location_city: 'San Telmo, CABA',
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Uniforme_tercero_Boca_Juniors_2021-2022.jpg/800px-Uniforme_tercero_Boca_Juniors_2021-2022.jpg',
      ],
    },

    // UNISEX
    {
      userIndex: 0,
      title: 'Camiseta River Plate Retro Histórica Banda Roja 1986',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'vintage',
      gender: 'unisex',
      size: 'L',
      condition: 'muy_bueno',
      description: 'Reedición retro de la camiseta de River Plate campeón de América 1986. Banda roja estampada y león en el pecho. Prenda de colección.',
      location_city: 'Palermo, CABA',
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Camiseta_River_de_Am%C3%A9rico_Gallego_1985_%281%29.jpg/800px-Camiseta_River_de_Am%C3%A9rico_Gallego_1985_%281%29.jpg',
      ],
    },
    {
      userIndex: 2,
      title: 'Camiseta Fútbol Vintage Retro Algodón Clásica',
      brand: 'Topper',
      category: 'camisetas',
      style: 'vintage',
      gender: 'unisex',
      size: 'M',
      condition: 'bueno',
      description: 'Camiseta retro de entrenamiento vintage noventero en piqué de algodón. Muy buscada para looks streetwear.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Camiseta Entrenamiento Selección Argentina Pre-Match',
      brand: 'Adidas',
      category: 'camisetas',
      style: 'deportivo',
      gender: 'unisex',
      size: 'L',
      condition: 'como_nuevo',
      description: 'Camiseta de calentamiento pre-match con gráfico azul y celeste abstracto. Súper cómoda para entrenamiento o uso casual.',
      location_city: 'Vicente López',
      images: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Lionel_Messi_20180626.jpg/800px-Lionel_Messi_20180626.jpg',
      ],
    },

    // ==========================================
    // SECCIÓN 2: REMERAS & MUSCULOSAS
    // ==========================================
    // HOMBRE
    {
      userIndex: 0,
      title: 'Remera Streetwear Oversized Blanca Algodón Pesado',
      brand: 'Independent',
      category: 'remeras',
      style: 'streetwear',
      gender: 'hombre',
      size: 'XL',
      condition: 'como_nuevo',
      description: 'Remera corte boxy fit en algodón peinado 24/1 gramaje pesado. Cuello cerrado reforzado que no se deforma.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 2,
      title: 'Remera Gráfica Negra Skate & Rock Streetwear',
      brand: 'Thrasher',
      category: 'remeras',
      style: 'streetwear',
      gender: 'hombre',
      size: 'L',
      condition: 'muy_bueno',
      description: 'Remera negra con estampado serigráfico de skate noventero en el pecho. Calce clásico holgado.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Remera Básica Minimalista Regular Fit Beige Arena',
      brand: 'Zara',
      category: 'remeras',
      style: 'casual',
      gender: 'hombre',
      size: 'M',
      condition: 'nuevo',
      description: 'Remera básica lisa color arena en algodón suave. Ideal para combinar con camisas abiertas o camperas de jean.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // MUJER
    {
      userIndex: 1,
      title: 'Remera Gráfica Vintage Estilo Y2K Acid Wash',
      brand: 'Bershka',
      category: 'remeras',
      style: 'y2k',
      gender: 'mujer',
      size: 'S',
      condition: 'como_nuevo',
      description: 'Remera con lavado mineral acid wash y tipografía noventera. Calce baby tee semi entallado.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 3,
      title: 'Top Crop Urbano Negro Rib Acanalado',
      brand: 'Forever 21',
      category: 'remeras',
      style: 'streetwear',
      gender: 'mujer',
      size: 'M',
      condition: 'nuevo',
      description: 'Crop top negro en rib elástico de algodón. Básico infaltable para combinar con pantalones cargo o jeans tiro alto.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 5,
      title: 'Musculosa Urbana Ribbed Cuello Halter Beige',
      brand: 'Zara',
      category: 'remeras',
      style: 'casual',
      gender: 'mujer',
      size: 'S',
      condition: 'como_nuevo',
      description: 'Musculosa cuello halter en hilo tejido fino. Muy elegante tanto para el día como para salir de noche.',
      location_city: 'San Telmo, CABA',
      images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // UNISEX
    {
      userIndex: 0,
      title: 'Remera Acid Wash Gris Carbón Boxy Fit',
      brand: 'Segunda Vuelta Studio',
      category: 'remeras',
      style: 'streetwear',
      gender: 'unisex',
      size: 'L',
      condition: 'nuevo',
      description: 'Remera con proceso de lavado gastado en piedra pómez. Corte unisex relajado de hombros caídos.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 3,
      title: 'Chomba Polo Vintage Rayada Retro 90s',
      brand: 'Lacoste',
      category: 'remeras',
      style: 'vintage',
      gender: 'unisex',
      size: 'M',
      condition: 'muy_bueno',
      description: 'Polo vintage original con cuello acanalado y botones nacarados. Rayas horizontales azul marino y crema.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 2,
      title: 'Remera Lisa Algodón Orgánico Terracota',
      brand: 'Patagonia',
      category: 'remeras',
      style: 'casual',
      gender: 'unisex',
      size: 'XL',
      condition: 'como_nuevo',
      description: 'Remera 100% algodón orgánico certificado. Tinte natural color óxido / terracota.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // ==========================================
    // SECCIÓN 3: BUZOS & HOODIES
    // ==========================================
    // HOMBRE
    {
      userIndex: 1,
      title: 'Buzo Hoodie Oversized Washed Negro Pesado 450 GSM',
      brand: 'Fear of God Essentials',
      category: 'buzos',
      style: 'streetwear',
      gender: 'hombre',
      size: 'XL',
      condition: 'como_nuevo',
      description: 'Hoodie con algodón frizado de 450 GSM estilo boxy fit. Capucha forrada doble tela, sin cordones estilo minimalista.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Buzo Crewneck Gris Melange Universitario Vintage',
      brand: 'Champion',
      category: 'buzos',
      style: 'vintage',
      gender: 'hombre',
      size: 'L',
      condition: 'muy_bueno',
      description: 'Buzo cuello redondo clásico Champion Reverse Weave original. Logo bordado en manga izquierda.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 0,
      title: 'Hoodie Streetwear Verde Militar con Bolsillo Frontal',
      brand: 'Carhartt WIP',
      category: 'buzos',
      style: 'streetwear',
      gender: 'hombre',
      size: 'M',
      condition: 'como_nuevo',
      description: 'Hoodie Carhartt verde oliva con parche cosido en bolsillo canguro. Muy abrigado y resistente.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // MUJER
    {
      userIndex: 3,
      title: 'Buzo Hoodie Cropped Rosa Pastel Oversize',
      brand: 'H&M',
      category: 'buzos',
      style: 'streetwear',
      gender: 'mujer',
      size: 'S',
      condition: 'como_nuevo',
      description: 'Hoodie crop corte holgado en color rosa empolvado. Friza suave por dentro, cintura con cordón ajustable.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 5,
      title: 'Sweater Tejido Oversize Cuello Tortuga Crudo',
      brand: 'Mango',
      category: 'buzos',
      style: 'casual',
      gender: 'mujer',
      size: 'M',
      condition: 'muy_bueno',
      description: 'Sweater de punto grueso trenzado en color natural crudo. Muy abrigado para invierno.',
      location_city: 'San Telmo, CABA',
      images: [
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 1,
      title: 'Buzo Aesthetic Cuello Redondo Lavanda Y2K',
      brand: 'Pull&Bear',
      category: 'buzos',
      style: 'y2k',
      gender: 'mujer',
      size: 'S',
      condition: 'nuevo',
      description: 'Crewneck en tono pastel lavanda con estampado tipográfico sutil. Calce oversized relajado.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // UNISEX
    {
      userIndex: 2,
      title: 'Buzo Hoodie Beige Arena Minimalista Boxy Fit',
      brand: 'Nike Sportswear',
      category: 'buzos',
      style: 'streetwear',
      gender: 'unisex',
      size: 'L',
      condition: 'como_nuevo',
      description: 'Hoodie Nike Club Fleece en color beige claro con logo swoosh bordado tono sobre tono.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 0,
      title: 'Buzo Canguro Negro Liso Algodón Premium',
      brand: 'Adidas Originals',
      category: 'buzos',
      style: 'deportivo',
      gender: 'unisex',
      size: 'M',
      condition: 'muy_bueno',
      description: 'Hoodie clásico negro con las tres tiras discretas en puños y trifolio en el pecho.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Buzo Cuello Redondo Azul Marino Vintage Retro',
      brand: 'Polo Ralph Lauren',
      category: 'buzos',
      style: 'vintage',
      gender: 'unisex',
      size: 'XL',
      condition: 'bueno',
      description: 'Crewneck vintage azul marino con el logo del jugador de polo bordado en hilo rojo.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // ==========================================
    // SECCIÓN 4: CAMPERAS & ABRIGOS
    // ==========================================
    // HOMBRE
    {
      userIndex: 1,
      title: 'Campera Puffer Plumón Abrigo Térmico Negro Mate',
      brand: 'The North Face',
      category: 'camperas',
      style: 'streetwear',
      gender: 'hombre',
      size: 'L',
      condition: 'como_nuevo',
      description: 'Campera de abrigo estilo Nuptse rellena de pluma sintética de alto rendimiento. Acabado negro mate impermeable.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 0,
      title: 'Campera de Cuero Biker Motociclista con Cierres Metálicos',
      brand: 'Levis',
      category: 'camperas',
      style: 'vintage',
      gender: 'hombre',
      size: 'L',
      condition: 'muy_bueno',
      description: 'Campera de cuero vacuno legítimo pesado. Forro interior de satén y cierres YKK reforzados.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Campera Bomber Militar Verde Oliva Reversible',
      brand: 'Alpha Industries',
      category: 'camperas',
      style: 'streetwear',
      gender: 'hombre',
      size: 'XL',
      condition: 'como_nuevo',
      description: 'Bomber MA-1 clásica militar con forro naranja de emergencia. Cinta roja Remove Before Flight en la manga.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // MUJER
    {
      userIndex: 3,
      title: 'Campera Puffer Corta Metalizada Streetwear',
      brand: 'Zara',
      category: 'camperas',
      style: 'streetwear',
      gender: 'mujer',
      size: 'S',
      condition: 'nuevo',
      description: 'Campera puffer corta estilo cropped en color plata tornasolado. Muy trendy y canchera para el frío.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 5,
      title: 'Campera Biker de Cuero Sintético Negro Dama',
      brand: 'Stradivarius',
      category: 'camperas',
      style: 'casual',
      gender: 'mujer',
      size: 'M',
      condition: 'como_nuevo',
      description: 'Chaqueta biker entallada con solapa cruzada y cinturón con hebilla plateada.',
      location_city: 'San Telmo, CABA',
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 1,
      title: 'Trench Coat Clásico Largo Beige con Cinturón',
      brand: 'Burberry Style',
      category: 'camperas',
      style: 'formal',
      gender: 'mujer',
      size: 'M',
      condition: 'muy_bueno',
      description: 'Piloto impermeable largo en gabardina beige clásico. Doble abotonadura y charreteras en hombros.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // UNISEX
    {
      userIndex: 2,
      title: 'Campera Rompevientos Vintage Retro Colorblock 90s',
      brand: 'Nike',
      category: 'camperas',
      style: 'vintage',
      gender: 'unisex',
      size: 'L',
      condition: 'muy_bueno',
      description: 'Windbreaker vintage original de los 90 traída de Europa. Combinación de colores fucsia, teal y negro.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 0,
      title: 'Campera de Jean Oversized Denim Gastado',
      brand: 'Levis Trucker',
      category: 'camperas',
      style: 'casual',
      gender: 'unisex',
      size: 'XL',
      condition: 'como_nuevo',
      description: 'Chaqueta denim modelo Type III Trucker en lavado azul medio gastado. Corte unisex amplio.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Campera Polar Fleece Sherpa Térmica Beige',
      brand: 'Patagonia',
      category: 'camperas',
      style: 'casual',
      gender: 'unisex',
      size: 'M',
      condition: 'muy_bueno',
      description: 'Campera de polar tipo sherpa con bolsillo de nylon contrastante en el pecho. Super abrigada.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // ==========================================
    // SECCIÓN 5: PANTALONES & JEANS
    // ==========================================
    // HOMBRE
    {
      userIndex: 2,
      title: 'Pantalón Cargo Skate Baggy con Múltiples Bolsillos',
      brand: 'Dickies',
      category: 'pantalones',
      style: 'streetwear',
      gender: 'hombre',
      size: '34',
      condition: 'como_nuevo',
      description: 'Pantalón cargo en gabardina gruesa color verde militar. Bolsillos fuelle en piernas y ajuste de botamanga.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 0,
      title: 'Jean Recto Clásico Levis 501 Original Fit Azul Gastado',
      brand: 'Levis',
      category: 'pantalones',
      style: 'casual',
      gender: 'hombre',
      size: '32',
      condition: 'muy_bueno',
      description: 'El clásico 501 con bragueta de botones. Denim rígido 100% algodón que se adapta perfecto al cuerpo.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Pantalón Parachute Ripstop Negro Streetwear',
      brand: 'Urban Outfitters',
      category: 'pantalones',
      style: 'streetwear',
      gender: 'hombre',
      size: '32',
      condition: 'nuevo',
      description: 'Pantalón estilo paracaidista en tela antidesgarro ripstop. Botamangas con tancas elásticas ajustables.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // MUJER
    {
      userIndex: 3,
      title: 'Jean Wide Leg Tiro Alto Celeste Claro Vintage',
      brand: 'Zara',
      category: 'pantalones',
      style: 'casual',
      gender: 'mujer',
      size: '28',
      condition: 'como_nuevo',
      description: 'Jean palazzo de pierna ancha y tiro super alto. Denim suave con lavado celeste veraniego.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 5,
      title: 'Pantalón Cargo Tiro Bajo Estética Y2K Beige',
      brand: 'Bershka',
      category: 'pantalones',
      style: 'y2k',
      gender: 'mujer',
      size: '26',
      condition: 'muy_bueno',
      description: 'Pantalón cargo estilo 2000 tiro bajo con bolsillos laterales y tiras decorativas.',
      location_city: 'San Telmo, CABA',
      images: [
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 1,
      title: 'Pantalón Sastrero Oversized Pinzado Negro',
      brand: 'Mango',
      category: 'pantalones',
      style: 'formal',
      gender: 'mujer',
      size: '30',
      condition: 'nuevo',
      description: 'Pantalón de vestir con doble pinza y caída fluida. Se puede usar formal o con zapatillas para look urbano.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // UNISEX
    {
      userIndex: 0,
      title: 'Pantalón Carpenter Baggy Marrón Tabaco',
      brand: 'Carhartt',
      category: 'pantalones',
      style: 'streetwear',
      gender: 'unisex',
      size: '32',
      condition: 'como_nuevo',
      description: 'Pantalón de carpintero con tira pasamartillo y remaches de bronce reforzados en costuras.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 2,
      title: 'Jean Baggy Vintage Desgastado Azul Medio',
      brand: 'Polar Skate Co',
      category: 'pantalones',
      style: 'streetwear',
      gender: 'unisex',
      size: '34',
      condition: 'muy_bueno',
      description: 'Big Boy jeans corte ultra holgado especial para skaters. Bordado característico en el bolsillo monedero.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Jogger Deportivo Tech Fleece Gris Oscuro',
      brand: 'Nike Tech',
      category: 'pantalones',
      style: 'deportivo',
      gender: 'unisex',
      size: 'M',
      condition: 'como_nuevo',
      description: 'Pantalón jogger con bolsillo lateral largo sellado con cierre negro térmico.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // ==========================================
    // SECCIÓN 6: ZAPATILLAS & CALZADO
    // ==========================================
    // HOMBRE
    {
      userIndex: 2,
      title: 'Zapatillas Nike Dunk Low Retro Panda Originales',
      brand: 'Nike',
      category: 'calzado',
      style: 'streetwear',
      gender: 'hombre',
      size: '42',
      condition: 'como_nuevo',
      description: 'Dunk Low Panda compradas en tienda oficial Nike. Con caja original. Puntas impecables sin pliegues pronunciados, suela al 98%.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 0,
      title: 'Zapatillas Nike Air Max 90 Blancas y Rojas',
      brand: 'Nike',
      category: 'calzado',
      style: 'deportivo',
      gender: 'hombre',
      size: '43',
      condition: 'muy_bueno',
      description: 'Air Max 90 con cámara de aire intacta y capellada de malla transpirable con detalles en gamuza.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Zapatillas Converse Chuck Taylor All Star Negras Botita',
      brand: 'Converse',
      category: 'calzado',
      style: 'casual',
      gender: 'hombre',
      size: '41',
      condition: 'como_nuevo',
      description: 'Clásicas botitas de lona negra con parche de estrella en el tobillo. Puntera blanca impecable.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // MUJER
    {
      userIndex: 3,
      title: 'Zapatillas Vans Old Skool Plataforma Clásicas',
      brand: 'Vans',
      category: 'calzado',
      style: 'streetwear',
      gender: 'mujer',
      size: '37',
      condition: 'como_nuevo',
      description: 'Vans Old Skool con suela plataforma waffle de 3 cm. Lona y gamuza negra con la clásica sidestripe blanca.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 5,
      title: 'Zapatillas Chunky Blancas Urbanas Suela Doble',
      brand: 'Fila Disruptor',
      category: 'calzado',
      style: 'y2k',
      gender: 'mujer',
      size: '38',
      condition: 'muy_bueno',
      description: 'Zapatillas chunky estilo noventero con suela dentada prominente. Super cómodas para caminar.',
      location_city: 'San Telmo, CABA',
      images: [
        'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 1,
      title: 'Zapatillas Nike Air Jordan 1 Low Pasteles Dama',
      brand: 'Nike Jordan',
      category: 'calzado',
      style: 'streetwear',
      gender: 'mujer',
      size: '38',
      condition: 'nuevo',
      description: 'Jordan 1 Low en combinación de tonos pasteles menta y blanco. Nuevas en caja sin pisar.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // UNISEX
    {
      userIndex: 4,
      title: 'Zapatillas Adidas Samba OG Cuero Blanco Clásicas',
      brand: 'Adidas',
      category: 'calzado',
      style: 'casual',
      gender: 'unisex',
      size: '41',
      condition: 'muy_bueno',
      description: 'Adidas Samba OG cuero genuino blanco con puntera en T de gamuza beige y suela color caramelo.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 0,
      title: 'Zapatillas New Balance 550 Vintage White Green',
      brand: 'New Balance',
      category: 'calzado',
      style: 'vintage',
      gender: 'unisex',
      size: '42',
      condition: 'como_nuevo',
      description: 'Silueta de básquet retro de los 80 en cuero microperforado blanco con detalles en verde bosque.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 2,
      title: 'Zapatillas Nike Blazer Mid 77 Vintage Cuero Blanco',
      brand: 'Nike',
      category: 'calzado',
      style: 'vintage',
      gender: 'unisex',
      size: '40',
      condition: 'muy_bueno',
      description: 'Botitas retro con lengüeta de espuma a la vista y swoosh negro lateral. Con caja.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // ==========================================
    // SECCIÓN 7: ACCESORIOS & GORRAS
    // ==========================================
    // HOMBRE
    {
      userIndex: 0,
      title: 'Gorra New Era New York Yankees 59FIFTY Azul',
      brand: 'New Era',
      category: 'accesorios',
      style: 'streetwear',
      gender: 'hombre',
      size: 'L',
      condition: 'como_nuevo',
      description: 'Gorra cerrada original con visera plana y holograma oficial de la MLB intacto en la visera.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 2,
      title: 'Cinturón Táctico Hebilla Cobra Streetwear Negro',
      brand: 'Alyx Style',
      category: 'accesorios',
      style: 'streetwear',
      gender: 'hombre',
      size: 'M',
      condition: 'nuevo',
      description: 'Cinturón en cinta de nylon militar resistente con hebilla metálica de desenganche rápido.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Mochila Urbana Antirrobo Impermeable Gris Carbón',
      brand: 'Herschel',
      category: 'accesorios',
      style: 'casual',
      gender: 'hombre',
      size: 'L',
      condition: 'muy_bueno',
      description: 'Mochila con compartimento acolchado para notebook de 15.6 pulgadas y forro a rayas clásico.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // MUJER
    {
      userIndex: 3,
      title: 'Cartera Baguette Y2K Cuero Sintético Negro',
      brand: 'Bershka',
      category: 'accesorios',
      style: 'y2k',
      gender: 'mujer',
      size: 'S',
      condition: 'como_nuevo',
      description: 'Cartera pequeña para llevar bajo el hombro estilo años 2000. Cierre metálico y correa corta.',
      location_city: 'Belgrano, CABA',
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 1,
      title: 'Piluso Bucket Hat Algodón Peinado Beige Arena',
      brand: 'Stussy',
      category: 'accesorios',
      style: 'streetwear',
      gender: 'mujer',
      size: 'M',
      condition: 'nuevo',
      description: 'Gorro piluso en sarga de algodón con bordado frontal. Plegable y muy combinable.',
      location_city: 'Recoleta, CABA',
      images: [
        'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 5,
      title: 'Bufanda Tejida Oversize con Flecos Color Crema',
      brand: 'Zara',
      category: 'accesorios',
      style: 'casual',
      gender: 'mujer',
      size: 'L',
      condition: 'como_nuevo',
      description: 'Bufanda tipo manta súper suave y esponjosa. Terminaciones con flecos gruesos.',
      location_city: 'San Telmo, CABA',
      images: [
        'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      ],
    },

    // UNISEX
    {
      userIndex: 0,
      title: 'Gorra Dad Hat Vintage Desgastada Verde Washed',
      brand: 'Polo Ralph Lauren',
      category: 'accesorios',
      style: 'vintage',
      gender: 'unisex',
      size: 'M',
      condition: 'muy_bueno',
      description: 'Gorra con visera curva de 6 paneles en algodón suave deslavado. Hebilla metálica de ajuste trasera.',
      location_city: 'Palermo, CABA',
      images: [
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 2,
      title: 'Riñonera Shoulder Bag Cruzada Cordura Negra',
      brand: 'Carhartt WIP',
      category: 'accesorios',
      style: 'streetwear',
      gender: 'unisex',
      size: 'M',
      condition: 'como_nuevo',
      description: 'Bolso bandolera en tejido cordura repelente al agua. Dos compartimentos con cierre y correa regulable.',
      location_city: 'Caballito, CABA',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      userIndex: 4,
      title: 'Gorro Beanie de Lana Acanalada Pescador Gris',
      brand: 'The North Face',
      category: 'accesorios',
      style: 'casual',
      gender: 'unisex',
      size: 'M',
      condition: 'nuevo',
      description: 'Gorro beanie corto estilo fisherman en punto acanalado grueso. Parche con logo bordado en el doblez.',
      location_city: 'Vicente López',
      images: [
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const owner = createdUsers[p.userIndex];
    const prod = await Product.create({
      id: uuidv4(),
      user_id: owner.id,
      title: p.title,
      brand: p.brand,
      category: p.category,
      style: p.style,
      gender: p.gender,
      size: p.size,
      item_condition: p.condition,
      description: p.description,
      location_city: p.location_city,
      location_lat: owner.location_lat,
      location_lng: owner.location_lng,
      images: p.images,
      status: 'active',
      views_count: Math.floor(Math.random() * 45) + 8,
    });
    createdProducts.push(prod);
  }

  // 4. Create an Exemplary Completed Exchange with Review
  const exchangeId = uuidv4();
  const [completedExchange] = await Exchange.findOrCreate({
    where: { id: exchangeId },
    defaults: {
      id: exchangeId,
      requester_id: createdUsers[0].id, // Lucas
      owner_id: createdUsers[1].id,     // Valentina
      product_requested_id: createdProducts[1]?.id || createdProducts[0].id,
      product_offered_id: createdProducts[0]?.id,
      status: 'completed',
      exchange_code: 'SV-9942',
      requester_confirmed: true,
      owner_confirmed: true,
      completed_at: new Date(),
    },
  });

  // 5. Create Community Reviews
  await Review.findOrCreate({
    where: { exchange_id: exchangeId, reviewer_id: createdUsers[0].id },
    defaults: {
      id: uuidv4(),
      exchange_id: exchangeId,
      reviewer_id: createdUsers[0].id,
      reviewed_id: createdUsers[1].id,
      rating: 5,
      comment: '¡Excelente experiencia! La prenda estaba exactamente como en las fotos y la coordinación del punto de encuentro fue súper rápida.',
    },
  });

  await Review.findOrCreate({
    where: { exchange_id: exchangeId, reviewer_id: createdUsers[1].id },
    defaults: {
      id: uuidv4(),
      exchange_id: exchangeId,
      reviewer_id: createdUsers[1].id,
      reviewed_id: createdUsers[0].id,
      rating: 5,
      comment: 'Super confiable Lucas, puntual y la camiseta impecable. 100% recomendado para la comunidad.',
    },
  });

  console.log(`--- Seed Completed: ${createdUsers.length} Users, ${createdProducts.length} Authenticated Garments Seeded ---`);
}
