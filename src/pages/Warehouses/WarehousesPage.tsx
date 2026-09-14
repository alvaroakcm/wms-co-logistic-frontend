import { useCallback, useEffect, useState, type FormEvent } from "react";
import Modal from "../../components/Modal";
import { getApiMessage } from "../../features/access/api";
import { createWarehouse, listWarehouses } from "../../features/catalogs/api";
import type { Warehouse, WarehousePayload } from "../../features/catalogs/types";
import { useAuth } from "../../features/auth/auth-context";

const EMPTY_WAREHOUSE: WarehousePayload = {
  codigo: "",
  nombre: "",
  referencia: "",
  capacidad_pallets: 0,
  estado: true,
};

export default function WarehousesPage() {
  const { profile } = useAuth();
  const canCreate = profile?.permisos.includes("almacenes.crear") ?? false;
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<WarehousePayload>(EMPTY_WAREHOUSE);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (term = "", state = "") => {
    setLoading(true);
    setPageError(null);
    try {
      setWarehouses(await listWarehouses(term, state));
    } catch (error) {
      setPageError(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setFormError("Completa el código y nombre del almacén.");
      return;
    }
    setSaving(true);
    try {
      await createWarehouse({
        ...form,
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        referencia: form.referencia.trim(),
      });
      setModalOpen(false);
      await loadData(search, stateFilter);
    } catch (error) {
      setFormError(getApiMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="management-page">
      <header className="page-heading management-heading">
        <div><span className="page-eyebrow">Catálogos maestros</span><h1>Almacenes</h1><p>Define los espacios principales y su capacidad de pallets.</p></div>
        {canCreate && <button className="action-button" type="button" onClick={() => { setForm(EMPTY_WAREHOUSE); setFormError(null); setModalOpen(true); }}>＋ Nuevo almacén</button>}
      </header>
      <div className="toolbar-card catalog-toolbar">
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); void loadData(search, stateFilter); }}>
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Código, nombre o referencia" aria-label="Buscar almacenes" />
          <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} aria-label="Filtrar almacenes por estado"><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select>
          <button type="submit">Filtrar</button>
        </form>
        <span className="record-count">{warehouses.length} almacén{warehouses.length === 1 ? "" : "es"}</span>
      </div>
      {pageError && <div className="inline-alert" role="alert">{pageError}<button type="button" onClick={() => void loadData(search, stateFilter)}>Reintentar</button></div>}
      {loading ? <div className="content-loading"><span className="loading-spinner" /> Cargando almacenes…</div> : (
        <div className="data-card"><table className="data-table"><thead><tr><th>Código</th><th>Almacén</th><th>Referencia</th><th>Capacidad</th><th>Estado</th></tr></thead><tbody>
          {warehouses.map((warehouse) => <tr key={warehouse.id_almacen}><td><span className="code-value">{warehouse.codigo}</span></td><td><strong className="primary-cell">{warehouse.nombre}</strong></td><td>{warehouse.referencia || "—"}</td><td>{warehouse.capacidad_pallets} pallets</td><td><span className={`status-pill ${warehouse.estado ? "active" : "inactive"}`}><i />{warehouse.estado ? "Activo" : "Inactivo"}</span></td></tr>)}
          {!warehouses.length && <tr><td colSpan={5}><div className="empty-state"><strong>No hay almacenes registrados</strong><span>Crea el primer almacén para organizar sus zonas.</span></div></td></tr>}
        </tbody></table></div>
      )}
      {modalOpen && <Modal title="Registrar almacén" description="El código debe ser único dentro del WMS." onClose={() => !saving && setModalOpen(false)}>
        <form className="management-form" onSubmit={submit}>
          <div className="form-grid"><label><span>Código</span><input value={form.codigo} onChange={(event) => setForm({ ...form, codigo: event.target.value.toUpperCase() })} maxLength={20} autoFocus required /></label><label><span>Nombre</span><input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} maxLength={100} required /></label></div>
          <label><span>Referencia</span><input value={form.referencia} onChange={(event) => setForm({ ...form, referencia: event.target.value })} maxLength={150} placeholder="Dirección o referencia interna" /></label>
          <label><span>Capacidad de pallets</span><input type="number" min="0" step="1" value={form.capacidad_pallets} onChange={(event) => setForm({ ...form, capacidad_pallets: Number(event.target.value) })} required /></label>
          <label className="switch-row"><span><strong>Almacén activo</strong><small>Disponible para crear zonas y ubicaciones.</small></span><input type="checkbox" checked={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.checked })} /></label>
          {formError && <div className="inline-alert compact" role="alert">{formError}</div>}
          <footer className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="action-button" type="submit" disabled={saving}>{saving ? "Guardando…" : "Registrar almacén"}</button></footer>
        </form>
      </Modal>}
    </section>
  );
}
