import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../../common/schemas/company.schema.js';

@Injectable()
export class CompaniesRepository {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async findById(id: string): Promise<CompanyDocument | null> {
    return this.companyModel.findById(id).exec();
  }

  async update(id: string, companyUpdates: Partial<Company>): Promise<CompanyDocument | null> {
    return this.companyModel
      .findByIdAndUpdate(id, { $set: companyUpdates }, { new: true })
      .exec();
  }
}