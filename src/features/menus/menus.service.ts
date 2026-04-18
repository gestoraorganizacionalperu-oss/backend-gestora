import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MenusRepository } from './menus.repository.js';

@Injectable()
export class MenusService {
  private readonly logger = new Logger(MenusService.name);

  constructor(private menusRepository: MenusRepository) {}

  async getMyMenus(userProfile: string) {
    try {
      return await this.menusRepository.findMenusByProfile(userProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Error obteniendo menús para el perfil ${userProfile}: ${errorMessage}`);
      throw new InternalServerErrorException('Ocurrió un error al obtener los menús.');
    }
  }
}