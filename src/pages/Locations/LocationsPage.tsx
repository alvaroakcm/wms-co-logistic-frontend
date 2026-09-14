import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Modal from "../../components/Modal";
import { getApiMessage } from "../../features/access/api";
import { createLocation, createZone, getLocationOptions, listLocations, updateLocation } from "../../features/catalogs/api";
import type { Location, LocationFilters, LocationOptions, LocationPayload, ZonePayload } from "../../features/catalogs/types";
import { useAuth } from "../../features/auth/auth-context";

const EMPTY_FILTERS: LocationFilters = { almacen: "", zona: "", rack: "", estado: "" };
const EMPTY_OPTIONS: LocationOptions = { almacenes: [], zonas: [] };
const EMPTY_LOCATION: LocationPayload = { id_zona: 0, codigo: "", pasillo: "", rack: "", nivel: "", columna: "", posicion: "", capacidad_volumen: "0", capacidad_peso: "0", estado: true };
const EMPTY_ZONE: ZonePayload = { id_almacen: 0, codigo: "", nombre: "", tipo: "ALMACENAJE", estado: true };

export default function LocationsPage() {
  const { profile } = useAuth();
  const canCreate = profile?.permisos.includes("ubicaciones.crear") ?? false;
  const canEdit = profile?.permisos.includes("ubicaciones.editar") ?? false;
  const [locations, setLocations] = useState<Location[]>([]);
  const [options, setOptions] = useState<LocationOptions>(EMPTY_OPTIONS);
  const [filters, setFilters] = useState<LocationFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<LocationFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState<LocationPayload>(EMPTY_LOCATION);
  const [zoneForm, setZoneForm] = useState<ZonePayload>(EMPTY_ZONE);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (currentFilters: LocationFilters) => {
    setLoading(true); setPageError(null);
    try {
      const [locationData, optionData] = await Promise.all([listLocations(currentFilters), getLocationOptions()]);
      setLocations(locationData); setOptions(optionData);
    } catch (error) { setPageError(getApiMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(EMPTY_FILTERS), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const activeWarehouses = useMemo(() => options.almacenes.filter((item) => item.estado), [options]);
  const activeZones = useMemo(() => options.zonas.filter((zone) => zone.estado && activeWarehouses.some((warehouse) => warehouse.id_almacen === zone.id_almacen)), [activeWarehouses, options]);

  function openLocation(location?: Location) {
    setEditing(location ?? null);
    setLocationForm(location ? {
      id_zona: location.id_zona, codigo: location.codigo, pasillo: location.pasillo,
      rack: location.rack, nivel: location.nivel, columna: location.columna,
      posicion: location.posicion, capacidad_volumen: location.capacidad_volumen,
      capacidad_peso: location.capacidad_peso, estado: location.estado,
    } : { ...EMPTY_LOCATION, id_zona: activeZones[0]?.id_zona ?? 0 });
    setFormError(null); setLocationOpen(true);
  }

  function openZone() {
    setZoneForm({ ...EMPTY_ZONE, id_almacen: activeWarehouses[0]?.id_almacen ?? 0 });
    setFormError(null); setZoneOpen(true);
  }

  async function submitZone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(null); setSaving(true);
    try {
      await createZone({ ...zoneForm, codigo: zoneForm.codigo.trim().toUpperCase(), nombre: zoneForm.nombre.trim(), tipo: zoneForm.tipo.trim().toUpperCase() });
      setZoneOpen(false); await loadData(appliedFilters);
    } catch (error) { setFormError(getApiMessage(error)); }
    finally { setSaving(false); }
  }

  async function submitLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(null);
    if (!locationForm.id_zona || !locationForm.codigo.trim() || !locationForm.pasillo.trim() || !locationForm.rack.trim() || !locationForm.nivel.trim() || !locationForm.posicion.trim()) {
      setFormError("Completa zona, código, pasillo, rack, nivel y posición."); return;
    }
    setSaving(true);
    try {
      const payload = { ...locationForm, codigo: locationForm.codigo.trim().toUpperCase(), columna: locationForm.posicion.trim(), posicion: locationForm.posicion.trim() };
      if (editing) await updateLocation(editing.id_ubicacion, payload); else await createLocation(payload);
      setLocationOpen(false); await loadData(appliedFilters);
    } catch (error) { setFormError(getApiMessage(error)); }
    finally { setSaving(false); }
  }

  return (
    <section className="management-page">
      <header className="page-heading management-heading"><div><span className="page-eyebrow">Estructura del almacén</span><h1>Ubicaciones</h1><p>Administra zonas, posiciones, capacidad y ocupación física.</p></div>{canCreate && <div className="heading-actions"><button className="secondary-button" type="button" onClick={openZone} disabled={!activeWarehouses.length}>＋ Nueva zona</button><button className="action-button" type="button" onClick={() => openLocation()} disabled={!activeZones.length}>＋ Nueva ubicación</button></div>}</header>
      <form className="product-filters location-filters" onSubmit={(event) => { event.preventDefault(); setAppliedFilters(filters); void loadData(filters); }}>
        <label><span>Almacén</span><select value={filters.almacen} onChange={(event) => setFilters({ ...filters, almacen: event.target.value })}><option value="">Todos</option>{options.almacenes.map((warehouse) => <option key={warehouse.id_almacen} value={warehouse.id_almacen}>{warehouse.nombre}</option>)}</select></label>
        <label><span>Zona</span><input value={filters.zona} onChange={(event) => setFilters({ ...filters, zona: event.target.value })} placeholder="Código o nombre" /></label>
        <label><span>Rack</span><input value={filters.rack} onChange={(event) => setFilters({ ...filters, rack: event.target.value })} placeholder="Rack" /></label>
        <label><span>Estado</span><select value={filters.estado} onChange={(event) => setFilters({ ...filters, estado: event.target.value })}><option value="">Todos</option><option value="disponible">Disponibles</option><option value="ocupada">Ocupadas</option><option value="inactiva">Inactivas</option></select></label>
        <div className="filter-actions"><button className="secondary-button" type="button" onClick={() => { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); void loadData(EMPTY_FILTERS); }}>Limpiar</button><button className="action-button" type="submit">Filtrar</button></div>
      </form>
      {pageError && <div className="inline-alert" role="alert">{pageError}<button type="button" onClick={() => void loadData(appliedFilters)}>Reintentar</button></div>}
      {canCreate && !loading && (!activeWarehouses.length || !activeZones.length) && <div className="info-alert">Registra primero un almacén activo y después una zona para habilitar nuevas ubicaciones.</div>}
      {loading ? <div className="content-loading"><span className="loading-spinner" /> Cargando ubicaciones…</div> : <div className="data-card"><table className="data-table location-table"><thead><tr><th>Ubicación</th><th>Almacén / zona</th><th>Coordenadas</th><th>Capacidad</th><th>Stock</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>
        {locations.map((location) => <tr key={location.id_ubicacion}><td><span className="code-value">{location.codigo}</span></td><td><div className="stacked-cell"><strong className="primary-cell">{location.almacen?.nombre || "—"}</strong><small>{location.zona?.codigo} · {location.zona?.nombre}</small></div></td><td>P{location.pasillo} · R{location.rack} · N{location.nivel} · Pos {location.posicion}</td><td><div className="stacked-cell"><span>{location.capacidad_volumen} m³</span><small>{location.capacidad_peso} kg</small></div></td><td>{location.stock_total}</td><td><span className={`availability-pill ${location.estado_operativo}`}>{location.estado_operativo}</span></td><td>{canEdit && <button className="table-action" type="button" onClick={() => openLocation(location)}>Editar</button>}</td></tr>)}
        {!locations.length && <tr><td colSpan={7}><div className="empty-state"><strong>No hay ubicaciones para mostrar</strong><span>Registra una o cambia los filtros.</span></div></td></tr>}
      </tbody></table></div>}
      {zoneOpen && <Modal title="Registrar zona" description="El código de zona es único dentro del almacén." onClose={() => !saving && setZoneOpen(false)}><form className="management-form" onSubmit={submitZone}><label><span>Almacén</span><select value={zoneForm.id_almacen} onChange={(event) => setZoneForm({ ...zoneForm, id_almacen: Number(event.target.value) })} required>{activeWarehouses.map((warehouse) => <option key={warehouse.id_almacen} value={warehouse.id_almacen}>{warehouse.nombre} ({warehouse.codigo})</option>)}</select></label><div className="form-grid"><label><span>Código de zona</span><input value={zoneForm.codigo} onChange={(event) => setZoneForm({ ...zoneForm, codigo: event.target.value.toUpperCase() })} maxLength={20} required /></label><label><span>Tipo</span><input value={zoneForm.tipo} onChange={(event) => setZoneForm({ ...zoneForm, tipo: event.target.value })} maxLength={50} required /></label></div><label><span>Nombre</span><input value={zoneForm.nombre} onChange={(event) => setZoneForm({ ...zoneForm, nombre: event.target.value })} maxLength={100} required /></label>{formError && <div className="inline-alert compact" role="alert">{formError}</div>}<footer className="modal-actions"><button className="secondary-button" type="button" onClick={() => setZoneOpen(false)} disabled={saving}>Cancelar</button><button className="action-button" type="submit" disabled={saving}>{saving ? "Guardando…" : "Registrar zona"}</button></footer></form></Modal>}
      {locationOpen && <Modal title={editing ? "Editar ubicación" : "Registrar ubicación"} description="Las ubicaciones con stock activo no pueden desactivarse." onClose={() => !saving && setLocationOpen(false)}><form className="management-form" onSubmit={submitLocation}><label><span>Zona</span><select value={locationForm.id_zona} onChange={(event) => setLocationForm({ ...locationForm, id_zona: Number(event.target.value) })} required>{options.zonas.map((zone) => <option key={zone.id_zona} value={zone.id_zona} disabled={!zone.estado && zone.id_zona !== editing?.id_zona}>{zone.codigo} · {zone.nombre}</option>)}</select></label><div className="form-grid"><label><span>Código</span><input value={locationForm.codigo} onChange={(event) => setLocationForm({ ...locationForm, codigo: event.target.value.toUpperCase() })} maxLength={50} required /></label><label><span>Pasillo</span><input value={locationForm.pasillo} onChange={(event) => setLocationForm({ ...locationForm, pasillo: event.target.value })} maxLength={10} required /></label><label><span>Rack</span><input value={locationForm.rack} onChange={(event) => setLocationForm({ ...locationForm, rack: event.target.value })} maxLength={10} required /></label><label><span>Nivel</span><input value={locationForm.nivel} onChange={(event) => setLocationForm({ ...locationForm, nivel: event.target.value })} maxLength={10} required /></label><label><span>Posición</span><input value={locationForm.posicion} onChange={(event) => setLocationForm({ ...locationForm, posicion: event.target.value })} maxLength={10} required /></label></div><div className="form-grid"><label><span>Capacidad de volumen (m³)</span><input type="number" min="0" step="0.01" value={locationForm.capacidad_volumen} onChange={(event) => setLocationForm({ ...locationForm, capacidad_volumen: event.target.value })} required /></label><label><span>Capacidad de peso (kg)</span><input type="number" min="0" step="0.01" value={locationForm.capacidad_peso} onChange={(event) => setLocationForm({ ...locationForm, capacidad_peso: event.target.value })} required /></label></div><label className="switch-row"><span><strong>Ubicación activa</strong><small>{editing && Number(editing.stock_total) > 0 ? "Tiene stock activo y no puede desactivarse." : "Disponible para operaciones del almacén."}</small></span><input type="checkbox" checked={locationForm.estado} disabled={Boolean(editing && Number(editing.stock_total) > 0)} onChange={(event) => setLocationForm({ ...locationForm, estado: event.target.checked })} /></label>{formError && <div className="inline-alert compact" role="alert">{formError}</div>}<footer className="modal-actions"><button className="secondary-button" type="button" onClick={() => setLocationOpen(false)} disabled={saving}>Cancelar</button><button className="action-button" type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Registrar ubicación"}</button></footer></form></Modal>}
    </section>
  );
}
