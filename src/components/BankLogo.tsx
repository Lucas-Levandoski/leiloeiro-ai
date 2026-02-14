import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BankLogoProps {
  bankName?: string;
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { width: 24, height: 24, containerClass: 'h-6 w-auto' }, // Sidebar
  md: { width: 100, height: 40, containerClass: 'h-10 w-auto' }, // Project Main Page
  lg: { width: 150, height: 60, containerClass: 'h-14 w-auto' }, // Lote Details
};

export const getBankLogoUrl = (bankName: string): string | null => {
  if (!bankName) return null;
  
  const normalized = bankName.toLowerCase().trim();
  
  if (normalized.includes('bradesco')) {
    return '/images/bradesco.png';
  }
  if (normalized.includes('caixa')) {
    return '/images/caixa-federal.png';
  }
  if (normalized.includes('santander')) {
    return '/images/santander.png';
  }
  if (normalized.includes('brasil') || normalized.includes('bb')) {
    return '/images/banco-do-brasil.png';
  }
  if (normalized.includes('itau') || normalized.includes('itaú')) {
    return '/images/itau.png';
  }
  if (normalized.includes('safra')) {
    return '/images/safra.png';
  }
  if (normalized.includes('btg')) {
    return '/images/btg-pactual.png';
  }
  
  return null;
};

export function BankLogo({ bankName, className, showName = false, size = 'md' }: BankLogoProps) {
  const [error, setError] = useState(false);
  
  if (!bankName) return null;

  const logoUrl = getBankLogoUrl(bankName);
  const config = sizeConfig[size];

  if (!logoUrl || error) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="bg-muted p-1 rounded-md flex items-center justify-center" style={{ width: config.height, height: config.height }}>
            <Building2 className="h-full w-full opacity-50 p-0.5" />
        </div>
        {showName && <span className="text-sm font-medium">{bankName}</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 relative", className)}>
      <div className={cn("relative flex items-center", config.containerClass)}>
        <Image 
            src={logoUrl} 
            alt={`Logo ${bankName}`} 
            width={config.width}
            height={config.height}
            className="object-contain w-auto h-full"
            onError={() => setError(true)}
            priority={size !== 'sm'}
        />
      </div>
      {showName && <span className="text-sm font-medium sr-only">{bankName}</span>}
    </div>
  );
}
