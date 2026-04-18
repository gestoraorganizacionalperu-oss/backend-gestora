import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../common/schemas/user.schema';
@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findUserByCredentials(email: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ Email: email });
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