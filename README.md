<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1EG9hJNznTKLIlIAz5hw9OT5cE1Zx5200

## Run Locally

**Prerequisites:**  Node.js

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the root of your project and add the following variables.

    ### Required Variables

    - **`VITE_GEMINI_API_KEY`**: Your API key from Google AI Studio. **This is required for the AI recommendation features to work.**
    - **`VITE_FIREBASE_*`**: All Firebase variables are required for user authentication, friend features, and storing your watchlist. You can get these from your Firebase project console.

    ```
    # Get this from Google AI Studio (https://ai.studio.google.com/app/apikey)
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

    # Get these from your Firebase project settings
    VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    ```

3.  **Run the app:**
    ```bash
    npm run dev
    ```

## Deploying to Netlify
When deploying, make sure to add the same environment variables listed above in your Netlify site's **Build & deploy > Environment** settings. The application's features depend on these keys being available during the build process.
