# UniTrade

## Run locally

Run `npm install` in `backend` and `frontend`. In separate terminals, run `npm run dev` in each folder and open the Vite URL.

Keep backend settings in your ignored `backend/.env` and use a test MongoDB database. To test password recovery locally, set `NODE_ENV=development` and `MAIL_MODE=outbox`. Reset emails appear as local text files in `backend/.mail-outbox/`. The outbox works in development and test modes and binds the backend to loopback.

For inbox delivery, set `MAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT` (default `587`), `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `backend/.env`. Set `FRONTEND_ORIGIN` to the browser URL if it differs from `http://localhost:5173`. Production requires a public HTTPS URL and an encrypted SMTP connection.

## Check the main flows

1. **Register and log in.** Create an account with a unique email and username and a password of at least 15 characters. Log in with those details. Try a mismatched password or future birth date to check the form messages.
2. **Profile and logout.** Edit your profile and replace your photo, then save and refresh to check that the changes persist. Log out and revisit `/#/profile` to confirm that it redirects to login.
3. **Password reset.** On the login page, select **Forgot password?** and request a code. Open the reset email in the outbox, try a wrong code, then enter the correct code within 10 minutes. Set and confirm a new password. Check that the used code and old password are rejected and that the new password works. Refresh any other signed-in tab to check that the old session has ended.
4. **Login limit.** Use a separate test email and attempt to log in six times within 15 minutes. The sixth attempt should return HTTP `429` with a wait interval. There is also a 30-attempt limit per IP. The limits apply per server process.
5. **Home.** Check the navigation, categories, and listings at desktop and mobile widths. Search, Cart, Favorites, and Sell an item are disabled.
