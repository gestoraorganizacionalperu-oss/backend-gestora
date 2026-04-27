import { Schema } from 'mongoose';

export const SolicitudPermisoSchema = new Schema({
  dni: { type: String, required: true },
  fechaInicio: { type: String, required: true }, // Guardar como 'DD/MM/YYYY'
  fechaFin: { type: String, required: true },    // Guardar como 'DD/MM/YYYY'
  correlativo: { type: String, required: true },
  imagenBase64: { type: String, required: true },
});
