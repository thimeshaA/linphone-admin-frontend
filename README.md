# Telco Command Console

Build a polished, production-quality **responsive web admin panel** for managing **SIP accounts** and, eventually, **eSIM accounts**, on top of a Flexisip-based telephony infrastructure.

This is a **frontend-only prototype for now**. Use realistic mock data and simulated interactions so every flow can be evaluated without a backend. Do not build a generic SaaS dashboard. The result should feel like a deliberate, high-end **telephony operations command center**: focused, restrained, information-dense where appropriate, and extremely clear.

## 1. Core product model

There are four access states:

### Admin

* Full access to everything.
* Can access both SIP and eSIM modules.
* Can view/manage all accounts.
* Can see who created each account.
* Can create, renew, disable, and delete SIP accounts.
* Can access the approval queue for incoming requests.
* Delete is admin-only and intentionally harder to reach than other actions.

### Reseller

* Can only access modules they have been approved for.
* Within an approved module, they can only see and manage accounts **they themselves created**.
* They should never see another reseller's accounts.
* If they do not have access to a module, they should see a locked module preview rather than the actual dashboard.

### End-user

* Represents an existing SIP/eSIM account holder.
* Logs in using their **existing account credentials**.
* There is **no end-user signup flow**.
* After login, they **skip the module hub entirely**.
* They land directly on a minimal, read-only account status view.
* Show only their own account information.
* No account list, creation, renewal, disable, delete, reseller, or admin functionality.

### Anonymous visitor

* Does not need to log in to submit a request.
* Can access the public request form.
* Requests enter the same admin approval queue.

---

# 2. Overall information architecture

Design the application around these primary experiences:

1. Public request form
2. Login
3. Module hub
4. Admin approval queue
5. SIP account dashboard
6. End-user account view
7. Locked module preview
8. Account create flow
9. Account renew flow
10. Account disable flow
11. Account delete flow
12. Theme switching
13. Responsive/mobile navigation

The exact implementation can use reusable components, but do not flatten these experiences into one generic dashboard.

---

# 3. PUBLIC REQUEST FLOW

Create a polished public page accessible without authentication.

The visitor first chooses:

### Request type

* Become a reseller
* Request an account

Then chooses:

### Module

* SIP
* eSIM

The form should dynamically adapt based on the selected request type.

### Reseller request fields

Include realistic fields such as:

* Full name
* Business/company name
* Email
* Phone number
* Country
* Website
* Requested module
* Business description / reason for becoming a reseller
* Optional additional note

### Account request fields

Include:

* Full name
* Email
* Phone number
* Requested module
* Optional note

Do not make this feel like a bare HTML form.

Use:

* Clear section hierarchy
* Helpful field labels
* Concise descriptions
* Proper required/optional indicators
* Inline validation
* Accessible error messaging
* Appropriate input types
* Clear primary submit action
* Loading state during submission
* Success confirmation after submission
* Error/retry state if submission fails

After successful submission, show a polished confirmation state explaining that the request has been submitted for review.

The visitor should be able to easily return to the login page.

---

# 4. LOGIN

Create **one shared login experience** for Admin, Reseller, and End-user.

Do NOT create separate login pages by role.

The backend would resolve the role after authentication.

The UI should communicate that one account system supports different access levels without forcing users to understand the underlying architecture.

Include:

* Identifier/username/email field as appropriate
* Password field
* Show/hide password
* Remember-me option if appropriate
* Sign in button
* Loading state
* Invalid credential state
* General authentication error state
* Link to the public request flow for users who need an account

Important:

* End-users authenticate using their existing SIP credentials.
* Do not show an end-user signup option.
* Do not imply that end-users can create accounts themselves.

The login page should feel consistent with the command-center visual language but can be more focused and spacious than the authenticated dashboard.

---

# 5. MODULE HUB

After login:

* Admin → module hub
* Reseller → module hub
* End-user → SKIP module hub and go directly to their account view

The hub should contain two strong module cards:

## SIP Account Panel

This is active.

Show:

* SIP icon/visual identity
* Short description
* Account count relevant to the current role
* Small contextual status information
* Clear "Open panel" interaction when accessible

## eSIM Panel

Currently unavailable.

This card should behave differently depending on access:

### If the user has access

Open the eSIM dashboard placeholder.

### If the user does not have access

Show a **locked preview**, not a disabled-looking dead card.

