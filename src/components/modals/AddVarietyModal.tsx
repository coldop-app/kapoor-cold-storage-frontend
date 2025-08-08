import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { storeAdminApi } from "@/lib/api/storeAdmin";

interface Farmer {
  _id: string;
  name: string;
  fatherName?: string;
  address?: string;
  mobileNumber?: string;
}

interface AddVarietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: Farmer;
  token: string;
  onSuccess: () => void;
}

const AddVarietyModal = ({ isOpen, onClose, farmer, token, onSuccess }: AddVarietyModalProps) => {
  const [selectedVariety, setSelectedVariety] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountNumberError, setAccountNumberError] = useState("");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Get available varieties
  const { data: varietiesData, isLoading: isLoadingVarieties } = useQuery({
    queryKey: ['varieties'],
    queryFn: () => storeAdminApi.getVarieties(token),
    enabled: isOpen && !!token,
  });

  // Get existing farmer IDs to prevent duplicates
  const { data: farmerIdData, isLoading: isLoadingFarmerId } = useQuery({
    queryKey: ['farmerIds'],
    queryFn: () => storeAdminApi.checkFarmerId(token),
    enabled: isOpen && !!token,
  });

  // Calculate next farmer ID when farmerIdsData is available
  const nextFarmerId = useMemo(() => {
    if (farmerIdData?.data?.registeredFarmers?.length > 0) {
      const maxId = Math.max(...farmerIdData.data.registeredFarmers.map((id: string) => parseInt(id)));
      return (maxId + 1).toString();
    }
    return "1";
  }, [farmerIdData]);

  // Set the next farmer ID when data is loaded (only if user hasn't interacted)
  useEffect(() => {
    if (farmerIdData?.data?.registeredFarmers && nextFarmerId && !accountNumber && !hasUserInteracted) {
      setAccountNumber(nextFarmerId);
    }
  }, [farmerIdData, nextFarmerId, accountNumber, hasUserInteracted]);

  // Validate account number when it changes
  useEffect(() => {
    if (accountNumber && farmerIdData?.data?.registeredFarmers) {
      const existingIds = farmerIdData.data.registeredFarmers;
      if (existingIds.includes(accountNumber)) {
        setAccountNumberError(`Account number ${accountNumber} is already taken. Please choose a different number.`);
      } else {
        setAccountNumberError("");
      }
    } else {
      setAccountNumberError("");
    }
  }, [accountNumber, farmerIdData]);

  // Handle account number change
  const handleAccountNumberChange = (value: string) => {
    setHasUserInteracted(true);
    setAccountNumber(value);
  };

  // Quick register mutation
  const quickRegisterMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVariety) {
        throw new Error("Please select a variety");
      }

      if (!accountNumber) {
        throw new Error("Account number is required");
      }

      return storeAdminApi.quickRegister({
        name: farmer.name,
        fatherName: farmer.fatherName || farmer.name,
        address: farmer.address || "",
        password: "123456", // Default password
        imageUrl: "https://example.com/farmer-image.jpg", // Default image
        farmerId: accountNumber,
        variety: selectedVariety,
        mobileNumber: farmer.mobileNumber,
      }, token);
    },
    onSuccess: () => {
      toast.success("Variety added successfully!");
      onSuccess();
      onClose();
      setSelectedVariety("");
      setAccountNumber("");
      setAccountNumberError("");
      setHasUserInteracted(false);
    },
    onError: (error: unknown) => {
      console.error("Error adding variety:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add variety";
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariety) {
      toast.error("Please select a variety");
      return;
    }
    if (!accountNumber) {
      toast.error("Account number is required");
      return;
    }

    // Check if account number already exists
    const existingIds = farmerIdData?.data?.registeredFarmers || [];
    if (existingIds.includes(accountNumber)) {
      toast.error(`Account number ${accountNumber} is already taken. Please choose a different number.`);
      return;
    }

    quickRegisterMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Variety</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800">{farmer.name}</h3>
          {farmer.mobileNumber && (
            <p className="text-sm text-blue-600">📱 {farmer.mobileNumber}</p>
          )}
          {farmer.address && (
            <p className="text-sm text-blue-600">📍 {farmer.address}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Variety Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Variety
            </label>
            <select
              value={selectedVariety}
              onChange={(e) => setSelectedVariety(e.target.value)}
              className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition"
              required
            >
              <option value="">Choose a variety</option>
              {isLoadingVarieties ? (
                <option disabled>Loading varieties...</option>
              ) : (
                varietiesData?.varieties?.map((variety: string) => (
                  <option key={variety} value={variety}>
                    {variety}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => handleAccountNumberChange(e.target.value)}
              placeholder="Enter account number"
              className={`w-full p-3 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition ${
                accountNumberError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-border'
              }`}
              disabled={isLoadingFarmerId}
            />
            {isLoadingFarmerId && (
              <p className="text-xs text-muted-foreground mt-1">
                Loading next available account number...
              </p>
            )}
            {accountNumberError && (
              <p className="text-xs text-red-500 mt-1">
                {accountNumberError}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-md bg-background hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickRegisterMutation.isPending || !!accountNumberError}
              className="flex-1 px-4 py-3 bg-primary text-secondary rounded-md hover:bg-primary/85 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quickRegisterMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Adding...
                </div>
              ) : (
                "Add Variety"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVarietyModal;
