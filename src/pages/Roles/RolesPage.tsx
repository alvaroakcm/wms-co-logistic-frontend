import { useCallback, useEffect, useState, type FormEvent } from "react";
import Modal from "../../components/Modal";
import { createRole, getApiMessage, listPermissions, listRoles, updateRole } from "../../features/access/api";
import type { AccessPermission, AccessRole } from "../../features/access/types";
import { useAuth } from "../../features/auth/auth-context";

interface RoleFormState { nombre: string; descripcion: string; estado: boolean; permissionIds: number[] }
const EMPTY_ROLE: RoleFormState = { nombre: "", descripcion: "", estado: true, permissionIds: [] };

function permissionLabel(name: string) {
  const [, action = name] = name.split(".");
  const labels: Record<string, string> = { ver: "Ver módulo", crear: "Crear registros", editar: "Editar registros", asignar_roles: "Asignar roles", gestionar: "Gestionar" };
  return labels[action] ?? action.replaceAll("_", " ");
}

export default function RolesPage() {
  const { profile, refreshProfile } = useAuth();
  const canManage = profile?.permisos.includes("roles.gestionar") ?? false;
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AccessRole | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_ROLE);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setPageError(null);
    try {
      const [roleData, permissionData] = await Promise.all([listRoles(), listPermissions()]);
      setRoles(roleData); setPermissions(permissionData);
    } catch (error) { setPageError(getApiMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadData]);

  function openRole(role?: AccessRole) {
    setEditing(role ?? null);
    setForm(role ? { nombre: role.nombre, descripcion: role.descripcion, estado: role.estado, permissionIds: role.permisos.map((permission) => permission.id_permiso) } : EMPTY_ROLE);
    setFormError(null); setModalOpen(true);
  }

  function togglePermission(permissionId: number) {
    setForm((current) => ({ ...current, permissionIds: current.permissionIds.includes(permissionId) ? current.permissionIds.filter((id) => id !== permissionId) : [...current.permissionIds, permissionId] }));
  }

  async function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(null);
    if (!form.nombre.trim()) { setFormError("Ingresa un nombre para el rol."); return; }
    setSaving(true);
    try {
      const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), estado: form.estado, permission_ids: form.permissionIds };
      if (editing) await updateRole(editing.id_rol, payload); else await createRole(payload);
      setModalOpen(false); await loadData(); await refreshProfile();
    } catch (error) { setFormError(getApiMessage(error)); }
    finally { setSaving(false); }
  }

  const groupedPermissions = permissions.reduce<Record<string, AccessPermission[]>>((groups, permission) => {
    const moduleName = permission.nombre.split(".")[0];
    groups[moduleName] = [...(groups[moduleName] ?? []), permission];
    return groups;
  }, {});

  return (
    <section className="management-page">
      <header className="page-heading management-heading"><div><span className="page-eyebrow">Seguridad y accesos</span><h1>Roles y permisos</h1><p>Define qué módulos y operaciones puede utilizar cada perfil.</p></div>{canManage && <button className="action-button" type="button" onClick={() => openRole()}>＋ Nuevo rol</button>}</header>
      {pageError && <div className="inline-alert" role="alert">{pageError}<button type="button" onClick={() => void loadData()}>Reintentar</button></div>}
      {loading ? <div className="content-loading"><span className="loading-spinner" /> Cargando roles…</div> : <div className="role-grid">{roles.map((role) => <article className="role-card" key={role.id_rol}><header><div className="role-icon">◇</div><div><h2>{role.nombre}</h2><span className={`status-pill ${role.estado ? "active" : "inactive"}`}><i />{role.estado ? "Activo" : "Inactivo"}</span></div>{canManage && <button className="table-action" type="button" onClick={() => openRole(role)}>Editar</button>}</header><p>{role.descripcion || "Sin descripción"}</p><div className="permission-summary"><strong>{role.permisos.length} permisos</strong><div className="tag-list">{role.permisos.slice(0, 5).map((permission) => <span className="permission-tag" key={permission.id_permiso}>{permission.nombre}</span>)}{role.permisos.length > 5 && <span className="permission-tag">+{role.permisos.length - 5}</span>}</div></div></article>)}{!roles.length && <div className="empty-state data-card"><strong>No hay roles configurados</strong><span>Crea el primer rol para controlar el acceso.</span></div>}</div>}
      {modalOpen && <Modal title={editing ? "Editar rol" : "Crear rol"} description="Los cambios se aplican a todos los usuarios que tengan este rol." onClose={() => !saving && setModalOpen(false)}><form className="management-form" onSubmit={submitRole}><label><span>Nombre del rol</span><input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} autoFocus maxLength={255} required /></label><label><span>Descripción</span><textarea value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} rows={3} maxLength={1000} /></label><label className="switch-row"><span><strong>Rol activo</strong><small>Los roles inactivos no conceden acceso.</small></span><input type="checkbox" checked={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.checked })} /></label><fieldset className="choice-fieldset"><legend>Permisos del rol</legend><div className="permission-groups">{Object.entries(groupedPermissions).map(([moduleName, items]) => <section key={moduleName}><h3>{moduleName}</h3>{items.map((permission) => <label className="permission-choice" key={permission.id_permiso}><input type="checkbox" checked={form.permissionIds.includes(permission.id_permiso)} onChange={() => togglePermission(permission.id_permiso)} /><span><strong>{permissionLabel(permission.nombre)}</strong><small>{permission.descripcion}</small></span></label>)}</section>)}</div></fieldset>{formError && <div className="inline-alert compact" role="alert">{formError}</div>}<footer className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="action-button" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar rol"}</button></footer></form></Modal>}
    </section>
  );
}
