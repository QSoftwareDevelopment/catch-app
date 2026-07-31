import React from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { catalogPlural, catalogSingular, getSector } from '@/sectors/sectors';
import { ComingSoon } from '@/ui/ComingSoon';

/**
 * The catalog, named after whatever the business actually sells. A restaurant sees
 * "Our Menu Items"; a realtor sees "Our Property Listings". Everything on this screen
 * is derived from the sector chosen at signup.
 */
export default function CatalogScreen() {
  const { business } = useAuth();

  const sector = getSector(business?.sector);
  const plural = catalogPlural(business?.sector);
  const singular = catalogSingular(business?.sector);
  const lowerPlural = plural.toLowerCase();

  return (
    <ComingSoon
      testID="catalog-screen"
      icon={sector?.icon ?? '📦'}
      title={`Our ${plural}`}
      summary={`The ${lowerPlural} your customers can ask about, book and buy over text.`}
      bullets={[
        `Add a ${singular.toLowerCase()} with a price and a short description`,
        `Customers get your ${lowerPlural} sent straight into the thread`,
        'Take the booking or the order without leaving the conversation',
        `Turn a ${singular.toLowerCase()} off when you are not offering it`,
      ]}
    />
  );
}
