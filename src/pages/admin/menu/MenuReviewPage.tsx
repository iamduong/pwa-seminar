import { Navigate, useParams } from "react-router";

export default function MenuReviewPage() {
  const { poiId } = useParams();
  if (!poiId) return <p>Chưa chọn địa điểm.</p>;
  return <Navigate to={`/quan-ly/dia-diem-poi/${poiId}/mon-an?status=pending`} replace />;
}
