import { Component, createSignal, lazy, onMount } from 'solid-js';
import { Route, Router } from '@solidjs/router';
import { getContext } from './Context';
import './background.css';
import Footer from './components/Footer';
import Header from './components/Header';
import { translatePage } from './i18n';
import Modal from './components/Modal';
import Statistics from './components/Statistics';
import Practice from './routes/Practice';
import Route404 from './routes/Route404';
import Discord from './routes/Discord';
import { logVersionInfo } from './util/version';

const Home = lazy(() => import('./routes/Home'));
const Settings = lazy(() => import('./routes/Settings'));
const Game = lazy(() => import('./routes/Game'));
const FAQ = lazy(() => import('./routes/Faq'));
const PrivacyPolicy = lazy(() => import('./routes/PrivacyPolicy'));

const App: Component = () => {
  const { theme } = getContext();
  const [showStats, setShowStats] = createSignal(false);
  onMount(() => {
    translatePage();
    // Log version information on app load
    logVersionInfo();
  });

  return (
    <div
      class="relative top-0 right-0 bottom-0 left-0 min-h-screen"
      classList={{ dark: theme().isDark }}
    >
      <Modal trigger={showStats} setTrigger={setShowStats}>
        <Statistics showStats={showStats} setShowStats={setShowStats} />
      </Modal>
      <main class="relative z-20 mx-auto flex min-h-screen max-w-2xl flex-col justify-between p-4 md:px-0 dark:text-gray-200">
        <Header showStats={showStats} setShowStats={setShowStats} />
        <Router>
          <Route path="/" component={Home} />
          <Route path="/game" component={() => <Game setShowStats={setShowStats} />} />
          <Route path="/practice" component={Practice} />
          <Route path="/settings" component={Settings} />
          <Route path="/faq" component={FAQ} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/discord" component={Discord} />
          <Route path="*" component={Route404} />
        </Router>

        <Footer />
      </main>
      <div
        classList={{ night: theme().isDark }}
        class="sky pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-0 block h-full"
      />
      <div
        classList={{ empty: theme().isDark }}
        class="clouds pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-10 block"
      />
      <div
        classList={{ empty: !theme().isDark }}
        class="stars pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-10 block"
      />
    </div>
  );
};

export default App;
