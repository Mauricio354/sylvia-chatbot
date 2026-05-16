# Google Calendar Migration Guide for Sylvia

Purpose: fix the slow chatbot booking calendar by switching Cal.com to read from Google Calendar instead of Apple/iCloud Calendar. Sylvia continues using her iPhone Calendar app the same way she does today. Only the backend storage changes.

Estimated time: 20 to 30 minutes in person.

## What Sylvia will need on hand

1. Her iPhone (unlocked, signed into iCloud).
2. Her laptop or a computer with a browser (to set up Google and migrate events).
3. A Google account. If she does not have one, we will create one during the meeting at accounts.google.com. Use an email she will remember and keep long-term. Recommended: sylvia.solis.realtor@gmail.com or similar.
4. Her Cal.com login (email and password, or the magic-link email address).
5. Roughly 20 to 30 minutes of uninterrupted time.

## Step 1: Create or confirm Google account (5 min)

On her laptop:
1. Go to accounts.google.com.
2. If she has a Gmail already, sign in. Otherwise create a new one.
3. Verify the account works by opening calendar.google.com and confirming an empty calendar loads.

Keep this browser tab open, we will come back to it.

## Step 2: Export existing events from iCloud (5 min)

Her appointments currently live in iCloud. We need to move them to Google so historical and future-booked events are all in one place.

On her laptop:
1. Open icloud.com in a browser and sign in with her Apple ID.
2. Click Calendar.
3. On the left sidebar, find her main calendar (often called "Home" or "Calendar").
4. Click the wifi-style "share" icon next to the calendar name.
5. Check "Public Calendar" temporarily. Copy the webcal URL it generates.
6. Open a new tab and paste the URL, but change "webcal://" to "https://" at the start. Press enter. This downloads a .ics file.
7. Important: after downloading, go back to iCloud and UNCHECK "Public Calendar" so her events are private again.

If the public-calendar method makes her uncomfortable, alternative: open Calendar app on her Mac, select each calendar, File menu, Export, save as .ics. Same result.

## Step 3: Import events into Google Calendar (3 min)

On her laptop, in the Google Calendar tab:
1. Click the gear icon (top right), then Settings.
2. Left sidebar: Import & export.
3. Under Import, click "Select file from your computer" and choose the .ics file from step 2.
4. Destination calendar: her main Google Calendar (usually her email address).
5. Click Import. Wait for confirmation ("X events imported").
6. Go back to the main Google Calendar view and scroll through the calendar to confirm her events appear.

## Step 4: Add Google account to her iPhone (3 min)

On her iPhone:
1. Settings app.
2. Scroll down, tap Calendar.
3. Tap Accounts.
4. Tap "Add Account".
5. Choose Google.
6. Sign in with the Google account from step 1.
7. When asked what to sync: turn on Calendars and Contacts (optional: Mail). Leave everything else off.
8. Tap Save.

## Step 5: Set Google as the default calendar on her iPhone (1 min)

This is the critical step. Without it, new events still go to iCloud.

On her iPhone:
1. Settings app.
2. Scroll to Calendar.
3. Tap "Default Calendar".
4. Select her Google Calendar (her Gmail address will be shown).
5. Back out.

Test it: open the Calendar app, tap "+", create a test event called "Test Google". Save. Then on the laptop, refresh Google Calendar. The test event should appear within seconds. If it does, the migration is working. Delete the test event from Google (it will disappear from her iPhone automatically).

## Step 6: Hide the iCloud calendar on her iPhone (optional, 1 min)

To avoid confusion between old iCloud events and new Google events:

On her iPhone:
1. Open the Calendar app.
2. Tap "Calendars" at the bottom.
3. Under the iCloud section, uncheck any calendars that are now duplicated in Google.
4. Leave Google Calendar checked.

Her phone now shows only Google events. Nothing was deleted from iCloud. She can re-enable anytime.

## Step 7: Connect Google Calendar to Cal.com (3 min)

On her laptop:
1. Go to app.cal.com and sign in.
2. Click Apps in the left sidebar.
3. Under Installed, find Apple Calendar. Click the three-dot menu, then Remove.
4. Click "App Store" or "Browse Apps".
5. Find Google Calendar. Click Install.
6. Sign in with the Google account from step 1. Grant permissions.
7. After install, go to Apps and confirm Google Calendar shows as connected.
8. Click the Google Calendar settings gear. Set:
   - "Add events to": her primary Google Calendar.
   - "Check for conflicts in": her primary Google Calendar only. Uncheck anything else.

## Step 8: Test the full booking flow (3 min)

On her laptop, in a private/incognito window:
1. Go to distinctivehomes.net.
2. Open the chat widget.
3. Click "I want to buy", run through the qualification questions.
4. Enter a real contact (use Mauricio's email for testing).
5. Click "Book Your Consultation".
6. The calendar should now load in under 2 seconds. Available slots should show real availability based on her Google Calendar.
7. Book a test slot.
8. Confirm: the event appears in her Google Calendar AND on her iPhone Calendar app (because her iPhone now reads from Google).
9. Cancel the test booking from Google Calendar to clean up.

## What Sylvia notices day-to-day

Nothing changes. She keeps using the Calendar app on her iPhone exactly like today. She taps "+" to add events. She sees reminders. She replies to invites. The only invisible change: her events are stored in Google instead of iCloud. Cal.com reads Google, so bookings are fast.

## If something goes wrong

Problem: test event from iPhone does not appear in Google.
Fix: Check Settings, Calendar, Accounts, Google. Confirm Calendars toggle is ON. Re-set default calendar in step 5.

Problem: Cal.com still slow after migration.
Fix: Confirm in Cal.com, Apps section, that Apple Calendar is removed (not just disconnected, actually uninstalled). Only Google should be connected.

Problem: Sylvia accidentally creates an event and it goes to iCloud.
Fix: She forgot to change default in step 5. Redo step 5. She can move the event manually by opening it in the Calendar app, tapping Calendar, and switching it to her Google Calendar.

Problem: Events are duplicating.
Fix: She has both the imported Google calendar AND her iCloud calendar showing. Do step 6 to hide iCloud.

## Post-migration cleanup (later, no rush)

Once she confirms the new setup works for a week:
1. Optional: delete the imported old events from iCloud to avoid any future sync conflicts. Only do this after confirming Google has them all.
2. Optional: remove iCloud calendar from her iPhone Settings entirely. Not necessary but keeps things clean.

## Summary checklist for the meeting

- [ ] Google account ready
- [ ] iCloud events exported to .ics
- [ ] Events imported into Google Calendar
- [ ] Google account added to iPhone
- [ ] Default calendar set to Google on iPhone
- [ ] iCloud calendar hidden on iPhone (optional)
- [ ] Apple Calendar removed from Cal.com
- [ ] Google Calendar connected to Cal.com
- [ ] Test booking done, completed in under 2 seconds
- [ ] Test event appeared on her phone via Google