The locked preview should communicate:

* eSIM management is available but access is not currently enabled
* Why access is restricted
* "Request access" CTA
* CTA links to the public request form

For the current prototype, eSIM can remain a "Coming Soon" / restricted module while still feeling intentionally designed.

The hub should visually communicate module availability without making inaccessible modules look broken.

Use subtle motion:

* Smooth card hover/press feedback
* Small icon or status transitions
* Subtle Aceternity UI effects
* Avoid excessive animation

---

# 6. AUTHENTICATED ADMIN / RESELLER SHELL

Create a reusable responsive application shell.

Desktop:

* Left sidebar navigation
* Brand/logo area
* Module navigation
* Approval Queue where applicable
* User/account area
* Theme toggle
* Logout

The sidebar should be compact and purposeful, not oversized.

Suggested navigation:

* Overview / Modules
* SIP Accounts
* Approvals — Admin only
* eSIM — when relevant
* Settings only if genuinely useful; do not invent unnecessary product functionality

### Mobile behavior

Do NOT simply shrink the desktop sidebar.

On mobile:

* Replace the sidebar with a **bottom tab bar**
* Keep the most important destinations accessible
* Use concise icons + labels
* Ensure safe spacing around the bottom navigation
* Keep secondary actions inside menus/drawers
* Preserve the same information architecture

The UI must work naturally at mobile browser widths.

---

# 7. ADMIN APPROVAL QUEUE

Create a dedicated approval queue for Admin users.

This is a core workflow and should not be treated as an afterthought.

Show a realistic list of pending requests containing both:

### Reseller applications

and

### Account requests

Each row/card should clearly communicate:

* Request type
* Requested module
* Applicant name
* Email/contact information
* Submitted date
* Current state
* Relevant contextual details

Use visually distinct but restrained request-type indicators.

Provide:

* Search
* Filters
* Request type filter
* Module filter
* Status filter
* Sorting where useful

Actions:

* Review
* Approve
* Reject

Approval/rejection should use confirmation dialogs where appropriate.

For rejection, consider a reason field so the interaction feels realistic.

Include realistic states:

* Pending requests
* Empty queue
* Loading
* Error
* Successful approval
* Successful rejection

After an action, update the mock UI state rather than simply showing a toast and leaving the list unchanged.

---

# 8. SIP ACCOUNT DASHBOARD

This is the primary operational screen.

Design it as an actual management workspace rather than a CRUD table.

At the top, create a concise overview section with meaningful stats such as:

* Total accounts
* Active
* Expiring soon
* Disabled / expired

Use large bold numbers.

Animate number changes with subtle count-up motion using Aceternity UI where appropriate.

Do not turn every metric into a giant colorful card.

Below the overview, create the account management area.

## Account table

Include realistic mock accounts with fields such as:

* Account / SIP identifier
* Display name
* Status
* Expiry date
* Created date
* Created by — **Admin only**
* Actions

For Resellers:

* Only show accounts created by the current reseller.
* Do not show the "Created by" column.

For Admin:

* Show all accounts.
* Show "Created by".

Use:

* Search
* Status filters
* Expiry filters
* Sorting
* Pagination or a sensible scalable table pattern

The table should remain usable on mobile.

On smaller screens, transform rows into compact account cards or a responsive stacked layout rather than forcing users to horizontally scroll through an unusable desktop table.

---

# 9. SIP ACCOUNT STATUS MODEL

Use these concepts consistently:

### Active

Positive/healthy state.

Use:

* Orange-tinted status background
* Orange status text
* Orange accent only where useful

### Disabled / Expired

Negative/inactive state.

Use:

* Muted red-tinted background
* Red text

IMPORTANT:
Do not represent disabled/expired as a dimmed version of orange.

The user must immediately understand:

**Orange = active/positive**
**Red = disabled/expired/problem**

Avoid excessive use of color elsewhere.

---

# 10. CREATE ACCOUNT

Create a polished create-account flow.

Use a modal/drawer/page depending on what produces the best UX, but prioritize usability.

Include realistic fields such as:

* SIP username/account identifier
* Display name
* Contact/email if relevant
* Expiry date
* Optional notes

The UI should make it clear what will happen after creation.

Include:

* Validation
* Required fields
* Loading state
* Success state
* Error state
* Cancel action

After successful creation, update the mock account list.

Do not make the form feel like an arbitrary database CRUD form.

