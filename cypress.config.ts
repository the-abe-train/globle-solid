import { defineConfig } from "cypress";

// Populate process.env with values from .env file
require("dotenv").config();

export default defineConfig({
  projectId: "j6ify9",
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:8788",
    env: {
      googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
      myEmail: process.env.MY_EMAIL,
      cryptoKey: process.env.CRYPTO_KEY,
      mode: process.env.MODE,
    },
  },
});
