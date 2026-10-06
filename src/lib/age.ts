/**
 * Age gate: SideQuests is for people 18 and over (see the Terms).
 * People confirm with a checkbox when they sign up and again on their profile
 * if it was never recorded; firestore.rules requires it on every new profile.
 */
let confirmedThisSession = false;

/** Remembers that someone ticked the box on the sign-up form, so profile setup can pre-tick it. */
export function rememberAgeConfirmed() {
  confirmedThisSession = true;
}

export const ageConfirmedThisSession = () => confirmedThisSession;

export const AGE_CONFIRM_LABEL = 'I confirm I’m 18 or older.';
