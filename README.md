# Common Ground

A mobile-first dating and community website for adults (18+) who want to meet people who think like them. Built from the Beyond Belief code: one `index.html` page, a Supabase backend, hosted free on GitHub Pages.

---

## 1. For members

### Account
- **Join / sign in** with email and password, or **Continue with Google** (needs Google set up).
- **18+ confirmation** tick box before joining. Profiles under 18 are refused.
- **Forgot password:** emails a reset link, then shows a "Set a new password" box.
- **Sign out**, and **Delete my account** (permanently removes profile, photos, messages and voice notes).

### Profile
- Up to **4 photos**. Tap a photo to make it the main one. Photos are resized before upload to save space.
- **Basics:** display name, username (required, used for search), age, "I am", "Interested in", city.
- **About you:** worldview, looking for, work, education, drinks, smokes, kids, languages, interests, about me, a question you love to talk about, green flags, dealbreakers.
- **More about you (optional):** pronouns, height, raised as, how open I am about my beliefs, love language, ideal weekend, exercise, pets, currently into, ideal first date, a hot take, two truths and a lie.
- **Privacy options:**
  - *Hide my worldview until we match* (also hides "raised as" and "how open I am").
  - *Blur my photos until we match.*
  - These control what the app shows to people you have not matched with. They are not a database-level lock.

### Finding people
- **Discover:** browse profiles one at a time with a compatibility percentage. **Spark** (heart) to show interest, or **Pass** to skip.
- **Search:** find a member by username.
- **Matches:** when two members Spark each other it is a match, and the person appears under **Chats**.
- Only matched members can message or call each other. Blocked members cannot.

### Private chats (end-to-end encrypted)
- **Text messages and voice notes** (up to 3 minutes). Cancel a recording before sending.
- **Delete** your own messages and voice notes. They are removed for both people.
- **Voice calls** between matched members (live, device to device).
- **Block** a member, or **Report** them. When reporting you can choose to include recent messages as evidence.
- **Chat passphrase:** created once (10+ characters). It locks your messages so only you and the other person can read them.
  - On a new phone, sign in and enter the passphrase to unlock old chats.
  - **Recovery file:** download a backup copy of your key, which still needs the passphrase.
  - **Start fresh** creates a new key, but old messages become unreadable forever.
  - Nobody, including the site owner, can recover a forgotten passphrase.

### Groups
- **Create a group** (any member, up to 10 owned): **Public** (anyone can find and join) or **Private** (invite code only, hidden from the list).
- **Join** a public group from the list, or a private one with its 8-character code.
- **Group chat:** text and voice notes (up to 3 minutes), delete your own messages.
- **Members & info:** member list, description, invite code with **Copy code**, **Leave group**.
- **Group owners** can also: remove members, remove anyone's message, make a **New code** (the old one stops working), and **Delete group**.
- Group messages are **not end-to-end encrypted**. Everyone in the group can read them, and so can the site owner.

### Notifications (while the site is open)
- Red **unread badges** on the Chats and Groups tabs, a short **sound**, a **pop-up** for new messages, and a count in the browser tab title.
- **Turn on alerts** on the Groups screen enables system alerts when the site is open in the background (Android with `sw.js`; iPhone needs "Add to Home Screen").
- Private chat alerts never show the message text.
- Alerts do **not** arrive once the site or browser is fully closed.

### Safety and legal
- **Privacy & Rules** page, linked from the sign-in screen.
- Block and Report tools, 18+ rule, community rules (no harassment, hate, scams or nudity).

---

## 2. For admins

An admin is a member whose user id is in the `admins` table.

### What an admin can do in the app
- **Admin button** (top of the page) opens the **Reports** screen.
- See the latest reports: who reported, who was reported, the reason, and any evidence the reporter chose to share.
- **Dismiss** a report once reviewed.
- **Remove a member** (deletes their account and data).

### What an admin can do behind the scenes (no screen yet)
- Delete any group, remove any group member, delete any group message.

### Making someone an admin
Run in the Supabase SQL Editor, using their sign-up email:

    insert into public.admins (user_id)
    select id from auth.users where email = 'name@example.com'
    on conflict do nothing;

### Where admins look in Supabase
- **Authentication → Users:** everyone who joined.
- **Table Editor:** profiles, reports, groups and the rest.
- **Settings → Usage:** storage and data use against the plan limits.

### What admins cannot see
- The **content of private messages and voice notes**. They are locked on the members' phones.
- Admins **can** see who messaged whom and when, profile details, and all group messages.

---

## 3. Setup files

| File | Purpose |
|---|---|
| `index.html` | The whole website |
| `sw.js` | Lets alerts show on Android |
| `supabase.js` | Connects to Supabase (put the project URL and publishable key in rows 5 and 6) |
| `base-setup.sql` | Core tables, rules and voice-notes bucket |
| `chat-keys-setup.sql` | Chat key backups |
| `extras-setup.sql` | Extra profile fields |
| `admin-and-check.sql` | Admin table (edit the email first) |
| `fix-profile-columns.sql` | Profile columns |
| `fix-missing.sql` | Photos, delete account, admin remove, report evidence |
| `chat-delete-policies.sql` | Delete your own messages and voice notes |
| `groups-setup.sql` | Groups, group chat, group voice, live updates |

Run the SQL files in the order above, each in a new query. All are safe to run more than once.

After deploying: in Supabase go to Authentication → URL Configuration and set the Site URL and Redirect URL to your site address.

---

## 4. Known limits

- **Free Supabase plan:** the project pauses after a week of no use, 1 GB file storage, 5 GB data out per month, no backups. Upgrade to Pro when you open to the public.
- **Alerts** work only while the site is open. True push alerts for a closed app need a push server.
- **Calls** use a public STUN server only. On many mobile networks a TURN server is needed for reliable calls.
- **Hide until match** is enforced by the page, not the database.
- **Discover** loads up to 100 profiles at a time.
- **Reporting a group message** has no button yet. Owners and admins can remove content.
- **Free email limits:** Supabase's built-in email sends only a few messages per hour (sign-up confirmation and password reset).
