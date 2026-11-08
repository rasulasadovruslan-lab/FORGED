# Forged: what changed

1. Goals are one spreadsheet-style grid: goals = rows, Day 1-30 = columns, checkbox per day. Add as many goals as you want.
2. The site knows the date: today's column is highlighted, future days are locked, page refreshes at midnight, and after day 30 you can start a new 30 days.
3. Today's date sits top-left next to the logo.
4. Clicking the profile icon opens a menu: Profile, Settings, Report, Log out.
5. Safe account deletion in Settings: password + type DELETE, wipes goals/notes/friendships/profile, then deletes the login.
6. Report page (reachable from Settings and the avatar menu): completion, check-ins, cycle day, perfect days, best/weakest goal, per-goal table.
7. Settings has "Reset all settings to default" (plus reset accent).
8. Huge progress ring with a success/fail meter on the Goals page.
9. Better Firebase error messages, listener error handling, and Firestore rules (firestore.rules).

Deploy: push these files to your repo (Vercel redeploys). Publish firestore.rules in the Firebase console. Hard-refresh the site.
