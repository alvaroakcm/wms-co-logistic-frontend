import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "./ForgotPasswordPage";

const mocks = vi.hoisted(() => ({ resetPasswordForEmail: vi.fn() }));

vi.mock("../../lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { resetPasswordForEmail: mocks.resetPasswordForEmail } },
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    mocks.resetPasswordForEmail.mockReset();
  });

  it("rejects an invalid email before contacting Supabase", () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "correo-invalido" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("correo electrónico válido");
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("shows a generic success message after requesting recovery", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "persona@empresa.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Si la dirección está registrada",
      );
    });
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "persona@empresa.com",
      { redirectTo: "http://localhost:3000/restablecer-contrasena" },
    );
  });
});
