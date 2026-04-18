import { Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesRepository } from './companies.repository.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { toCompanyApiResponse } from '../../common/mappers/company.mapper.js';

@Injectable()
export class CompaniesService {
  constructor(private companiesRepository: CompaniesRepository) {}

  async findOne(id: string) {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Empresa no encontrada.');
    }
    return toCompanyApiResponse(company);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string) {
    // 1. Mapear del DTO de la API a la estructura de la BD
    const companyUpdates = {};
    if (updateCompanyDto.businessName) companyUpdates['RazonSocial'] = updateCompanyDto.businessName;
    if (updateCompanyDto.ruc) companyUpdates['RUC'] = updateCompanyDto.ruc;
    if (updateCompanyDto.logo) companyUpdates['LogoUrl'] = updateCompanyDto.logo;
    if (updateCompanyDto.isActive !== undefined) companyUpdates['IsActive'] = updateCompanyDto.isActive;
    companyUpdates['UpdatedBy'] = userId; // Añadimos el ID del usuario que modifica

    // 2. Realizar la actualización
    const updatedCompany = await this.companiesRepository.update(id, companyUpdates);

    if (!updatedCompany) {
      throw new NotFoundException('Empresa no encontrada para actualizar.');
    }

    // 3. Mapear la respuesta de la BD al formato de la API
    return toCompanyApiResponse(updatedCompany);
  }
}