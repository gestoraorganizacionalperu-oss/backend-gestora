/**
 * Script de migración: agrega los menús de Control de Producción
 * a todos los perfiles existentes en la colección `menus`.
 *
 * Uso:
 *   node scripts/add-menus-produccion.js
 *
 * Requiere que .env tenga DATABASE_URL configurado.
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer DATABASE_URL desde .env (sin depender de dotenv)
function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    process.env[key.trim()] = rest.join('=').trim();
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no encontrado en .env');
  process.exit(1);
}

const NUEVOS_MENUS = [
  {
    Id: 20,
    Nombre: 'Gestión de Producción',
    Ruta: '/gestion-produccion',
    Icono: 'ClipboardList',
    ParentId: null,
  },
  {
    Id: 21,
    Nombre: 'Adm. Control de Producción',
    Ruta: '/administracion/control-produccion',
    Icono: 'Settings',
    ParentId: null,
  },
  {
    Id: 22,
    Nombre: 'Reportes de Producción',
    Ruta: '/reportes-produccion',
    Icono: 'BarChart2',
    ParentId: null,
  },
];

async function main() {
  const client = new MongoClient(DATABASE_URL);
  await client.connect();
  console.log('✅ Conectado a MongoDB');

  const db = client.db();
  const col = db.collection('menus');

  const perfiles = await col.find({}).toArray();
  console.log(`📋 Perfiles encontrados: ${perfiles.length}`);

  for (const perfil of perfiles) {
    const menus = perfil.Menus ?? [];
    const rutas = new Set(menus.map((m) => m.Ruta));

    const aAgregar = NUEVOS_MENUS.filter((nm) => !rutas.has(nm.Ruta));

    if (aAgregar.length === 0) {
      console.log(`  ⏭️  ${perfil.NamePerfil} (IdPerfil: ${perfil.IdPerfil}) — ya tiene los menús`);
      continue;
    }

    await col.updateOne(
      { _id: perfil._id },
      { $push: { Menus: { $each: aAgregar } } }
    );
    console.log(
      `  ✅ ${perfil.NamePerfil} (IdPerfil: ${perfil.IdPerfil}) — agregados: ${aAgregar.map((m) => m.Nombre).join(', ')}`
    );
  }

  await client.close();
  console.log('\n🎉 Migración completada.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
