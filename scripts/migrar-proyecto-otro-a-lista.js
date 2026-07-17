/**
 * Migración: `config_ctrl_produccion.proyectoOtro` (un objeto único por
 * semana) -> `config_ctrl_produccion.proyectosOtros` (una lista), para
 * poder tener varias filas de "Proyectos/Otros" por semana en vez de una
 * sola.
 *
 * Para cada documento:
 *   - Si `proyectoOtro` tiene datos reales (descripción o algún día con
 *     horas/cantidad), se convierte en el primer elemento de
 *     `proyectosOtros`, con un `id` generado.
 *   - Si `proyectoOtro` está vacío (nunca se usó), `proyectosOtros` queda
 *     como lista vacía -- no se genera una fila fantasma sin datos.
 *   - El campo viejo `proyectoOtro` se elimina del documento después de
 *     migrar (con $unset), para no dejar datos duplicados/confusos.
 *
 * Uso:
 *   node scripts/migrar-proyecto-otro-a-lista.js            (dry-run)
 *   node scripts/migrar-proyecto-otro-a-lista.js --apply     (aplica)
 *
 * Como siempre: correr primero contra staging, revisar, y recién
 * después contra producción.
 */

import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';
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

function diaTieneDatos(dia) {
  if (!dia) return false;
  return !!(dia.hProg || dia.cantPro || dia.horaInicio || dia.horaFin || dia.responsableId);
}

function proyectoOtroTieneDatos(p) {
  if (!p) return false;
  if (p.descripcion) return true;
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return dias.some((d) => diaTieneDatos(p[d]));
}

async function main() {
  const client = new MongoClient(DATABASE_URL);
  await client.connect();
  console.log(`✅ Conectado a MongoDB (${APLICAR ? 'modo APLICAR cambios' : 'modo DRY-RUN, solo simulación'})`);

  const db = client.db();
  const configCol = db.collection('config_ctrl_produccion');

  const docs = await configCol.find({ proyectoOtro: { $exists: true } }).toArray();
  console.log(`📋 Documentos con el campo viejo "proyectoOtro": ${docs.length}\n`);

  let conDatos = 0;
  let vacios = 0;

  for (const doc of docs) {
    const tieneDatos = proyectoOtroTieneDatos(doc.proyectoOtro);
    const nuevaLista = tieneDatos ? [{ id: randomUUID(), ...doc.proyectoOtro }] : [];

    if (tieneDatos) {
      conDatos++;
      console.log(`   _id=${doc._id} semanaInicio=${doc.semanaInicio || '(sin migrar)'} -> 1 fila migrada ("${doc.proyectoOtro.descripcion || 'sin descripción'}")`);
    } else {
      vacios++;
    }

    if (APLICAR) {
      await configCol.updateOne(
        { _id: doc._id },
        {
          $set: { proyectosOtros: nuevaLista },
          $unset: { proyectoOtro: '' },
        }
      );
    }
  }

  console.log(`\n✅ Con datos reales (migrados a 1 fila): ${conDatos}`);
  console.log(`ℹ️  Vacíos (proyectosOtros quedó como lista vacía): ${vacios}`);

  await client.close();

  if (!APLICAR) {
    console.log('\nℹ️  Esto fue una simulación (dry-run). Nada se escribió en la base.');
    console.log('   Si los resultados de arriba se ven correctos, vuelve a correr con --apply.');
  } else {
    console.log('\n🎉 Migración aplicada.');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
