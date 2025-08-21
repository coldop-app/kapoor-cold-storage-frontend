import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { storeAdminApi } from "@/lib/api/storeAdmin";
import { RootState } from "@/store";
import { StoreAdmin } from "@/utils/types";
import Loader from "@/components/common/Loader/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnimatedFormStepProps {
  isVisible: boolean;
  children: React.ReactNode;
}

const AnimatedFormStep = ({ isVisible, children }: AnimatedFormStepProps) => {
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState("translateY(15px)");

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setOpacity(1);
        setTransform("translateY(0)");
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      setTransform("translateY(15px)");
    }
  }, [isVisible]);

  return (
    <div
      style={{
        opacity,
        transform,
        position: "relative",
        transition: "opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {children}
    </div>
  );
};

interface BagQuantities {
  [key: string]: string;
}

// Helper function to format bag size label
const formatBagSizeLabel = (bagSize: string): string => {
  if (bagSize.toLowerCase() === 'number-12') return 'Number-12';
  if (bagSize.toLowerCase() === 'cut-tok') return 'Cut & Tok';
  return bagSize
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to convert bag size to field name
const getBagSizeFieldName = (bagSize: string): string => {
  // Convert from API format (e.g., "Cut-tok") to camelCase field name (e.g., "cutTok")
  const normalized = bagSize.toLowerCase().replace(/-/g, '');
  return normalized.charAt(0).toLowerCase() +
         normalized.slice(1).replace(/\b\w/g, c => c.toUpperCase());
};

interface FormData {
  farmerName: string;
  farmerId: string;
  farmerAccount: string;
  quantities: BagQuantities;
  bagLocations: { [key: string]: string };
  bagLocationDetails: {
    [key: string]: { chamber: string; floor: string; row: string };
  };
  remarks: string;
  variety: string;
  dateOfEntry: string;
}

interface KapoorEditIncomingOrderPayload {
  remarks: string;
  dateOfEntry: string;
  variety: string;
  farmerAccount: string;
  incomingBagSizes: {
    size: string;
    quantity: {
      initialQuantity: number;
      currentQuantity: number;
    };
    location: string;
  }[];
}

// Interface for the actual order structure we're receiving
interface ActualOrder {
  _id: string;
  coldStorageId: string;
  farmerId: {
    _id: string;
    name: string;
    address: string;
    mobileNumber: string;
    farmerId: string;
  };
  voucher: {
    type: 'RECEIPT' | 'DELIVERY';
    voucherNumber: number;
  };
  dateOfSubmission?: string;
  fulfilled?: boolean;
  remarks: string;
  currentStockAtThatTime: number;
  orderDetails: Array<{
    variety: string;
    bagSizes: Array<{
      size: string;
      quantity: {
        initialQuantity: number;
        currentQuantity: number;
      };
    }>;
    location: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface EditIncomingOrderFormContentProps {
  order: ActualOrder;
}

const EditIncomingOrderFormContent = ({ order }: EditIncomingOrderFormContentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state: RootState) => state.auth) as { adminInfo: StoreAdmin | null };
  const [currentStep, setCurrentStep] = useState(1);

  console.log("order is: ", order);
  // Initialize form data from order
  const [formData, setFormData] = useState<FormData>(() => {
    console.log('Order received:', order);

    // Check if this is an incoming order (voucher type RECEIPT) or outgoing order (voucher type DELIVERY)
    const isIncomingOrder = order.voucher?.type === 'RECEIPT';
    console.log('Is incoming order (RECEIPT):', isIncomingOrder);

    const quantities: BagQuantities = {};
    let variety = '';
    let remarks = '';

    if (isIncomingOrder) {
      // This is an incoming order - extract from orderDetails (multiple entries with different bag sizes)
      console.log('Processing incoming order with order details:', order.orderDetails);

      // Combine all bag sizes from all order details
      order.orderDetails?.forEach((orderDetail, detailIndex: number) => {
        console.log(`Processing order detail ${detailIndex}:`, orderDetail);
        if (orderDetail.bagSizes) {
          orderDetail.bagSizes.forEach((bag, bagIndex: number) => {
            console.log(`Processing bag ${bagIndex} from detail ${detailIndex}:`, bag);
            if (bag.quantity) {
              // Use the exact bag size name as it comes from the API - no transformation needed
              const fieldName = bag.size;
              console.log(`Field name used: "${fieldName}", Current quantity: ${bag.quantity.currentQuantity}`);
              quantities[fieldName] = bag.quantity.currentQuantity.toString();
            }
          });
        }
      });

      // Get variety from the first order detail (they should all be the same)
      variety = order.orderDetails?.[0]?.variety || '';
      remarks = order.remarks || '';
      console.log('Extracted variety:', variety, 'remarks:', remarks);
    } else {
      // This is an outgoing order - extract from orderDetails
      const orderDetail = order.orderDetails?.[0];
      console.log('Processing outgoing order with order details:', orderDetail);

      if (orderDetail?.bagSizes) {
        orderDetail.bagSizes.forEach((bag) => {
          console.log('Processing outgoing bag:', bag);
          if (bag.quantity) {
            // Use the exact bag size name as it comes from the API - no transformation needed
            const fieldName = bag.size;
            console.log('Field name:', fieldName, 'Current quantity:', bag.quantity.currentQuantity);
            quantities[fieldName] = bag.quantity.currentQuantity.toString();
          }
        });
      }

      variety = orderDetail?.variety || '';
      remarks = order.remarks || '';
    }

    console.log('Final quantities object:', quantities);
    console.log('Admin preferences bag sizes:', adminInfo?.preferences?.bagSizes);

    // Parse existing location data if available
    const bagLocations: { [key: string]: string } = {};
    const bagLocationDetails: { [key: string]: { chamber: string; floor: string; row: string } } = {};

    // If the order has location data, parse it
    if (isIncomingOrder && order.orderDetails) {
      // For incoming orders, check each order detail for location
      order.orderDetails.forEach((orderDetail) => {
        if (orderDetail.bagSizes && orderDetail.location) {
          orderDetail.bagSizes.forEach((bag) => {
            const locationParts = orderDetail.location.split('-');
            if (locationParts.length === 3) {
              // Use the exact bag size name as it comes from the API - no transformation needed
              const fieldName = bag.size;

              bagLocations[fieldName] = orderDetail.location;
              bagLocationDetails[fieldName] = {
                chamber: locationParts[0] || "",
                floor: locationParts[1] || "",
                row: locationParts[2] || ""
              };
            }
          });
        }
      });
    } else if (!isIncomingOrder && order.orderDetails?.[0]?.location) {
      // For outgoing orders, parse the location from orderDetails
      const orderDetail = order.orderDetails[0];
      if (orderDetail && orderDetail.location) {
        const locationParts = orderDetail.location.split('-');
        if (locationParts.length === 3) {
          // Set the main location for all bag sizes
          adminInfo?.preferences?.bagSizes?.forEach(bagSize => {
            // Use the exact bag size name as it comes from admin preferences - no transformation needed
            bagLocations[bagSize] = orderDetail.location || "";
            bagLocationDetails[bagSize] = {
              chamber: locationParts[0] || "",
              floor: locationParts[1] || "",
              row: locationParts[2] || ""
            };
          });
        }
      }
    }

    return {
      farmerName: order.farmerId?.name || '',
      farmerId: order.farmerId?._id || '',
      farmerAccount: order.farmerId?._id || '',
      quantities,
      bagLocations,
      bagLocationDetails,
      remarks,
      variety,
      dateOfEntry: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };
  });

  // Fetch varieties
  const { data: varietiesData, isLoading: isLoadingVarieties } = useQuery({
    queryKey: ['varieties'],
    queryFn: () => storeAdminApi.getVarieties(adminInfo?.token || ''),
    enabled: !!adminInfo?.token,
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateQuantity = (bagType: string, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [bagType]: numericValue
      }
    }));
  };

  const updateLocationDetails = (
    bagType: string,
    field: "chamber" | "floor" | "row",
    value: string
  ) => {
    // Remove spaces from the value
    const trimmedValue = value.replace(/\s/g, '');

    setFormData((prev) => {
      const currentDetails = prev.bagLocationDetails[bagType] || {
        chamber: "",
        floor: "",
        row: "",
      };
      const updatedDetails = { ...currentDetails, [field]: trimmedValue };

      // Combine into single location string
      const locationString = `${updatedDetails.chamber}-${updatedDetails.floor}-${updatedDetails.row}`;

      return {
        ...prev,
        bagLocationDetails: {
          ...prev.bagLocationDetails,
          [bagType]: updatedDetails,
        },
        bagLocations: {
          ...prev.bagLocations,
          [bagType]: locationString,
        },
      };
    });
  };

  const calculateTotal = () => {
    return Object.values(formData.quantities)
      .reduce((sum, quantity) => sum + (parseInt(quantity) || 0), 0);
  };

  const nextStep = () => {
    if (!formData.variety) {
      toast.error(t('editIncomingOrder.errors.selectVariety'));
      return;
    }
    if (calculateTotal() === 0) {
      toast.error(t('editIncomingOrder.errors.enterQuantity'));
      return;
    }
    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      if (!adminInfo?.token) {
        throw new Error("No authentication token found");
      }

      const payload: KapoorEditIncomingOrderPayload = {
        remarks: formData.remarks,
        dateOfEntry: formData.dateOfEntry,
        variety: formData.variety,
        farmerAccount: formData.farmerAccount,
        incomingBagSizes: adminInfo.preferences?.bagSizes?.map(bagSize => {
          const currentQuantity = parseInt(formData.quantities[bagSize] || "0");
          const location = formData.bagLocations[bagSize] || "";
          return {
            size: bagSize,
            quantity: {
              initialQuantity: currentQuantity,
              currentQuantity: currentQuantity
            },
            location: location
          };
        }) || []
      };

      // Use the new Kapoor API
      const updatedOrder = await storeAdminApi.kapoorEditIncomingOrder(order._id, payload, adminInfo.token);

      // Return the response which should maintain the same structure
      return updatedOrder;
    },
    onSuccess: () => {
      toast.success(t('editIncomingOrder.success.orderUpdated'));
      navigate('/erp/daybook');
    },
    onError: (error: unknown) => {
      console.error("Error updating order:", error);
      if (error instanceof Error) {
        toast.error(error.message || t('editIncomingOrder.errors.failedToUpdate'));
      } else {
        toast.error(t('editIncomingOrder.errors.failedToUpdate'));
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all bag locations are filled
    const hasEmptyLocations = adminInfo?.preferences?.bagSizes?.some(
      (bagSize) => {
        const fieldName = getBagSizeFieldName(bagSize);
        const quantity = parseInt(formData.quantities[fieldName] || "0");
        const location = formData.bagLocations[fieldName] || "";
        return quantity > 0 && !location.trim();
      }
    );

    if (hasEmptyLocations) {
      toast.error(t('incomingOrder.errors.enterAllLocations'));
      return;
    }

    updateOrderMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-background rounded-lg shadow-lg border border-border">
      <h1 className="text-2xl font-bold text-center mb-6">{t('editIncomingOrder.title')}</h1>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="w-[90%] max-w-md">
            <div className="relative flex justify-between">
              <div className="absolute h-0.5 bg-muted top-5 left-10 w-[calc(100%-80px)]"></div>
              <div
                className={`absolute h-0.5 top-5 left-10 w-[calc(100%-80px)] transition-colors duration-500 ease-in-out ${
                  currentStep >= 2 ? 'bg-primary' : 'bg-muted'
                }`}
              ></div>

              <div className="relative flex flex-col items-center">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? 'bg-primary text-secondary' : 'bg-muted text-muted-foreground'
                }`}>
                  1
                </div>
                <span className="text-xs mt-2 text-center">{t('incomingOrder.steps.quantities')}</span>
              </div>

              <div className="relative flex flex-col items-center">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? 'bg-primary text-secondary' : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </div>
                <span className="text-xs mt-2 text-center">{t('incomingOrder.steps.details')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Farmer, Variety and Quantities */}
        <AnimatedFormStep isVisible={currentStep === 1}>
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Farmer Details (Read-only) */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <h3 className="text-lg font-medium mb-2">{t('editIncomingOrder.farmerDetails')}</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{formData.farmerName}</p>
                </div>
              </div>

              {/* Date of Entry */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <h3 className="text-lg font-medium mb-2">Date of Entry</h3>
                <input
                  type="date"
                  value={formData.dateOfEntry || new Date().toISOString().split('T')[0]}
                  disabled
                  className="w-full p-3 border border-border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">This date cannot be modified</p>
              </div>

              {/* Variety Selection */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <h3 className="text-lg font-medium mb-2">{t('incomingOrder.variety.title')}</h3>
                <div className="relative">
                  <Select
                    value={formData.variety}
                    onValueChange={(value) => updateFormData('variety', value)}
                    disabled={isLoadingVarieties}
                  >
                    <SelectTrigger className="w-full bg-background">
                      {isLoadingVarieties ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('incomingOrder.variety.loading')}</span>
                        </div>
                      ) : (
                        <SelectValue placeholder={t('incomingOrder.variety.selectPlaceholder')} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {varietiesData?.varieties?.map((variety: string) => (
                        <SelectItem key={variety} value={variety}>
                          {variety}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantities Section */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <h3 className="text-lg font-medium mb-2">{t('incomingOrder.quantities.title')}</h3>
                <div className="space-y-4">
                  {/* Display ALL bag sizes from admin preferences, with quantities if they exist */}
                  {adminInfo?.preferences?.bagSizes?.map((bagSize) => {
                    const quantityValue = formData.quantities[bagSize] || "";
                    console.log(`Rendering form for bag size: "${bagSize}" -> value: "${quantityValue}"`);
                    return (
                      <div key={bagSize} className="flex items-center justify-between">
                        <label className="text-sm font-medium">{formatBagSizeLabel(bagSize)}</label>
                        <input
                          type="text"
                          value={quantityValue}
                          onChange={(e) => updateQuantity(bagSize, e.target.value)}
                          placeholder="-"
                          className="w-32 p-2 border rounded-md bg-background text-center focus:ring-2 focus:ring-primary focus:border-primary transition"
                        />
                      </div>
                    );
                  })}

                  <hr className="border-gray-300" />

                  <div className="flex items-center justify-between font-semibold">
                    <label className="text-sm">{t('incomingOrder.quantities.total')}</label>
                    <span className="text-lg">{calculateTotal()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="font-custom inline-block cursor-pointer rounded-lg bg-primary px-8 py-3 text-lg font-semibold text-secondary no-underline duration-100 hover:bg-primary/85 hover:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {t('editIncomingOrder.continue')}
                </button>
              </div>
            </div>
          )}
        </AnimatedFormStep>

        {/* Step 2: Location and Remarks */}
        <AnimatedFormStep isVisible={currentStep === 2}>
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <h3 className="text-lg font-medium mb-2">{t('incomingOrder.location.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('incomingOrder.location.description')}
                </p>

                <div className="space-y-4">
                  {/* Bag Locations */}
                  {adminInfo?.preferences?.bagSizes?.map((bagSize) => {
                    const quantity = parseInt(
                      formData.quantities[bagSize] || "0"
                    );
                    const locationDetails = formData.bagLocationDetails[
                      bagSize
                    ] || { chamber: "", floor: "", row: "" };

                    // Only show location input if quantity > 0
                    if (quantity === 0) return null;

                    return (
                      <div key={bagSize} className="space-y-3">
                        <label className="block text-sm font-medium">
                          {formatBagSizeLabel(bagSize)} -{" "}
                          {formData.quantities[bagSize] || "0"} {t('bags')}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Chamber
                            </label>
                            <input
                              type="text"
                              data-location-input={`${bagSize}-chamber`}
                              value={locationDetails.chamber}
                              onChange={(e) =>
                                updateLocationDetails(
                                  bagSize,
                                  "chamber",
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const floorInput = document.querySelector(
                                    `input[data-location-input="${bagSize}-floor"]`
                                  ) as HTMLInputElement;
                                  if (floorInput) floorInput.focus();
                                }
                              }}
                              className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition text-center"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Floor
                            </label>
                            <input
                              type="text"
                              data-location-input={`${bagSize}-floor`}
                              value={locationDetails.floor}
                              onChange={(e) =>
                                updateLocationDetails(
                                  bagSize,
                                  "floor",
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const rowInput = document.querySelector(
                                    `input[data-location-input="${bagSize}-row"]`
                                  ) as HTMLInputElement;
                                  if (rowInput) rowInput.focus();
                                  return;
                                }
                              }}
                              className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition text-center"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">
                              Row
                            </label>
                            <input
                              type="text"
                              data-location-input={`${bagSize}-row`}
                              value={locationDetails.row}
                              onChange={(e) =>
                                updateLocationDetails(
                                  bagSize,
                                  "row",
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  // Find next bag size with quantity
                                  const bagSizes = adminInfo?.preferences?.bagSizes || [];
                                  const currentBagIndex = bagSizes.indexOf(bagSize);
                                  const nextBagSize = bagSizes
                                    .slice(currentBagIndex + 1)
                                    .find((size) => {
                                      return (
                                        parseInt(
                                          formData.quantities[size] ||
                                            "0"
                                        ) > 0
                                      );
                                    });

                                  if (nextBagSize) {
                                    const nextChamberInput =
                                      document.querySelector(
                                        `input[data-location-input="${nextBagSize}-chamber"]`
                                      ) as HTMLButtonElement;
                                    if (nextChamberInput) {
                                      nextChamberInput.focus();
                                      return;
                                    }
                                  }

                                  // If no more bag sizes, focus remarks
                                  const remarksTextarea =
                                    document.querySelector(
                                      "[data-remarks-textarea]"
                                    ) as HTMLTextAreaElement;
                                  if (remarksTextarea) remarksTextarea.focus();
                                }
                              }}
                              className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition text-center"
                              required
                            />
                          </div>
                        </div>
                        {formData.bagLocations[bagSize] && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            Combined Location:{" "}
                            <span className="font-medium">
                              {formData.bagLocations[bagSize]}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('incomingOrder.remarks.label')}</label>
                    <textarea
                      value={formData.remarks}
                      data-remarks-textarea
                      onChange={(e) => updateFormData('remarks', e.target.value)}
                      placeholder={t('incomingOrder.remarks.placeholder')}
                      className="w-full p-3 border border-border rounded-md bg-background h-32 resize-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="font-custom flex-1 cursor-pointer rounded-lg border border-primary px-0 py-3 text-base font-medium text-primary bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                >
                  {t('editIncomingOrder.back')}
                </button>
                <button
                  type="submit"
                  disabled={updateOrderMutation.isPending}
                  className="font-custom flex-1 cursor-pointer rounded-lg bg-primary px-0 py-3 text-base font-semibold text-secondary hover:bg-primary/85 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                >
                  {updateOrderMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <Loader size="sm" className="mr-2" />
                      <span>{t('editIncomingOrder.updating')}</span>
                    </div>
                  ) : (
                    t('editIncomingOrder.update')
                  )}
                </button>
              </div>
            </div>
          )}
        </AnimatedFormStep>
      </form>
    </div>
  );
};

export default EditIncomingOrderFormContent;