import { Role } from '../../common/enums/role.enum';

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  role!: Role;
  createdAt!: Date;
}
