import type { ReactNode } from 'react';

/*
 * Terms of Service and Privacy Policy.
 *
 * DRAFT: not yet reviewed by a lawyer. While LEGAL_DRAFT is true both pages
 * show a banner saying they are not yet in effect. Fill in every [BRACKETED]
 * value, have them reviewed, set the effective date, then flip LEGAL_DRAFT.
 */
export const LEGAL_DRAFT = true;
const EFFECTIVE_DATE = '[EFFECTIVE DATE]';
const OPERATOR = 'Obasomidotun Ajibola';
const STATE = '[STATE]';
const CONTACT = '[CONTACT EMAIL]';

const H = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="font-display text-2xl md:text-3xl text-white font-semibold mt-12 mb-4 scroll-mt-24">{children}</h2>
);
const P = ({ children }: { children: ReactNode }) => <p className="text-[#CFCFC9] leading-relaxed mb-4">{children}</p>;
const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-6 space-y-2 text-[#CFCFC9] leading-relaxed mb-4 marker:text-brand-volt">{children}</ul>
);
const B = ({ children }: { children: ReactNode }) => <strong className="text-white font-semibold">{children}</strong>;

function Shell({ title, intro, toc, children, onOther, otherLabel }: {
  title: string; intro: ReactNode; toc: [string, string][]; children: ReactNode; onOther: () => void; otherLabel: string;
}) {
  return (
    <article className="max-w-3xl mx-auto py-12 md:py-16">
      {LEGAL_DRAFT && (
        <div role="note" className="mb-8 p-4 rounded-2xl border border-[#FFB547]/40 bg-[#FFB547]/10 text-sm text-[#FFD9A0]">
          <strong className="text-[#FFB547]">Draft, not yet in effect.</strong> This page is being reviewed and does not yet govern your use of SideQuests.
        </div>
      )}
      <span className="font-mono text-xs tracking-[0.18em] text-brand-volt uppercase">Legal</span>
      <h1 className="font-display text-4xl md:text-5xl text-white font-semibold mt-3">{title}</h1>
      <p className="mt-3 text-sm text-brand-text-muted">Effective date: {EFFECTIVE_DATE}</p>
      <div className="mt-8 text-lg text-[#E6E6E0] leading-relaxed">{intro}</div>
      <nav aria-label="On this page" className="mt-8 p-5 rounded-2xl border border-white/10 bg-[#141414]">
        <span className="block text-sm font-semibold text-white mb-3">On this page</span>
        <ol className="sm:columns-2 gap-x-8 text-sm list-decimal pl-5 text-brand-text-muted [&>li]:mb-1.5 [&>li]:break-inside-avoid">
          {toc.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white">{label}</a></li>
          ))}
        </ol>
      </nav>
      {children}
      <div className="mt-14 pt-6 border-t border-white/10 text-sm text-brand-text-muted">
        See also our <button onClick={onOther} className="text-brand-volt hover:underline cursor-pointer">{otherLabel}</button>.
      </div>
    </article>
  );
}

/* ================================================================ TERMS */

