import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductsPage from "./ProductsPage";

const catalogApi = vi.hoisted(() => ({
  calculateProductBoxes: vi.fn(),
  createProduct: vi.fn(),
  getProductOptions: vi.fn(),
  listProducts: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock("../../features/catalogs/api", () => catalogApi);
vi.mock("../../features/auth/auth-context", () => ({
  useAuth: () => ({
    profile: { permisos: ["productos.ver", "productos.crear", "productos.editar"] },
  }),
}));

describe("ProductsPage", () => {
  beforeEach(() => {
    catalogApi.calculateProductBoxes.mockReset();
    catalogApi.createProduct.mockReset();
    catalogApi.listProducts.mockReset().mockResolvedValue([]);
    catalogApi.updateProduct.mockReset();
    catalogApi.getProductOptions.mockReset().mockResolvedValue({
      clientes: [{ id_cliente: 1, razon_social: "Cliente Demo", ruc: "20123456789", estado: true }],
      categorias: [{ id_categoria: 1, nombre: "General", estado: true }],
      unidades: [{ id_unidad_medida: 1, codigo: "UND", nombre: "Unidad", estado: true }],
    });
  });

  it("rejects product codes that are not EAN-8 or EAN-13", async () => {
    render(<ProductsPage />);
    await waitFor(() => expect(catalogApi.getProductOptions).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /nuevo producto/i }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("SKU"), { target: { value: "SKU-01" } });
    fireEvent.change(dialog.getByLabelText(/^Código EAN/), { target: { value: "123456789" } });
    fireEvent.change(dialog.getByLabelText("Nombre"), { target: { value: "Producto Demo" } });
    fireEvent.submit(dialog.getByRole("button", { name: "Registrar producto" }).closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El código EAN debe tener 8 o 13 dígitos.",
    );
    expect(catalogApi.createProduct).not.toHaveBeenCalled();
  });

  it("requires a pallet conversion factor for products sold by box", async () => {
    catalogApi.getProductOptions.mockResolvedValueOnce({
      clientes: [{ id_cliente: 1, razon_social: "Cliente Demo", ruc: "20123456789", estado: true }],
      categorias: [{ id_categoria: 1, nombre: "General", estado: true }],
      unidades: [{ id_unidad_medida: 2, codigo: "CJ", nombre: "Caja", estado: true }],
    });
    render(<ProductsPage />);
    await waitFor(() => expect(catalogApi.getProductOptions).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /nuevo producto/i }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("SKU"), { target: { value: "SKU-BOX" } });
    fireEvent.change(dialog.getByLabelText(/^Código EAN/), { target: { value: "12345678" } });
    fireEvent.change(dialog.getByLabelText("Nombre"), { target: { value: "Producto por caja" } });
    fireEvent.submit(dialog.getByRole("button", { name: "Registrar producto" }).closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Indica un factor mayor a cero para calcular cajas desde pallets.",
    );
    expect(catalogApi.createProduct).not.toHaveBeenCalled();
  });
});