---

# 11. RENEW ACCOUNT

Renewal is a normal operational action.

Allow the administrator/reseller to select **any custom expiry date**.

Do not restrict the UI to arbitrary preset durations such as:

* 30 days
* 90 days
* 1 year

A custom date picker is required.

Show the current expiry date and the new selected expiry date clearly.

Make the distinction obvious:

Current expiry → New expiry

After confirmation:

* Update the mock data
* Update the account status
* Update the expiry date in the table
* Show a concise success confirmation

---

# 12. DISABLE ACCOUNT

Disable is a **pause/deactivation** action, not deletion.

This distinction is extremely important.

The UI should visually and conceptually communicate:

**Disable = account remains in the system but is inactive**

Use a confirmation dialog.

Clearly explain what disabling does.

After disabling:

* Status becomes Disabled
* Account remains visible
* It can potentially be re-enabled later if appropriate
* No destructive language should imply deletion

If useful, provide an Enable/Reactivate action for disabled accounts.

---

# 13. DELETE ACCOUNT

Delete is fundamentally different from disable.

Rules:

* Admin only
* More difficult to reach
* Never make Delete a prominent primary action
* Place it inside an overflow / "More actions" menu
* Require a strong confirmation dialog
* Clearly explain that deletion is destructive/permanent
* Consider requiring the account identifier to be typed for confirmation

Do not make deletion one accidental click away.

The UI hierarchy should communicate:

**Renew / Manage → normal**
**Disable → caution**
**Delete → destructive and exceptional**

After deletion, update the mock list and show a clear confirmation.

---

# 14. END-USER EXPERIENCE

This is intentionally minimal.

When an end-user logs in:

* Skip the module hub
* Skip the admin/reseller navigation
* Do not show an account table
* Do not show management actions

Instead show a focused account status card.

Include only information relevant to their own account:

* Account identifier
* Current status
* Expiry date
* Disabled state if applicable
* Simple explanatory message

Examples:

Active:
"Your account is active."

Expiring:
"Your account expires soon."

Disabled:
"Your account is currently disabled."

Expired:
"Your account has expired."

Do not expose:

* Other accounts
* Created-by information
* Admin actions
* Reseller functionality
* Approval queue
* Account creation
* Delete functionality

The end-user experience should feel trustworthy and calm rather than like a stripped-down admin dashboard.

---

# 15. VISUAL DESIGN SYSTEM

The visual direction is already decided. Follow it strictly.

## Light theme

Page:

* #EFEFEF

Card/surface:

* #FFFFFF
* #DDDDDD where secondary surfaces are needed

## Dark theme

Page:

* #121212

Cards:

* #202020

## Accent

Use exactly one primary accent:

**Orange: #F2651E**

Use orange sparingly for:

* Primary buttons
* Active navigation
* Important stat numbers
* Progress/status indicators
* Selected states
* Small highlights
* Focused visual emphasis

NEVER use orange as a giant page background or large decorative fill.

The design should remain visually sophisticated even when orange is absent.

## Negative status

Disabled/expired:

* Muted red-tinted background
* Red text

Do not use orange for negative states.

## Cards

* Rounded corners: approximately 16–20px
* No visible borders
* No gradients
* No heavy shadows
* Flat, refined surfaces
* Strong spacing and typography should establish hierarchy

Avoid the "every element is a card" problem.

Not every piece of information needs a container.

---

# 16. TYPOGRAPHY

Use a strong modern sans-serif for the primary UI.

Key statistics:

* Bold
* Oversized
* High visual impact

Small metadata:

* Uppercase
* Letter-spaced
* Monospace or condensed font treatment

Body/table content:

* Clean regular sans-serif
* Highly readable
* Good line-height

Create a clear hierarchy between:

* Page title
* Section title
* Statistic
* Metadata
* Body
* Table labels
* Secondary information

Do not make everything bold.

---

# 17. COMMAND CENTER AESTHETIC

The visual reference is:

**A focused operations command center / analytics console.**

It should feel:

* Precise
* Technical
* Calm
* Modern
* Premium
* Operational
* Information-aware

It should NOT feel:

* Like a generic SaaS template
* Like a CRM
* Like a marketing dashboard
* Like a colorful startup admin panel
* Like a collection of random cards

Avoid:

