import axios from "axios";
import { BASE_URL } from "@/utils/const";
import { IncomingOrdersResponse, KapoorOutgoingOrderResponse, KapoorFarmerStockSummaryResponse } from "@/utils/types";
import { KapoorDaybookOrdersResponse } from "@/utils/types";

interface LoginCredentials {
  mobileNumber: string;
  password: string;
  isMobile: boolean;
}

interface QuickRegisterCredentials {
  name: string;
  fatherName: string;
  address: string;
  password: string;
  imageUrl: string;
  farmerId: string;
  variety: string;
  mobileNumber?: string; // Optional field
}

interface SignupCredentials {
  name: string;
  personalAddress: string;
  mobileNumber: string;
  coldStorageName: string;
  coldStorageAddress: string;
  coldStorageContactNumber: string;
  capacity?: number;
  password: string;
  imageUrl: string;
  isVerified: boolean;
  isMobile: boolean;
  preferences: {
    bagSizes: string[];
  };
}

interface DaybookOrdersParams {
  type: 'all' | 'incoming' | 'outgoing';
  sortBy: 'latest' | 'oldest';
  page: number;
  limit: number;
}

interface SearchReceiptParams {
  receiptNumber: number;
}

interface SearchByVarietyParams {
  variety: string;
  storeAdminId: string;
}

interface CreateOrderPayload {
  farmerAccount: string;
  variety: string;
  incomingBagSizes: {
    size: string;
    quantity: {
      initialQuantity: number;
      currentQuantity: number;
    };
    location: string;
  }[];
  dateOfEntry: string;
  remarks: string;
}

interface BagUpdate {
  size: string;
  quantityToRemove: number;
  location: string; // Add location field
}

interface OutgoingOrderDetail {
  orderId: string;
  variety: string;
  bagUpdates: BagUpdate[];
}

interface CreateOutgoingOrderPayload {
  orders: OutgoingOrderDetail[];
  remarks: string;
}

interface CreateFarmerPayload {
  accNo: string;
  name: string;
  address: string;
  mobileNumber: string;
  coldStorageId: string;
}

interface UpdateProfilePayload {
  name: string;
  personalAddress: string;
  mobileNumber: string;
  coldStorageName: string;
  coldStorageAddress: string;
  coldStorageContactNumber: string;
  capacity?: number;
  imageUrl: string;
  preferences: {
    bagSizes: string[];
  };
  isMobile: boolean;
  password?: string | undefined;
}