export function TermsPage({ onPrivacy }: { onPrivacy: () => void }) {
  const toc: [string, string][] = [
    ['t-about', 'About these terms'],
    ['t-accounts', 'Who can use SideQuests'],
    ['t-role', 'What SideQuests does, and doesn’t do'],
    ['t-quests', 'Quests, applications and contracts'],
    ['t-payments', 'Protected Payments and fees'],
    ['t-offplatform', 'Paying outside SideQuests'],
    ['t-taxes', 'Taxes'],
    ['t-content', 'Your content and the work you deliver'],
    ['t-conduct', 'Rules of conduct'],
    ['t-disputes', 'Disagreements between users'],
    ['t-closing', 'Suspending or closing accounts'],
    ['t-disclaimers', 'Disclaimers'],
    ['t-liability', 'Limits on our liability'],
    ['t-indemnity', 'Your responsibility to us'],
    ['t-changes', 'Changes'],
    ['t-law', 'Governing law'],
    ['t-contact', 'Contact'],
  ];
  return (
    <Shell
      title="Terms of Service"
      toc={toc}
      onOther={onPrivacy}
      otherLabel="Privacy Policy"
      intro={<p>SideQuests connects creatives with people who want to hire them. These terms explain the rules for using SideQuests, how Protected Payments works, and what you and we are each responsible for. Please read them, especially the sections on payments, disputes and our liability.</p>}
    >
      <H id="t-about">1. About these terms</H>
      <P>SideQuests is operated by {OPERATOR}, an individual based in the United States (“SideQuests”, “we”, “us”). These Terms of Service (“Terms”) are an agreement between you and us. By creating an account or using SideQuests, you agree to these Terms and to our <button onClick={onPrivacy} className="text-brand-volt hover:underline cursor-pointer">Privacy Policy</button>. If you don’t agree, please don’t use SideQuests.</P>
      <P>In these Terms, a <B>creative</B> is someone who offers creative services, a <B>gig provider</B> is someone who posts work and hires creatives, a <B>quest</B> is a piece of work a gig provider posts, and a <B>contract</B> is the agreement a gig provider and a creative make on SideQuests when a creative is hired.</P>

      <H id="t-accounts">2. Who can use SideQuests</H>
      <UL>
        <li>You must be at least 18 years old and able to enter into a binding contract.</li>
        <li>Creatives can currently only receive payouts to a US bank account, so a creative who wants to be paid through SideQuests must be able to open a US Stripe account.</li>
        <li>You must give accurate information about yourself and keep it up to date. If you use SideQuests for a business, you confirm you’re allowed to act for that business.</li>
        <li>You’re responsible for everything that happens under your account. Keep your sign-in details secure and tell us straight away if you think someone else has accessed your account.</li>
        <li>One person, one account, unless we agree otherwise.</li>
      </UL>

      <H id="t-role">3. What SideQuests does, and doesn’t do</H>
      <P>SideQuests is a marketplace. We provide the tools for gig providers and creatives to find each other, agree on work and get paid. We are not a party to the agreement between a gig provider and a creative.</P>
      <UL>
        <li><B>We don’t employ creatives.</B> Creatives are independent and decide how, when and where they do the work. Nothing on SideQuests creates an employment, partnership or agency relationship between us and any user, or between users.</li>
        <li><B>We don’t guarantee work, results or quality.</B> We don’t promise that a quest will be filled, that a creative will be hired, or that the work delivered will meet expectations. Each user is responsible for checking who they work with.</li>
        <li><B>Verified badges.</B> A verified badge means our team has reviewed that creative’s identity and portfolio at a point in time. It isn’t a guarantee of their future work or conduct.</li>
        <li><B>Reviews and track record.</B> After a contract is completed, the gig provider and the creative can each review the other within 14 days. Only people on a completed, paid contract can leave a review. Reviews stay hidden until both have been submitted or the 14 days pass, and then appear on profiles. Reviews must be honest and about the work; we may remove reviews that are abusive, fake, include personal information, or try to pressure the other person. Track record figures (such as completed contracts and approval speed) are calculated automatically from activity on SideQuests.</li>
        <li><B>We’re not a bank.</B> Protected Payments is a payment feature of a marketplace. It is not a banking, money transmission or escrow service.</li>
      </UL>

      <H id="t-quests">4. Quests, applications and contracts</H>
      <UL>
        <li>Gig providers must describe quests honestly, including the budget, deadline and what’s required. Quests must be for legal work.</li>
        <li>Creatives apply with a proposal and a price. Applying doesn’t create an obligation for either side.</li>
        <li>When a gig provider hires a creative, a contract is created on SideQuests. The gig provider sets out the milestones (what will be delivered, and what each milestone is worth). The creative can accept the terms or ask for changes. The contract is agreed when the creative accepts.</li>
        <li>The contract, together with these Terms, is the agreement between the gig provider and the creative. If something in a contract conflicts with these Terms, these Terms apply as between you and us.</li>
        <li>Either side can cancel a contract before it has been paid for. Once paid for, cancellation and refunds work as described in section 5.</li>
      </UL>

      <H id="t-payments">5. Protected Payments and fees</H>
      <P><B>How it works.</B> After the creative accepts a contract, the gig provider pays the full contract amount up front. Work starts once that payment has gone through. The money is held in our account with our payment processor, Stripe, and is released to the creative milestone by milestone as the gig provider approves each one.</P>
      <UL>
        <li><B>Our fee.</B> We charge creatives a fee of 3% of the contract total. It’s deducted once, from the final milestone payment; earlier milestones are paid in full. For example, on a $3,000 contract with two $1,500 milestones, the creative receives $1,500 and then $1,410. If a contract ends early, the fee is 3% of the amount released to the creative. Gig providers pay the agreed contract amount and no fee. We cover Stripe’s processing fees out of our fee. We’ll tell you before any change to our fees takes effect, and changes won’t affect contracts that have already been paid for.</li>
        <li><B>Paying.</B> Gig providers can pay by US bank account (ACH) or card. Bank payments can take several business days to clear, and a contract becomes active only once the payment clears. If a payment fails, the contract won’t start and the gig provider can try again.</li>
        <li><B>Submitting and approving work.</B> The creative submits each milestone through the contract. The gig provider then either approves it, which releases that milestone’s money to the creative, or asks for changes. Approval can’t be undone, so gig providers should check the work before approving.</li>
        <li><B>If a gig provider doesn’t respond.</B> If a gig provider hasn’t approved or asked for changes on a submitted milestone within [14] days, we may review the submission and decide whether to release that milestone’s payment to the creative.</li>
        <li><B>Payouts to creatives.</B> To be paid, creatives set up a payout account with Stripe. Released money is sent to the creative’s bank account on Stripe’s payout schedule. We aren’t responsible for delays caused by banks, Stripe or incorrect bank details.</li>
        <li><B>Cancellation and refunds after payment.</B> If a paid-for contract is cancelled, or a gig provider and creative can’t agree, money that hasn’t yet been released for approved milestones can be refunded to the gig provider, released to the creative, or split between them. We decide this case by case, based on what was agreed and delivered and on what both sides tell us. Money released for approved milestones won’t be refunded through SideQuests. Our 3% fee only applies to money released to the creative, so it doesn’t apply to amounts refunded to the gig provider.</li>
        <li><B>Chargebacks and fraud.</B> If a gig provider disputes a payment with their bank or card issuer, or we reasonably suspect fraud, we may hold payments and payouts connected to that contract while we look into it.</li>
        <li><B>Stripe.</B> Payment processing for SideQuests is provided by Stripe. Payment processing services for creatives are provided by Stripe and are subject to the <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="text-brand-volt hover:underline">Stripe Connected Account Agreement</a>, which includes the <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-brand-volt hover:underline">Stripe Terms of Service</a> (together, the “Stripe Services Agreement”). By agreeing to these Terms or continuing to operate as a creative on SideQuests, you agree to be bound by the Stripe Services Agreement, as it may be modified by Stripe from time to time. As a condition of SideQuests enabling payment processing services through Stripe, you agree to provide us with accurate and complete information about you and your business, and you authorize us to share it and transaction information related to your use of the payment processing services provided by Stripe.</li>
      </UL>

      <H id="t-offplatform">6. Paying outside SideQuests</H>
      <P>If you find someone through SideQuests, please pay for that work through SideQuests. Protected Payments only protects money that goes through SideQuests: we can’t help with work that was paid for, or should have been paid for, outside SideQuests. We may suspend accounts that repeatedly move work off SideQuests to avoid our fee.</P>

      <H id="t-taxes">7. Taxes</H>
      <P>Each user is responsible for their own taxes. Creatives are responsible for reporting and paying tax on what they earn. We and Stripe may collect tax information from you and issue tax forms (such as IRS Form 1099) where the law requires it.</P>

      <H id="t-content">8. Your content and the work you deliver</H>
      <UL>
        <li><B>Your content stays yours.</B> You own what you post on SideQuests, such as your profile, portfolio, quests, messages and files.</li>
        <li><B>Permission for us to show it.</B> You give us a non-exclusive, worldwide, royalty-free licence to host, store, copy, display and adapt your content only as needed to run, show and promote SideQuests (for example, showing your public profile on the Creatives page). This licence ends when you delete the content or your account, except for copies we must keep for legal reasons and content you shared with other users, such as messages in a contract.</li>
        <li><B>Work delivered under a contract.</B> Unless the gig provider and creative agree otherwise in writing, the creative keeps ownership of their work until the milestone it belongs to has been paid out. Once it has been paid out, ownership of that milestone’s deliverables passes to the gig provider. The creative can still show the work in their portfolio unless they agreed not to.</li>
        <li><B>You have the rights to what you share.</B> Only post or deliver content you have the right to use. Don’t infringe anyone’s copyright, trademark or other rights. If you think something on SideQuests infringes your rights, contact us at {CONTACT}.</li>
      </UL>

      <H id="t-conduct">9. Rules of conduct</H>
      <P>When using SideQuests, you must not:</P>
      <UL>
        <li>break the law or help anyone else break it, or post quests for illegal work;</li>
        <li>pretend to be someone else, or misrepresent your skills, experience or identity;</li>
        <li>harass, threaten, discriminate against or abuse anyone;</li>
        <li>post sexually explicit content, or anything involving minors in a sexual or harmful way;</li>
        <li>send spam, scams or misleading offers, or ask for payment details or passwords;</li>
        <li>upload viruses or harmful code, or try to access accounts or data that aren’t yours;</li>
        <li>scrape, copy or resell SideQuests data, or interfere with how SideQuests works; or</li>
        <li>use SideQuests to collect other users’ personal information for anything other than the work you’re discussing with them.</li>
      </UL>

      <H id="t-disputes">10. Disagreements between users</H>
      <P>If something goes wrong with a contract, try to sort it out with the other person first, using the contract’s messages. If you can’t, contact us at {CONTACT}. We may help, look at what was agreed and delivered, and decide how unreleased money is handled as described in section 5. We aren’t obliged to resolve disagreements between users, and our decisions about money held on SideQuests don’t stop either side from taking other legal action against the other.</P>

      <H id="t-closing">11. Suspending or closing accounts</H>
      <P>You can stop using SideQuests at any time, and you can ask us to delete your account by contacting {CONTACT}. We may suspend or close an account, remove content, or hold related payments while we investigate, if we reasonably believe someone has broken these Terms or the law, or put other users or SideQuests at risk. Where we can, we’ll tell you why. Closing an account doesn’t cancel obligations from contracts already in progress, or money already owed.</P>

      <H id="t-disclaimers">12. Disclaimers</H>
      <P>SideQuests is provided “as is” and “as available”. To the fullest extent the law allows, we make no warranties, express or implied, including warranties of merchantability, fitness for a particular purpose and non-infringement. We don’t warrant that SideQuests will always be available or error-free, or that any user, quest or piece of work is what it claims to be.</P>

      <H id="t-liability">13. Limits on our liability</H>
      <P>To the fullest extent the law allows, we aren’t liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or goodwill, arising from your use of SideQuests or from your dealings with other users. Our total liability to you for any claim related to SideQuests is limited to the greater of the fees you paid us in the 12 months before the claim, or US$100. Some places don’t allow these limits, so they may not all apply to you.</P>

      <H id="t-indemnity">14. Your responsibility to us</H>
      <P>If someone makes a claim against us because of content you posted, work you delivered, your dealings with another user, or your breaking these Terms or the law, you agree to cover our reasonable losses and costs, including reasonable legal fees, to the extent the law allows.</P>

      <H id="t-changes">15. Changes</H>
      <P>We may update SideQuests and these Terms over time. If we make a significant change to these Terms, we’ll let you know through SideQuests or by email before it takes effect. If you keep using SideQuests after a change takes effect, you accept the updated Terms. Changes won’t apply to contracts that were already paid for before the change.</P>

      <H id="t-law">16. Governing law</H>
      <P>These Terms are governed by the laws of the State of {STATE}, USA, without regard to its conflict-of-law rules. Any dispute with us will be handled in the state or federal courts located in {STATE}, unless the law where you live gives you the right to bring it elsewhere.</P>
      <P>If any part of these Terms can’t be enforced, the rest still applies. If we don’t enforce a right straight away, we haven’t given it up. You can’t transfer your rights under these Terms without our permission; we may transfer ours as part of a sale or reorganisation of SideQuests.</P>

      <H id="t-contact">17. Contact</H>
      <P>Questions about these Terms? Contact {OPERATOR} at {CONTACT}.</P>
    </Shell>
  );
}

