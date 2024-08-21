import { useLocation, useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";

export default function () {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = location.search;
  createEffect(() => {
    console.log(searchParams);
    fetch("/discordLogin" + searchParams)
      .then((res) => {
        return res.json();
      })
      .then((data: any) => {
        console.log(data);
        navigate(`/settings?email=${data.email}`, { replace: true });
      });
  }, []);
  return <div />;
}
