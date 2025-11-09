import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import CartItem from "../components/CartItem";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

const ITEMS_PER_PAGE = 12;

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHierarchicalId, setSelectedHierarchicalId] = useState<string | undefined>(
    searchParams.get('hierarchical_parent') || undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showProducts, setShowProducts] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading, isError } = useProducts(selectedHierarchicalId);

  // Sync URL with state only on initial load and browser back/forward
  useEffect(() => {
    const urlParam = searchParams.get('hierarchical_parent');
    const currentId = urlParam || undefined;
    if (currentId !== selectedHierarchicalId) {
      setSelectedHierarchicalId(currentId);
      setShowProducts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return (categories ?? []).filter((c) => {
      const key = c.hierarchical_id || c.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  const totalPages = useMemo(() => {
    return Math.ceil((products?.length || 0) / ITEMS_PER_PAGE);
  }, [products]);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return products?.slice(startIndex, endIndex) || [];
  }, [products, currentPage]);

  const isLoading = categoriesLoading || productsLoading;

  // Animate products appearance when they change
  useEffect(() => {
    if (!isLoading && currentProducts.length > 0) {
      setShowProducts(false);
      const timer = setTimeout(() => setShowProducts(true), 50);
      return () => clearTimeout(timer);
    } else if (isLoading) {
      setShowProducts(false);
    }
  }, [currentProducts.length, isLoading, selectedHierarchicalId, currentPage]);

  const handleCategoryChange = (hierarchicalId?: string) => {
    // Не делаем ничего, если категория уже выбрана
    if (hierarchicalId === selectedHierarchicalId) {
      return;
    }
    
    setShowProducts(false);
    setSelectedHierarchicalId(hierarchicalId);
    setCurrentPage(1);
    
    // Update URL params
    if (hierarchicalId) {
      setSearchParams({ hierarchical_parent: hierarchicalId });
    } else {
      setSearchParams({});
    }
  };

  return (
      <section className="pt-10 lg:pt-28">
        <div className="container">
          <h2 className="text-[#b12e2e] font-bold mt-16 pb-2 lg:pl-3 lg:text-5xl text-4xl mb-6">
            КАТАЛОГ
          </h2>

          <ul className="flex mt-4 gap-2 sm:gap-3 md:gap-4 flex-wrap justify-start md:justify-center">
            <li>
              <button
                  onClick={() => handleCategoryChange(undefined)}
                  className={`text-sm md:text-base border px-3 md:px-4 py-2 flex justify-center items-center cursor-pointer transition-all duration-200 rounded-full whitespace-nowrap ${
                      !selectedHierarchicalId
                          ? "bg-[#f6eaea] text-black font-bold border-[#f6eaea]"
                          : "text-[#f6eaea] border-[#f6eaea]/30 hover:bg-[#f6eaea] hover:text-black hover:border-[#f6eaea]"
                  }`}
              >
                Все
              </button>
            </li>
            {uniqueCategories.map((cat) => (
                <li key={cat.hierarchical_id || cat.id}>
                  <button
                      onClick={() => handleCategoryChange(cat.hierarchical_id)}
                      className={`text-sm md:text-base border px-3 md:px-4 py-2 flex justify-center items-center cursor-pointer transition-all duration-200 rounded-full whitespace-nowrap ${
                          selectedHierarchicalId === cat.hierarchical_id
                              ? "bg-[#f6eaea] text-black font-bold border-[#f6eaea]"
                              : "text-[#f6eaea] border-[#f6eaea]/30 hover:bg-[#f6eaea] hover:text-black hover:border-[#f6eaea]"
                      }`}
                  >
                    {cat.name}
                  </button>
                </li>
            ))}
          </ul>

          <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 py-8">
            {isLoading && <p className="text-center col-span-full text-[#f6eaea]">Загрузка...</p>}
            {isError && (
                <p className="text-center col-span-full text-red-500">
                  Ошибка при загрузке товаров
                </p>
            )}
            {!isLoading && currentProducts.map((product, index) => (
                <div
                    key={`${product.id}-${selectedHierarchicalId}`}
                    className={`transition-all duration-500 ease-out ${
                        showProducts
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                    }`}
                    style={{
                        transitionDelay: showProducts ? `${index * 50}ms` : '0ms'
                    }}
                >
                    <CartItem product={product} />
                </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pb-8">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-[#b12e2e] text-[#b12e2e] rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b12e2e] hover:text-black transition-all"
              >
                Назад
              </button>
              
              <span className="text-[#f6eaea] px-4 text-1l">
                {currentPage} из {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-[#b12e2e] text-[#b12e2e] rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b12e2e] hover:text-black transition-all"
              >
                Вперёд
              </button>
            </div>
          )}
        </div>
      </section>
  );
};

export default Catalog;
