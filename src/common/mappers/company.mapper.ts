import { CompanyDocument } from '../schemas/company.schema.js';

/**
 * Mapea un documento de la base de datos (con campos como RazonSocial)
 * a un objeto de respuesta para la API (con campos como businessName).
 * @param company El documento de la compañía desde Mongoose.
 */
export function toCompanyApiResponse(company: CompanyDocument) {
  const companyObject = company.toObject();
  return {
    id: companyObject._id.toString(),
    businessName: companyObject.RazonSocial,
    ruc: companyObject.RUC,
    isActive: companyObject.IsActive,
    logo: companyObject.LogoUrl,
    createdAt: companyObject.CreatedAt,
    updatedAt: companyObject.UpdatedAt,
    createdBy: companyObject.CreatedBy,
    updatedBy: companyObject.UpdatedBy,
  };
}