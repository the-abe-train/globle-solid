/* @refresh reload */
/// <reference types="google.accounts" />
import { render } from "solid-js/web";
import "./index.css";
import App from "./App";
import { Router } from "@solidjs/router";
import { GlobalContext, makeContext } from "./Context";

render(
  () => (
    <GlobalContext.Provider value={makeContext("Stored")}>
      <App />
    </GlobalContext.Provider>
  ),
  document.getElementById("root") as HTMLElement
);
