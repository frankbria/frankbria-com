'use client';

/**
 * Cookie Consent Banner Component
 *
 * Displays a cookie consent banner at the bottom of the page using react-cookie-consent.
 * Stores user consent in a cookie that expires after 365 days.
 *
 * Features:
 * - Dark theme styling matching site design
 * - Accept button to grant consent
 * - Cookie settings button to decline
 * - Fully accessible with ARIA labels and keyboard navigation
 * - Automatically hides when consent is given
 * - Persists consent across sessions
 *
 * Cookie Details:
 * - Name: frankbria-cookie-consent
 * - Value: true (when accepted)
 * - Expiry: 365 days
 * - Path: /
 *
 * @component
 * @example
 * ```tsx
 * import CookieConsent from '@/components/CookieConsent';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <CookieConsent />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

import React from 'react';
import CookieConsentBanner from 'react-cookie-consent';

// Cookie configuration constants
const COOKIE_NAME = 'frankbria-cookie-consent';
const COOKIE_EXPIRY_DAYS = 365;

// Color constants (Tailwind CSS colors)
const COLORS = {
  GRAY_900: '#1f2937',  // Dark background
  GRAY_400: '#9ca3af',  // Decline button text
  BLUE_500: '#3b82f6',  // Accept button background
  WHITE: '#ffffff',     // Text color
} as const;

// Button style configuration
const buttonBaseStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '500',
  padding: '10px 24px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
};

/**
 * CookieConsent Component
 *
 * Displays a GDPR-compliant cookie consent banner with accept/decline options.
 * Uses the react-cookie-consent library for cookie management.
 */
const CookieConsent: React.FC = () => {
  return (
    <CookieConsentBanner
      // Cookie configuration
      location="bottom"
      cookieName={COOKIE_NAME}
      expires={COOKIE_EXPIRY_DAYS}

      // Button configuration
      buttonText="ACCEPT"
      declineButtonText="Cookie settings"
      enableDeclineButton
      flipButtons={true}
      setDeclineCookie={false}

      // CSS classes for styling
      containerClasses="cookie-consent-container"
      buttonClasses="cookie-consent-accept-button bg-blue-500 text-white rounded"
      declineButtonClasses="cookie-consent-decline-button bg-transparent text-gray-400"

      // Accessibility attributes
      customContainerAttributes={{
        role: 'dialog',
        'aria-label': 'Cookie Consent Banner',
      }}
      ariaAcceptLabel="Accept cookies"
      ariaDeclineLabel="Decline cookies and open cookie settings"

      // Container styling
      style={{
        background: COLORS.GRAY_900,
        padding: '20px',
        alignItems: 'center',
      }}

      // Accept button styling
      buttonStyle={{
        ...buttonBaseStyle,
        background: COLORS.BLUE_500,
        color: COLORS.WHITE,
      }}

      // Decline button styling
      declineButtonStyle={{
        ...buttonBaseStyle,
        background: 'transparent',
        color: COLORS.GRAY_400,
      }}

      // Content styling
      contentStyle={{
        flex: '1 0 300px',
        margin: '0 20px',
      }}

      // Overlay configuration
      overlay={false}
      overlayClasses=""
    >
      <span
        style={{
          fontSize: '14px',
          color: COLORS.WHITE,
          lineHeight: '1.5',
        }}
      >
        This website uses cookies to improve your experience. We'll assume you're ok with this, but you can opt-out if you wish.
      </span>
    </CookieConsentBanner>
  );
};

export default CookieConsent;
