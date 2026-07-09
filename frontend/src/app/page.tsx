import Header from '@/components/Header';
import EventCarousel from '@/components/EventCarousel';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main>
        <EventCarousel />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
