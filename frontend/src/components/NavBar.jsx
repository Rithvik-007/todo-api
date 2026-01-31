import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

export default function NavBar() {
  const nav = useNavigate();

  return (
    <div className="d-flex align-items-center justify-content-between border-bottom p-3">
      <Link to="/artifacts" className="text-decoration-none fw-bold">
        Secure Artifact Registry
      </Link>
      <button
        className="btn btn-outline-danger btn-sm"
        onClick={() => {
          logout();
          nav("/");
        }}
      >
        Logout
      </button>
    </div>
  );
}
