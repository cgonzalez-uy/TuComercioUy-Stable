import { useState, useEffect } from 'react';
import { BusinessCard } from './BusinessCard';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { useSettings } from '../lib/hooks/useSettings';
import { usePlans } from '../lib/hooks/usePlans';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';
import { trackSearch, trackFilterUse } from '../lib/analytics';

interface BusinessListProps {
  searchTerm: string;
  location: string;
  categories: string[];
}

const ITEMS_PER_PAGE = 12; // Show 12 businesses initially (3x4 grid)

export function BusinessList({ searchTerm, location, categories }: BusinessListProps) {
  const { businesses, loading, error } = useBusinesses();
  const { settings: categorySettings } = useSettings('categories');
  const { plans } = usePlans();
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Track search and filter changes
  useEffect(() => {
    // Track search term
    if (searchTerm) {
      trackSearch('business', searchTerm);
    }

    // Track location search
    if (location) {
      trackSearch('location', location);
    }

    // Track category filters
    if (categories.length > 0) {
      trackFilterUse('categories', categories);
    }
  }, [searchTerm, location, categories]);

  // Filter businesses based on search criteria
  const filteredBusinesses = businesses.filter(business => {
    // Only show active businesses
    if (!business.isActive) return false;

    // Filter by search term
    const searchMatch = !searchTerm || 
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by location
    const locationMatch = !location ||
      business.address.toLowerCase().includes(location.toLowerCase());

    // Filter by categories
    const categoryMatch = categories.length === 0 ||
      business.categories.some(category => categories.includes(category));

    return searchMatch && locationMatch && categoryMatch;
  });

  // Sort businesses by plan and creation date
  const sortedBusinesses = filteredBusinesses.sort((a, b) => {
    // Get business plans
    const planA = plans.find(p => p.id === a.planId);
    const planB = plans.find(p => p.id === b.planId);

    // Compare by plan price (higher price = better position)
    if (planA?.price !== planB?.price) {
      return (planB?.price || 0) - (planA?.price || 0);
    }

    // If same plan, sort by creation date (newest first)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Get businesses to display based on current display count
  const displayedBusinesses = sortedBusinesses.slice(0, displayCount);
  const hasMore = displayCount < sortedBusinesses.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (sortedBusinesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron comercios que coincidan con tu búsqueda</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedBusinesses.map((business) => (
          <BusinessCard
            key={business.id}
            id={business.id}
            name={business.name}
            shortDescription={business.shortDescription}
            categories={business.categories.map(categoryName => {
              const category = categorySettings.find(c => c.name === categoryName);
              return {
                name: categoryName,
                color: category?.color || '#3B82F6'
              };
            })}
            address={business.address}
            phone={business.phone}
            image={business.image}
            website={business.website}
            instagram={business.instagram}
            facebook={business.facebook}
            whatsapp={business.whatsapp}
            shippingMethods={business.shippingMethods}
            schedule={business.schedule}
            planId={business.planId}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            className="group"
          >
            <ChevronDown className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
            Mostrar más comercios
          </Button>
        </div>
      )}
    </div>
  );
}