import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../common/schemas/user.schema';
@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // `identificador` puede ser el Email o el Username del usuario -- se
  // permite loguearse con cualquiera de los dos.
  async findUserByCredentials(identificador: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({
      $or: [{ Email: identificador }, { Username: identificador }],
    });
    if (!user) {
      return null;
    }
    // Corrección: Comparar la contraseña del login (`pass`) con el campo `PasswordHash` del usuario.
    const isPasswordMatching = user.PasswordHash === pass;

    if (!isPasswordMatching) {
      // Si las contraseñas no coinciden, también se retorna null.
      return null;
    }
    return user.toObject();
  }
}