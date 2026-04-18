import { Document } from 'mongoose';
import { User } from '../../common/schemas/user.schema.js';

export type UserDocument = User & Document;