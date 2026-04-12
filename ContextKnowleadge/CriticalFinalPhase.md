1. Unique email for organizaiont: 
  Email of the organization should be unique and the system should not allow registration with same email. 
   
initially remove exiting records as they are with same email just for the testing purpose.


2. Email configuration:
  - create an eamil lex-box@tdxcode.com, and use the smtp for sending email to clients. Otheriwse use https://mailtrap.io/sending/analytics

The Mailtrap sandbox is working perfectly — that's exactly what it's designed to do (so all emails are in sandbox). It captures all outgoing emails and shows them in the virtual inbox. Emails in the sandbox will never reach a real inbox by design — this is the point of sandbox testing (so you don't accidentally spam real users during development).

Here's the distinction:

Mailtrap product	What it does
Email Testing (Sandbox)	Captures emails into a virtual inbox — no real delivery
Email Sending	Actually delivers to real inboxes — requires domain verification
Your current setup is correct for development. The sandbox is working.

When you're ready to send real emails (production), you have two options:

Option A — Mailtrap Email Sending (you already have the account)

Go to Mailtrap → Email Sending → Add & verify domain tdxcode.com
They give you new SMTP credentials (different from sandbox)
Then from=info@tdxcode.com (clients-lexbox@tdxcode.com) will work and emails arrive in real inboxes.



