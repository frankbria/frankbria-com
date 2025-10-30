import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const revalidate = 60;

export default async function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <article className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Hey there, I'm Frank Bria</h2>

          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {/* Frank's Headshot */}
            <div className="flex-shrink-0 md:w-1/3">
              <img
                src="https://beta.frankbria.com/uploads/2024/01/frank-bria-headshot-pro-400x516.png"
                alt="Frank Bria"
                className="w-full h-auto rounded-lg"
                width="400"
                height="516"
              />
            </div>

            {/* Bio text */}
            <div className="flex-1 space-y-4 text-gray-700">
              <p>
                I'm a serial entrepreneur and analytics junkie. I started my career in analytics consulting in fintech. As a consultant, I found my business model didn't scale. So I worked with consulting firms and service agencies like me to grow and scale.
              </p>
              <p>
                But the fintech sector was calling me back. I'm currently engaged with SaaS companies and banks creating amazing digital customer experiences. But the brands and companies I started are still around.
              </p>
              <p>
                So look around and click through to the brand or platform that is of best interest to you. Or, just connect with me personally on{' '}
                <a href="https://linkedin.com/in/frankbria" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  LinkedIn
                </a>.
              </p>
              <p>
                I do advisory work for startups in the fintech and advanced analytics space such as artificial intelligence and machine learning (AI/ML).
              </p>
              <p>
                <a href="https://www.advisorycloud.com/profile/Frank-Bria?embed" target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
                  Request a Meeting
                </a>
              </p>
            </div>
          </div>

          {/* Ventures Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* High-Ticket Program */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <a href="/category/think-tank" className="block">
                <div className="flex items-center justify-center mb-4" style={{ minHeight: '200px' }}>
                  <img
                    src="https://beta.frankbria.com/uploads/2019/05/HTP-Logo-bk-e1557603932149-400x133.png"
                    alt="High-Ticket Program Logo"
                    className="max-h-[200px] w-auto rounded"
                    width="400"
                    height="133"
                  />
                </div>
                <h5 className="text-lg font-semibold text-gray-900">
                  Small B2B Services Businesses Looking to Grow to 7 Figures
                </h5>
              </a>
            </div>

            {/* Frank Bria Music */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <a href="https://frankbriamusic.com" target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-center justify-center mb-4" style={{ minHeight: '200px' }}>
                  <img
                    src="/FB_music_logo_v2_trans_dark_4x.png"
                    alt="Frank Bria Music Logo"
                    className="max-h-[200px] w-auto rounded"
                    width="400"
                    height="124"
                  />
                </div>
                <h5 className="text-lg font-semibold text-gray-900">
                  Orchestral Film & Media Composer
                </h5>
              </a>
            </div>

            {/* Scale Book */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <a href="https://www.amazon.com/Scale-Grow-Your-Business-Working-ebook/dp/B00YW8OIGS" target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-center justify-center mb-4" style={{ minHeight: '200px' }}>
                  <img
                    src="https://beta.frankbria.com/uploads/2020/03/3d_book_2_med.png"
                    alt="Scale Book Cover"
                    className="max-h-[200px] w-auto rounded"
                    width="400"
                    height="534"
                  />
                </div>
                <h5 className="text-lg font-semibold text-gray-900">
                  Scale: How to Grow Your Business by Working Less
                </h5>
              </a>
            </div>

            {/* Seven Billion Banks Book */}
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <a href="https://www.amazon.com/Seven-Billion-Banks-Personalized-Experience/dp/0985725435" target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-center justify-center mb-4" style={{ minHeight: '200px' }}>
                  <img
                    src="https://beta.frankbria.com/uploads/2020/03/3d_book.png"
                    alt="Seven Billion Banks Book Cover"
                    className="max-h-[200px] w-auto rounded"
                    width="512"
                    height="756"
                  />
                </div>
                <h5 className="text-lg font-semibold text-gray-900">
                  Seven Billion Banks: How a Personalized Banking Experience Will Save the Industry
                </h5>
              </a>
            </div>

            {/* 6 to 7 Figures Show Podcast - Centered in row */}
            <div className="md:col-span-2 flex justify-center">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow md:w-1/2">
                <a href="https://open.spotify.com/show/0xcYcgrzcnsff0mkNX0fGh" target="_blank" rel="noopener noreferrer" className="block">
                  <div className="flex items-center justify-center mb-4" style={{ minHeight: '200px' }}>
                    <img
                      src="https://beta.frankbria.com/uploads/2019/05/6_to_7_figures_cover_sq_300.jpg"
                      alt="6 to 7 Figures Show Podcast Cover"
                      className="max-h-[200px] w-auto rounded"
                      width="300"
                      height="300"
                    />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900">
                    The 6 to 7 Figures Show Podcast
                  </h5>
                </a>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}