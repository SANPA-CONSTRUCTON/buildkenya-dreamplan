import { ReactNode } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import Navbar from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const AppLayout = ({ children, title, description }: AppLayoutProps) => {
  const pageTitle = title ? `${title} | BuildMyDream Kenya` : "🏠 BuildMyDream - Kenya Housing Planner";
  const pageDescription = description || "Plan realistic, budget-driven housing projects in Kenya with AI-powered visualization and cost breakdowns.";

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
        </Helmet>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </HelmetProvider>
  );
};

export default AppLayout;