import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, HelpCircle, UserPlus, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { storeAdminApi } from "@/lib/api/storeAdmin";
import { RootState } from "@/store";
import { StoreAdmin } from "@/utils/types";
import debounce from "lodash/debounce";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import VarietySelector from "@/components/common/VarietySelector/VarietySelector";
import { cn } from "@/lib/utils";

export interface NewFarmerFormData {
  accNo: string;
  name: string;
  fatherName: string;
  address: string;
  contact: string;
  variety: string;
}

const NewFarmerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state: RootState) => state.auth) as { adminInfo: StoreAdmin | null };

  const { data: farmerIdsData } = useQuery({
    queryKey: ['farmerIds'],
    queryFn: () => storeAdminApi.checkFarmerId(adminInfo?.token || ''),
    enabled: !!adminInfo?.token,
  });

  const [formData, setFormData] = useState<NewFarmerFormData>({
    accNo: "",
    name: "",
    fatherName: "",
    address: "",
    contact: "",
    variety: ""
  });

  // Calculate next farmer ID when farmerIdsData is available
  const nextFarmerId = useMemo(() => {
    if (farmerIdsData?.data?.registeredFarmers?.length > 0) {
      const maxId = Math.max(...farmerIdsData.data.registeredFarmers.map((id: string) => parseInt(id)));
      return (maxId + 1).toString();
    }
    return "1";
  }, [farmerIdsData]);

  // Set the next farmer ID when data is loaded
  React.useEffect(() => {
    if (farmerIdsData?.data?.registeredFarmers && nextFarmerId) {
      setFormData(prev => ({ ...prev, accNo: nextFarmerId }));
    }
  }, [farmerIdsData, nextFarmerId]);

  const [accNoError, setAccNoError] = useState<string>("");

  // Create a debounced function to check farmer ID
  const debouncedCheckFarmerId = useMemo(
    () =>
      debounce((id: string, registeredFarmers: string[]) => {
        if (registeredFarmers.includes(id)) {
          setAccNoError(`Farmer ID ${id} is already taken. Please use a different ID.`);
        } else {
          setAccNoError("");
        }
      }, 500),
    []
  );

  const handleChange = (field: keyof NewFarmerFormData, value: string) => {
    // Handle numeric-only validation for accNo field
    if (field === 'accNo') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [field]: numericValue }));

      // Debounced check for existing farmer ID
      if (numericValue && farmerIdsData?.data?.registeredFarmers) {
        debouncedCheckFarmerId(numericValue, farmerIdsData.data.registeredFarmers);
      } else {
        setAccNoError("");
      }
      return;
    }

    // Handle numeric-only validation and 10-digit limit for contact field
    if (field === 'contact') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [field]: numericValue }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that the farmer ID doesn't exist
    if (farmerIdsData?.data?.registeredFarmers?.includes(formData.accNo)) {
      setAccNoError(`Farmer ID ${formData.accNo} is already taken. Please use a different ID.`);
      return;
    }

    // Don't submit if there's an error with the account number
    if (accNoError) {
      return;
    }

    // Validate contact number length only if provided
    if (formData.contact.length > 0 && formData.contact.length !== 10) {
      toast.error('Contact number must be exactly 10 digits');
      return;
    }

    try {
      if (!adminInfo?.token) {
        throw new Error("No authentication token found");
      }

      await storeAdminApi.quickRegister({
        name: formData.name,
        fatherName: formData.fatherName,
        address: formData.address,
        password: "123456", // Hardcoded default password
        imageUrl: "",
        farmerId: formData.accNo,
        variety: formData.variety,
        mobileNumber: formData.contact
      }, adminInfo.token);

      toast.success('Farmer created successfully!');
      navigate('/erp/incoming-order'); // Navigate to incoming orders screen
    } catch (error: any) {
      console.error("Error creating farmer:", error);
      toast.error(error.response?.data?.message || 'Failed to create farmer');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold">Add New Farmer</h1>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-background rounded-lg shadow-lg border border-border">
          {/* Header Section */}
          <div className="p-6 border-b border-border">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Register New Farmer</h2>
              <p className="text-sm text-muted-foreground">
                Add a new farmer to your cold storage management system
              </p>
            </div>

            {/* Farmer ID Info Card */}
            <div className="bg-secondary/50 rounded-lg p-4 border border-secondary">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {farmerIdsData?.data?.registeredFarmers?.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-primary">
                          Next Available ID:
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-sm font-bold rounded">
                          #{nextFarmerId}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Currently {farmerIdsData.data.registeredFarmers.length} farmer(s) registered
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-primary">
                          First Farmer ID:
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-sm font-bold rounded">
                          #1
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will be your first registered farmer
                      </p>
                    </>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-medium">Registered Farmer IDs</h4>
                      <div className="max-h-40 overflow-y-auto">
                        {farmerIdsData?.data?.registeredFarmers?.length > 0 ? (
                          <div className="grid grid-cols-5 gap-2">
                            {farmerIdsData.data.registeredFarmers
                              .sort((a: string, b: string) => parseInt(a) - parseInt(b))
                              .map((id: string) => (
                                <div
                                  key={id}
                                  className="px-2 py-1 bg-secondary text-center rounded text-sm"
                                >
                                  {id}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No farmer IDs registered yet</p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Variety Selection Section - moved above Basic Information */}
              <div className={cn(
                "border rounded-lg p-4",
                formData.variety
                  ? "border-green-200 bg-green-50/50"
                  : "border-muted bg-muted/5"
              )}>
                <h3 className="text-lg font-medium mb-2">Crop Variety</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the primary crop variety this farmer will be dealing with
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Variety <span className="text-red-500">*</span>
                  </label>
                  <VarietySelector
                    value={formData.variety}
                    onValueChange={(value) => handleChange("variety", value)}
                    token={adminInfo?.token || ''}
                  />
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Farmer ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accNo}
                      onChange={(e) => handleChange("accNo", e.target.value)}
                      className={cn(
                        "w-full p-3 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition",
                        accNoError ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-border"
                      )}
                      placeholder="Enter farmer ID"
                      required
                    />
                    {accNoError && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠</span>
                        {accNoError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Father's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => handleChange("fatherName", e.target.value)}
                      className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition"
                      placeholder="Enter father's name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contact}
                      onChange={(e) => handleChange("contact", e.target.value)}
                      className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition"
                      placeholder="Enter 10-digit mobile number (optional)"
                      pattern="[0-9]{10}"
                      maxLength={10}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formData.contact.length}/10 digits
                      </p>
                      {formData.contact.length === 10 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Valid
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
                    placeholder="Enter complete address"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 px-4 border border-primary text-primary rounded-lg hover:bg-secondary/90 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-primary text-secondary rounded-lg hover:bg-primary/85 transition font-semibold"
                >
                  Register Farmer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewFarmerScreen;