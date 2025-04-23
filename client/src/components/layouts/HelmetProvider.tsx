import { Helmet } from 'react-helmet';

interface HelmetProviderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  showAdsense?: boolean;
}

export function HelmetProvider({
  title = 'InvoiceGenius - GST Invoicing for Indian Businesses',
  description = 'Create professional GST-compliant invoices quickly and easily with InvoiceGenius. Manage customers, products, and payments all in one place.',
  children,
  showAdsense = true
}: HelmetProviderProps) {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {showAdsense && (
          <script 
            async 
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx"
            crossOrigin="anonymous"
          />
        )}
      </Helmet>
      {children}
    </>
  );
}