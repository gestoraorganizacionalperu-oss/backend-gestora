import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from '../../common/schemas/company.schema.js'; // Esta ruta es correcta
import { CompaniesController } from './companies.controller.js';
import { CompaniesRepository } from './companies.repository.js';
import { CompaniesService } from './companies.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}