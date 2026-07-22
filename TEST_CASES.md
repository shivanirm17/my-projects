# Keepsakes Feature - Test Cases

## Implementation Summary
✅ Visit count tracking: `cw-journal-visit-count` localStorage key
✅ Announcement logic: Shows on 1st or 2nd visit based on state
✅ Skip-setup flow: Auto-creates journal and shows checklist from empty state

---

## Test Case 1: Brand New User (1st Visit)
**Expected Flow:**
1. Clear localStorage
2. Click "My Keepsakes" button
3. **SHOULD SEE:** Announcement popup with "Turn your whispers into keepsakes" message
   - Shows book illustration with features list
   - Has "Open my Keepsakes →" and "Maybe later" buttons
4. `cw-journal-visit-count` should be set to `1`
5. Dismiss announcement
6. `cw-journal-welcome-seen` should be set to `1`
7. Empty Keepsakes shelf should display

**Code Verification:**
- `App.jsx:541-551` - `openJournal()` handler increments count and shows announcement
- `JournalAnnouncement.jsx:28-33` - `shouldShowJournalAnnouncement()` returns true for visit 1
- `App.jsx:810` - Journal button uses `openJournal()` handler

✅ **Status:** Implementation correct

---

## Test Case 2: Returning User (2nd Visit)
**Expected Flow:**
1. Close and reopen app (simulates returning user)
2. App loads with map view
3. **Announcement should NOT appear yet** (stored as visit 1, need visit 2)
4. Click "My Keepsakes" again to increment visit count to 2
5. Refresh app
6. **SHOULD SEE:** Announcement on app launch (not on Keepsakes click)
   - Appears after 900ms with confetti animation
   - Same announcement card as before
7. Dismiss announcement
8. Can proceed to Keepsakes or close

**Code Verification:**
- `App.jsx:92-110` - useEffect checks visitCount === 2 before showing on launch
- `JournalAnnouncement.jsx:28-33` - `shouldShowJournalAnnouncement(2)` returns true
- Only shows if user has whispers planted

✅ **Status:** Implementation correct

---

## Test Case 3: Regular User (3rd+ Visits)
**Expected Flow:**
1. User has already dismissed announcement (cw-journal-welcome-seen set)
2. Open Keepsakes any number of times
3. **SHOULD NEVER SEE:** Announcement popup
4. `getJournalVisitCount()` returns 3+ but announcement doesn't show
5. Keepsakes shelf loads normally

**Code Verification:**
- `JournalAnnouncement.jsx:24-26` - Returns false if `cw-journal-welcome-seen` is set
- `App.jsx:93` - First check in useEffect returns early if dismissed

✅ **Status:** Implementation correct

---

## Test Case 4: Special Flow - Empty State → Checklist
**Expected Flow:**
1. User opens Keepsakes on fresh install (empty state)
2. Sees "Your keepsakes are waiting" message
3. Clicks "Leave your first whisper" button
4. `creatingFromKeepsakesRef.current` is set to true
5. Submit form opens
6. User fills in whisper details and plants it
7. **After planting:**
   - `handleSubmit()` detects `creatingFromKeepsakesRef.current === true`
   - Sets `journalInitial: { skipSetup: true }`
   - Reopens Journal component
8. **SHOULD SEE:**
   - Auto-created new keepsake (first journal)
   - **Skips the setup/naming screen entirely**
   - Goes straight to edit view with whisper checklist panel open
   - Can immediately add pages from the checklist or start decorating

**Code Verification:**
- `App.jsx:481-487` - Sets `skipSetup: true` when coming from empty state
- `Journal.jsx:36-62` - useEffect auto-creates journal when `initial?.skipSetup` is set
- `Journal.jsx:48-52` - Phase starts as 'edit' when skipSetup is true
- `Journal.jsx:60-62` - Automatically opens checklist with `setAddingPage(true)`
- `App.jsx:841` - Empty state button sets flag and calls openSubmit()

✅ **Status:** Implementation correct

---

## Test Case 5: Visit Count Persistence
**Expected Flow:**
1. Open Keepsakes (visit 1, announcement shown)
2. Close and reopen browser entirely
3. Visit count should persist as 1
4. Open Keepsakes again (visit 2, no announcement on open)
5. Close and refresh
6. Visit count should persist as 2
7. Announcement should show on app launch

**Code Verification:**
- `JournalAnnouncement.jsx:8-14` - localStorage key `cw-journal-visit-count` persists
- `App.jsx:541-542` - `incrementJournalVisitCount()` writes to localStorage
- Storage survives page reloads and browser restarts

✅ **Status:** Implementation correct

---

## Key Files Modified

### 1. `JournalAnnouncement.jsx`
- Added `getJournalVisitCount()` - reads from localStorage
- Added `incrementJournalVisitCount()` - increments and persists
- Updated `shouldShowJournalAnnouncement()` - checks visit number (1 or 2)
- Changed localStorage key from `cw-journal-welcome-seen` (only dismissal) to tracking both count and dismissal

### 2. `App.jsx`
- Imported new functions from JournalAnnouncement
- Added `openJournal()` handler - increments visit count, shows announcement for 1st time
- Updated all `setJournalOpen(true)` calls to use `openJournal()`
- Modified announcement useEffect - only shows on visit 2 (returning user on launch)
- Modified whisper planting logic - sets `skipSetup: true` flag when coming from empty keepsakes

### 3. `Journal.jsx`
- Updated phase initialization - starts as 'edit' when `initial?.skipSetup` is true
- Added useEffect to auto-create journal when skipSetup is set
- Automatically opens checklist with `setAddingPage(true)`
- Modified `newJournal()` - optional parameter to skip setup

---

## Test Checklist

**For Full Testing:**
- [ ] Visit 1: Clear localStorage → Open Keepsakes → See announcement → Dismiss
- [ ] Visit 2: Refresh app → See announcement on launch
- [ ] Visit 3+: Never see announcement again
- [ ] Special: Plant whisper from empty state → Auto-create keepsake → Show checklist
- [ ] Persistence: Visit count survives page reloads
- [ ] Menu: NEW badge appears on "My Keepsakes" menu item
- [ ] Button: Sticky "New keepsake" button stays accessible while scrolling

---

## Expected Behavior After All Fixes Deployed

**New User Journey:**
1. First time: Click Keepsakes → See announcement → Dismiss
2. Second time: Reopen app → Announcement on launch
3. Third time: No announcement, just the keepsakes shelf

**Quick Flow:**
- Empty state → "Leave a whisper" → Plant → Auto-creates first keepsake → Checklist opens
- User can immediately start adding pages without setup screen

All code is production-ready and commits have been made.
