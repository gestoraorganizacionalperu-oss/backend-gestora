/**
 * Script de migración: completa el campo `empresa_id` en la colección
 * `trabajador`, que hoy no lo tiene en ningún documento.
 *
 * Es un paso NECESARIO antes de desplegar el fix de seguridad que filtra
 * GET /api/asistencia/trabajadores por empresa -- sin este backfill, el
 * filtro dejaría la lista de trabajadores vacía para todo el mundo.
 *
 * Estrategia: para cada `trabajador`, busca en `asistencia` un documento
 * cuyo `dni` coincida con el `nro_doc` del trabajador, y toma de ahí el
 * `empresa_id` correcto (ya que `asistencia` sí lo tiene bien cargado).
 *
 * Casos que NO se resuelven automáticamente (se listan al final para
 * decidir a mano, nunca se adivinan):
 *   - Trabajador sin ningún registro de asistencia (nunca marcó) -> no hay
 *     con qué cruzar.
 *   - Trabajador cuyo nro_doc aparece en asistencia con MÁS DE UN
 *     empresa_id distinto -> dato inconsistente, requiere revisión manual.
 *
 * Uso:
 *   node scripts/backfill-empresa-id-trabajador.js            (dry-run, no escribe nada)
 *   node scripts/backfill-empresa-id-trabajador.js --apply    (aplica los cambios)
 *
 * Requiere que .env tenga DATABASE_URL configurado. Correr SIEMPRE primero
 * contra staging, revisar el resultado, y recién después contra producción.
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  // En Render (y otros hosts) las variables de entorno ya vienen inyectadas
  // directamente en process.env -- no existe un archivo .env físico ahí.
  // Si no lo encontramos, no es un error: seguimos usando lo que ya esté
  // en process.env (como hace el backend real en producción).
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

// Trabajadores confirmados manualmente por el usuario cuando no hay ningún
// registro en `asistencia` para cruzar (ej. no marcan reloj, o son nuevos
// y todavía no marcaron ninguna vez). Mapeo: _id de trabajador -> empresa_id.
const OVERRIDES_MANUALES = {
  5: '69e3144e43b3860670988885', // José Adolfo Urbina Vela -- ToolGestora S.A., trabajador, aún sin marcar
  6: '69e3144e43b3860670988885', // Percy Rodríguez Villaseca -- ToolGestora S.A., trabajador, aún sin marcar
  7: '69e3144e43b3860670988885', // Carlos Percy Orihuela Solís -- ToolGestora S.A., Gerente General, no marca asistencia
};

async function main() {
  const client = new MongoClient(DATABASE_URL);
  await client.connect();
  console.log(`✅ Conectado a MongoDB (${APLICAR ? 'modo APLICAR cambios' : 'modo DRY-RUN, solo simulación'})`);

  const db = client.db();
  const trabajadorCol = db.collection('trabajador');
  const asistenciaCol = db.collection('asistencia');

  const trabajadores = await trabajadorCol.find({ empresa_id: { $in: [null, undefined, ''] } }).toArray();
  console.log(`📋 Trabajadores sin empresa_id: ${trabajadores.length}\n`);

  const resueltos = [];
  const sinAsistencia = [];
  const inconsistentes = [];

  for (const t of trabajadores) {
    const registros = await asistenciaCol.find({ dni: t.nro_doc }).toArray();

    if (registros.length === 0) {
      if (OVERRIDES_MANUALES[t._id] != null) {
        resueltos.push({ trabajador: t, empresaId: OVERRIDES_MANUALES[t._id], origen: 'override manual' });
      } else {
        sinAsistencia.push(t);
      }
      continue;
    }

    const empresasDistintas = [...new Set(registros.map((r) => r.empresa_id).filter(Boolean))];

    if (empresasDistintas.length === 0) {
      if (OVERRIDES_MANUALES[t._id] != null) {
        resueltos.push({ trabajador: t, empresaId: OVERRIDES_MANUALES[t._id], origen: 'override manual' });
      } else {
        sinAsistencia.push(t);
      }
      continue;
    }

    if (empresasDistintas.length > 1) {
      inconsistentes.push({ trabajador: t, empresas: empresasDistintas });
      continue;
    }

    resueltos.push({ trabajador: t, empresaId: empresasDistintas[0], origen: 'cruce con asistencia' });
  }

  console.log(`✅ Resueltos: ${resueltos.length}`);
  for (const { trabajador, empresaId, origen } of resueltos) {
    console.log(`   _id=${trabajador._id} (${trabajador.nombres}, DNI ${trabajador.nro_doc}) -> empresa_id=${empresaId} [${origen}]`);
    if (APLICAR) {
      await trabajadorCol.updateOne({ _id: trabajador._id }, { $set: { empresa_id: empresaId } });
    }
  }

  console.log(`\n⚠️  Sin ningún registro de asistencia para cruzar (requieren asignación manual): ${sinAsistencia.length}`);
  for (const t of sinAsistencia) {
    console.log(`   _id=${t._id} (${t.nombres}, DNI ${t.nro_doc})`);
  }

  console.log(`\n🚨 Con empresa_id AMBIGUO -- el mismo DNI aparece con más de una empresa en asistencia (requieren revisión manual): ${inconsistentes.length}`);
  for (const { trabajador, empresas } of inconsistentes) {
    console.log(`   _id=${trabajador._id} (${trabajador.nombres}, DNI ${trabajador.nro_doc}) -> posibles empresas: ${empresas.join(', ')}`);
  }

  await client.close();

  if (!APLICAR) {
    console.log('\nℹ️  Esto fue una simulación (dry-run). Nada se escribió en la base.');
    console.log('   Si los resultados de arriba se ven correctos, vuelve a correr con --apply.');
  } else {
    console.log('\n🎉 Migración aplicada. Revisa los casos manuales listados arriba antes de activar el filtro de seguridad.');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
