import api from "../../services/api";
import type {
  Client,
  ClientPayload,
  Product,
  ProductFilters,
  ProductOptions,
  ProductPayload,
  ProductBoxCalculation,
  ImportCatalog,
  ImportReport,
  Location,
  LocationFilters,
  LocationOptions,
  LocationPayload,
  Warehouse,
  WarehousePayload,
  Zone,
  ZonePayload,
} from "./types";

export async function listClients(search = "", state = "") {
  const response = await api.get<Client[]>("clients/", {
    params: {
      ...(search ? { search } : {}),
      ...(state ? { estado: state } : {}),
    },
  });
  return response.data;
}

export async function createClient(payload: ClientPayload) {
  const response = await api.post<Client>("clients/", payload);
  return response.data;
}

export async function updateClient(clientId: number, payload: ClientPayload) {
  const response = await api.patch<Client>(`clients/${clientId}/`, payload);
  return response.data;
}

export async function listProducts(filters: ProductFilters) {
  const response = await api.get<Product[]>("products/", {
    params: Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value.trim()),
    ),
  });
  return response.data;
}

export async function createProduct(payload: ProductPayload) {
  const response = await api.post<Product>("products/", payload);
  return response.data;
}

export async function updateProduct(productId: number, payload: ProductPayload) {
  const response = await api.patch<Product>(`products/${productId}/`, payload);
  return response.data;
}

export async function calculateProductBoxes(productId: number, palletQuantity: string) {
  const response = await api.post<ProductBoxCalculation>(
    `products/${productId}/calculate-boxes/`,
    { cantidad_pallets: palletQuantity },
  );
  return response.data;
}

export async function getProductOptions() {
  const response = await api.get<ProductOptions>("catalogs/product-options/");
  return response.data;
}

export async function listWarehouses(search = "", state = "") {
  const response = await api.get<Warehouse[]>("warehouses/", {
    params: { ...(search ? { search } : {}), ...(state ? { estado: state } : {}) },
  });
  return response.data;
}

export async function createWarehouse(payload: WarehousePayload) {
  const response = await api.post<Warehouse>("warehouses/", payload);
  return response.data;
}

export async function listZones(warehouse = "") {
  const response = await api.get<Zone[]>("zones/", {
    params: warehouse ? { almacen: warehouse } : {},
  });
  return response.data;
}

export async function createZone(payload: ZonePayload) {
  const response = await api.post<Zone>("zones/", payload);
  return response.data;
}

export async function listLocations(filters: LocationFilters) {
  const response = await api.get<Location[]>("locations/", {
    params: Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value.trim()),
    ),
  });
  return response.data;
}

export async function createLocation(payload: LocationPayload) {
  const response = await api.post<Location>("locations/", payload);
  return response.data;
}

export async function updateLocation(locationId: number, payload: LocationPayload) {
  const response = await api.patch<Location>(`locations/${locationId}/`, payload);
  return response.data;
}

export async function getLocationOptions() {
  const response = await api.get<LocationOptions>("catalogs/location-options/");
  return response.data;
}

export async function importMasterData(type: ImportCatalog, file: File) {
  const form = new FormData();
  form.append("tipo", type);
  form.append("archivo", file);
  const response = await api.post<ImportReport>("imports/master-data/", form);
  return response.data;
}
