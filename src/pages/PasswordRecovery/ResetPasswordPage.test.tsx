import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "./ResetPasswordPage";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../../lib/supabase", () => ({
  supabase: { auth: mocks },
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    mocks.exchangeCodeForSession.mockReset();
    mocks.getSession.mockReset();
    mocks.signOut.mockReset();
    mocks.updateUser.mockReset();
    window.history.pushState({}, "", "/restablecer-contrasena?code=valid-code");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("updates the password and requires a new login", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);

    await screen.findByLabelText("Nueva contraseña");
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "NuevaClave123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "NuevaClave123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar contraseña" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Cambio completado");
    });
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "NuevaClave123" });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
});
