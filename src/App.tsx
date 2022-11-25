import { Component, createSignal, lazy } from "solid-js";
import { Route, Routes } from "@solidjs/router";
import { getContext } from "./Context";
import "./background.css";
import Footer from "./components/Footer";
import Header from "./components/Header";

const Home = lazy(() => import("./routes/Home"));

const App: Component = () => {
  const { theme } = getContext();
  const [showStats, setShowStats] = createSignal(false);
  return (
    <div
      class="relative top-0 bottom-0 left-0 right-0 min-h-screen"
      classList={{ dark: theme().isDark }}
    >
      <main
        class="max-w-2xl mx-auto p-4 md:px-0 z-20 relative dark:text-gray-200 min-h-screen
      flex flex-col justify-between"
      >
        <Header showStats={showStats} setShowStats={setShowStats} />
        <Routes>
          <Route path="/" component={Home} />
        </Routes>
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
