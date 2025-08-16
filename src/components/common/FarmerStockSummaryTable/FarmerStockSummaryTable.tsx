import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { StoreAdmin } from '@/utils/types';
import type { KapoorFarmerStockSummaryResponse } from '@/utils/types';

interface OrderSummary {
  variety: string;
  sizes: {
    size: string;
    totalQuantity: number;
  }[];
  totalBags: number;
}

interface FarmerStockSummaryTableProps {
  stockSummaryData: KapoorFarmerStockSummaryResponse['stockSummaries'];
}

const FarmerStockSummaryTable: React.FC<FarmerStockSummaryTableProps> = ({ stockSummaryData }) => {
  const adminInfo = useSelector((state: RootState) => state.auth.adminInfo) as StoreAdmin | null;

  // Process data for incoming table (initial quantities)
  const incomingSummary = useMemo(() => {
    const summaryData: OrderSummary[] = [];

    Object.values(stockSummaryData).forEach(farmerVarieties => {
      farmerVarieties.forEach(variety => {
        const existingVariety = summaryData.find(item => item.variety === variety.variety);

        if (existingVariety) {
          // Merge sizes if variety already exists
          variety.sizes.forEach(size => {
            const existingSize = existingVariety.sizes.find(s => s.size === size.size);
            if (existingSize) {
              existingSize.totalQuantity += size.initialQuantity;
            } else {
              existingVariety.sizes.push({
                size: size.size,
                totalQuantity: size.initialQuantity
              });
            }
          });
        } else {
          // Add new variety
          summaryData.push({
            variety: variety.variety,
            sizes: variety.sizes.map(size => ({
              size: size.size,
              totalQuantity: size.initialQuantity
            })),
            totalBags: 0
          });
        }
      });
    });

    // Calculate total bags for each variety
    summaryData.forEach(variety => {
      variety.totalBags = variety.sizes.reduce((sum, size) => sum + size.totalQuantity, 0);
    });

    return summaryData.sort((a, b) => a.variety.localeCompare(b.variety));
  }, [stockSummaryData]);

  // Process data for current table (current quantities)
  const currentSummary = useMemo(() => {
    const summaryData: OrderSummary[] = [];

    Object.values(stockSummaryData).forEach(farmerVarieties => {
      farmerVarieties.forEach(variety => {
        const existingVariety = summaryData.find(item => item.variety === variety.variety);

        if (existingVariety) {
          // Merge sizes if variety already exists
          variety.sizes.forEach(size => {
            const existingSize = existingVariety.sizes.find(s => s.size === size.size);
            if (existingSize) {
              existingSize.totalQuantity += size.currentQuantity;
            } else {
              existingVariety.sizes.push({
                size: size.size,
                totalQuantity: size.currentQuantity
              });
            }
          });
        } else {
          // Add new variety
          summaryData.push({
            variety: variety.variety,
            sizes: variety.sizes.map(size => ({
              size: size.size,
              totalQuantity: size.currentQuantity
            })),
            totalBags: 0
          });
        }
      });
    });

    // Calculate total bags for each variety
    summaryData.forEach(variety => {
      variety.totalBags = variety.sizes.reduce((sum, size) => sum + size.totalQuantity, 0);
    });

    return summaryData.sort((a, b) => a.variety.localeCompare(b.variety));
  }, [stockSummaryData]);

  // Process data for outgoing table (quantities removed)
  const outgoingSummary = useMemo(() => {
    const summaryData: OrderSummary[] = [];

    Object.values(stockSummaryData).forEach(farmerVarieties => {
      farmerVarieties.forEach(variety => {
        const existingVariety = summaryData.find(item => item.variety === variety.variety);

        if (existingVariety) {
          // Merge sizes if variety already exists
          variety.sizes.forEach(size => {
            if (size.quantityRemoved && size.quantityRemoved > 0) {
              const existingSize = existingVariety.sizes.find(s => s.size === size.size);
              if (existingSize) {
                existingSize.totalQuantity += size.quantityRemoved;
              } else {
                existingVariety.sizes.push({
                  size: size.size,
                  totalQuantity: size.quantityRemoved
                });
              }
            }
          });
        } else {
          // Add new variety only if it has quantities removed
          const sizesWithRemoved = variety.sizes
            .filter(size => size.quantityRemoved && size.quantityRemoved > 0)
            .map(size => ({
              size: size.size,
              totalQuantity: size.quantityRemoved || 0
            }));

          if (sizesWithRemoved.length > 0) {
            summaryData.push({
              variety: variety.variety,
              sizes: sizesWithRemoved,
              totalBags: 0
            });
          }
        }
      });
    });

    // Calculate total bags for each variety
    summaryData.forEach(variety => {
      variety.totalBags = variety.sizes.reduce((sum, size) => sum + size.totalQuantity, 0);
    });

    return summaryData.sort((a, b) => a.variety.localeCompare(b.variety));
  }, [stockSummaryData]);

  // Get all unique bag sizes for consistent columns
  const allBagSizes = useMemo(() => {
    if (!adminInfo?.preferences?.bagSizes || adminInfo.preferences.bagSizes.length === 0) {
      const uniqueSizes = new Set<string>();
      incomingSummary.forEach(variety => {
        variety.sizes.forEach(size => uniqueSizes.add(size.size));
      });
      currentSummary.forEach(variety => {
        variety.sizes.forEach(size => uniqueSizes.add(size.size));
      });
      outgoingSummary.forEach(variety => {
        variety.sizes.forEach(size => uniqueSizes.add(size.size));
      });
      return Array.from(uniqueSizes).sort();
    }
    return adminInfo.preferences.bagSizes;
  }, [incomingSummary, currentSummary, outgoingSummary, adminInfo?.preferences?.bagSizes]);

  // Helper function to get quantity for a specific bag size and variety
  const getQuantityForSize = (variety: OrderSummary, sizeName: string) => {
    const sizeData = variety.sizes.find(s => s.size === sizeName);
    return sizeData ? sizeData.totalQuantity : 0;
  };

  // Helper function to calculate total for a specific bag size across all varieties
  const getTotalForSize = (summary: OrderSummary[], sizeName: string) => {
    return summary.reduce((total, variety) => {
      return total + getQuantityForSize(variety, sizeName);
    }, 0);
  };

  // Helper function to calculate total bags for a summary
  const getTotalBags = (summary: OrderSummary[]) => {
    return summary.reduce((total, variety) => total + variety.totalBags, 0);
  };

  // Table component for each tab
  const SummaryTable = ({ summary, title }: { summary: OrderSummary[]; title: string }) => {
    if (summary.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No {title.toLowerCase()} data available
        </div>
      );
    }

    const totalBags = getTotalBags(summary);

    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 border-r whitespace-nowrap">
                      Varieties
                    </th>
                    {allBagSizes.map((size: string) => (
                      <th key={size} className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 border-r whitespace-nowrap">
                        {size}
                      </th>
                    ))}
                    <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-blue-50 whitespace-nowrap">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.map((variety, index) => (
                    <tr key={variety.variety} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium text-gray-900 border-r text-xs sm:text-sm">
                        <div className="truncate max-w-[120px] sm:max-w-none" title={variety.variety}>
                          {variety.variety}
                        </div>
                      </td>
                      {allBagSizes.map((size: string) => (
                        <td
                          key={size}
                          className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 text-center text-gray-700 border-r text-xs sm:text-sm"
                        >
                          {getQuantityForSize(variety, size)}
                        </td>
                      ))}
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center font-bold text-blue-600 bg-blue-50 text-xs sm:text-sm">
                        {variety.totalBags}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-gray-900 border-r text-xs sm:text-sm">
                      Bag Total
                    </td>
                    {allBagSizes.map((size: string) => (
                      <td key={size} className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 text-center text-gray-900 border-r text-xs sm:text-sm">
                        {getTotalForSize(summary, size)}
                      </td>
                    ))}
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-center text-blue-600 bg-blue-100 text-xs sm:text-sm">
                      {totalBags}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming" className="text-sm font-medium">
            Incoming ({getTotalBags(incomingSummary)})
          </TabsTrigger>
          <TabsTrigger value="current" className="text-sm font-medium">
            Current ({getTotalBags(currentSummary)})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="text-sm font-medium">
            Outgoing ({getTotalBags(outgoingSummary)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Initial Quantities (Incoming)</h3>
            <SummaryTable summary={incomingSummary} title="Incoming" />
          </div>
        </TabsContent>

        <TabsContent value="current" className="mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Stock</h3>
            <SummaryTable summary={currentSummary} title="Current" />
          </div>
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantities Removed (Outgoing)</h3>
            <SummaryTable summary={outgoingSummary} title="Outgoing" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmerStockSummaryTable;