/* ============================================================== PRIVACY */

export function PrivacyPage({ onTerms }: { onTerms: () => void }) {
  const toc: [string, string][] = [
    ['p-who', 'Who we are'],
    ['p-collect', 'What we collect'],
    ['p-use', 'How we use it'],
    ['p-visible', 'What other people can see'],
    ['p-share', 'Who we share it with'],
    ['p-cookies', 'Cookies and local storage'],
    ['p-where', 'Where your data is stored'],
    ['p-keep', 'How long we keep it'],
    ['p-rights', 'Your choices and rights'],
    ['p-security', 'Security'],
    ['p-children', 'Children'],
    ['p-changes', 'Changes'],
    ['p-contact', 'Contact'],
  ];
  return (
    <Shell
      title="Privacy Policy"
      toc={toc}
      onOther={onTerms}
      otherLabel="Terms of Service"
      intro={<p>This policy explains what personal information SideQuests collects, why, who we share it with and the choices you have. The short version: we collect what we need to run the marketplace and process payments. We don’t sell your information, we don’t show ads, and we don’t use advertising trackers.</p>}
    >
      <H id="p-who">1. Who we are</H>
      <P>SideQuests is operated by {OPERATOR}, an individual based in the United States (“SideQuests”, “we”, “us”). We’re responsible for the personal information described in this policy. This policy should be read with our <button onClick={onTerms} className="text-brand-volt hover:underline cursor-pointer">Terms of Service</button>.</P>

      <H id="p-collect">2. What we collect</H>
      <P><B>Information you give us</B></P>
      <UL>
        <li><B>Account details:</B> your email address and password, or your Google account’s name, email address and profile photo if you sign in with Google. Passwords are handled by our sign-in provider (Google Firebase); we never see them in plain text.</li>
        <li><B>Profile:</B> the details you add to your profile, such as your name, handle, headline, bio, location, profile picture, disciplines and skills, rate, credits, gear, availability and social media links, and photos or videos of your work. Gig providers may also add an organisation name, type and hiring goals.</li>
        <li><B>Marketplace activity:</B> quests you post, applications and proposals you send (including your price), quests you bookmark, and contracts you’re part of, including milestones, messages and files you upload.</li>
        <li><B>Reviews:</B> reviews you leave and receive after a contract (star ratings, tags, notes and whether you’d work together again). Once released, reviews are public on the reviewed person’s profile with the reviewer’s name and the quest title.</li>
        <li><B>Messages to us:</B> anything you send when you contact us.</li>
      </UL>
      <P><B>Payment information</B></P>
      <UL>
        <li>Payments are processed by Stripe. When a gig provider pays, Stripe collects their card or bank details. When a creative sets up payouts, Stripe collects the information it needs to verify their identity and pay them, such as legal name, date of birth, address, tax ID and bank account.</li>
        <li>Stripe handles this information under its own <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-volt hover:underline">privacy policy</a>. We don’t receive or store full card or bank account numbers. We do keep a record of each payment (amounts, fees, status and dates), your Stripe account ID, and whether your payouts are set up.</li>
      </UL>
      <P><B>Information collected automatically</B></P>
      <UL>
        <li>When you use SideQuests, our hosting and sign-in providers process technical information such as your IP address, browser and device type, and the time of your requests, to deliver the site, keep it secure and prevent abuse.</li>
        <li>We don’t currently use analytics, advertising or tracking tools.</li>
      </UL>

      <H id="p-use">3. How we use it</H>
      <UL>
        <li>to create and run your account, and show your profile and quests;</li>
        <li>to let gig providers and creatives find each other, apply, hire, message, share files and manage contracts;</li>
        <li>to process payments, hold and release money under Protected Payments, and pay creatives;</li>
        <li>to keep SideQuests safe: preventing fraud, enforcing our Terms, and verifying creatives who request a verified badge;</li>
        <li>to handle disagreements between users and answer your questions;</li>
        <li>to tell you about important changes to SideQuests, these policies or your account; and</li>
        <li>to meet legal obligations, such as tax and financial record-keeping.</li>
      </UL>
      <P>We don’t sell your personal information, we don’t share it for targeted advertising, and we don’t use it to make decisions about you that have legal or similarly significant effects based solely on automated processing.</P>

      <H id="p-visible">4. What other people can see</H>
      <UL>
        <li><B>Public:</B> your profile (everything you add to it except private account details like your email address) and quests you post can be seen by anyone, including people who aren’t signed in.</li>
        <li><B>Shared with the gig provider:</B> applications you send, including your proposal and price.</li>
        <li><B>Private to the contract:</B> contract details, messages and files can only be seen by the gig provider and creative on that contract, and by us when needed to run SideQuests, investigate a problem or handle a disagreement.</li>
      </UL>

      <H id="p-share">5. Who we share it with</H>
      <UL>
        <li><B>Service providers</B> who run SideQuests for us: Google Firebase (hosting, database, file storage, sign-in and server functions) and Stripe (payments and payouts). They may only use your information to provide their services to us.</li>
        <li><B>Content providers</B> when you load pages: fonts are loaded from Google Fonts and some homepage images from Unsplash, so those services receive your IP address and browser details.</li>
        <li><B>Other users</B>, as described in section 4.</li>
        <li><B>For legal reasons:</B> if the law requires it, or to protect the rights, property or safety of SideQuests, our users or others.</li>
        <li><B>If SideQuests changes hands:</B> if SideQuests is sold, merged or reorganised, your information may be transferred to the new owner, who will be bound by this policy.</li>
      </UL>

      <H id="p-cookies">6. Cookies and local storage</H>
      <P>We use your browser’s local storage only to keep you signed in and remember basic settings. We don’t use advertising or tracking cookies. Stripe may set its own cookies on its payment pages to process payments and prevent fraud.</P>

      <H id="p-where">7. Where your data is stored</H>
      <P>Your information is stored and processed in the United States by our service providers. If you use SideQuests from outside the US, your information will be transferred to the US.</P>

      <H id="p-keep">8. How long we keep it</H>
      <P>We keep your information while your account is open. If you ask us to delete your account, we’ll delete or anonymise your personal information within [30] days, except:</P>
      <UL>
        <li>payment and tax records, which we keep for as long as the law requires (usually up to 7 years);</li>
        <li>messages and files in contracts you were part of, which the other person on the contract may still need; and</li>
        <li>information we need to keep to resolve disputes, prevent fraud or enforce our Terms.</li>
      </UL>

      <H id="p-rights">9. Your choices and rights</H>
      <UL>
        <li>You can view and update your profile at any time from your Profile page.</li>
        <li>You can ask us for a copy of your personal information, ask us to correct or delete it, or ask us to stop using it in certain ways, by emailing {CONTACT}. We may need to verify your identity first.</li>
        <li>Depending on where you live (for example, California and other US states with privacy laws), you may have additional rights. We’ll honour them and won’t treat you differently for using them. We aim to respond within 30 days, and at most within the time the law requires.</li>
        <li>You can update or close your payout details through the Stripe account link on SideQuests.</li>
      </UL>

      <H id="p-security">10. Security</H>
      <P>We use reputable providers and access rules that limit who can see each piece of information: for example, contract messages and files can only be opened by the people on that contract. No system is perfectly secure, so please use a strong, unique password and keep your sign-in details private. If we learn of a security breach that affects your information, we’ll notify you as the law requires.</P>

      <H id="p-children">11. Children</H>
      <P>SideQuests is only for people aged 18 and over. We don’t knowingly collect information from anyone under 18. If you believe a minor has created an account, contact us and we’ll delete it.</P>

      <H id="p-changes">12. Changes</H>
      <P>We may update this policy as SideQuests changes. If we make a significant change, we’ll let you know through SideQuests or by email before it takes effect, and we’ll update the effective date at the top.</P>

      <H id="p-contact">13. Contact</H>
      <P>Questions or requests about your privacy? Contact {OPERATOR} at {CONTACT}.</P>
    </Shell>
  );
}
