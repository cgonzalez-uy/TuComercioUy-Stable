import { useState } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { BusinessList } from '../components/BusinessList';
import { useSettings } from '../lib/hooks/useSettings';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { UserAuthModal } from '../components/auth/UserAuthModal';

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { settings: categories } = useSettings('categories');
  const { settings: siteSettings } = useSettings('site-settings');

  const activeCategories = categories.filter(cat => cat.isActive);
  const heroTitle = siteSettings.find(s => s.key === 'hero-title')?.value || 'Conecta con los mejores comercios de Tu Ciudad';
  const heroSubtitle = siteSettings.find(s => s.key === 'hero-subtitle')?.value || 'Descubre y apoya los comercios locales. Todo lo que necesitas, cerca de ti.';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero Section - Added pt-16 to account for fixed navbar height */}
      <section className="bg-white border-b pt-16">
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
          <h1 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-4 tracking-tight">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
          
          {/* Búsqueda y Filtros */}
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="¿Qué estás buscando? Ej: restaurantes, librerías..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="¿En qué zona?"
                  className="pl-10 md:w-[200px]"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2 md:w-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
            </div>

            {/* Panel de Filtros */}
            {showFilters && (
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Explora por categoría</h3>
                <div className="flex flex-wrap gap-2">
                  {activeCategories.map((category) => (
                    <label
                      key={category.id}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedCategories.includes(category.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.name]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== category.name));
                          }
                        }}
                      />
                      <span className="text-sm">{category.name}</span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lista de Comercios */}
      <section className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <BusinessList
          searchTerm={searchTerm}
          location={selectedLocation}
          categories={selectedCategories}
        />
      </section>

      <Footer />

      {/* Auth Modal */}
      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}