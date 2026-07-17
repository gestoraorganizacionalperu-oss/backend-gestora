/**
 * Vacía las colecciones `config_ctrl_produccion` y `registros_produccion`
 * -- SOLO de una empresa (por defecto, ToolGestora S.A.) -- para
 * arrancar con data real desde cero, sin tocar las demás empresas.
 *
 * ⚠️  Esto borra TODO lo programado y registrado de esa empresa en esas
 *     2 colecciones. Haz un respaldo en Mongo Atlas ANTES de correr esto
 *     con --apply, por si acaso.
 *
 * NO toca `trabajador`, `users`, `companies`, `matriz-procesos`,
 * `puestos`, ni ninguna otra colección -- solo estas dos, y solo para
 * el companyId indicado.
 *
 * Uso:
 *   node scripts/limpiar-reportes-produccion.js                     (dry-run, solo cuenta)
 *   node scripts/limpiar-reportes-produccion.js --apply              (borra de verdad)
 *   node scripts/limpiar-reportes-produccion.js --company=OTRO_ID     (otra empresa)
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  try {
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    console.log('ℹ️  No se encontró .env físico (normal en Render) -- usando variables de entorno ya inyectadas.');
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no encontrado en .env');
  process.exit(1);
}

const APLICAR = process.argv.includes('--apply');

// Por defecto, ToolGestora S.A. (confirmado en esta conversación).
// Se puede sobreescribir con --company=OTRO_ID si hace falta.
const argCompany = process.argv.find((a) => a.startsWith('--company='));
const COMPANY_ID = argCompany ? argCompany.split('=')[1] : '69e3144e43b3860670988885';

async function main() {
  const client = new MongoClient(DATABASE_URL);
  await client.connect();
  console.log(`✅ Conectado a MongoDB (${APLICAR ? '🚨 modo APLICAR -- SE BORRA DE VERDAD' : 'modo DRY-RUN, solo simulación'})`);
  console.log(`🏢 Empresa objetivo: ${COMPANY_ID}\n`);

  const db = client.db();
  const configCol = db.collection('config_ctrl_produccion');
  const registroCol = db.collection('registros_produccion');

  const totalConfig = await configCol.countDocuments({ companyId: COMPANY_ID });
  const totalRegistros = await registroCol.countDocuments({ companyId: COMPANY_ID });

  console.log(`📋 config_ctrl_produccion de esta empresa: ${totalConfig} documentos`);
  console.log(`📋 registros_produccion de esta empresa: ${totalRegistros} documentos`);

  // Conteo total (todas las empresas), solo informativo, para que veas
  // que el resto no se toca.
  const totalConfigGlobal = await configCol.countDocuments({});
  const totalRegistrosGlobal = await registroCol.countDocuments({});
  console.log(`\nℹ️  Total en el sistema (todas las empresas, NO se tocan): config_ctrl_produccion=${totalConfigGlobal}, registros_produccion=${totalRegistrosGlobal}`);

  if (APLICAR) {
    const r1 = await configCol.deleteMany({ companyId: COMPANY_ID });
    const r2 = await registroCol.deleteMany({ companyId: COMPANY_ID });
    console.log(`\n🎉 Borrados de esta empresa: ${r1.deletedCount} de config_ctrl_produccion, ${r2.deletedCount} de registros_produccion.`);
  } else {
    console.log('\nℹ️  Esto fue una simulación (dry-run). Nada se borró todavía.');
    console.log('   Si los números de arriba se ven correctos, vuelve a correr con --apply.');
  }

  await client.close();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
