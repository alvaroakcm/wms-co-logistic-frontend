import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientsPage from "./ClientsPage";

const catalogApi = vi.hoisted(() => ({
  createClient: vi.fn(),
  listClients: vi.fn(),
  updateClient: vi.fn(),
}));

vi.mock("../../features/catalogs/api", () => catalogApi);
vi.mock("../../features/auth/auth-context", () => ({
  useAuth: () => ({
    profile: { permisos: ["clientes.ver", "clientes.crear", "clientes.editar"] },
  }),
}));

describe("ClientsPage", () => {
  beforeEach(() => {
    catalogApi.createClient.mockReset();
    catalogApi.listClients.mockReset().mockResolvedValue([]);
    catalogApi.updateClient.mockReset();
  });

  it("rejects a RUC that does not contain exactly 11 digits", async () => {
    render(<ClientsPage />);
    await waitFor(() => expect(catalogApi.listClients).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /nuevo cliente/i }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Razón social"), {
      target: { value: "Cliente Demo SAC" },
    });
    fireEvent.change(dialog.getByLabelText(/^RUC/), {
      target: { value: "1234567890" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Registrar cliente" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El RUC debe contener exactamente 11 dígitos.",
    );
    expect(catalogApi.createClient).not.toHaveBeenCalled();
  });
});
