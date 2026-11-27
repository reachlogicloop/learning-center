# Passcode-only portal (private pilot)
Student login defaults to a single secret-words input. Teacher login is a separate link, also with one secret-words input. No email address or username is entered by either user. Supabase still uses internal Auth identifiers.

Create two confirmed users via Authentication > Users:
- student@learning-center.example
- teacher@learning-center.example

Choose their passwords privately. Use a strong, unique teacher password and avoid shared or guessable student secrets. Disable public signups. Add a profile for each user with the corresponding Auth UUID and correct role. Never put passwords or service-role keys in GitHub. These example aliases are not mailboxes; email password reset will not work.

The client uses only a publishable Supabase key and RLS. This version supports one account per role. For multiple passcode-only students, design a rate-limited server-side account lookup before expansion.

This is a portal-first commit. The 15 lessons are registered in the database but the approved lesson files have not yet been imported. Student dashboard deliberately does not expose broken lesson links. Browser/authentication tests, account provisioning, security review, content licensing and deployment are pending. The repository is private; publishing through GitHub Pages does not automatically make the site private.