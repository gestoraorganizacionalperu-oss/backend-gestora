import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../../common/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { ProfilesService } from '../profile/profiles.service';
import { PuestosService } from '../puestos/puestos.service';
import { AsistenciaService } from '../asistencia/asistencia.service.js';
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profilesService: ProfilesService,
    private readonly puestosService: PuestosService,
    private readonly asistenciaService: AsistenciaService,
  ) {}

  // Transforma el documento de la BD al formato esperado por el frontend
  private transformUser(user: UserDocument): any {
    if (!user) return null;
    return {
      id: user._id,
      name: user.Name,
      lastName: user.LastName,
      email: user.Email,
      username: user.Username,
      dni: user.Dni,
      profileId: user.ProfileId,
      profileName: this.profilesService.getProfileName(user.ProfileId), // <-- CAMBIO AÑADIDO
      puestoId: user.get('PuestoId'),
      isActive: user.IsActive,
      hasCredentials: user.HasCredentials,
      companyId: user.CompanyId,
      createdAt: user.get('CreatedAt'),
      createdBy: user.CreatedBy,
      updatedAt: user.get('UpdatedAt'),
      updatedBy: user.UpdatedBy,
    };
  }

  async findAll(companyId: string): Promise<any[]> {
        console.log("aaaaaaa",companyId);
    const users = await this.userRepository.findAllByCompany(companyId);
    return users.map((user) => this.transformUser(user));
  }


  async findOne(id: string, companyId: string): Promise<any> {
    const user = await this.userRepository.findByIdAndCompany(id, companyId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return this.transformUser(user);
  }

  async create(
    createUserDto: CreateUserDto,
    companyId: string,
    createdBy: string,
  ): Promise<any> {
    const { email, username, password, profileId, hasCredentials, dni, puestoId, esTrabajador } =
      createUserDto;

    // Si se marcó "también es trabajador de planta", necesitamos un DNI
    // para poder crear/vincular el registro en `trabajador` -- sin
    // documento no hay con qué identificarlo ahí.
    if (esTrabajador && !dni) {
      throw new BadRequestException('Para marcar "también es trabajador" se requiere ingresar un DNI.');
    }

    // Validar que el puesto exista y pertenezca a la empresa antes de crear el usuario
    if (puestoId) {
      await this.puestosService.findOne(puestoId, companyId);
    }

    if (email) {
      const activeEmail = await this.userRepository.findActiveByEmail(
        email,
        companyId,
      );
      if (activeEmail) {
        throw new ConflictException('El email ya está en uso por un usuario activo.');
      }
    }
    if (dni) {
      const activeDni = await this.userRepository.findActiveByDni(dni, companyId);
      if (activeDni) {
        throw new ConflictException('El DNI ya está en uso por un usuario activo.');
      }
    }
    if (username) {
      const existingUsername = await this.userRepository.findByUsername(username, companyId);
      if (existingUsername) {
        throw new ConflictException('El nombre de usuario ya está registrado.');
      }
    }

    const passwordHash = password;

    const newUser = await this.userRepository.create({
      Name: createUserDto.name,
      LastName: createUserDto.lastName,
      Dni: dni,
      HasCredentials: createUserDto.hasCredentials,
      ProfileId: profileId,
      Email: hasCredentials ? email : null,
      Username: hasCredentials ? username : null,
      PasswordHash: passwordHash,
      CompanyId: companyId,
      CreatedBy: createdBy,
      IsActive: true,
      PuestoId: puestoId,
    } as any);

    // Si se asignó un puesto, agregar al usuario como responsable
    if (puestoId) {
      await this.puestosService.addUserToPuesto(puestoId, {
        id: (newUser as any)._id.toString(),
        name: createUserDto.name,
        email: createUserDto.email || 'email@placeholder.com',
      }, companyId);
    }

    // Homologación Usuario <-> Trabajador: si se marcó el checkbox, busca
    // un Trabajador existente con ese mismo DNI en la empresa (por si vino
    // del sincronizador del reloj biométrico) y lo vincula, o crea uno
    // nuevo si no existe. Nunca duplica.
    let trabajadorVinculado: { id: any; creado: boolean } | null = null;
    if (esTrabajador && dni) {
      const { trabajador, creado } = await this.asistenciaService.crearOVincularTrabajador({
        nombreCompleto: `${createUserDto.name} ${createUserDto.lastName}`.trim(),
        nroDoc: dni,
        companyId,
        puestoId: puestoId ?? null,
      });
      trabajadorVinculado = { id: (trabajador as any)._id, creado };
    }

    const response = this.transformUser(newUser);

    // Devolvemos solo los campos especificados en la documentación para el 201 Created
    return {
      id: response.id,
      name: response.name,
      lastName: response.lastName,
      profileId: response.profileId,
      puestoId: response.puestoId,
      isActive: response.isActive,
      companyId: response.companyId,
      createdAt: response.createdAt,
      createdBy: response.createdBy,
      trabajadorVinculado,
    };
  }

  async update(
    id: string,
    companyId: string,
    updateUserDto: UpdateUserDto,
    updatedBy: string,
  ): Promise<any> {
    const userToUpdate = await this.userRepository.findByIdAndCompany(
      id,
      companyId,
    );
    if (!userToUpdate) {
      throw new NotFoundException('Usuario no encontrado para la actualización.');
    }

    const {
      email,
      username,
      dni,
      password,
      name,
      lastName,
      profileId,
      hasCredentials,
      puestoId,
    } = updateUserDto;

    // Validar que el puesto exista y pertenezca a la empresa antes de actualizar
    if (puestoId) {
      await this.puestosService.findOne(puestoId, companyId);
    }

    // Validar email único si se está cambiando
    if (email && email !== userToUpdate.Email) {
      const activeEmail = await this.userRepository.findActiveByEmail(
        email,
        companyId,
      );
      if (activeEmail) {
        throw new ConflictException('El email ya está en uso por otro usuario activo.');
      }
      userToUpdate.Email = email;
    }

    // Validar DNI único si se está cambiando
    if (dni && dni !== userToUpdate.Dni) {
      const activeDni = await this.userRepository.findActiveByDni(dni, companyId);
      if (activeDni) {
        throw new ConflictException('El DNI ya está en uso por otro usuario activo.');
      }
      userToUpdate.Dni = dni;
    }

    // Actualizar otros campos
    if (username) userToUpdate.Username = username;
    if (name) userToUpdate.Name = name;
    if (lastName) userToUpdate.LastName = lastName;
    if (profileId) userToUpdate.ProfileId = profileId;
    if (hasCredentials !== undefined)
      userToUpdate.HasCredentials = hasCredentials;
    if (password) {
      userToUpdate.PasswordHash = password;
    }
    
    // Lógica para Puesto: Eliminar e Insertar en responsibles
    if (puestoId) {
      // 1. Obtener el puesto actual del usuario antes de actualizar
      const currentPuestoId = userToUpdate.get('PuestoId');
      if (currentPuestoId) {
        await this.puestosService.removeUserFromPuesto(currentPuestoId.toString(), id, companyId);
      }
      
      await this.puestosService.addUserToPuesto(puestoId, {
        id: id,
        name: name || userToUpdate.Name,
        email: email || userToUpdate.Email || 'email@placeholder.com',
      }, companyId);
      userToUpdate.set('PuestoId', new Types.ObjectId(puestoId), { strict: false });
    }

    userToUpdate.UpdatedBy = updatedBy;

    const savedUser = await this.userRepository.update(
      id,
      companyId,
      userToUpdate.toObject(),
    );
    if (!savedUser) {
      throw new NotFoundException('Usuario no encontrado tras la actualización.');
    }
    const response = this.transformUser(savedUser);

    // Devolvemos solo los campos especificados en la documentación para el 200 OK (update)
    return {
      id: response.id,
      name: response.name,
      profileId: response.profileId,
      puestoId: response.puestoId,
      companyId: response.companyId,
      updatedAt: response.updatedAt,
      updatedBy: response.updatedBy,
    };
  }

  async deactivate(id: string, companyId: string, updatedBy: string): Promise<{ message: string }> {
    const user = await this.userRepository.update(id, companyId, { IsActive: false, UpdatedBy: updatedBy });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado para desactivar.');
    }
    return { message: 'Usuario desactivado exitosamente.' };
  }

  async getUserNamesMap(ids: string[], companyId: string): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(ids.filter((id) => id))];
    const users = await this.userRepository.findNamesByIds(uniqueIds, companyId);
    const namesMap = new Map<string, string>();
    users.forEach((user) => {
      namesMap.set((user as any)._id.toString(), `${user.Name} ${user.LastName}`);
    });
    return namesMap;
  }
}