* Excessive gradients
* Glassmorphism
* Huge hero illustrations
* Stock imagery
* Decorative blobs
* Excessive glow
* Rainbow status colors
* Excessive rounded UI elements
* Generic dashboard illustrations

Use whitespace intentionally, but do not create excessive empty space that makes an operational dashboard inefficient.

---

# 18. MOTION AND INTERACTION

Use **Aceternity UI** selectively.

Motion should communicate hierarchy and state rather than exist for decoration.

Good examples:

* Subtle page transitions
* Smooth module-card hover states
* Number count-up for key dashboard stats
* Small glow/pulse around active progress/status indicators
* Smooth opening/closing of dialogs and drawers
* Subtle press feedback on buttons
* Table/filter transitions
* Smooth theme transition

Avoid:

* Constant animations
* Large animated backgrounds
* Distracting particle effects
* Excessive parallax
* Animation that slows down operational workflows

Respect `prefers-reduced-motion`.

---

# 19. THEME TOGGLE

Implement a polished light/dark theme toggle.

It must:

* Work across the entire application
* Have a clear accessible label
* Provide visible state
* Transition smoothly
* Maintain strong contrast in both themes
* Avoid flashing or visually jarring changes

The design should feel equally intentional in light and dark mode.

Do not simply invert colors.

Review every surface, status pill, input, table, modal, dropdown, and navigation state in both themes.

---

# 20. ACCESSIBILITY

Treat accessibility as a core product requirement.

Ensure:

* WCAG-conscious contrast in both themes
* Visible keyboard focus states
* Proper semantic HTML
* Accessible buttons and links
* Proper labels for inputs
* Clear error messages
* Keyboard-accessible dialogs/dropdowns
* Appropriate ARIA attributes where needed
* Do not rely on color alone to communicate status
* Status pills should include text, not only color
* Touch targets should be comfortably sized on mobile
* Focus should remain sensible when dialogs open/close
* Tables should have proper semantics
* Forms should be navigable logically with keyboard
* Reduced-motion preference should be respected

Do not sacrifice accessibility for the aesthetic.

---

# 21. RESPONSIVE UX

Design mobile-first, but optimize especially well for desktop browsers.

Desktop:

* Spacious command-center layout
* Sidebar
* Efficient data tables
* Multi-column layouts where useful

Tablet:

* Collapse secondary navigation
* Adapt table density
* Preserve hierarchy

Mobile:

* Bottom tab navigation
* Cards instead of dense tables where appropriate
* Stacked forms
* Full-width primary actions
* Bottom sheets/drawers for contextual actions where appropriate
* Never allow important actions to become tiny or difficult to tap
* Maintain readable spacing
* Keep account status immediately understandable

Do not merely make the desktop design narrower.

Actually redesign information presentation for smaller screens.

---

# 22. LOADING, EMPTY, ERROR AND SUCCESS STATES

Every major flow must have intentional states.

Create realistic designs for:

### Loading

* Skeletons for dashboard stats
* Table row skeletons
* Button loading states
* Form submission states

Do not use a generic full-screen spinner for everything.

### Empty

Examples:

* No SIP accounts yet
* No search results
* No pending approvals
* No requests found
* No disabled accounts

Each empty state should explain what is happening and, when appropriate, provide the next useful action.

### Error

Examples:

* Failed to load accounts
* Failed to submit request
* Authentication failure
* Failed approval action

Errors should be understandable and actionable.

### Success

Use restrained toast/confirmation feedback and update the underlying UI state.

Do not rely only on a toast for important operations.

---

# 23. REALISTIC MOCK DATA

The prototype must be fully usable without a backend.

Create realistic mock data for:

### Users

Include examples of:

* Admin
* SIP reseller
* eSIM reseller
* Reseller with access to both modules
* End-user

### SIP accounts

Create at least 10–15 realistic accounts with a mix of:

* Active
* Expiring soon
* Disabled
* Expired

Include realistic:

* SIP identifiers
* Names
* Dates
* Created-by users
* Statuses

### Pending requests

Include a realistic mixture of:

* Reseller applications
* SIP account requests
* eSIM account requests

Use believable names, companies, emails, dates, and notes.

Do not use repetitive "John Doe / [test@example.com](mailto:test@example.com)" placeholder data everywhere.

The UI should look convincing immediately after loading.

---

# 24. ROLE SIMULATION

Since there is no backend yet, provide a simple development/demo mechanism for switching between mock roles.

For example, a small development-only role selector or mock login credentials can allow evaluation of:

