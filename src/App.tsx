import {
  Component,
  createSignal,
  lazy,
  Match,
  onMount,
  Switch,
} from "solid-js";
import { Route, Routes } from "@solidjs/router";
import { getContext } from "./Context";
import "./background.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { translatePage } from "./i18n";
import Modal from "./components/Modal";
import Statistics from "./components/Statistics";
import Practice from "./routes/Practice";
import UAParser from "ua-parser-js";
import SnackAdUnit from "./components/SnackAdUnit";

const Home = lazy(() => import("./routes/Home"));
const Settings = lazy(() => import("./routes/Settings"));
const Game = lazy(() => import("./routes/Game"));
const FAQ = lazy(() => import("./routes/Faq"));
const PrivacyPolicy = lazy(() => import("./routes/PrivacyPolicy"));

// TODO add snack ads
// TODO PWA
// TODO add code to solid branch on original site?
// TODO A/B tested in Netlify?
// TODO merge?

const App: Component = () => {
  const { theme } = getContext();
  const [showStats, setShowStats] = createSignal(false);
  onMount(translatePage);
  const parser = new UAParser();

  return (
    <div
      class="relative top-0 bottom-0 left-0 right-0 min-h-screen"
      classList={{ dark: theme().isDark }}
    >
      <Modal trigger={showStats} setTrigger={setShowStats}>
        <Statistics showStats={showStats} setShowStats={setShowStats} />
      </Modal>
      <main
        class="max-w-2xl mx-auto p-4 md:px-0 z-20 relative dark:text-gray-200 
        min-h-screen flex flex-col justify-between"
      >
        <Header showStats={showStats} setShowStats={setShowStats} />
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/game" element={<Game setShowStats={setShowStats} />} />
          <Route path="/practice" component={Practice} />
          <Route path="/settings" component={Settings} />
          <Route path="/faq" component={FAQ} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
        </Routes>
        <Switch>
          <Match when={parser.getDevice().type === "mobile"}>
            <SnackAdUnit unitName="snack_mex1" siteId="2902" />
          </Match>
          <Match when={parser.getDevice().type === "tablet"}>
            <SnackAdUnit unitName="snack_dex1" siteId="2902" />
          </Match>
          <Match when={parser.getDevice().type === "console"}>
            <SnackAdUnit unitName="snack_dex1" siteId="2902" />
          </Match>
        </Switch>
        <Footer />
      </main>
      <div
        classList={{ night: theme().isDark }}
        class="absolute top-0 bottom-0 left-0 right-0 block z-0 h-full 
        pointer-events-none sky"
      ></div>
      <div
        classList={{ empty: theme().isDark }}
        class="absolute top-0 bottom-0 left-0 right-0 block z-10 pointer-events-none
        clouds"
      ></div>
      <div
        classList={{ empty: !theme().isDark }}
        class="absolute top-0 bottom-0 left-0 right-0 block z-10 pointer-events-none
        stars"
      ></div>
    </div>
  );
};

export default App;
