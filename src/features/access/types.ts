export interface AccessRole {
  id_rol: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  permisos: AccessPermission[];
}

export interface AccessPermission {
  id_permiso: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface ManagedUserRole {
  id_rol: number;
  nombre: string;
  estado: boolean;
}

export interface ManagedUser {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  estado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
  roles: ManagedUserRole[];
}

export interface UserCreatePayload {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  role_ids: number[];
}

export interface UserUpdatePayload {
  nombre: string;
  apellido: string;
  correo: string;
}

export interface RoleWritePayload {
  nombre: string;
  descripcion: string;
  estado: boolean;
  permission_ids: number[];
}
