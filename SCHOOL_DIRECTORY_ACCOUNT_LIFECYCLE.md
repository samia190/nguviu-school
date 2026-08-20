# Verified School Directory and Account Lifecycle

## Purpose

The school directory is now the authority for **who may have an account**. The public site, navigation, and portal layout remain unchanged; the control is applied inside the existing administrator, sign-up, sign-in, password-recovery, Excel-import, and results workflows.

## Required administrator workflow

| Step | Administrator action | System effect |
| --- | --- | --- |
| 1. Register a school record | Import an account workbook, including each student’s admission number, curriculum, grade/form, class, and stream; include a staff ID for teachers and staff. | The system creates a verified directory record. No person can sign in yet. |
| 2. Check placement | Open **School Directory** in the Administrator Dashboard. | The dashboard shows whole-school totals, totals by curriculum/grade/form, class, stream, account state, and personnel role. |
| 3. Share activation | The account import sends a single-use activation link to the verified school email. | The recipient sets a strong password. The link expires after 72 hours and cannot be reused. |
| 4. Activate and sign in | The person uses the link, then signs in using a school email, student admission number, or teacher/staff ID. | The system activates the linked directory record and permits the appropriate portal only. |
| 5. Reset a password | The user supplies any approved identifier. | A reset link is sent only to the verified directory email; no record-existence detail is revealed. |
| 6. Reissue activation safely | In **School Directory**, select **Reissue link** for an unactivated, unlocked record. | All earlier unused links for that identity are revoked; a new 72-hour link is sent only to the registered school email and the action is audited. |

> A student, teacher, staff member, or administrator with no matching directory record cannot create an account or access a school portal. They must contact the school administration.

## Student placement and results safeguards

Each student directory record has a curriculum, grade/form, class, and stream. A results workbook must include the student’s admission number, class, stream, and curriculum. Before staging, the system compares all four values to the **verified directory record**. A result is rejected if the admission number is unknown, the record is inactive, or the class, stream, or curriculum differs.

Results may be uploaded before the recipient activates their school account. Once the student activates the account, published records are found through the matching admission number and remain visible only to that authenticated student.

## Existing accounts before release

Before enforcing this release against live users, backfill existing school accounts into the new directory once:

```bash
cd kscbackend
node scripts/backfill-directory-identities.mjs
```

Run this against a production backup or staging database first. Review the output and the **School Directory** dashboard before release. The script does not create or reset passwords; it links existing active accounts to directory records.

## Optional sign-in methods

Email-link recovery, admission-number sign-in, staff-ID sign-in, and approved-phone lookup are implemented. **Google sign-in and SMS OTP are intentionally not enabled without a school-controlled Google OAuth application and SMS provider credentials.** The application starts with those methods disabled. It refuses to start in production if either feature flag is enabled without its complete set of required credentials.

| Optional method | Required configuration before enabling | Directory rule that remains mandatory |
| --- | --- | --- |
| Google sign-in | `ENABLE_GOOGLE_SIGN_IN=true`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI` | The verified Google email must map to an active directory identity; no new school account may be created solely from Google. |
| Phone OTP | `ENABLE_PHONE_OTP=true`, `SMS_OTP_PROVIDER`, `SMS_API_URL`, `SMS_API_KEY`, and `SMS_FROM` | The submitted phone must first map to an active, approved directory identity; OTP must not reveal whether any record exists. |

The current release exposes only safe configuration status for these providers. It does not activate either provider or send SMS without the school selecting a provider and supplying its production credentials.
