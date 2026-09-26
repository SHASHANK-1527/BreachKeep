# Page 2 Design Specification 

**1. General Layout & Background**
*   **Background Visual:** An interior view of a gothic-style hall or castle. Stone pillars line the sides, flanked by lit candles on tall candelabras. 
*   **Focal Point:** The center of the background features a large, glowing, swirling yellow and orange magical portal. The floor is highly reflective, mirroring the portal's bright light.
*   **Color Palette:** A high-contrast mix of dark, cool purples/blues in the architecture and intense, warm oranges/yellows emanating from the portal.

**2. UI Components**
*   **Central Modal Container:** A large, centered card with rounded corners utilizing a heavy glassmorphism/translucent overlay, resting directly over the visual of the portal.
*   **Heading:** The text "Sign In" is centered at the top of the translucent card. It has a thin, dark underline beneath the text.
*   **Action Button:** A wide, pill-shaped white button is positioned in the center. It contains the Google "G" logo on the left and the text "Continue With Google".

**3. Transition Effects (Frontend)**
*   **Portal Entry Transition:** Upon clicking the "Continue With Google" button (and simulating a successful frontend authentication state), trigger a full-screen video transition. 
*   **Animation Sequence:** The UI modal should fade out completely. The background portal should scale up rapidly, simulating the camera/user flying directly *into* the glowing orange vortex. Once the screen is filled with the portal's light, crossfade into the environment of Page 3.