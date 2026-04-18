import { IsMongoId } from 'class-validator';

export class ParamIdDto {
  @IsMongoId({ message: 'El ID proporcionado no es un ObjectId válido.' })
  id: string;
}