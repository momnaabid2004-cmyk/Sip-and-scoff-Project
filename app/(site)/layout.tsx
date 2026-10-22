import { getSiteData } from "@/lib/site-data";
import { SiteProvider } from "@/components/providers/SiteProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ProductModal } from "@/components/layout/ProductModal";
import { Toaster } from "@/components/layout/Toaster";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ThreeProvider } from "@/components/three/ThreeProvider";

// Pages are cached and refreshed on every admin change (see lib/site-data.ts).
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories } = await getSiteData();
  return (
    <SiteProvider value={{ settings, categories }}>
      <ThreeProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-cocoa focus:px-4 focus:py-2 focus:text-vanilla">Skip to content</a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <Toaster />
      <ChatWidget />
      </ThreeProvider>
    </SiteProvider>
  );
}
