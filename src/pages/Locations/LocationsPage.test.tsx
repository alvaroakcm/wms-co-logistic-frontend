import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocationsPage from "./LocationsPage";

const catalogApi = vi.hoisted(() => ({
  createLocation: vi.fn(),
  createZone: vi.fn(),
  getLocationOptions: vi.fn(),
  listLocations: vi.fn(),
  updateLocation: vi.fn(),
}));

vi.mock("../../features/catalogs/api", () => catalogApi);
vi.mock("../../features/auth/auth-context", () => ({
  useAuth: () => ({
    profile: { permisos: ["ubicaciones.ver", "ubicaciones.crear", "ubicaciones.editar"] },
  }),
}));

describe("LocationsPage", () => {
  beforeEach(() => {
    catalogApi.getLocationOptions.mockResolvedValue({
      almacenes: [{ id_almacen: 1, codigo: "ALM-01", nombre: "Principal", estado: true }],
      zonas: [{ id_zona: 2, id_almacen: 1, codigo: "Z-01", nombre: "Picking", tipo: "PICKING", estado: true }],
    });
    catalogApi.listLocations.mockResolvedValue([{
      id_ubicacion: 9, id_zona: 2, zona: { id_zona: 2, codigo: "Z-01", nombre: "Picking" },
      almacen: { id_almacen: 1, codigo: "ALM-01", nombre: "Principal" }, codigo: "UBI-01",
      pasillo: "1", rack: "A", nivel: "1", columna: "1", posicion: "1",
      capacidad_volumen: "20.00", capacidad_peso: "500.00", stock_total: "12.0000",
      estado_operativo: "ocupada", estado: true, fecha_registro: "", fecha_actualizacion: "",
    }]);
  });

  it("does not allow disabling an occupied location in the form", async () => {
    render(<LocationsPage />);
    await waitFor(() => expect(screen.getByText("UBI-01")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const dialog = within(screen.getByRole("dialog"));

    expect(dialog.getByLabelText(/^Ubicación activa/)).toBeDisabled();
    expect(dialog.getByText(/tiene stock activo/i)).toBeInTheDocument();
  });
});
