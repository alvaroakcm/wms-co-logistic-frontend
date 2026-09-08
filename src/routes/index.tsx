import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/Login/Login";
import DashboardLayout from "../layouts/DashboardLayout";

const router = createBrowserRouter([
	{
		path: "/login",
		element: <Login />,
	},
	{
		path: "/",
		element: <DashboardLayout />,
	},
]);

export default router;
