import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MasterDataImportPage from "./MasterDataImportPage";

const importMasterData = vi.hoisted(() => vi.fn());
vi.mock("../../features/catalogs/api", () => ({ importMasterData }));

describe("MasterDataImportPage", () => {
  it("requires a CSV file before importing", () => {
    render(<MasterDataImportPage />);
    const submit = screen.getByRole("button", { name: "Validar e importar" });

    fireEvent.submit(submit.closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent("Selecciona una plantilla CSV.");
    expect(importMasterData).not.toHaveBeenCalled();
  });
});
