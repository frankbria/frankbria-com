import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms & Conditions | Frank Bria',
  description: 'Terms and conditions for all programs',
};

export default function TermsAndConditions() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">Terms & Conditions for All Programs</h1>

          <div className="space-y-6 text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Refund Policy</h2>
            <p>
              Unless otherwise noted, all programs have a no refund policy. Upon charging the card or paying the invoice, the purchase is final and there are no refunds for any reason.
            </p>

            <p className="mt-8 text-sm text-gray-600">
              Last Modified: May 28, 2019
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
