import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MatrizProcesosRepository } from './matrizprocesos.repository';
import { MacroprocesoDto } from './dto/matrizprocesos.dto';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { Documento } from '../../common/schemas/documento.schema';
import { Company } from '../../common/schemas/company.schema';
import { Macroproceso } from '../../common/schemas/matrizprocesos.schema';
import { TipoDocumento } from '../../common/schemas/tipo-documento.schema';
import { User } from '../../common/schemas/user.schema';
import * as crypto from 'crypto';
import * as path from 'path';
import { Puesto } from '../../common/schemas/puesto.schema';

@Injectable()
export class MatrizProcesosService {
  constructor(
    private readonly repository: MatrizProcesosRepository,
    @InjectModel(Documento.name) private readonly documentoModel: Model<Documento>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(TipoDocumento.name) private readonly tipoDocumentoModel: Model<TipoDocumento>,
    @InjectModel(Macroproceso.name) private readonly macroprocesoModel: Model<Macroproceso>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Puesto.name) private readonly puestoModel: Model<Puesto>,
  ) {}

  async getMatriz(companyId: string, userId: string): Promise<any[]> {
    try {
      let matriz = await this.repository.findByCompanyId(companyId);

      // Verificar perfil del usuario
      const user = await this.userModel.findById(userId).select('ProfileId').lean();
      
      // Si es Responsable (ProfileId 3), aplicamos el filtro
      if (user && user.ProfileId === 3) {
        // 1. Obtener los IDs de los puestos donde el usuario es responsable
        const userPuestos = await this.puestoModel.find({
          'responsibles.UsuarioId': userId,
          CompanyId: companyId
        }).select('_id').lean();
        
        const userPuestoIds = new Set(userPuestos.map(p => p._id.toString()));

        // 2. Función recursiva para filtrar la matriz
        const filterMatrizRecursive = (nodes: any[], level: string): any[] => {
          return nodes.filter(node => {
            if (level === 'macroproceso') {
              if (node.procesos) {
                node.procesos = filterMatrizRecursive(node.procesos, 'proceso');
              }
              return node.procesos && node.procesos.length > 0;
            }
            if (level === 'proceso') {
              if (node.subprocesos) {
                node.subprocesos = filterMatrizRecursive(node.subprocesos, 'subproceso');
              }
              return node.subprocesos && node.subprocesos.length > 0;
            }
            if (level === 'subproceso') {
              let hasContent = false;
              // Verificar actividades
              if (node.actividades) {
                node.actividades = filterMatrizRecursive(node.actividades, 'actividad');
                if (node.actividades.length > 0) hasContent = true;
              }
              // Verificar subprocesos anidados (recursividad)
              if (node.subprocesos) {
                node.subprocesos = filterMatrizRecursive(node.subprocesos, 'subproceso');
                if (node.subprocesos.length > 0) hasContent = true;
              }
              return hasContent;
            }
            if (level === 'actividad') {
              if (node.descripciones) {
                node.descripciones = filterMatrizRecursive(node.descripciones, 'descripcion');
              }
              return node.descripciones && node.descripciones.length > 0;
            }
            if (level === 'descripcion') {
              // Verificar si alguno de los puestos de la descripción corresponde al usuario
              if (node.puestos && Array.isArray(node.puestos)) {
                return node.puestos.some((pRef: any) => {
                  // pRef.id es el objeto populado, accedemos a su _id
                  const pId = pRef.id && pRef.id._id ? pRef.id._id.toString() : null;
                  return pId && userPuestoIds.has(pId);
                });
              }
              return false;
            }
            return false;
          });
        };

        matriz = filterMatrizRecursive(matriz, 'macroproceso');
      }

      const processAndSort = (item: any) => {
        if (!item) return;

        // Transformación de puestos (lógica original)
        if (item.puestos) {
          item.puestos = item.puestos.map((p) =>
            p.id ? { id: p.id._id, nombre: p.id.Nombre } : p,
          );
        }

        // Recorrer recursivamente los niveles anidados
        const childrenFields = ['procesos', 'subprocesos', 'actividades', 'descripciones'];
        childrenFields.forEach((field) => {
          if (item[field] && Array.isArray(item[field])) {
            item[field].forEach(processAndSort);
          }
        });
      };

      // Procesar recursivamente toda la estructura
      matriz.forEach(processAndSort);

      return matriz;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener la matriz de procesos.',
      );
    }
  }

  async updateMatriz(
    companyId: string,
    userId: string,
    matrizDto: MacroprocesoDto[],
  ): Promise<any> {
    try {
      await this.repository.updateMatriz(companyId, userId, matrizDto);
      return { message: 'Matriz de procesos actualizada correctamente.' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al actualizar la matriz de procesos.',
      );
    }
  }

  async createDocumento(
    createDocumentoDto: CreateDocumentoDto,
    userId: string,
    companyId: string,
  ): Promise<Documento> {
    // VALIDACIÓN ADICIONAL: Solo puede haber UN documento por subproceso con desdeMatrizProceso = true.
    if (createDocumentoDto.desdeMatrizProceso) {
      const documentoExistente = await this.documentoModel.findOne({
        subProcesoId: createDocumentoDto.subProcesoId,
        desdeMatrizProceso: true,
      });

      if (documentoExistente) {
        throw new ConflictException(`Ya existe un documento principal (desdeMatrizProceso=true) asociado al subproceso con ID '${createDocumentoDto.subProcesoId}'.`);
      }
    }

    // Procesar y subir adjuntos si existen
    const adjuntosParaGuardar: { nombreArchivo: string; idGoogle: string }[] = [];
    if (createDocumentoDto.adjuntos && createDocumentoDto.adjuntos.length > 0) {
      for (const adjunto of createDocumentoDto.adjuntos) {
        const fileId = crypto.randomUUID();
        const fileExtension = path.extname(adjunto.nombreArchivo);
        const gcsFileName = `${fileId}${fileExtension}`;

        // await this.googleStorageService.uploadFile(
        //   adjunto.base64,
        //   gcsFileName,
        //   companyId,
        // );
        adjuntosParaGuardar.push({
          nombreArchivo: adjunto.nombreArchivo,
          idGoogle: gcsFileName,
        });
      }
    }

    // 1. Obtener la abreviatura de la empresa y el código del tipo de documento
    const [company, tipoDocumento] = await Promise.all([
      this.companyModel.findById(companyId).select('Abreviatura').lean(),
      this.tipoDocumentoModel
        .findById(createDocumentoDto.tipoDocumentoId)
        .select('codigo')
        .lean(),
    ]);

    if (!company) {
      throw new NotFoundException(`No se encontró la empresa con id ${companyId}`);
    }
    if (!tipoDocumento) {
      throw new NotFoundException(
        `No se encontró el tipo de documento con id ${createDocumentoDto.tipoDocumentoId}`,
      );
    }

    // Obtener el nombre del subproceso
    const subProcesoNombre = await this._findSubProcesoNombre(
      createDocumentoDto.subProcesoId.toString(),
      companyId,
    );
    if (!subProcesoNombre) {
      throw new NotFoundException(
        `No se pudo encontrar el nombre para el subproceso con ID '${createDocumentoDto.subProcesoId}'.`,
      );
    }

    // 2. Generar el código correlativo
    const codigo = await this.generarCodigoCorrelativo(
      company.Abreviatura,
      createDocumentoDto.areaCodigo,
      tipoDocumento.codigo,
      new Types.ObjectId(companyId),
      createDocumentoDto.tipoDocumentoId,
    );

    // 3. Construir el nuevo documento
    const nuevoDocumento = new this.documentoModel({
      ...createDocumentoDto,
      codigo,
      subProcesoNombre,
      version: '1.0',
      companyId: new Types.ObjectId(companyId),
      adjuntos: adjuntosParaGuardar,
      createdBy: new Types.ObjectId(userId),
      definiciones: createDocumentoDto.definiciones,
      vbElaborado: false, // Valor por defecto
      vbRevisado: false,   // Valor por defecto
      vbAprobado: false,   // Valor por defecto
      controlCambios: [
        {
          item: 1,
          modificacion: 'Actualización inicial del proceso',
          version: '1.0',
          fecha: new Date(),
        },
      ],
    });
    console.log("aaaaaaaaaaa",nuevoDocumento)
    // 4. Guardar en la base de datos y devolver el resultado
    try {
      return await nuevoDocumento.save({ validateBeforeSave: false });
    } catch (error) {
      console.error('Error al guardar el documento:', error);
      throw new InternalServerErrorException(
        'Ocurrió un error al registrar el documento.',
      );
    }
  }

  private async generarCodigoCorrelativo(
    abreviaturaEmpresa: string,
    areaCodigo: string,
    codigoTipoDoc: string,
    companyId: Types.ObjectId,
    tipoDocumentoId: Types.ObjectId,
  ): Promise<string> {
    const prefijo = `${abreviaturaEmpresa}-${areaCodigo}-${codigoTipoDoc}`;

    const count = await this.documentoModel.countDocuments({
      companyId: companyId,
      areaCodigo: areaCodigo,
      tipoDocumentoId: tipoDocumentoId,
    });

    const correlativo = count + 1;
    const correlativoFormateado = correlativo.toString().padStart(3, '0');

    return `${prefijo}-${correlativoFormateado}`;
  }

  async findDocumentoBySubProcesoId(
    subProcesoId: string,
    companyId: string,
  ): Promise<any> {

    const matchQuery: any = {
      subProcesoId: subProcesoId,
      desdeMatrizProceso: true,
    };

    const results = await this.documentoModel.aggregate([
      // 1. Encontrar el documento por el ID del subproceso
      { $match: matchQuery },
      // 2. Buscar en la colección 'macroprocesos' para obtener el nombre
      {
        $lookup: {
          from: 'macroprocesos',
          let: { subId: '$subProcesoId' },
          pipeline: [
            // Filtrar por el companyId correcto
            { $match: { CompanyId: companyId } },
            // Desenrollar los procesos y el primer nivel de subprocesos
            { $unwind: '$procesos' },
            { $unwind: '$procesos.subprocesos' },
            // Usar $graphLookup para encontrar el subproceso en cualquier nivel de anidación
            {
              $graphLookup: {
                from: 'macroprocesos',
                startWith: '$procesos.subprocesos', // Empezar desde el primer nivel de subprocesos
                connectFromField: 'subprocesos', // Campo que contiene los hijos
                connectToField: '_id', // Campo que conecta (no se usa en este caso, pero es requerido)
                as: 'todosLosSubprocesos', // Array con todos los subprocesos encontrados
                depthField: 'nivel', // Campo que indica el nivel de anidación
              },
            },
            // Añadir el subproceso de nivel 1 a la lista de todos los subprocesos
            { $addFields: { todosLosSubprocesos: { $concatArrays: ['$todosLosSubprocesos', ['$procesos.subprocesos']] } } },
            // Desenrollar la lista completa de subprocesos
            { $unwind: '$todosLosSubprocesos' },
            // Reemplazar la raíz con el subproceso actual
            { $replaceRoot: { newRoot: '$todosLosSubprocesos' } },
            // Filtrar para encontrar el que coincide con el ID que buscamos
            { $match: { _id: subProcesoId } },
            // Proyectar solo el nombre
            { $project: { _id: 0, nombre: 1 } },
          ],
          as: 'subProcesoInfo',
        },
      },
      // 3. Desenrrollar el resultado del lookup
      {
        $unwind: {
          path: '$subProcesoInfo',
          preserveNullAndEmptyArrays: true, // Mantener el documento si no se encuentra el nombre
        },
      },
      // 4. Proyectar el formato de salida final
      {
        $project: {
          _id: 1,
          tipoDocumentoId: 1,
          subProcesoId: 1,
          subProcesoNombre: { $ifNull: ['$subProcesoInfo.nombre', '$subProcesoNombre'] }, // Usar el nombre encontrado o el guardado como fallback
          codigo: 1,
          version: 1,
          objetivo: 1,
          alcance: 1,
          definiciones: 1,
          elaboradoPor: 1,
          revisadoPor: 1,
          aprobadoPor: 1,
          controlCambios: 1,
          areaId: 1,
          vbElaborado: 1,
          vbRevisado: 1,
          vbAprobado: 1,
          desdeMatrizProceso: 1,
          descripcionDocumento: 1,
          adjuntos: 1,
        },
      },
    ]);

    if (results.length === 0) {
      throw new NotFoundException(`No se encontró un documento para el subproceso con ID '${subProcesoId}'.`);
    }

    const documento = results[0];

    // Recolectar IDs de usuarios para obtener sus nombres si el Visto Bueno (vb) es true
    const userIds: Types.ObjectId[] = [];
    if (documento.vbElaborado && documento.elaboradoPor?.usuarioId) {
      userIds.push(new Types.ObjectId(documento.elaboradoPor.usuarioId));
    }
    if (documento.vbRevisado && documento.revisadoPor?.usuarioId) {
      userIds.push(new Types.ObjectId(documento.revisadoPor.usuarioId));
    }
    if (documento.vbAprobado && documento.aprobadoPor?.usuarioId) {
      userIds.push(new Types.ObjectId(documento.aprobadoPor.usuarioId));
    }

    const namesMap = new Map<string, string>();
    if (userIds.length > 0) {
      const users = await this.userModel.find({ _id: { $in: userIds } }).select('Name LastName').lean();
      users.forEach((u) => {
        namesMap.set(u._id.toString(), `${u.Name} ${u.LastName}`);
      });
    }

    return {
      ...documento,
      NombreElaborado: (documento.vbElaborado && documento.elaboradoPor?.usuarioId)
        ? (namesMap.get(documento.elaboradoPor.usuarioId.toString()) || '') : '',
      NombreRevisado: (documento.vbRevisado && documento.revisadoPor?.usuarioId)
        ? (namesMap.get(documento.revisadoPor.usuarioId.toString()) || '') : '',
      NombreAprobado: (documento.vbAprobado && documento.aprobadoPor?.usuarioId)
        ? (namesMap.get(documento.aprobadoPor.usuarioId.toString()) || '') : '',
    };
  }

  private async _findSubProcesoNombre(
    subProcesoId: string,
    companyId: string,
  ): Promise<string | null> {
    const objectIdSubProceso = new Types.ObjectId(subProcesoId);

    const result = await this.macroprocesoModel.aggregate([
      { $match: { CompanyId: companyId } },
      { $unwind: '$procesos' },
      { $unwind: '$procesos.subprocesos' },
      {
        $graphLookup: {
          from: 'macroprocesos',
          startWith: '$procesos.subprocesos.subprocesos',
          connectFromField: 'subprocesos',
          connectToField: '_id',
          as: 'subprocesosAnidados',
          depthField: 'nivel',
        },
      },
      {
        $addFields: {
          todosLosSubprocesos: {
            $concatArrays: [
              '$subprocesosAnidados',
              ['$procesos.subprocesos'],
            ],
          },
        },
      },
      { $unwind: '$todosLosSubprocesos' },
      { $replaceRoot: { newRoot: '$todosLosSubprocesos' } },
      { $match: { _id: objectIdSubProceso } },
      { $project: { _id: 0, nombre: 1 } },
      { $limit: 1 },
    ]);

    return result.length > 0 ? result[0].nombre : null;
  }

  async updateDocumento(
    id: string,
    updateDocumentoDto: UpdateDocumentoDto,
    userId: string,
    companyId: string,
  ): Promise<Documento> {
    // 1. Buscar el documento existente
    const documento = await this.documentoModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });

    if (!documento) {
      throw new NotFoundException(
        `No se encontró un documento con ID '${id}' para actualizar.`,
      );
    }

    // 2. Versionado: Incrementar la versión
    const versionParts = documento.version.split('.');
    const newMinorVersion = parseInt(versionParts[1], 10) + 1;
    const newVersion = `${versionParts[0]}.${newMinorVersion}`;

    // 3. Control de Cambios: Añadir nuevo registro
    const nuevoControlCambio = {
      item: documento.controlCambios.length + 1,
      modificacion: updateDocumentoDto.modificacion,
      version: newVersion,
      fecha: new Date(),
    };

    // Excluir el campo 'modificacion' y 'adjuntos' del DTO para que no se guarde en la raíz del documento
    const { modificacion, adjuntos, ...updateData } = updateDocumentoDto;

    // Lógica de Adjuntos
    if (adjuntos) {
      const adjuntosActuales = documento.adjuntos;
      const adjuntosFinales: any[] = [];

      // 1. Identificar qué archivos se mantienen (vienen con idGoogle válido)
      const idsGoogleEntrantes = adjuntos
        .filter((a) => a.idGoogle && a.idGoogle.trim() !== '')
        .map((a) => a.idGoogle);

      // 2. Identificar y eliminar archivos que ya no están en la solicitud
      const adjuntosAEliminar = adjuntosActuales.filter(
        (a) => !idsGoogleEntrantes.includes(a.idGoogle),
      );

      for (const adjunto of adjuntosAEliminar) {
        // await this.googleStorageService.deleteFile(adjunto.idGoogle, companyId);
      }

      // 3. Procesar la lista entrante
      for (const adjuntoReq of adjuntos) {
        if (adjuntoReq.idGoogle && adjuntoReq.idGoogle.trim() !== '') {
          // Archivo existente: mantenemos idGoogle, actualizamos nombre si cambió
          const original = adjuntosActuales.find((a) => a.idGoogle === adjuntoReq.idGoogle);
          if (original) {
            adjuntosFinales.push({
              _id: original._id,
              nombreArchivo: adjuntoReq.nombreArchivo,
              idGoogle: original.idGoogle,
              IsActive: original.IsActive,
            });
          }
        } else if (adjuntoReq.base64) {
          // Archivo nuevo: subimos a GCS y generamos idGoogle
          const fileId = crypto.randomUUID();
          const fileExtension = path.extname(adjuntoReq.nombreArchivo);
          const gcsFileName = `${fileId}${fileExtension}`;

          // await this.googleStorageService.uploadFile(adjuntoReq.base64, gcsFileName, companyId);

          adjuntosFinales.push({
            nombreArchivo: adjuntoReq.nombreArchivo,
            idGoogle: gcsFileName,
            IsActive: true,
          });
        }
      }
      documento.adjuntos = adjuntosFinales as any;
    }

    // 4. Preparar payload de actualización
    // Usamos findByIdAndUpdate en lugar de save() para permitir guardar campos vacíos (como objetivo/alcance)
    // ignorando la validación 'required' del esquema de Mongoose si es necesario.
    const updatePayload: any = {
      ...updateData,
      version: newVersion,
      updatedBy: new Types.ObjectId(userId),
    };

    if (adjuntos) {
      updatePayload.adjuntos = documento.adjuntos;
    }

    // 5. Guardar y devolver el documento actualizado
    try {
      const updatedDoc = await this.documentoModel.findByIdAndUpdate(
        documento._id,
        {
          $set: updatePayload,
          $push: { controlCambios: nuevoControlCambio },
        },
        { new: true },
      );
      if (!updatedDoc) {
        throw new NotFoundException('No se encontró el documento para actualizar.');
      }
      return updatedDoc;
    } catch (error) {
      console.error('Error al actualizar el documento:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new ConflictException('Error de clave duplicada al actualizar.');
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al actualizar el documento.',
      );
    }
  }

  async findAllParentSubprocesos(companyId: string): Promise<{ _id: Types.ObjectId; nombre: string }[]> {
    try {
      const subprocesos = await this.macroprocesoModel.aggregate([
        // 1. Filtrar por la empresa activa
        { $match: { CompanyId: companyId, IsActive: true } },
        // 2. Desenrollar el array de procesos
        { $unwind: '$procesos' },
        // 3. Filtrar solo procesos activos
        { $match: { 'procesos.IsActive': true } },
        // 4. Desenrollar el array de subprocesos (los padres)
        { $unwind: '$procesos.subprocesos' },
        // 5. Filtrar solo subprocesos activos
        { $match: { 'procesos.subprocesos.IsActive': true } },
        // 6. Reemplazar la raíz del documento por el subproceso
        { $replaceRoot: { newRoot: '$procesos.subprocesos' } },
        // 7. Proyectar solo los campos necesarios
        { $project: { _id: 1, nombre: 1 } },
      ]);
      return subprocesos;
    } catch (error) {
      console.error('Error al obtener los subprocesos padres:', error);
      throw new InternalServerErrorException('Ocurrió un error al obtener los subprocesos.');
    }
  }

  async findDocumentoById(id: string, companyId: string): Promise<any> {
    const objectId = new Types.ObjectId(id);

    // 1. Usamos una agregación para obtener el documento y el nombre del subproceso
    const results = await this.documentoModel.aggregate([
      { $match: { _id: objectId, companyId: new Types.ObjectId(companyId) } },
      {
        $lookup: {
          from: 'macroprocesos',
          let: { subId: '$subProcesoId' },
          pipeline: [
            { $match: { CompanyId: companyId } },
            { $unwind: '$procesos' },
            { $unwind: '$procesos.subprocesos' },
            {
              $graphLookup: {
                from: 'macroprocesos',
                startWith: '$procesos.subprocesos.subprocesos',
                connectFromField: 'subprocesos',
                connectToField: '_id',
                as: 'subprocesosAnidados',
              },
            },
            { $addFields: { todosLosSubprocesos: { $concatArrays: ['$subprocesosAnidados', ['$procesos.subprocesos']] } } },
            { $unwind: '$todosLosSubprocesos' },
            { $replaceRoot: { newRoot: '$todosLosSubprocesos' } },
            { $match: { $expr: { $eq: ['$_id', '$$subId'] } } },
            { $project: { _id: 0, nombre: 1 } },
            { $limit: 1 },
          ],
          as: 'subProcesoInfo',
        },
      },
      { $unwind: { path: '$subProcesoInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          // Proyectamos todos los campos necesarios
          _id: 1, tipoDocumentoId: 1, subProcesoId: 1, codigo: 1, version: 1, objetivo: 1,
          alcance: 1, definiciones: 1, elaboradoPor: 1, revisadoPor: 1, aprobadoPor: 1,
          controlCambios: 1, vbElaborado: 1, vbRevisado: 1, vbAprobado: 1, adjuntos: 1,
          areaId: 1, desdeMatrizProceso: 1, descripcionDocumento: 1,
          subProcesoNombre: { $ifNull: ['$subProcesoInfo.nombre', '$subProcesoNombre'] },
        },
      },
    ]);

    if (results.length === 0) {
      throw new NotFoundException(`No se encontró un documento con ID '${id}'.`);
    }

    const documento = results[0];

    // 2. Procesar los adjuntos para obtener la base64
    if (documento.adjuntos && documento.adjuntos.length > 0) {
      const adjuntosConBase64 = await Promise.all(
        documento.adjuntos.map(async (adjunto) => {
          // const base64 = await this.googleStorageService.downloadFileAsBase64(
          //   adjunto.idGoogle,
          //   companyId,
          // );
          return {
            nombreArchivo: adjunto.nombreArchivo,
            idGoogle: adjunto.idGoogle,
            base64: null, // Será null si el archivo no se encuentra en GCS
          };
        }),
      );
      documento.adjuntos = adjuntosConBase64;
    }

    // Recolectar IDs de usuarios para obtener sus nombres si el Visto Bueno (vb) es true
    const userIds: Types.ObjectId[] = [];
    if (documento.vbElaborado && documento.elaboradoPor?.usuarioId) {
      userIds.push(new Types.ObjectId(documento.elaboradoPor.usuarioId));
    }
    if (documento.vbRevisado && documento.revisadoPor?.usuarioId) {
      userIds.push(new Types.ObjectId(documento.revisadoPor.usuarioId));
    }
    if (documento.vbAprobado && documento.aprobadoPor?.usuarioId) {
      userIds.push(new Types.ObjectId(documento.aprobadoPor.usuarioId));
    }

    const namesMap = new Map<string, string>();
    if (userIds.length > 0) {
      const users = await this.userModel.find({ _id: { $in: userIds } }).select('Name LastName').lean();
      users.forEach((u) => {
        namesMap.set(u._id.toString(), `${u.Name} ${u.LastName}`);
      });
    }

    return {
      ...documento,
      NombreElaborado: (documento.vbElaborado && documento.elaboradoPor?.usuarioId)
        ? (namesMap.get(documento.elaboradoPor.usuarioId.toString()) || '') : '',
      NombreRevisado: (documento.vbRevisado && documento.revisadoPor?.usuarioId)
        ? (namesMap.get(documento.revisadoPor.usuarioId.toString()) || '') : '',
      NombreAprobado: (documento.vbAprobado && documento.aprobadoPor?.usuarioId)
        ? (namesMap.get(documento.aprobadoPor.usuarioId.toString()) || '') : '',
    };
  }

  async findAllDocumentosPoliticas(companyId: string, userId: string): Promise<any[]> {
    try {
      // Obtener el perfil del usuario
      const user = await this.userModel.findById(userId).select('ProfileId').lean();
      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const matchQuery: any = { companyId: new Types.ObjectId(companyId) };

      // Si es Perfil 3 (Responsable), aplicar filtro de participación. Los perfiles 1, 2 y 4 ven todo.
      if (user.ProfileId == 3) {
        const userObjectId = new Types.ObjectId(userId);
        // Se usa $in para comparar tanto con ObjectId como con String para mayor robustez
        matchQuery.$or = [
          { 'elaboradoPor.usuarioId': userObjectId },
          { 'revisadoPor.usuarioId': userObjectId },
          { 'aprobadoPor.usuarioId': userObjectId },
          { 'elaboradoPor.usuarioId': { $in: [userObjectId, userId] } },
          { 'revisadoPor.usuarioId': { $in: [userObjectId, userId] } },
          { 'aprobadoPor.usuarioId': { $in: [userObjectId, userId] } },
        ];
      }

      const documentos = await this.documentoModel.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'tipoDocumentos',
            let: { tipo_id: '$tipoDocumentoId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$tipo_id' }] },
                },
              },
            ],
            as: 'tipoDocumentoInfo',
          },
        },
        {
          $unwind: {
            path: '$tipoDocumentoInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'areas',
            let: { area_id: '$areaId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$area_id' }],
                  },
                },
              },
            ],
            as: 'areaInfo',
          },
        },
        {
          $unwind: {
            path: '$areaInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'macroprocesos',
            let: { subId: '$subProcesoId' },
            pipeline: [
              { $match: { CompanyId: new Types.ObjectId(companyId) } },
              { $unwind: '$procesos' },
              { $unwind: '$procesos.subprocesos' },
              {
                $graphLookup: {
                  from: 'macroprocesos',
                  startWith: '$procesos.subprocesos.subprocesos',
                  connectFromField: 'subprocesos',
                  connectToField: '_id',
                  as: 'subprocesosAnidados',
                },
              },
              {
                $addFields: {
                  todosLosSubprocesos: {
                    $concatArrays: ['$subprocesosAnidados', ['$procesos.subprocesos']],
                  },
                },
              },
              { $unwind: '$todosLosSubprocesos' },
              { $replaceRoot: { newRoot: '$todosLosSubprocesos' } },
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$subId' }] },
                },
              },
              { $project: { _id: 0, nombre: 1 } },
              { $limit: 1 },
            ],
            as: 'subProcesoInfo',
          },
        },
        {
          $unwind: {
            path: '$subProcesoInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            ultimoCambio: { $arrayElemAt: ['$controlCambios', -1] },
          },
        },
        {
          $project: {
            _id: 1,
            codigo: 1,
            subProcesoId: 1,
            tipoDocumentoId: 1,
            descripcionSubProceso: { $ifNull: ['$subProcesoInfo.nombre', '$subProcesoNombre'] },
            tipoDocumentoDescripcion: '$tipoDocumentoInfo.tipo_documento',
            areaId: 1,
            areaDescripcion: '$areaInfo.Nombre',
            version: 1,
            desdeMatrizProceso: 1,
            objetivo: 1,
            alcance: 1,
            descripcionDocumento: 1,
            definiciones: 1,
            elaboradoPor: 1,
            revisadoPor: 1,
            aprobadoPor: 1,
            vbElaborado: 1,
            vbRevisado: 1,
            vbAprobado: 1,
            Cambios: '$ultimoCambio.modificacion',
          },
        },
      ]);
      return documentos;
    } catch (error) {
      console.error('Error al listar documentos de políticas:', error);
      throw new InternalServerErrorException(
        'Ocurrió un error al listar los documentos.',
      );
    }
  }

  async aprobarElaborado(id: string, userId: string, companyId: string) {
    const documento = await this.documentoModel.findOne({ _id: id, companyId: new Types.ObjectId(companyId) });
    if (!documento) {
      throw new NotFoundException(`Documento con ID '${id}' no encontrado.`);
    }

    if (documento.elaboradoPor?.usuarioId?.toString() !== userId) {
      throw new ForbiddenException('Usted no tiene permisos para ejecutar la acción de aprobacion');
    }

    return this.documentoModel.findByIdAndUpdate(
      id,
      { $set: { vbElaborado: true } },
      { new: true },
    );
  }

  async aprobarRevisado(id: string, userId: string, companyId: string) {
    const documento = await this.documentoModel.findOne({ _id: id, companyId: new Types.ObjectId(companyId) });
    if (!documento) {
      throw new NotFoundException(`Documento con ID '${id}' no encontrado.`);
    }

    if (documento.revisadoPor?.usuarioId?.toString() !== userId) {
      throw new ForbiddenException('Usted no tiene permisos para ejecutar la acción de aprobacion');
    }

    return this.documentoModel.findByIdAndUpdate(
      id,
      { $set: { vbRevisado: true } },
      { new: true },
    );
  }

  async aprobarAprobado(id: string, userId: string, companyId: string) {
    const documento = await this.documentoModel.findOne({ _id: id, companyId: new Types.ObjectId(companyId) });
    if (!documento) {
      throw new NotFoundException(`Documento con ID '${id}' no encontrado.`);
    }

    if (documento.aprobadoPor?.usuarioId?.toString() !== userId) {
      throw new ForbiddenException('Usted no tiene permisos para ejecutar la acción de aprobacion');
    }

    return this.documentoModel.findByIdAndUpdate(
      id,
      { $set: { vbAprobado: true } },
      { new: true },
    );
  }
}
