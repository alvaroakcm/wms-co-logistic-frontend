import { useRef, useState, type FormEvent } from "react";
import { getApiMessage } from "../../features/access/api";
import { importMasterData } from "../../features/catalogs/api";
import type { ImportCatalog, ImportReport } from "../../features/catalogs/types";

const TEMPLATE_HEADERS: Record<ImportCatalog, string[]> = {
  clientes: ["razon_social", "ruc", "contacto_nombre", "contacto_telefono", "estado"],
  productos: ["cliente_ruc", "sku", "codigo_ean", "nombre", "unidad_codigo", "categoria", "descripcion", "controla_lote", "factor_conversion", "estado"],
  almacenes: ["codigo", "nombre", "referencia", "capacidad_pallets", "estado"],
  ubicaciones: ["almacen_codigo", "zona_codigo", "zona_nombre", "zona_tipo", "codigo", "pasillo", "rack", "nivel", "posicion", "capacidad_volumen", "capacidad_peso", "estado"],
};

function downloadTemplate(type: ImportCatalog) {
  const content = `\uFEFF${TEMPLATE_HEADERS[type].join(",")}\n`;
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `plantilla_${type}.csv`; anchor.click();
  URL.revokeObjectURL(url);
}

function formatErrors(errors: unknown) {
  if (typeof errors === "string") return errors;
  try { return JSON.stringify(errors); } catch { return "Error de validación"; }
}

export default function MasterDataImportPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<ImportCatalog>("clientes");
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setReport(null);
    if (!file) { setError("Selecciona una plantilla CSV."); return; }
    setUploading(true);
    try {
      setReport(await importMasterData(type, file));
      setFile(null); if (fileInput.current) fileInput.current.value = "";
    } catch (uploadError) { setError(getApiMessage(uploadError)); }
    finally { setUploading(false); }
  }

  return (
    <section className="management-page import-page">
      <header className="page-heading"><div><span className="page-eyebrow">Migración de datos</span><h1>Importar catálogos</h1><p>Carga plantillas validadas y revisa cada registro rechazado.</p></div></header>
      <div className="import-layout">
        <form className="import-card" onSubmit={submit}>
          <label><span>Catálogo</span><select value={type} onChange={(event) => { setType(event.target.value as ImportCatalog); setReport(null); }}><option value="clientes">Clientes</option><option value="productos">Productos</option><option value="almacenes">Almacenes</option><option value="ubicaciones">Zonas y ubicaciones</option></select></label>
          <div className="template-note"><strong>Formato CSV UTF-8</strong><span>Máximo 2 MB y 5,000 filas. No cambies los encabezados.</span><button className="secondary-button" type="button" onClick={() => downloadTemplate(type)}>Descargar plantilla</button></div>
          <label className="file-field"><span>Archivo CSV</span><input ref={fileInput} type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /><small>{file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : "Selecciona la plantilla completada."}</small></label>
          {error && <div className="inline-alert compact" role="alert">{error}</div>}
          <button className="action-button" type="submit" disabled={uploading}>{uploading ? "Procesando…" : "Validar e importar"}</button>
        </form>
        <aside className="import-help"><h2>Orden recomendado</h2><ol><li>Clientes</li><li>Almacenes</li><li>Productos</li><li>Zonas y ubicaciones</li></ol><p>Productos requieren clientes y unidades existentes. Las ubicaciones pueden crear su zona al importar.</p></aside>
      </div>
      {report && <section className="import-report" aria-live="polite"><header><div><span>Procesados</span><strong>{report.procesados}</strong></div><div className="success-metric"><span>Cargados</span><strong>{report.cargados}</strong></div><div className="danger-metric"><span>Rechazados</span><strong>{report.rechazados}</strong></div></header>{report.detalle_rechazados.length > 0 && <div className="data-card"><table className="data-table"><thead><tr><th>Fila</th><th>Motivo del rechazo</th></tr></thead><tbody>{report.detalle_rechazados.map((item) => <tr key={item.fila}><td>{item.fila}</td><td>{formatErrors(item.errores)}</td></tr>)}</tbody></table></div>}</section>}
    </section>
  );
}
