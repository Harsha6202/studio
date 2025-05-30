# Product Demo Platform

This is an interactive product demo platform built with Next.js in Firebase Studio. It allows users to create, share, and manage step-by-step product tours, similar to platforms like Arcade.

## Features

*   **User Authentication**: Sign up, log in, and manage sessions securely using Firebase Authentication.
*   **Interactive Tour Creation**:
    *   Upload images/screenshots or use video URLs for tour steps.
    *   Add titles, descriptions, and text annotations to each step.
    *   Reorder steps easily.
*   **In-Browser Screen Recorder**: Capture product workflows directly within the app (uses `getDisplayMedia`). Recorded videos can be uploaded to Firebase Storage.
*   **Visual Editor Interface**: Manage tour content and steps.
*   **Publishing**: Set demos as public (shareable via link) or private.
*   **Dashboard**: View all created demos with (currently mocked) analytics.
*   **AI-Powered Descriptions**: Leverage Genkit to generate tour descriptions.
*   **Responsive UI**: Built with ShadCN UI components and Tailwind CSS.

## Tech Stack

*   **Frontend**: Next.js (App Router), React, TypeScript
*   **Styling**: Tailwind CSS, ShadCN UI
*   **State Management**: Zustand
*   **Forms**: React Hook Form, Zod for validation
*   **Backend (Firebase)**:
    *   Firebase Authentication for user management.
    *   Firebase Storage for storing screen recordings and other media.
    *   (Cloud Firestore can be integrated for persistent tour data storage).
*   **Generative AI**: Genkit with Google AI (e.g., Gemini).

## Getting Started

1.  **Firebase Setup**:
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Add a Web app to your Firebase project.
    *   Copy the Firebase configuration object.
    *   Update `src/lib/firebase/client.ts` with your project's Firebase config, especially ensure you replace `"YOUR_WEB_APP_ID_HERE"` with your actual Web App ID.
    *   Enable Firebase Authentication (Email/Password provider).
    *   Enable Firebase Storage. Set up Storage security rules as needed (e.g., allow authenticated users to write to their own paths).

2.  **Environment Variables**:
    *   If using Genkit with paid Google AI features, you might need to set `GOOGLE_API_KEY` in a `.env` file (though the default setup uses free-tier compatible models).

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Run Development Server**:
    *   For Next.js app:
        ```bash
        npm run dev
        ```
    *   For Genkit flows (if you're actively developing/testing them):
        ```bash
        npm run genkit:dev
        ```
    Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) to view the app.

## Project Structure

*   `src/app/`: Next.js App Router pages and layouts.
*   `src/components/`: Reusable UI components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/auth/`: Authentication related components.
    *   `src/components/dashboard/`: Dashboard specific components.
    *   `src/components/layout/`: Layout components like the sidebar.
    *   `src/components/tours/`: Components related to tour creation and viewing.
*   `src/contexts/`: React context providers (e.g., `AuthContext`).
*   `src/hooks/`: Custom React hooks (e.g., `useTourStore`, `useToast`).
*   `src/lib/`: Utility functions, Firebase setup, type definitions.
    *   `src/lib/firebase/`: Firebase client initialization.
*   `src/ai/`: Genkit related files.
    *   `src/ai/flows/`: Genkit flow definitions.
*   `public/`: Static assets.

## Building for Production

```bash
npm run build
```

## Deployment

This project is set up for Next.js and can be deployed to various platforms like:

*   **Firebase App Hosting**: `apphosting.yaml` is present.
*   **Vercel**: Recommended for Next.js projects.
*   **Other Node.js hosting platforms**: (Netlify, Render, Railway, etc.)

Refer to the `Dockerfile` for container-based deployments. The CI workflow in `.github/workflows/main.yml` provides a starting point for automated builds.
