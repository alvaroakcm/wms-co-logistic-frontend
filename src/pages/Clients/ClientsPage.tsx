import { useCallback, useEffect, useState, type FormEvent } from "react";
import Modal from "../../components/Modal";
import { getApiMessage } from "../../features/access/api";
import { createClient, listClients, updateClient } from "../../features/catalogs/api";
import type { Client, ClientPayload } from "../../features/catalogs/types";
import { useAuth } from "../../features/auth/auth-context";

const EMPTY_CLIENT: ClientPayload = {
  razon_social: "",
  ruc: "",
  contacto_nombre: "",
  contacto_telefono: "",
  estado: true,
};

export default function ClientsPage() {
  const { profile } = useAuth();
  const canCreate = profile?.permisos.includes("clientes.crear") ?? false;
  const canEdit = profile?.permisos.includes("clientes.editar") ?? false;
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientPayload>(EMPTY_CLIENT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async (term = "", state = "") => {
    setLoading(true); setPageError(null);
    try { setClients(await listClients(term, state)); }
    catch (error) { setPageError(getApiMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function openForm(client?: Client) {
    setEditing(client ?? null);
    setForm(client ? {
      razon_social: client.razon_social,
      ruc: client.ruc,
      contacto_nombre: client.contacto_nombre,
      contacto_telefono: client.contacto_telefono,
      estado: client.estado,
    } : EMPTY_CLIENT);
    setFormError(null); setModalOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(null);
    if (!form.razon_social.trim()) { setFormError("Ingresa la razón social."); return; }
    if (!/^\d{11}$/.test(form.ruc)) { setFormError("El RUC debe contener exactamente 11 dígitos."); return; }
    setSaving(true);
    try {
      const payload = { ...form, razon_social: form.razon_social.trim(), contacto_nombre: form.contacto_nombre.trim(), contacto_telefono: form.contacto_telefono.trim() };
      if (editing) await updateClient(editing.id_cliente, payload); else await createClient(payload);
      setModalOpen(false); await loadData(search, stateFilter);
    } catch (error) { setFormError(getApiMessage(error)); }
    finally { setSaving(false); }
  }

  return (
    <section className="management-page">
      <header className="page-heading management-heading"><div><span className="page-eyebrow">Catálogos maestros</span><h1>Clientes</h1><p>Administra las empresas asociadas a productos y operaciones logísticas.</p></div>{canCreate && <button className="action-button" type="button" onClick={() => openForm()}>＋ Nuevo cliente</button>}</header>
      <div className="toolbar-card catalog-toolbar"><form className="search-form" onSubmit={(event) => { event.preventDefault(); void loadData(search, stateFilter); }}><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Razón social, RUC o contacto" aria-label="Buscar clientes" /><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} aria-label="Filtrar clientes por estado"><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select><button type="submit">Filtrar</button></form><span className="record-count">{clients.length} cliente{clients.length === 1 ? "" : "s"}</span></div>
      {pageError && <div className="inline-alert" role="alert">{pageError}<button type="button" onClick={() => void loadData(search, stateFilter)}>Reintentar</button></div>}
      {loading ? <div className="content-loading"><span className="loading-spinner" /> Cargando clientes…</div> : <div className="data-card"><table className="data-table"><thead><tr><th>Cliente</th><th>RUC</th><th>Contacto</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{clients.map((client) => <tr key={client.id_cliente}><td><strong className="primary-cell">{client.razon_social}</strong></td><td><span className="code-value">{client.ruc}</span></td><td><div className="stacked-cell"><span>{client.contacto_nombre || "Sin contacto"}</span><small>{client.contacto_telefono || "Sin teléfono"}</small></div></td><td><span className={`status-pill ${client.estado ? "active" : "inactive"}`}><i />{client.estado ? "Activo" : "Inactivo"}</span></td><td>{canEdit && <button className="table-action" type="button" onClick={() => openForm(client)}>Editar</button>}</td></tr>)}{!clients.length && <tr><td colSpan={5}><div className="empty-state"><strong>No encontramos clientes</strong><span>Registra uno nuevo o cambia los filtros.</span></div></td></tr>}</tbody></table></div>}
      {modalOpen && <Modal title={editing ? "Editar cliente" : "Registrar cliente"} description="El RUC identifica de forma única al cliente." onClose={() => !saving && setModalOpen(false)}><form className="management-form" onSubmit={submit}><label><span>Razón social</span><input value={form.razon_social} onChange={(event) => setForm({ ...form, razon_social: event.target.value })} maxLength={150} autoFocus required /></label><label><span>RUC</span><input value={form.ruc} onChange={(event) => setForm({ ...form, ruc: event.target.value.replace(/\D/g, "").slice(0, 11) })} inputMode="numeric" maxLength={11} required /><small>11 dígitos, sin espacios ni guiones.</small></label><div className="form-grid"><label><span>Persona de contacto</span><input value={form.contacto_nombre} onChange={(event) => setForm({ ...form, contacto_nombre: event.target.value })} maxLength={100} /></label><label><span>Teléfono</span><input value={form.contacto_telefono} onChange={(event) => setForm({ ...form, contacto_telefono: event.target.value })} maxLength={20} /></label></div><label className="switch-row"><span><strong>Cliente activo</strong><small>Solo los clientes activos pueden asociarse a productos nuevos.</small></span><input type="checkbox" checked={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.checked })} /></label>{formError && <div className="inline-alert compact" role="alert">{formError}</div>}<footer className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="action-button" type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Registrar cliente"}</button></footer></form></Modal>}
    </section>
  );
}
