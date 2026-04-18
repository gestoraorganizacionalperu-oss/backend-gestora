import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../common/schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAllByCompany(companyId: string): Promise<UserDocument[]> {
    return this.userModel.find({ CompanyId: companyId , IsActive: true}).exec();
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, CompanyId: companyId , IsActive: true }).exec();
  }

  async findActiveByEmail(email: string, companyId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ Email: email, CompanyId: companyId,IsActive: true }).exec();
  }

  async findByUsername(username: string, companyId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ Username: username, CompanyId: companyId,IsActive: true }).exec();
  }

  async findActiveByDni(dni: string, companyId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ Dni: dni, CompanyId: companyId, IsActive: true }).exec();
  }

  async create(user: any): Promise<UserDocument> {
    const newUser = new this.userModel(user);
    // Forzamos el guardado de PuestoId si existe, por si no está en el esquema estricto
    if (user.PuestoId) {
      newUser.set('PuestoId', new Types.ObjectId(user.PuestoId), { strict: false });
    }
    return newUser.save();
  }

  async update(
    id: string,
    companyId: string,
    userUpdates: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate({ _id: id, CompanyId: companyId }, { $set: userUpdates }, { new: true, strict: false }).exec();
  }

  async findNamesByIds(ids: string[], companyId: string): Promise<UserDocument[]> {
    return this.userModel.find(
      { _id: { $in: ids }, CompanyId: companyId },
      { Name: 1, LastName: 1 }
    ).exec();
  }
}