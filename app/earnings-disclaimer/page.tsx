import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Earnings Disclaimer | Frank Bria',
  description: 'Earnings disclaimer for High-Ticket Program services',
};

export default function EarningsDisclaimer() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">Earnings Disclaimer</h1>

          <div className="space-y-6 text-gray-700">
            <p>
              While we make every effort to ensure that we accurately represent all the products and services provided by High-Ticket Program, it should be noted that earnings and income statements made by FrankBria.com, Frank Bria, Noatak Enterprises, LLC, or High-Ticket Program, its advertisers, sponsors, or partners are estimates only of what we think you can possibly earn.
            </p>

            <p>
              There is no guarantee that you will earn any money using the techniques and ideas or software provided with this website. Examples in these materials are not to be interpreted as a promise or guarantee of earnings.
            </p>

            <p>
              Earning potential is entirely dependent on the person using our product, ideas, techniques and the effort put forth. We do not purport this as a "get rich scheme."
            </p>

            <p>
              Your level of success in attaining the results claimed in our materials depends on the time you devote to the program, ideas and techniques mentioned, your finances, knowledge and various skills. Since these factors differ according to individuals, we cannot guarantee your success or income level. Nor are we responsible for any of your actions.
            </p>

            <p>
              Materials in our product and our website may contain information that includes or is based upon forward-looking statements within the meaning of the securities litigation reform act of 1995. Forward-looking statements give our expectations or forecasts of future events. You can identify these statements by the fact that they do not relate strictly to historical or current facts. They use words such as "anticipate," "estimate," "expect," "project," "intend," "plan," "believe," and other words and terms of similar meaning in connection with a description of potential earnings or financial performance.
            </p>

            <p>
              Any and all forward looking statements here or on any of our sales material are intended to express our opinion of earnings potential. Many factors will be important in determining your actual results and no guarantees are made that you will achieve results similar to ours or anybody else's, in fact no guarantees are made that you will achieve any results from our ideas and techniques in our material.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