* Admin
* SIP reseller
* Reseller with restricted module access
* End-user

This is only for prototype evaluation and should be clearly distinguishable from the real production authentication flow.

The UI must change according to role.

Demonstrate the access rules rather than simply displaying every feature to everyone.

---

# 25. COMPONENT ARCHITECTURE

Use:

* Next.js App Router
* Tailwind CSS
* shadcn/ui for structural primitives
* Aceternity UI for appropriate motion/visual interactions

Build reusable components for:

* App shell
* Sidebar
* Mobile bottom navigation
* Module cards
* Stat blocks
* Status pills
* Tables
* Account cards
* Filters
* Search
* Dialogs
* Confirmation dialogs
* Date picker
* Form fields
* Toasts
* Empty states
* Loading skeletons
* Error states

Keep styling consistent through reusable design tokens/components rather than duplicating arbitrary styles.

---

# 26. IMPORTANT UX RULES

Follow these principles throughout the entire product:

1. **Hierarchy over decoration.**
   Important information should be immediately obvious.

2. **Actions should have consequences reflected in the UI.**
   If an account is disabled, the table/card should actually change.

3. **Never confuse disable with delete.**
   They are different concepts and must look and behave differently.

4. **Respect role boundaries.**
   Do not merely hide text; structure the UI so unauthorized functionality is genuinely absent.

5. **Don't overload the user with orange.**
   Orange is a signal, not the default UI color.

6. **Don't make every section a card.**
   Use grouping, whitespace, typography, and alignment as hierarchy tools.

7. **Don't use generic dashboard patterns blindly.**
   Design around the actual operational workflows.

8. **Every destructive action should feel destructive.**
   Especially account deletion.

9. **Every important state needs feedback.**
   Loading, success, failure, empty, disabled, active, expired.

10. **Mobile should be a first-class experience.**
    Do not simply compress desktop layouts.

11. **Admin sees breadth; reseller sees scope; end-user sees only themselves.**
    This principle should be reflected visually and structurally.

---

# 27. EXPECTED SCREENS

Build enough of the application to demonstrate the complete product experience:

### Public

* Public request landing/form
* Reseller request form
* Account request form
* Submission success state

### Authentication

* Shared login
* Authentication error/loading states

### Admin

* Module hub
* SIP dashboard
* Approval queue
* Create account
* Renew account
* Disable account
* Delete account
* eSIM locked/coming-soon preview

### Reseller

* Module hub
* Approved SIP dashboard
* Restricted/unapproved module preview
* Create/renew/disable flows within their own accounts

### End-user

* Minimal personal account status screen

### System-wide

* Light/dark theme
* Responsive mobile navigation
* Loading states
* Empty states
* Error states
* Success feedback

---

# 28. FINAL QUALITY BAR

Before considering the UI complete, evaluate it as if it were going into production.

Ask:

* Can a new user immediately understand what they can do?
* Is the difference between Admin, Reseller, and End-user obvious through the interface?
* Can an admin process requests quickly?
* Can a reseller manage only their own accounts without confusion?
* Can an end-user understand their account status in seconds?
* Is disable clearly different from delete?
* Does the locked module preview actually encourage requesting access?
* Does the approval queue feel like a real operational workflow?
* Does the SIP dashboard remain usable with 100+ accounts?
* Does the mobile experience feel intentionally designed?
* Does the UI remain equally polished in light and dark mode?
* Is orange used as a deliberate signal rather than decoration?
* Are negative states clearly red rather than muted orange?
* Are loading, empty, error, and success states designed rather than improvised?
* Are keyboard navigation and contrast handled properly?
* Does the result feel like a **focused telephony operations command center rather than a generic SaaS admin template**?

Prioritize **information architecture, role-aware UX, visual hierarchy, accessibility, operational efficiency, and thoughtful interaction design** over simply producing a large number of screens.

The final result should feel cohesive, premium, restrained, and ready to evolve into a real production application.

## Development

Built with **Next.js (App Router)**. You need Node.js — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating) — and [pnpm](https://pnpm.io/installation).

```sh
git clone <this-repository-url>
cd <repository-name>
cp .env.example .env
pnpm install
pnpm dev
```

The dev server proxies `/api/*` to the backend configured via `BACKEND_URL` (see `proxy.ts` and `next.config.mjs`) to avoid CORS during local development. Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm format`.
