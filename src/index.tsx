/* @refresh reload */
/// <reference types="google.accounts" />

import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { Router } from "@solidjs/router";
import { GlobalContext, makeContext } from "./Context";

render(
  () => (
    <Router>
      <GlobalContext.Provider value={makeContext("Stored")}>
        <App />
      </GlobalContext.Provider>
    </Router>
  ),
  document.getElementById("root") as HTMLElement
);
