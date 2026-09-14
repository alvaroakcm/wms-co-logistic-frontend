import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/Login/Login";
import DashboardLayout from "../layouts/DashboardLayout";
import AppShell from "../layouts/AppShell";
import UsersPage from "../pages/Users/UsersPage";
import RolesPage from "../pages/Roles/RolesPage";
import ForgotPasswordPage from "../pages/PasswordRecovery/ForgotPasswordPage";
import ResetPasswordPage from "../pages/PasswordRecovery/ResetPasswordPage";
import ClientsPage from "../pages/Clients/ClientsPage";
import ProductsPage from "../pages/Products/ProductsPage";
import WarehousesPage from "../pages/Warehouses/WarehousesPage";
import LocationsPage from "../pages/Locations/LocationsPage";
import MasterDataImportPage from "../pages/Imports/MasterDataImportPage";
import ProtectedRoute from "./ProtectedRoute";
import PermissionRoute from "./PermissionRoute";

const router = createBrowserRouter([
	{
		path: "/login",
		element: <Login />,
	},
	{
		path: "/recuperar-contrasena",
		element: <ForgotPasswordPage />,
	},
	{
		path: "/restablecer-contrasena",
		element: <ResetPasswordPage />,
	},
	{
		path: "/",
		element: (
			<ProtectedRoute>
				<AppShell />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <DashboardLayout /> },
			{
				path: "usuarios",
				element: <PermissionRoute permission="usuarios.ver"><UsersPage /></PermissionRoute>,
			},
			{
				path: "roles",
				element: <PermissionRoute permission="roles.ver"><RolesPage /></PermissionRoute>,
			},
			{
				path: "clientes",
				element: <PermissionRoute permission="clientes.ver"><ClientsPage /></PermissionRoute>,
			},
			{
				path: "productos",
				element: <PermissionRoute permission="productos.ver"><ProductsPage /></PermissionRoute>,
			},
			{
				path: "almacenes",
				element: <PermissionRoute permission="almacenes.ver"><WarehousesPage /></PermissionRoute>,
			},
			{
				path: "ubicaciones",
				element: <PermissionRoute permission="ubicaciones.ver"><LocationsPage /></PermissionRoute>,
			},
			{
				path: "importaciones",
				element: <PermissionRoute permission="importaciones.ejecutar"><MasterDataImportPage /></PermissionRoute>,
			},
		],
	},
]);

export default router;
