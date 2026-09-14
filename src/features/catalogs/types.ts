export interface Client {
  id_cliente: number;
  razon_social: string;
  ruc: string;
  contacto_nombre: string;
  contacto_telefono: string;
  estado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
}

export interface ClientPayload {
  razon_social: string;
  ruc: string;
  contacto_nombre: string;
  contacto_telefono: string;
  estado: boolean;
}

export interface ProductClientOption {
  id_cliente: number;
  razon_social: string;
  ruc: string;
  estado: boolean;
}

export interface ProductCategoryOption {
  id_categoria: number;
  nombre: string;
  estado: boolean;
}

export interface ProductUnitOption {
  id_unidad_medida: number;
  codigo: string;
  nombre: string;
  estado: boolean;
}

export interface ProductOptions {
  clientes: ProductClientOption[];
  categorias: ProductCategoryOption[];
  unidades: ProductUnitOption[];
}

export interface Product {
  id_producto: number;
  id_cliente: number;
  cliente: Pick<ProductClientOption, "id_cliente" | "razon_social" | "ruc"> | null;
  id_categoria: number | null;
  categoria: string | null;
  id_unidad_medida: number;
  unidad_medida: Pick<ProductUnitOption, "codigo" | "nombre"> | null;
  unidad_comercial: "CAJA" | "UNIDAD";
  factor_conversion: string | null;
  sku: string;
  codigo_ean: string;
  nombre: string;
  descripcion: string;
  controla_lote: boolean;
  estado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
}

export interface ProductPayload {
  id_cliente: number;
  id_categoria: number | null;
  id_unidad_medida: number;
  sku: string;
  codigo_ean: string;
  nombre: string;
  descripcion: string;
  controla_lote: boolean;
  estado: boolean;
  factor_conversion: string | null;
}

export interface ProductBoxCalculation {
  id_producto: number;
  sku: string;
  cantidad_pallets: string;
  factor_conversion: string;
  cantidad_cajas: string;
}

export interface ProductFilters {
  codigo: string;
  nombre: string;
  cliente: string;
  estado: string;
}

export interface Warehouse {
  id_almacen: number;
  codigo: string;
  nombre: string;
  referencia: string;
  capacidad_pallets: number;
  estado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
}

export type WarehousePayload = Omit<
  Warehouse,
  "id_almacen" | "fecha_registro" | "fecha_actualizacion"
>;

export interface Zone {
  id_zona: number;
  id_almacen: number;
  almacen?: Pick<Warehouse, "id_almacen" | "codigo" | "nombre"> | null;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: boolean;
}

export interface ZonePayload {
  id_almacen: number;
  codigo: string;
  nombre: string;
  tipo: string;
  estado: boolean;
}

export interface Location {
  id_ubicacion: number;
  id_zona: number;
  zona: Pick<Zone, "id_zona" | "codigo" | "nombre"> | null;
  almacen: Pick<Warehouse, "id_almacen" | "codigo" | "nombre"> | null;
  codigo: string;
  pasillo: string;
  rack: string;
  nivel: string;
  columna: string;
  posicion: string;
  capacidad_volumen: string;
  capacidad_peso: string;
  stock_total: string;
  estado_operativo: "disponible" | "ocupada" | "inactiva";
  estado: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
}

export interface LocationPayload {
  id_zona: number;
  codigo: string;
  pasillo: string;
  rack: string;
  nivel: string;
  columna: string;
  posicion: string;
  capacidad_volumen: string;
  capacidad_peso: string;
  estado: boolean;
}

export interface LocationOptions {
  almacenes: Array<Pick<Warehouse, "id_almacen" | "codigo" | "nombre" | "estado">>;
  zonas: Array<Pick<Zone, "id_zona" | "id_almacen" | "codigo" | "nombre" | "tipo" | "estado">>;
}

export interface LocationFilters {
  almacen: string;
  zona: string;
  rack: string;
  estado: string;
}

export type ImportCatalog = "clientes" | "productos" | "almacenes" | "ubicaciones";

export interface ImportReport {
  tipo: ImportCatalog;
  procesados: number;
  cargados: number;
  rechazados: number;
  detalle_rechazados: Array<{ fila: number; errores: unknown }>;
}
