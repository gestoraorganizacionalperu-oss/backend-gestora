import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area, AreaDocument } from '../../common/schemas/area.schema';
import { Ubicacion, UbicacionDocument } from '../../common/schemas/ubicacion.schema';
import { Menu, MenuDocument } from '../../common/schemas/menu.perfil.schema';
import { TipoDocumento, TipoDocumentoDocument } from '../../common/schemas/tipo-documento.schema';

@Injectable()
export class MaestrosRepository {
  constructor(
    @InjectModel(Area.name) private areaModel: Model<AreaDocument>,
    @InjectModel(Ubicacion.name) private ubicacionModel: Model<UbicacionDocument>,
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
    @InjectModel(TipoDocumento.name) private tipoDocumentoModel: Model<TipoDocumentoDocument>,
  ) {}

  async findPerfiles() {
    // Seleccionamos solo los campos IdPerfil y NamePerfil, y excluimos _id
    return this.menuModel.find().select({ IdPerfil: 1, NamePerfil: 1, _id: 0 }).exec();
  }

  async findActiveUbicacionesByCompany(companyId: string): Promise<any[]> {
    return this.ubicacionModel.find({ CompanyId: companyId, IsActive: true }).lean().exec();
  }

  async findActiveAreasByCompany(companyId: string): Promise<any[]> {
    return this.areaModel.find({ CompanyId: companyId, IsActive: true }).lean().exec();
  }

  async findAllUbicacionesByCompany(companyId: string): Promise<any[]> {
    return this.ubicacionModel.find({ CompanyId: companyId }).lean().exec();
  }

  async findAllAreasByCompany(companyId: string): Promise<any[]> {
    return this.areaModel.find({ CompanyId: companyId }).lean().exec();
  }

  async findTipoDocumentos(): Promise<TipoDocumento[]> {
    return this.tipoDocumentoModel.find().exec();
  }
}