import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/common/Topbar/Topbar';
import { Phone, MapPin, Package, ArrowDownCircle, ArrowUpCircle, FileText, Search } from 'lucide-react';
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
import { useMemo, useState } from 'react';
import { StoreAdmin, Order } from '@/utils/types';
import { PDFViewer } from '@react-pdf/renderer';
import FarmerReportPDF from '@/components/pdf/FarmerReportPDF';
import * as ReactDOM from 'react-dom/client';
import FarmerStockSummaryTable from '@/components/common/FarmerStockSummaryTable';

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

// Type guard function to check if the admin is a StoreAdmin
const isStoreAdmin = (admin: unknown): admin is StoreAdmin => {
  return admin !== null &&
    typeof admin === 'object' &&
    'coldStorageDetails' in admin &&
    'name' in admin &&
    'personalAddress' in admin &&
    'mobileNumber' in admin &&
    'imageUrl' in admin;
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

const FarmerProfileScreen = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const farmer = location.state?.farmer as Farmer;
  const adminInfo = useSelector((state: RootState) => state.auth.adminInfo);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Add new state variables for search, filter, and sorting
  const [searchReceiptNumber, setSearchReceiptNumber] = useState<string>("");
  const [orderType, setOrderType] = useState<"all" | "incoming" | "outgoing">("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

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

  // Helper function to convert new API format to Order for FarmerReportPDF
  const convertToOrderForPDF = (order: KapoorSingleFarmerAllOrdersResponse['data'][number]): Order => {
    if (order.voucher.type === 'RECEIPT') {
      // For receipt orders, use incomingBagSizes
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
          type: 'RECEIPT' as const,
          voucherNumber: order.voucher.voucherNumber
        },
        dateOfSubmission: order.dateOfEntry || order.createdAt,
        remarks: order.remarks,
        currentStockAtThatTime: order.currentStockAtThatTime,
        orderDetails: [{
          variety: order.variety || '',
          location: order.incomingBagSizes?.[0]?.location || '',
          bagSizes: order.incomingBagSizes?.map(bag => ({
            size: bag.size,
            quantity: {
              initialQuantity: bag.quantity.initialQuantity,
              currentQuantity: bag.quantity.currentQuantity
            },
            location: bag.location
          })) || []
        }],
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
        __v: 0
      };
    } else {
      // For delivery orders, use orderDetails
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
          type: 'DELIVERY' as const,
          voucherNumber: order.voucher.voucherNumber
        },
        dateOfExtraction: order.dateOfExtraction || order.createdAt,
        remarks: order.remarks,
        currentStockAtThatTime: order.currentStockAtThatTime,
        orderDetails: order.orderDetails?.map(detail => ({
          variety: detail.variety,
          location: detail.bagSizes[0]?.location || '',
          bagSizes: detail.bagSizes.map(bag => ({
            size: bag.size,
            quantityRemoved: bag.quantityRemoved,
            location: bag.location
          }))
        })) || [],
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
        __v: 0
      };
    }
  };

  // Handle view report functionality
  const handleViewReport = async () => {
    if (!adminInfo || !isStoreAdmin(adminInfo) || !ordersData?.data) {
      alert('Data not available for report generation');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Convert orders to the format expected by FarmerReportPDF
      const ordersForPDF: Order[] = ordersData.data.map(convertToOrderForPDF);

      // Log the data being sent to PDF
      console.log('=== FARMER REPORT PDF DATA ===');
      console.log('Farmer Info:', {
        _id: farmer._id,
        name: farmer.name,
        address: farmer.address,
        mobileNumber: farmer.mobileNumber,
        farmerId: farmer.farmerId,
        createdAt: farmer.createdAt
      });

      console.log('Admin Info:', {
        _id: adminInfo._id,
        name: adminInfo.name,
        coldStorageName: adminInfo.coldStorageDetails.coldStorageName,
        coldStorageAddress: adminInfo.coldStorageDetails.coldStorageAddress,
        bagSizes: adminInfo.preferences?.bagSizes || []
      });

      console.log('Orders Summary:', {
        totalOrders: ordersForPDF.length,
        receiptOrders: ordersForPDF.filter(order => order.voucher.type === 'RECEIPT').length,
        deliveryOrders: ordersForPDF.filter(order => order.voucher.type === 'DELIVERY').length,
        orders: ordersForPDF.map(order => ({
          _id: order._id,
          voucherType: order.voucher.type,
          voucherNumber: order.voucher.voucherNumber,
          date: order.dateOfSubmission || order.dateOfExtraction,
          orderDetailsCount: order.orderDetails.length,
          totalBags: order.orderDetails.reduce((total, detail) => {
            if (order.voucher.type === 'RECEIPT') {
              return total + detail.bagSizes.reduce((sum, bag) => sum + (bag.quantity?.initialQuantity || 0), 0);
            } else {
              return total + detail.bagSizes.reduce((sum, bag) => sum + (bag.quantityRemoved || 0), 0);
            }
          }, 0)
        }))
      });
      console.log('=== END FARMER REPORT PDF DATA ===');

      // Open PDF in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <body>
              <div id="root" style="height: 100vh;"></div>
              <script>
                window.onbeforeunload = null;
              </script>
            </body>
          </html>
        `);

        const root = printWindow.document.getElementById('root');
        if (root) {
          ReactDOM.createRoot(root).render(
            <PDFViewer width="100%" height="100%">
              <FarmerReportPDF
                farmer={farmer}
                adminInfo={adminInfo}
                orders={ordersForPDF}
              />
            </PDFViewer>
          );
        }
      }
    } catch (error) {
      console.error('Error generating farmer report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle view variety-specific report functionality
  const handleViewVarietyReport = async (variety: string) => {
    if (!adminInfo || !isStoreAdmin(adminInfo) || !ordersData?.data) {
      alert('Data not available for report generation');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Filter orders by variety and convert to the format expected by FarmerReportPDF
      const varietyOrders = ordersData.data.filter(order =>
        order.variety === variety ||
        order.orderDetails?.some(detail => detail.variety === variety)
      );

      const ordersForPDF: Order[] = varietyOrders.map(convertToOrderForPDF);

      // Log the data being sent to PDF
      console.log(`=== VARIETY REPORT PDF DATA FOR ${variety} ===`);
      console.log('Farmer Info:', {
        _id: farmer._id,
        name: farmer.name,
        address: farmer.address,
        mobileNumber: farmer.mobileNumber,
        farmerId: farmer.farmerId,
        createdAt: farmer.createdAt
      });

      console.log('Admin Info:', {
        _id: adminInfo._id,
        name: adminInfo.name,
        coldStorageName: adminInfo.coldStorageDetails.coldStorageName,
        coldStorageAddress: adminInfo.coldStorageDetails.coldStorageAddress,
        bagSizes: adminInfo.preferences?.bagSizes || []
      });

      console.log('Variety Orders Summary:', {
        variety: variety,
        totalOrders: ordersForPDF.length,
        receiptOrders: ordersForPDF.filter(order => order.voucher.type === 'RECEIPT').length,
        deliveryOrders: ordersForPDF.filter(order => order.voucher.type === 'DELIVERY').length,
        orders: ordersForPDF.map(order => ({
          _id: order._id,
          voucherType: order.voucher.type,
          voucherNumber: order.voucher.voucherNumber,
          date: order.dateOfSubmission || order.dateOfExtraction,
          orderDetailsCount: order.orderDetails.length,
          totalBags: order.orderDetails.reduce((total, detail) => {
            if (order.voucher.type === 'RECEIPT') {
              return total + detail.bagSizes.reduce((sum, bag) => sum + (bag.quantity?.initialQuantity || 0), 0);
            } else {
              return total + detail.bagSizes.reduce((sum, bag) => sum + (bag.quantityRemoved || 0), 0);
            }
          }, 0)
        }))
      });
      console.log(`=== END VARIETY REPORT PDF DATA FOR ${variety} ===`);

      // Open PDF in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <body>
              <div id="root" style="height: 100vh;"></div>
              <script>
                window.onbeforeunload = null;
              </script>
            </body>
          </html>
        `);

        const root = printWindow.document.getElementById('root');
        if (root) {
          ReactDOM.createRoot(root).render(
            <PDFViewer width="100%" height="100%">
              <FarmerReportPDF
                farmer={farmer}
                adminInfo={adminInfo}
                orders={ordersForPDF}
              />
            </PDFViewer>
          );
        }
      }
    } catch (error) {
      console.error('Error generating variety report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
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

  // New API call for farmer stock summary
  const {
    data: stockSummaryData,
    isLoading: isStockSummaryLoading,
    error: stockSummaryError,
  } = useQuery({
    queryKey: ['farmerStockSummary', accountIds, adminInfo?.token],
    queryFn: () =>
      accountIds.length > 0 && adminInfo?.token
        ? storeAdminApi.kapoorFarmerStockSummary(accountIds, adminInfo.token)
        : Promise.resolve(undefined),
    enabled: !!adminInfo?.token && accountIds.length > 0,
  });

  // Calculate total bags from stock summary API data
  const totalBags = useMemo(() => {
    if (!stockSummaryData?.stockSummaries) return 0;

    let total = 0;
    Object.values(stockSummaryData.stockSummaries).forEach(farmerVarieties => {
      farmerVarieties.forEach(variety => {
        variety.sizes.forEach(size => {
          total += size.currentQuantity;
        });
      });
    });
    return total;
  }, [stockSummaryData?.stockSummaries]);

  // Calculate farmerStock (cumulative stock across all vouchers in chronological order)
  const farmerStockData = useMemo(() => {
    if (!ordersData?.data) return [];

    // Sort orders by creation date to get chronological sequence
    const sortedOrders = [...ordersData.data].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let cumulativeStock = 0;

    return sortedOrders.map((order) => {
      let currentVoucherStock = 0;

      if (order.voucher.type === 'RECEIPT') {
        // For receipt vouchers, add the total bags from incomingBagSizes
        currentVoucherStock = order.incomingBagSizes?.reduce((total, bag) =>
          total + (bag.quantity?.initialQuantity || 0), 0) || 0;
        cumulativeStock += currentVoucherStock;
      } else if (order.voucher.type === 'DELIVERY') {
        // For delivery vouchers, subtract the total bags removed
        currentVoucherStock = order.orderDetails?.reduce((total, detail) =>
          total + detail.bagSizes.reduce((sum, bag) =>
            sum + (bag.quantityRemoved || 0), 0), 0) || 0;
        cumulativeStock -= currentVoucherStock;
      }

      return {
        orderId: order._id,
        voucherNumber: order.voucher.voucherNumber,
        voucherType: order.voucher.type,
        createdAt: order.createdAt,
        currentVoucherStock,
        farmerStock: cumulativeStock, // This is the cumulative stock after this voucher
        order: order
      };
    });
  }, [ordersData?.data]);

  // Separate incoming and outgoing orders with filtering and sorting
  const filteredAndSortedOrders = useMemo(() => {
    if (!ordersData?.data) return { incoming: [], outgoing: [] };

    let filteredOrders = ordersData.data;

    // Filter by type
    if (orderType !== "all") {
      filteredOrders = filteredOrders.filter(order =>
        orderType === "incoming" ? order.voucher.type === "RECEIPT" : order.voucher.type === "DELIVERY"
      );
    }

    // Sort orders
    filteredOrders = [...filteredOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    // Filter by search receipt number if provided
    if (searchReceiptNumber) {
      filteredOrders = filteredOrders.filter(order =>
        order.voucher.voucherNumber.toString().includes(searchReceiptNumber)
      );
    }

    const incoming = filteredOrders.filter(order => order.voucher.type === "RECEIPT");
    const outgoing = filteredOrders.filter(order => order.voucher.type === "DELIVERY");

    return { incoming, outgoing };
  }, [ordersData?.data, orderType, sortOrder, searchReceiptNumber]);

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
                    onClick={handleViewReport}
                    disabled={isGeneratingPDF || !ordersData?.data || !adminInfo || !isStoreAdmin(adminInfo)}
                  >
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                    <span className="hidden sm:inline">
                      {isGeneratingPDF ? 'Generating...' : t('farmerProfile.viewReport')}
                    </span>
                    <span className="sm:hidden">
                      {isGeneratingPDF ? 'Generating...' : t('farmerProfile.report')}
                    </span>
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
                    <div className="font-bold text-2xl text-primary">
                      {isStockSummaryLoading ? '...' : totalBags}
                    </div>
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
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-200 text-xs font-medium inline-flex items-center justify-center gap-2"
                        onClick={() => handleViewVarietyReport(account.variety)}
                        disabled={isGeneratingPDF || !ordersData?.data || !adminInfo || !isStoreAdmin(adminInfo)}
                      >
                        <FileText className="h-3 w-3 text-primary" />
                        <span className="truncate">
                          {isGeneratingPDF ? 'Generating...' : 'View Report'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        {(isStockSummaryLoading || stockSummaryData?.stockSummaries) && (
          <div className="mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Stock Summary
            </h2>
            {isStockSummaryLoading ? (
              <div className="text-gray-500">Loading stock summary...</div>
            ) : stockSummaryError ? (
              <div className="text-red-500">Failed to load stock summary.</div>
            ) : stockSummaryData?.stockSummaries && Object.keys(stockSummaryData.stockSummaries).length > 0 ? (
              <FarmerStockSummaryTable stockSummaryData={stockSummaryData.stockSummaries} />
            ) : (
              <div className="text-gray-500">No stock summary available.</div>
            )}
          </div>
        )}

        {/* Farmer Stock Timeline Section */}
        {farmerStockData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Stock Timeline
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voucher #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voucher Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cumulative Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {farmerStockData.map((item) => (
                      <tr key={item.orderId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.voucherNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.voucherType === 'RECEIPT'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.voucherType === 'RECEIPT' ? 'Receipt' : 'Delivery'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }).replace(/\//g, '-')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span className={item.voucherType === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}>
                            {item.voucherType === 'RECEIPT' ? '+' : '-'}{item.currentVoucherStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-primary">
                          {item.farmerStock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Section */}
        <div className="mt-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            All Orders ({ordersData?.counts?.incoming || 0} Incoming, {ordersData?.counts?.outgoing || 0} Outgoing)
          </h2>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100 mb-4 sm:mb-6">
            <div className="space-y-4 sm:space-y-5">
              {/* Search Receipt */}
              <div className="relative">
                <div className="relative">
                  <input
                    type="number"
                    value={searchReceiptNumber}
                    onChange={(e) => setSearchReceiptNumber(e.target.value)}
                    placeholder="Search by receipt number..."
                    className="w-full px-4 py-2.5 sm:py-3 pl-11 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm sm:text-base placeholder:text-gray-400 transition-all duration-200"
                  />
                  <Search
                    className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
                {searchReceiptNumber && (
                  <button
                    onClick={() => setSearchReceiptNumber("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="w-full sm:w-[200px]">
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as "all" | "incoming" | "outgoing")}
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <option value="all">All Orders</option>
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>
                <div className="w-full sm:w-[200px]">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <option value="latest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 sm:ml-auto mt-1 sm:mt-0">
                  <button
                    onClick={() => navigate(`/erp/incoming-order`, { state: { farmer } })}
                    className="w-full sm:w-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-xs sm:text-sm lg:text-base font-medium inline-flex items-center justify-center gap-1 sm:gap-2 shadow-sm hover:shadow"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">Add Incoming</span>
                  </button>
                  <button
                    onClick={() => navigate(`/erp/outgoing-order`, { state: { farmer } })}
                    className="w-full sm:w-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-xs sm:text-sm lg:text-base font-medium inline-flex items-center justify-center gap-1 sm:gap-2 shadow-sm hover:shadow"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">Add Outgoing</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isOrdersLoading ? (
            <div className="text-gray-500">Loading orders...</div>
          ) : ordersError ? (
            <div className="text-red-500">Failed to load orders.</div>
          ) : filteredAndSortedOrders.incoming.length === 0 && filteredAndSortedOrders.outgoing.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchReceiptNumber
                    ? "No receipt found"
                    : "No orders found"}
                </h3>
                <p className="text-gray-500">
                  {searchReceiptNumber
                    ? "Try a different receipt number"
                    : "Create a new order to get started"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Incoming Orders */}
              {filteredAndSortedOrders.incoming.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                    Incoming Orders ({filteredAndSortedOrders.incoming.length})
                  </h3>
                  {filteredAndSortedOrders.incoming.map((order) => (
                    <ReceiptVoucherCard key={order._id} order={convertToIncomingOrderNew(order)} />
                  ))}
                </div>
              )}

              {/* Outgoing Orders */}
              {filteredAndSortedOrders.outgoing.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
                    Outgoing Orders ({filteredAndSortedOrders.outgoing.length})
                  </h3>
                  {filteredAndSortedOrders.outgoing.map((order) => (
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
