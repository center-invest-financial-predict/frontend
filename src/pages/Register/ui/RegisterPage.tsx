import { getRouteLogin } from "@/shared/consts/router";
import { Navigate } from "react-router-dom";

const RegisterPage = () => {
	return <Navigate to={`${getRouteLogin()}?tab=up`} replace />;
};

export default RegisterPage;
