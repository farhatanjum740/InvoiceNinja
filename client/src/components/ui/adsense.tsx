import { useEffect, useRef } from 'react';

interface AdSenseProps {
  client: string; // Your AdSense client ID
  slot: string;   // Your AdSense ad unit ID
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

export const AdSense = ({ 
  client, 
  slot, 
  format = 'auto', 
  style = {}, 
  className = '', 
  responsive = true 
}: AdSenseProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      try {
        // Clear the ad container first
        containerRef.current.innerHTML = '';
        
        // Create the ad
        const adsbygoogle = document.createElement('ins');
        adsbygoogle.className = 'adsbygoogle';
        adsbygoogle.style.display = 'block';
        adsbygoogle.dataset.adClient = client;
        adsbygoogle.dataset.adSlot = slot;
        
        if (responsive) {
          adsbygoogle.dataset.adFormat = format;
        }
        
        containerRef.current.appendChild(adsbygoogle);
        
        // Initialize the ad
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
    
    return () => {
      // Clean up, if needed
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [client, slot, format, responsive]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        display: 'block', 
        textAlign: 'center',
        ...style 
      }} 
      className={className}
    />
  );
};

// Banner ad that can be placed at the top or bottom of pages
export const BannerAd = ({ client, slot }: { client: string, slot: string }) => (
  <div className="w-full overflow-hidden my-4">
    <AdSense
      client={client}
      slot={slot}
      format="horizontal"
      style={{ minHeight: '90px' }}
    />
  </div>
);

// Sidebar ad that can be placed in the sidebar
export const SidebarAd = ({ client, slot }: { client: string, slot: string }) => (
  <div className="w-full overflow-hidden mb-4">
    <AdSense
      client={client}
      slot={slot}
      format="vertical"
      style={{ minHeight: '300px' }}
    />
  </div>
);

// In-content ad that can be placed between content sections
export const InContentAd = ({ client, slot }: { client: string, slot: string }) => (
  <div className="w-full overflow-hidden my-8">
    <AdSense
      client={client}
      slot={slot}
      format="rectangle"
      style={{ minHeight: '250px' }}
    />
  </div>
);

// Define this global AdSense type to avoid TypeScript errors
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}