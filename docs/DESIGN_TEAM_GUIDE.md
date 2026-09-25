# Design Team Quickstart & Testing Guide

This guide explains how the design and frontend team can run the application locally and test UI/page designs using **Test Mode**, without needing a MongoDB database, email service, or Google Client ID.

---

## 1. Quick Setup

1. Make sure you are on the `feature/test-mode-and-landing-fix` branch.
2. Ensure dependencies are installed for both the backend and frontend:
   ```bash
   npm --prefix apps/api install
   npm --prefix apps/web install
   ```

3. Ensure `.env` exists in the project root directory with `TEST_MODE=true` and `VITE_TEST_MODE=true`:
   ```env
   TEST_MODE=true
   VITE_TEST_MODE=true
   NODE_ENV=development
   PORT=5000
   VITE_API_BASE=/api
   ```

---

## 2. Running the Application

In two separate terminal windows (or tabs):

**Terminal 1 (Backend API in Test Mode):**
```bash
TEST_MODE=true npm --prefix apps/api start
```

**Terminal 2 (Frontend Web Server):**
```bash
npm --prefix apps/web run dev
```

The app will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 3. How to Log In as "Tester"

1. **Landing Page:**
   - Open `http://localhost:3000` in your browser.
   - You will see the **Landing Page** with the **ACCESS CODE** input box in the center.
   - Type **any code** (e.g. `1234` or `test`) into the input field and click **Enter**.

2. **Login Page (`/enter`):**
   - You will be transitioned to the **Login Page**.
   - Enter **any email** (e.g. `tester@example.com`) and **any password**.
   - Click **Log in**.

3. **Logged In as Tester:**
   - You will instantly be logged in as user **`Tester`** sorted into house **`rimeguard`**.
   - You can now freely navigate to Onboarding, Dashboard, Modules, Account pages, and inspect all UI components and styling!

---

## 4. Resetting Test Session / Logging Out

- Click the **Log out** button in the top header.
- This will clear your test session and return you to the Landing Page.