interface UpdateIncomingOrderPayload {
  remarks: string;
  dateOfSubmission: string;
  fulfilled: boolean;
  orderDetails: {
    variety: string;
    location: string;
    bagSizes: {
      size: string;
      quantity: {
        initialQuantity: number;
        currentQuantity: number;
      };
    }[];
  }[];
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

interface KapoorEditIncomingOrderResponse {
  status: string;
  message: string;
  data: {
    voucher: {
      type: string;
      voucherNumber: number;
    };
    _id: string;
    coldStorageId: string;
    farmerAccount: string;
    variety: string;
    incomingBagSizes: {
      size: string;
      quantity: {
        initialQuantity: number;
        currentQuantity: number;
      };
      location: string;
    }[];
    dateOfEntry: string;
    remarks: string;
    currentStockAtThatTime: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    farmerCurrentStockAtThatTime: number;
  };
}

interface UploadProfilePhotoResponse {
  status: string;
  data: {
    url: string;
  };
  message?: string;
}

interface DeleteProfilePhotoPayload {
  publicId: string;
}

interface DeleteProfilePhotoResponse {
  status: string;
  message?: string;
}

interface Farmer {
  _id: string;
  name: string;
  address: string;
  mobileNumber: string;
  farmerId: string;
  createdAt: string;
}

interface FarmersResponse {
  status: string;
  populatedFarmers: Farmer[];
}

interface CountResponse {
  success: boolean;
  currentCount: number;
  message?: string;
  error?: string;
}

interface ReceiptNumberResponse {
  status: string;
  receiptNumber: number;
}

interface FarmerAccount {
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

interface FarmerAccountsResponse {
  status: string;
  data: FarmerAccount[];
}

export interface FarmerProfile {
  _id: string;
  name: string;
  fatherName: string;
  address: string;
  imageUrl: string;
  mobileNumber?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface FarmerProfilesResponse {
  status: string;
  data: FarmerProfile[];
}

interface KapoorColdStorageSummarySize {
  size: string;
  initialQuantity: number;
  currentQuantity: number;
  quantityRemoved?: number;
}

interface KapoorColdStorageSummaryVariety {
  variety: string;
  sizes: KapoorColdStorageSummarySize[];
}

interface KapoorStockTrend {
  month: string;
  totalStock: number;
}

interface KapoorColdStorageSummaryResponse {
  status: string;
  stockSummary: KapoorColdStorageSummaryVariety[];
  stockTrend: KapoorStockTrend[];
}

interface KapoorTopFarmer {
  _id: string;
  totalBags: number;
  varieties: string[];
  bagSummary: {
    [key: string]: number;
  };
  farmerId: string;
  farmerName: string;
  fatherName: string;
  address: string;
  mobileNumber: string;
  accountId: string;
}

interface KapoorTopFarmersResponse {
  status: string;
  message: string;
  data: KapoorTopFarmer[];
}

interface KapoorOrderByVariety {
  _id: string;
  variety: string;
  dateOfEntry: string;
  voucher: {
    type: string;
    voucherNumber: number;
  };
  remarks: string;
  currentStockAtThatTime: number;
  incomingBagSizes: Array<{
    quantity: {
      initialQuantity: number;
      currentQuantity: number;
    };
    size: string;
    location: string;
  }>;
  farmer: {
    accountId: string;
    name: string;
    fatherName: string;
    mobileNumber: string;
    address: string;
  };
  createdAt: string;
}

interface KapoorOrdersByVarietyResponse {
  status: string;
  message: string;
  data: KapoorOrderByVariety[];
}

export interface KapoorSingleFarmerIncomingOrdersResponse {
  status: string;
  data: Array<{
    voucher: {
      type: string;
      voucherNumber: number;
    };
    _id: string;
    coldStorageId: string;
    farmerAccount: {
      _id: string;
      profile: {
        _id: string;
        name: string;
        address: string;
      };
      variety: string;
      farmerId: string;
    };
    variety: string;
    incomingBagSizes: Array<{
      size: string;
      quantity: {
        initialQuantity: number;
        currentQuantity: number;
      };
      location: string;
    }>;
    dateOfEntry: string;
    remarks: string;
    createdAt: string;
  }>;
  count: number;
}

export interface KapoorSingleFarmerAllOrdersResponse {
  status: string;
  data: Array<{
    voucher: {
      type: string;
      voucherNumber: number;
    };
    _id: string;
    coldStorageId: string;
    farmerAccount: {
      _id: string;
      name: string;
      address: string;
      mobileNumber: string;
      farmerId: string;
    };
    dateOfEntry?: string;
    dateOfExtraction?: string;
    remarks: string;
    currentStockAtThatTime: number;
    incomingBagSizes?: Array<{
      size: string;
      quantity: {
        initialQuantity: number;
        currentQuantity: number;
      };
      location: string;
    }>;
    variety?: string;
    orderDetails?: Array<{
      incomingOrder: {
        voucher: {
          type: string;
          voucherNumber: number;
        };
        _id: string;
        incomingBagSizes: Array<{
          size: string;
          quantity: {
            initialQuantity: number;
            currentQuantity: number;
          };
          location: string;
        }>;
      };
      variety: string;
      bagSizes: Array<{
        size: string;
        quantityRemoved: number;
        location: string;
      }>;
    }>;
    createdAt: string;
  }>;
  counts: {
    incoming: number;
    outgoing: number;
  };
}

export const storeAdminApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await axios.post(
      `${BASE_URL}/api/store-admin/login`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  register: async (credentials: SignupCredentials) => {
    const response = await axios.post(
      `${BASE_URL}/api/store-admin/register`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  sendOtp: async (mobileNumber: string) => {
    const formData = new URLSearchParams();
    formData.append("mobileNumber", mobileNumber);

    const response = await axios.post(
      `${BASE_URL}/api/store-admin/send-otp`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  },

  verifyOtp: async (mobileNumber: string, enteredOtp: string) => {
    const formData = new URLSearchParams();
    formData.append("mobileNumber", mobileNumber);
    formData.append("enteredOtp", enteredOtp);

    const response = await axios.post(
      `${BASE_URL}/api/store-admin/verify-mobile`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  },

  resendOtp: async (mobileNumber: string) => {
    const formData = new URLSearchParams();
    formData.append("mobileNumber", mobileNumber);

    const response = await axios.post(
      `${BASE_URL}/api/store-admin/resend-otp`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  },

  editMobile: async (mobileNumber: string) => {
    const formData = new URLSearchParams();
    formData.append("mobileNumber", mobileNumber);

    const response = await axios.post(
      `${BASE_URL}/api/store-admin/edit-mobile`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  },

  getDaybookOrders: async (params: DaybookOrdersParams, token: string) => {
    const response = await axios.get(
      `${BASE_URL}/api/store-admin/kapoor/incoming-orders`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data as IncomingOrdersResponse;
  },

  searchReceipt: async (params: SearchReceiptParams, token: string) => {
    const response = await axios.post(
      `${BASE_URL}/api/store-admin/daybook/search-receipt`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  searchByVariety: async (params: SearchByVarietyParams, token: string) => {
    const response = await axios.post(
      `${BASE_URL}/api/store-admin/orders/search-by-variety`,
      params,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getFarmers: async (token: string): Promise<FarmersResponse> => {
    const response = await axios.get<FarmersResponse>(
      `${BASE_URL}/api/store-admin/farmers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getFarmerStockSummary: async (farmerId: string, token: string) => {
    const response = await axios.get(
      `${BASE_URL}/api/store-admin/farmers/${farmerId}/stock-summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getColdStorageSummary: async (token: string) => {
    const response = await axios.get(
      `${BASE_URL}/api/store-admin/cold-storage-summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  createIncomingOrder: async (payload: CreateOrderPayload, token: string) => {
    const response = await axios.post(
      `${BASE_URL}/api/store-admin/kapoor/incoming-orders`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  searchFarmers: async (
    _coldStorageId: string,
    query: string,
    token: string
  ) => {
    const response = await axios.get(
      `${BASE_URL}/api/store-admin/kapoor/farmer-profiles/search`,
      {
        params: { searchQuery: query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getVarieties: async (token: string) => {
    const response = await axios.get(`${BASE_URL}/api/store-admin/varieties`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  createOutgoingOrder: async (
    farmerAccountId: string,
    payload: CreateOutgoingOrderPayload,
    token: string
  ): Promise<KapoorOutgoingOrderResponse> => {
    const response = await axios.post<KapoorOutgoingOrderResponse>(
      `${BASE_URL}/api/store-admin/kapoor/outgoing-orders/${farmerAccountId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getFarmerIncomingOrders: async (farmerId: string, token: string) => {
    const response = await axios.get(
      `${BASE_URL}/api/store-admin/farmers/${farmerId}/orders/incoming`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  quickRegister: async (
    credentials: QuickRegisterCredentials,
    token?: string
  ) => {
    const payload = {
      name: credentials.name,
      fatherName: credentials.fatherName,
      address: credentials.address,
      password: credentials.password,
      imageUrl: credentials.imageUrl,
      farmerId: credentials.farmerId,
      variety: credentials.variety,
      ...(credentials.mobileNumber && {
        mobileNumber: credentials.mobileNumber,
      }),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${BASE_URL}/api/store-admin/kapoor/quick-register`,
      payload,
      { headers }
    );
    return response.data;
  },

  createFarmer: async (payload: CreateFarmerPayload, token: string) => {
    const response = await axios.post(
      `${BASE_URL}/api/store-admin/farmers`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  checkFarmerId: async (token: string) => {
    const response = await axios.get(
      `${BASE_URL}/api/store-admin/kapoor/farmer-ids`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getFarmerOrders: async (farmerId: string, token: string) => {
    const response = await axios.get(
      `${BASE_URL}/api/store-admin/farmers/${farmerId}/orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload, token: string) => {
    const response = await axios.put(
      `${BASE_URL}/api/store-admin/profile`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  updateIncomingOrder: async (
    orderId: string,
    payload: UpdateIncomingOrderPayload,
    token: string
  ) => {
    const response = await axios.put(
      `${BASE_URL}/api/store-admin/incoming-orders/${orderId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  uploadProfilePhoto: async (image: File) => {
    const formData = new FormData();
    formData.append("image", image);

    const response = await axios.post<UploadProfilePhotoResponse>(
      `${BASE_URL}/api/store-admin/upload-profile-photo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  deleteProfilePhoto: async (payload: DeleteProfilePhotoPayload) => {
    const response = await axios.delete<DeleteProfilePhotoResponse>(
      `${BASE_URL}/api/store-admin/delete-profile-photo`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: payload,
      }
    );
    return response.data;
  },

  getTopFarmers: async (token: string) => {
    const response = await axios.get<KapoorTopFarmersResponse>(`${BASE_URL}/api/store-admin/top-farmers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  incrementCount: async () => {
    const response = await axios.post<CountResponse>(
      `${BASE_URL}/api/count/increment`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  getCount: async () => {
    const response = await axios.get<CountResponse>(`${BASE_URL}/api/count`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  getReceiptNumber: async (type: "incoming" | "outgoing", token: string) => {
    const response = await axios.get<ReceiptNumberResponse>(
      `${BASE_URL}/api/store-admin/receipt-number`,
      {
        params: { type },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  getKapoorVoucherNumber: async (token: string) => {
    const response = await axios.get<ReceiptNumberResponse>(
      `${BASE_URL}/api/store-admin/kapoor/receipt-voucher-numbers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  getFarmerAccounts: async (
    farmerProfileId: string,
    token: string
  ): Promise<FarmerAccountsResponse> => {
    const response = await axios.get<FarmerAccountsResponse>(
      `${BASE_URL}/api/store-admin/kapoor/farmer-profiles/${farmerProfileId}/accounts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Fetches all farmer profiles for the Kapoor cold storage.
   * @param token JWT Bearer token for authentication
   * @returns Promise<FarmerProfilesResponse>
   */
  getFarmerProfiles: async (token: string): Promise<FarmerProfilesResponse> => {
    const response = await axios.get<FarmerProfilesResponse>(
      `${BASE_URL}/api/store-admin/kapoor/farmer-profiles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Fetches the cold storage summary for the Kapoor cold storage.
   * @param token JWT Bearer token for authentication
   * @returns Promise<KapoorColdStorageSummaryResponse>
   */
  kapoorColdStorageSummary: async (token: string): Promise<KapoorColdStorageSummaryResponse> => {
    const response = await axios.get<KapoorColdStorageSummaryResponse>(
      `${BASE_URL}/api/store-admin/kapoor/cold-storage-summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Fetches all incoming orders for a single farmer (Kapoor cold storage) by farmerAccountIds.
   * @param farmerAccountIds Array of farmer account IDs
   * @param token JWT Bearer token for authentication
   * @returns Promise<KapoorSingleFarmerIncomingOrdersResponse>
   */
  kapoorGetAllIncomingOrdersOfSingleFarmer: async (
    farmerAccountIds: string[],
    token: string
  ): Promise<KapoorSingleFarmerIncomingOrdersResponse> => {
    const response = await axios.post<KapoorSingleFarmerIncomingOrdersResponse>(
      `${BASE_URL}/api/store-admin/kapoor/incoming-orders/single-farmer`,
      { farmerAccountIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  kapoorGetAllOrdersOfaSingleFarmer: async (
    farmerAccountIds: string[],
    token: string
  ): Promise<KapoorSingleFarmerAllOrdersResponse> => {
    const response = await axios.post<KapoorSingleFarmerAllOrdersResponse>(
      `${BASE_URL}/api/store-admin/kapoor/all-orders/single-farmer`,
      { farmerAccountIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  getKapoorDaybookOrders: async (
    token: string,
    type: string = "all",
    params: Record<string, unknown> = {}
  ): Promise<KapoorDaybookOrdersResponse> => {
    const response = await axios.get<KapoorDaybookOrdersResponse>(
      `${BASE_URL}/api/store-admin/kapoor/daybook-orders`,
      {
        params: { type, ...params },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Fetches the top farmers for the Kapoor cold storage.
   * @param token JWT Bearer token for authentication
   * @returns Promise<KapoorTopFarmersResponse>
   */
  getKapoorTopFarmers: async (token: string): Promise<KapoorTopFarmersResponse> => {
    const response = await axios.get<KapoorTopFarmersResponse>(
      `${BASE_URL}/api/store-admin/kapoor/top-farmers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Fetches orders by variety for the Kapoor cold storage.
   * @param token JWT Bearer token for authentication
   * @param variety The variety to search for
   * @param storeAdminId The store admin ID
   * @returns Promise<KapoorOrdersByVarietyResponse>
   */
  getKapoorOrderByVariety: async (
    token: string,
    variety: string,
    storeAdminId: string
  ): Promise<KapoorOrdersByVarietyResponse> => {
    const response = await axios.post<KapoorOrdersByVarietyResponse>(
      `${BASE_URL}/api/store-admin/kapoor/search-orders`,
      {
        variety,
        storeAdminId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Fetches farmer stock summary for multiple farmers (Kapoor cold storage).
   * @param farmerAccountIds Array of farmer account IDs
   * @param token JWT Bearer token for authentication
   * @returns Promise<KapoorFarmerStockSummaryResponse>
   */
  kapoorFarmerStockSummary: async (
    farmerAccountIds: string[],
    token: string
  ): Promise<KapoorFarmerStockSummaryResponse> => {
    const response = await axios.post<KapoorFarmerStockSummaryResponse>(
      `${BASE_URL}/api/store-admin/kapoor/farmer-stock-summary`,
      { farmerAccountIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Edits an incoming order for the Kapoor cold storage.
   * @param orderId The ID of the incoming order to edit
   * @param payload The updated order data
   * @param token JWT Bearer token for authentication
   * @returns Promise<KapoorEditIncomingOrderResponse>
   */
  kapoorEditIncomingOrder: async (
    orderId: string,
    payload: KapoorEditIncomingOrderPayload,
    token: string
  ): Promise<KapoorEditIncomingOrderResponse> => {
    const response = await axios.put<KapoorEditIncomingOrderResponse>(
      `${BASE_URL}/api/store-admin/kapoor/incoming-orders/${orderId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
