import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/common/Topbar/Topbar';
import { Phone, MapPin, Package, ArrowDownCircle, ArrowUpCircle, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { RootState } from '@/store';
import { storeAdminApi } from '@/lib/api/storeAdmin';
import ReceiptVoucherCard from '@/components/vouchers/ReceiptVoucherCard';
import DeliveryVoucherCard from '@/components/vouchers/DeliveryVoucherCard';
import type { KapoorSingleFarmerAllOrdersResponse } from '@/lib/api/storeAdmin';
import { useMemo } from 'react';
import { StoreAdmin } from '@/utils/types';

interface Farmer {
  _id: string;
  name: string;
  address: string;
  mobileNumber: string;
  farmerId: string;
  createdAt: string;
  imageUrl?: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Local type for FarmerAccount as returned by getFarmerAccounts
interface FarmerAccountAPI {
  _id: string;
  profile: string;
  storeAdmin: string;
  variety: string;
  farmerId: string;
  password: string;
  isVerified: boolean;
  role: string;
  farmerOrders: unknown[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Summary table component for farmer orders
interface OrderSummary {
  variety: string;
  sizes: {
    size: string;
    totalQuantity: number;
  }[];
  totalBags: number;
}

const FarmerOrderSummaryTable = ({ orders }: { orders: KapoorSingleFarmerAllOrdersResponse['data'] }) => {
  const adminInfo = useSelector((state: RootState) => state.auth.adminInfo) as StoreAdmin | null;

  // Process orders to create summary - only include incoming orders for stock summary
  const summary = useMemo(() => {
    const varietyMap = new Map<string, Map<string, number>>();

    orders.forEach(order => {
      // Only process incoming orders (RECEIPT type) for stock summary
      if (order.voucher.type === 'RECEIPT' && order.incomingBagSizes) {
        const variety = order.variety || '';
        if (!varietyMap.has(variety)) {
          varietyMap.set(variety, new Map());
        }

        const sizeMap = varietyMap.get(variety)!;
        order.incomingBagSizes.forEach(bag => {
          const currentTotal = sizeMap.get(bag.size) || 0;
          sizeMap.set(bag.size, currentTotal + bag.quantity.currentQuantity);
        });
      }
    });

    const summaryData: OrderSummary[] = [];
    varietyMap.forEach((sizeMap, variety) => {
      const sizes = Array.from(sizeMap.entries()).map(([size, totalQuantity]) => ({
        size,
        totalQuantity
      }));

      const totalBags = sizes.reduce((sum, size) => sum + size.totalQuantity, 0);

      summaryData.push({
        variety,
        sizes,
        totalBags
      });
    });

    return summaryData.sort((a, b) => a.variety.localeCompare(b.variety));
  }, [orders]);

  // Get all unique bag sizes for consistent columns
  const allBagSizes = useMemo(() => {
    if (!adminInfo?.preferences?.bagSizes || adminInfo.preferences.bagSizes.length === 0) {
      const uniqueSizes = new Set<string>();
      summary.forEach(variety => {
        variety.sizes.forEach(size => uniqueSizes.add(size.size));
      });
      return Array.from(uniqueSizes).sort();
    }
    return adminInfo.preferences.bagSizes;
  }, [summary, adminInfo?.preferences?.bagSizes]);

  // Helper function to get quantity for a specific bag size and variety
  const getQuantityForSize = (variety: OrderSummary, sizeName: string) => {
    const sizeData = variety.sizes.find(s => s.size === sizeName);
    return sizeData ? sizeData.totalQuantity : 0;
  };

  // Helper function to calculate total for a specific bag size across all varieties
  const getTotalForSize = (sizeName: string) => {
    return summary.reduce((total, variety) => {
      return total + getQuantityForSize(variety, sizeName);
    }, 0);
  };

  const totalBags = summary.reduce((total, variety) => total + variety.totalBags, 0);

  if (summary.length === 0) {
    return null;
  }

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
                      {getTotalForSize(size)}
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

const FarmerProfileScreen = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const farmer = location.state?.farmer as Farmer;
  const adminInfo = useSelector((state: RootState) => state.auth.adminInfo);

  // Helper function to convert new API format to IncomingOrderNew for ReceiptVoucherCard
  const convertToIncomingOrderNew = (order: KapoorSingleFarmerAllOrdersResponse['data'][number]) => {
    return {
      _id: order._id,
      coldStorageId: order.coldStorageId,
      farmerAccount: {
        _id: order.farmerAccount._id,
        profile: {
          _id: order.farmerAccount._id,
          name: order.farmerAccount.name,
          address: order.farmerAccount.address
        },
        variety: order.variety || '',
        farmerId: order.farmerAccount.farmerId
      },
      variety: order.variety || '',
      incomingBagSizes: order.incomingBagSizes || [],
      dateOfEntry: order.dateOfEntry || '',
      remarks: order.remarks,
      currentStockAtThatTime: order.currentStockAtThatTime,
      voucher: order.voucher,
      createdAt: order.createdAt
    };
  };

  // Helper function to convert new API format to Order for DeliveryVoucherCard
  const convertToOrder = (order: KapoorSingleFarmerAllOrdersResponse['data'][number]) => {
    return {
      _id: order._id,
      coldStorageId: order.coldStorageId,
      farmerId: {
        _id: order.farmerAccount._id,
        name: order.farmerAccount.name,
        address: order.farmerAccount.address,
        mobileNumber: order.farmerAccount.mobileNumber,
        farmerId: order.farmerAccount.farmerId
      },
      voucher: {
        type: order.voucher.type as 'RECEIPT' | 'DELIVERY',
        voucherNumber: order.voucher.voucherNumber
      },
      dateOfExtraction: order.dateOfExtraction || '',
      remarks: order.remarks,
      currentStockAtThatTime: order.currentStockAtThatTime,
      orderDetails: order.orderDetails?.map(detail => ({
        variety: detail.variety,
        bagSizes: detail.bagSizes.map(bag => ({
          size: bag.size,
          quantityRemoved: bag.quantityRemoved,
          location: bag.location
        })),
        incomingOrder: detail.incomingOrder ? {
          _id: detail.incomingOrder._id,
          location: detail.incomingOrder.incomingBagSizes[0]?.location || '',
          voucher: {
            type: detail.incomingOrder.voucher.type as 'RECEIPT' | 'DELIVERY',
            voucherNumber: detail.incomingOrder.voucher.voucherNumber
          },
          incomingBagSizes: detail.incomingOrder.incomingBagSizes.map(bag => ({
            size: bag.size,
            quantity: bag.quantity,
            _id: bag.size // Using size as _id since it's not provided
          }))
        } : undefined
      })) || [],
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
      __v: 0
    };
  };

  const {
    data: accountsData,
    isLoading: isAccountsLoading,
    error: accountsError,
  } = useQuery({
    queryKey: ['farmerAccounts', farmer?._id, adminInfo?.token],
    queryFn: () =>
      farmer && adminInfo?.token
        ? storeAdminApi.getFarmerAccounts(farmer._id, adminInfo.token)
        : Promise.resolve({ status: '', data: [] }),
    enabled: !!farmer && !!adminInfo?.token,
  });

  // Orders fetching logic - using the new getAllOrders function
  const accountIds = (accountsData?.data ?? []).map((account: FarmerAccountAPI) => account._id);

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ['farmerAllOrders', accountIds, adminInfo?.token],
    queryFn: () =>
      accountIds.length > 0 && adminInfo?.token
        ? storeAdminApi.kapoorGetAllOrdersOfaSingleFarmer(accountIds, adminInfo.token)
        : Promise.resolve(undefined),
    enabled: !!adminInfo?.token && accountIds.length > 0,
  });

  // Calculate total bags from incoming orders only
  const totalBags = useMemo(() => {
    if (!ordersData?.data) return 0;
    return ordersData.data
      .filter(order => order.voucher.type === 'RECEIPT' && order.incomingBagSizes)
      .reduce((total, order) => {
        return total + order.incomingBagSizes!.reduce((sum, bag) => sum + bag.quantity.currentQuantity, 0);
      }, 0);
  }, [ordersData?.data]);

  // Separate incoming and outgoing orders
  const incomingOrders = useMemo(() => {
    return ordersData?.data?.filter(order => order.voucher.type === 'RECEIPT') || [];
  }, [ordersData?.data]);

  const outgoingOrders = useMemo(() => {
    return ordersData?.data?.filter(order => order.voucher.type === 'DELIVERY') || [];
  }, [ordersData?.data]);

  if (!farmer) {
    return (
      <>
        <TopBar title={t('farmerProfile.title')} isSidebarOpen={false} setIsSidebarOpen={() => {}} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-red-500">{t('farmerProfile.notFound')}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={t('farmerProfile.title')} isSidebarOpen={false} setIsSidebarOpen={() => {}} />
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-20">
        {/* Personal Information Card */}
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          {/* Header Background */}
          <div className="bg-gray-50/50 border-b border-gray-100 px-6 sm:px-8 pt-6 sm:pt-8 pb-0">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 border-4 border-white shadow-md">
                  <AvatarFallback className="text-xl sm:text-2xl lg:text-3xl bg-primary text-white font-bold">
                    {getInitials(farmer.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Basic Info */}
              <div className="flex-1 w-full text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                  {farmer.name}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mb-6 font-medium">
                  {t('farmerProfile.memberSince')} {new Date(farmer.createdAt).toLocaleDateString()}
                </p>

                {/* Action Buttons Row */}
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => navigate(`/erp/incoming-order`, { state: { farmer } })}
                      className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 px-4 sm:px-6 py-2.5 font-medium"
                    >
                      <ArrowDownCircle className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{t('farmerProfile.incomingOrder')}</span>
                      <span className="sm:hidden">{t('daybook.incoming')}</span>
                    </Button>
                    <Button
                      onClick={() => navigate(`/erp/outgoing-order`, { state: { farmer } })}
                      variant="outline"
                      className="flex-1 sm:flex-initial bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-200 px-4 sm:px-6 py-2.5 font-medium"
                    >
                      <ArrowUpCircle className="mr-2 h-4 w-4 text-primary" />
                      <span className="hidden sm:inline">{t('farmerProfile.outgoingOrder')}</span>
                      <span className="sm:hidden">{t('daybook.outgoing')}</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-200 px-4 sm:px-6 py-2.5 font-medium"
                    disabled
                  >
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">{t('farmerProfile.viewReport')}</span>
                    <span className="sm:hidden">{t('farmerProfile.report')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards Section */}
          <CardContent className="p-6 sm:p-8 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Account Number Card */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M8 8h8M8 12h8M8 16h4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Number of Accounts
                    </div>
                    <div className="font-bold text-2xl text-primary">{accountsData?.data?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Phone Number Card */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {t('farmerProfile.phoneNumber')}
                    </div>
                    <div className="font-medium text-gray-900 truncate">{farmer.mobileNumber}</div>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {t('farmerProfile.address')}
                    </div>
                    <div className="font-medium text-gray-900 line-clamp-2 text-sm leading-relaxed">
                      {farmer.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Bags Card */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {t('farmerProfile.totalBags')}
                    </div>
                    <div className="font-bold text-2xl text-primary">{totalBags}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Farmer Accounts Section */}
        <div className="mt-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Accounts
          </h2>
          {isAccountsLoading ? (
            <div className="text-gray-500">Loading accounts...</div>
          ) : accountsError ? (
            <div className="text-red-500">Failed to load accounts.</div>
          ) : accountsData?.data?.length === 0 ? (
            <div className="text-gray-500">No accounts found for this farmer.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(accountsData?.data ?? []).map((account: FarmerAccountAPI) => (
                <div
                  key={account._id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Variety
                    </div>
                    <div className="font-semibold text-gray-900 text-lg">{account.variety}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-1">
                      Farmer ID
                    </div>
                    <div className="font-mono text-primary text-xl">{account.farmerId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        {ordersData?.data && ordersData.data.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            <FarmerOrderSummaryTable orders={ordersData.data} />
          </div>
        )}

        {/* Orders Section */}
        <div className="mt-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            All Orders ({ordersData?.counts?.incoming || 0} Incoming, {ordersData?.counts?.outgoing || 0} Outgoing)
          </h2>
          {isOrdersLoading ? (
            <div className="text-gray-500">Loading orders...</div>
          ) : ordersError ? (
            <div className="text-red-500">Failed to load orders.</div>
          ) : ordersData?.data?.length === 0 ? (
            <div className="text-gray-500">No orders found for this farmer.</div>
          ) : (
            <div className="space-y-6">
              {/* Incoming Orders */}
              {incomingOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                    Incoming Orders ({incomingOrders.length})
                  </h3>
                  {incomingOrders.map((order) => (
                    <ReceiptVoucherCard key={order._id} order={convertToIncomingOrderNew(order)} />
                  ))}
                </div>
              )}

              {/* Outgoing Orders */}
              {outgoingOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                    Outgoing Orders ({outgoingOrders.length})
                  </h3>
                  {outgoingOrders.map((order) => (
                    <DeliveryVoucherCard key={order._id} order={convertToOrder(order)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FarmerProfileScreen;
