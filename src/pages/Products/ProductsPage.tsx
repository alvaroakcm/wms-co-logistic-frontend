import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Modal from "../../components/Modal";
import { getApiMessage } from "../../features/access/api";
import {
  calculateProductBoxes,
  createProduct,
  getProductOptions,
  listProducts,
  updateProduct,
} from "../../features/catalogs/api";
import type {
  Product,
  ProductBoxCalculation,
  ProductFilters,
  ProductOptions,
  ProductPayload,
} from "../../features/catalogs/types";
import { useAuth } from "../../features/auth/auth-context";

const EMPTY_FILTERS: ProductFilters = { codigo: "", nombre: "", cliente: "", estado: "" };
const EMPTY_OPTIONS: ProductOptions = { clientes: [], categorias: [], unidades: [] };
const EMPTY_PRODUCT: ProductPayload = {
  id_cliente: 0,
  id_categoria: null,
  id_unidad_medida: 0,
  sku: "",
  codigo_ean: "",
  nombre: "",
  descripcion: "",
  controla_lote: false,
  estado: true,
  factor_conversion: null,
};

export default function ProductsPage() {
  const { profile } = useAuth();
  const canCreate = profile?.permisos.includes("productos.crear") ?? false;
  const canEdit = profile?.permisos.includes("productos.editar") ?? false;
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<ProductOptions>(EMPTY_OPTIONS);
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [calculationTarget, setCalculationTarget] = useState<Product | null>(null);
  const [palletQuantity, setPalletQuantity] = useState("1");
  const [calculation, setCalculation] = useState<ProductBoxCalculation | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const commercialUnits = useMemo(
    () => options.unidades.filter((unit) => ["CJ", "UND"].includes(unit.codigo.trim().toUpperCase())),
    [options.unidades],
  );

  const loadData = useCallback(async (currentFilters: ProductFilters) => {
    setLoading(true);
    setPageError(null);
    try {
      const [productData, optionData] = await Promise.all([
        listProducts(currentFilters),
        getProductOptions(),
      ]);
      setProducts(productData);
      setOptions(optionData);
    } catch (error) {
      setPageError(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(EMPTY_FILTERS), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function isBoxUnit(unitId: number) {
    return options.unidades.some(
      (unit) => unit.id_unidad_medida === unitId && unit.codigo.trim().toUpperCase() === "CJ",
    );
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(filters);
    void loadData(filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    void loadData(EMPTY_FILTERS);
  }

  function openForm(product?: Product) {
    setEditing(product ?? null);
    const activeClient = options.clientes.find((client) => client.estado);
    const activeUnit = commercialUnits.find((unit) => unit.estado);
    setForm(product ? {
      id_cliente: product.id_cliente,
      id_categoria: product.id_categoria,
      id_unidad_medida: product.id_unidad_medida,
      sku: product.sku,
      codigo_ean: product.codigo_ean,
      nombre: product.nombre,
      descripcion: product.descripcion,
      controla_lote: product.controla_lote,
      estado: product.estado,
      factor_conversion: product.factor_conversion,
    } : {
      ...EMPTY_PRODUCT,
      id_cliente: activeClient?.id_cliente ?? 0,
      id_unidad_medida: activeUnit?.id_unidad_medida ?? 0,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!form.id_cliente || !form.id_unidad_medida || !form.sku.trim() || !form.nombre.trim()) {
      setFormError("Completa cliente, SKU, nombre y unidad comercial.");
      return;
    }
    if (!/^(\d{8}|\d{13})$/.test(form.codigo_ean)) {
      setFormError("El código EAN debe tener 8 o 13 dígitos.");
      return;
    }
    if (isBoxUnit(form.id_unidad_medida) && (!form.factor_conversion || Number(form.factor_conversion) <= 0)) {
      setFormError("Indica un factor mayor a cero para calcular cajas desde pallets.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        sku: form.sku.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        factor_conversion: isBoxUnit(form.id_unidad_medida) ? form.factor_conversion : null,
      };
      if (editing) await updateProduct(editing.id_producto, payload);
      else await createProduct(payload);
      setModalOpen(false);
      await loadData(appliedFilters);
    } catch (error) {
      setFormError(getApiMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function openCalculator(product: Product) {
    setCalculationTarget(product);
    setPalletQuantity("1");
    setCalculation(null);
    setCalculationError(null);
  }

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!calculationTarget) return;
    setCalculationError(null);
    if (palletQuantity === "" || Number(palletQuantity) < 0) {
      setCalculationError("Ingresa una cantidad válida de pallets.");
      return;
    }
    setCalculating(true);
    try {
      setCalculation(await calculateProductBoxes(calculationTarget.id_producto, palletQuantity));
    } catch (error) {
      setCalculationError(getApiMessage(error));
    } finally {
      setCalculating(false);
    }
  }

  const noCreationOptions = !options.clientes.some((client) => client.estado)
    || !commercialUnits.some((unit) => unit.estado);

  return (
    <section className="management-page">
      <header className="page-heading management-heading">
        <div><span className="page-eyebrow">Catálogos maestros</span><h1>Productos</h1><p>Consulta y mantiene el catálogo utilizado en recepción, inventario y despacho.</p></div>
        {canCreate && <button className="action-button" type="button" onClick={() => openForm()} disabled={noCreationOptions} title={noCreationOptions ? "Primero registra un cliente y las unidades comerciales" : undefined}>＋ Nuevo producto</button>}
      </header>

      <form className="product-filters" onSubmit={applyFilters}>
        <label><span>Código</span><input value={filters.codigo} onChange={(event) => setFilters({ ...filters, codigo: event.target.value })} placeholder="SKU o EAN" /></label>
        <label><span>Nombre</span><input value={filters.nombre} onChange={(event) => setFilters({ ...filters, nombre: event.target.value })} placeholder="Nombre del producto" /></label>
        <label><span>Cliente</span><input value={filters.cliente} onChange={(event) => setFilters({ ...filters, cliente: event.target.value })} placeholder="Razón social o RUC" /></label>
        <label><span>Estado</span><select value={filters.estado} onChange={(event) => setFilters({ ...filters, estado: event.target.value })}><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></label>
        <div className="filter-actions"><button className="secondary-button" type="button" onClick={clearFilters}>Limpiar</button><button className="action-button" type="submit">Filtrar</button></div>
      </form>

      {pageError && <div className="inline-alert" role="alert">{pageError}<button type="button" onClick={() => void loadData(appliedFilters)}>Reintentar</button></div>}
      {noCreationOptions && canCreate && !loading && <div className="info-alert">Para registrar productos debe existir un cliente activo y las unidades Caja (CJ) o Unidad (UND).</div>}

      {loading ? <div className="content-loading"><span className="loading-spinner" /> Cargando productos…</div> : (
        <div className="data-card"><table className="data-table product-table"><thead><tr><th>Producto</th><th>Códigos</th><th>Cliente</th><th>Unidad comercial</th><th>Control</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>
          {products.map((product) => <tr key={product.id_producto}>
            <td><div className="stacked-cell"><strong className="primary-cell">{product.nombre}</strong><small>{product.categoria || "Sin categoría"}</small></div></td>
            <td><div className="stacked-cell"><span className="code-value">{product.sku}</span><small>EAN {product.codigo_ean}</small></div></td>
            <td><div className="stacked-cell"><span>{product.cliente?.razon_social || "—"}</span><small>{product.cliente?.ruc}</small></div></td>
            <td><div className="stacked-cell"><span className={`commercial-unit ${product.factor_conversion ? "box" : "unit"}`}>{product.unidad_comercial === "CAJA" ? "Caja" : "Unidad"}</span>{product.factor_conversion && <small>1 pallet = {product.factor_conversion} cajas</small>}</div></td>
            <td>{product.controla_lote ? <span className="lot-badge">Por lote</span> : <span className="muted-copy">Sin lote</span>}</td>
            <td><span className={`status-pill ${product.estado ? "active" : "inactive"}`}><i />{product.estado ? "Activo" : "Inactivo"}</span></td>
            <td><div className="row-actions">{product.factor_conversion && <button className="table-action" type="button" onClick={() => openCalculator(product)}>Calcular</button>}{canEdit && <button className="table-action" type="button" onClick={() => openForm(product)}>Editar</button>}</div></td>
          </tr>)}
          {!products.length && <tr><td colSpan={7}><div className="empty-state"><strong>No encontramos productos</strong><span>Registra uno nuevo o cambia los filtros.</span></div></td></tr>}
        </tbody></table></div>
      )}

      {modalOpen && <Modal title={editing ? "Editar producto" : "Registrar producto"} description="Configura su unidad comercial y conserva la identidad de las operaciones históricas." onClose={() => !saving && setModalOpen(false)}>
        <form className="management-form" onSubmit={submit}>
          <div className="form-grid"><label><span>SKU</span><input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value.toUpperCase() })} maxLength={50} autoFocus required /></label><label><span>Código EAN</span><input value={form.codigo_ean} onChange={(event) => setForm({ ...form, codigo_ean: event.target.value.replace(/\D/g, "").slice(0, 13) })} inputMode="numeric" maxLength={13} required /><small>EAN-8 o EAN-13.</small></label></div>
          <label><span>Nombre</span><input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} maxLength={150} required /></label>
          <label><span>Cliente asociado</span><select value={form.id_cliente} onChange={(event) => setForm({ ...form, id_cliente: Number(event.target.value) })} required><option value={0}>Selecciona un cliente</option>{options.clientes.map((client) => <option key={client.id_cliente} value={client.id_cliente} disabled={!client.estado && client.id_cliente !== editing?.id_cliente}>{client.razon_social} · {client.ruc}{!client.estado ? " (inactivo)" : ""}</option>)}</select></label>
          <div className="form-grid">
            <label><span>Unidad comercial</span><select value={form.id_unidad_medida} onChange={(event) => { const unitId = Number(event.target.value); setForm({ ...form, id_unidad_medida: unitId, factor_conversion: isBoxUnit(unitId) ? form.factor_conversion : null }); }} required><option value={0}>Selecciona una unidad</option>{commercialUnits.map((unit) => <option key={unit.id_unidad_medida} value={unit.id_unidad_medida} disabled={!unit.estado && unit.id_unidad_medida !== editing?.id_unidad_medida}>{unit.nombre} ({unit.codigo}){!unit.estado ? " · inactiva" : ""}</option>)}</select></label>
            <label><span>Categoría</span><select value={form.id_categoria ?? ""} onChange={(event) => setForm({ ...form, id_categoria: event.target.value ? Number(event.target.value) : null })}><option value="">Sin categoría</option>{options.categorias.map((category) => <option key={category.id_categoria} value={category.id_categoria} disabled={!category.estado && category.id_categoria !== editing?.id_categoria}>{category.nombre}{!category.estado ? " (inactiva)" : ""}</option>)}</select></label>
          </div>
          {isBoxUnit(form.id_unidad_medida) ? <label><span>Factor de conversión</span><input aria-label="Factor de conversión" type="number" min="0.01" step="0.01" value={form.factor_conversion ?? ""} onChange={(event) => setForm({ ...form, factor_conversion: event.target.value })} placeholder="Ej. 24" required /><small>Número de cajas contenidas en un pallet.</small></label> : <div className="conversion-note"><strong>Producto por unidad</strong><span>No utiliza pallet ni factor de conversión.</span></div>}
          <label><span>Descripción</span><textarea value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} rows={3} /></label>
          <div className="switch-grid"><label className="switch-row"><span><strong>Controla lote</strong><small>Exige trazabilidad por lote.</small></span><input type="checkbox" checked={form.controla_lote} onChange={(event) => setForm({ ...form, controla_lote: event.target.checked })} /></label><label className="switch-row"><span><strong>Producto activo</strong><small>Disponible para operaciones.</small></span><input type="checkbox" checked={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.checked })} /></label></div>
          {formError && <div className="inline-alert compact" role="alert">{formError}</div>}
          <footer className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="action-button" type="submit" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar cambios" : "Registrar producto"}</button></footer>
        </form>
      </Modal>}

      {calculationTarget && <Modal title="Calcular cajas" description={`${calculationTarget.nombre} · ${calculationTarget.sku}`} onClose={() => !calculating && setCalculationTarget(null)}>
        <form className="management-form conversion-calculator" onSubmit={calculate}>
          <div className="conversion-formula"><span>Factor configurado</span><strong>1 pallet = {calculationTarget.factor_conversion} cajas</strong></div>
          <label><span>Cantidad de pallets</span><input type="number" min="0" step="0.01" value={palletQuantity} onChange={(event) => { setPalletQuantity(event.target.value); setCalculation(null); }} required /></label>
          {calculation && <div className="calculation-result" aria-live="polite"><span>Resultado</span><strong>{calculation.cantidad_cajas} cajas</strong><small>{calculation.cantidad_pallets} pallets × {calculation.factor_conversion}</small></div>}
          {calculationError && <div className="inline-alert compact" role="alert">{calculationError}</div>}
          <footer className="modal-actions"><button className="secondary-button" type="button" onClick={() => setCalculationTarget(null)} disabled={calculating}>Cerrar</button><button className="action-button" type="submit" disabled={calculating}>{calculating ? "Calculando…" : "Calcular cajas"}</button></footer>
        </form>
      </Modal>}
    </section>
  );
}
