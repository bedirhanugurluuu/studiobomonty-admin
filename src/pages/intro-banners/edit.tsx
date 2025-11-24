import { Navigate, useParams } from "react-router-dom";

export default function IntroBannerEditRedirect() {
  const { id } = useParams();
  return <Navigate to="/admin/intro-banners" state={{ id }} replace />;
}
