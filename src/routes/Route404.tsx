import { useLocation, useNavigate } from "@solidjs/router";

export default function () {
  const location = useLocation();
  // const navigate = useNavigate();
  console.log("Location:", location);
  console.log(location.search);
  if (
    location.pathname === "/discord" ||
    location.pathname === "/discord/" ||
    location.pathname === "/hamburger"
  ) {
    const url = "/discord" + location.search;
    window.location.href = url;
    // return navigate("/discord" + location.search, { replace: true });
  }
  return <div>404 - looks like you're lost</div>;
}
