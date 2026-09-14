import axios from "axios";
import api from "../../services/api";
import type {
  AccessPermission,
  AccessRole,
  ManagedUser,
  RoleWritePayload,
  UserCreatePayload,
  UserUpdatePayload,
} from "./types";

export async function listUsers(search = "") {
  const response = await api.get<ManagedUser[]>("users/", {
    params: search ? { search } : undefined,
  });
  return response.data;
}

export async function createUser(payload: UserCreatePayload) {
  const response = await api.post<ManagedUser>("users/", payload);
  return response.data;
}

export async function updateUser(userId: string, payload: UserUpdatePayload) {
  const response = await api.patch<ManagedUser>(`users/${userId}/`, payload);
  return response.data;
}

export async function assignUserRoles(userId: string, roleIds: number[]) {
  const response = await api.put<ManagedUser>(`users/${userId}/roles/`, {
    role_ids: roleIds,
  });
  return response.data;
}

export async function setUserStatus(userId: string, active: boolean) {
  const response = await api.patch<ManagedUser>(`users/${userId}/status/`, {
    estado: active,
  });
  return response.data;
}

export async function listRoles() {
  const response = await api.get<AccessRole[]>("roles/");
  return response.data;
}

export async function listPermissions() {
  const response = await api.get<AccessPermission[]>("permissions/");
  return response.data;
}

export async function createRole(payload: RoleWritePayload) {
  const response = await api.post<AccessRole>("roles/", payload);
  return response.data;
}

export async function updateRole(roleId: number, payload: RoleWritePayload) {
  const response = await api.patch<AccessRole>(`roles/${roleId}/`, payload);
  return response.data;
}

export function getApiMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return "Ocurrió un error inesperado.";

  const data = error.response?.data as
    | Record<string, string | string[]>
    | undefined;
  if (data) {
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value[0]) return value[0];
      if (typeof value === "string") return value;
    }
  }
  if (error.response?.status === 403) {
    return "No tienes permiso para realizar esta operación.";
  }
  return "No pudimos completar la operación. Inténtalo nuevamente.";
}
