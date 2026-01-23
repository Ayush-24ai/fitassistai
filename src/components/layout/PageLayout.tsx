import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";

interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showMobileNav?: boolean;
}

export function PageLayout({ 
  children, 
  showFooter = true,
  showMobileNav = true 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {showFooter && <Footer />}
      {showMobileNav && <MobileNav />}
    </div>
  );
}
