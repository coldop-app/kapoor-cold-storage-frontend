export interface Admin {
  _id: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  token: string;
  __v: number;
}

export interface ColdStorageDetails {
  coldStorageName: string;
  coldStorageAddress: string;
  coldStorageContactNumber: string;
  capacity?: number;
}

export interface Preferences {
  bagSizes: string[];
}

export interface StoreAdmin {
  _id: string;
  name: string;
  personalAddress: string;
  mobileNumber: string;
  imageUrl: string;
  password: string;
  coldStorageDetails: ColdStorageDetails;
  coldStorageId: string;
  token: string;
  registeredFarmers: string[]; // Array of Farmer IDs
  role: string;
  isVerified: boolean;
  storeAdminId: number;
  isActive: boolean;
  isPaid: boolean;
  preferences: Preferences;
  forgotPasswordToken?: string;
  forgotPasswordTokenExpiry?: Date;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Farmer {
  _id: string;
  name: string;
  address: string;
  mobileNumber: string;
  farmerId: string;
}

export interface Voucher {
  type: 'RECEIPT' | 'DELIVERY';
  voucherNumber: number;
}

export interface BagSizeQuantity {
  initialQuantity: number;
  currentQuantity: number;
}

export interface BagSize {
  size: string;
  quantity?: BagSizeQuantity;
  quantityRemoved?: number;
  location?: string;
}

export interface IncomingBagSize {
  size: string;
  quantity: {
    initialQuantity: number;
    currentQuantity: number;
  };
  _id: string;
}

export interface IncomingOrder {
  _id: string;
  location: string;
  voucher: Voucher;
  incomingBagSizes: IncomingBagSize[];
}

export interface OrderDetails {
  variety: string;
  bagSizes: BagSize[];
  location?: string;
  incomingOrder?: IncomingOrder;
}

export interface Order {
  _id: string;
  coldStorageId: string;
  farmerId: Farmer;
  voucher: Voucher;
  dateOfSubmission?: string;
  dateOfExtraction?: string;
  fulfilled?: boolean;
  remarks: string;
  currentStockAtThatTime: number;
  orderDetails: OrderDetails[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface OutgoingBagSize {
  size: string;
  quantityRemoved: number;
}

export interface IncomingOrderReference {
  _id: string;
  location: string;
  voucher: {
    type: string;
    voucherNumber: number;
  };
  incomingBagSizes: IncomingBagSize[];
}

export interface OutgoingOrderDetails {
  variety: string;
  incomingOrder: IncomingOrderReference;
  bagSizes: OutgoingBagSize[];
}

export interface OutgoingOrder {
  _id: string;
  coldStorageId: string; // Reference to StoreAdmin
  farmerId: string; // Reference to Farmer
  voucher: {
    type: string;
    voucherNumber: number;
  };
  dateOfExtraction: string;
  remarks?: string;
  orderDetails: OutgoingOrderDetails[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// New interfaces for the updated API response
export interface FarmerProfile {
  _id: string;
  name: string;
  address: string;
}

export interface FarmerAccount {
  _id: string;
  profile: FarmerProfile;
  variety: string;
  farmerId: string;
}

export interface IncomingBagSizeNew {
  size: string;
  quantity: {
    initialQuantity: number;
    currentQuantity: number;
  };
  location: string;
}

export interface IncomingOrderNew {
  _id: string;
  coldStorageId: string;
  farmerAccount: FarmerAccount;
  variety: string;
  incomingBagSizes: IncomingBagSizeNew[];
  dateOfEntry: string;
  remarks: string;
  currentStockAtThatTime: number;
  voucher: {
    type: string;
    voucherNumber: number;
  };
  createdAt: string;
}

export interface IncomingOrdersResponse {
  status: string;
  data: IncomingOrderNew[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

// --- Kapoor Daybook Orders API Types ---
export interface KapoorDaybookOrderVoucher {
  type: 'RECEIPT' | 'DELIVERY';
  voucherNumber: number;
}

export interface KapoorDaybookFarmerAccount {
  _id: string;
  address: string,
  mobileNumber:string,
  name: string;
  farmerId: string;
}

export interface KapoorDaybookOrderIncomingBagSize {
  size: string;
  quantity: {
    initialQuantity: number;
    currentQuantity: number;
  };
  location: string;
}

export interface KapoorDaybookOrderOrderDetail {
  incomingOrder: {
    voucher: KapoorDaybookOrderVoucher;
    _id: string;
    incomingBagSizes: KapoorDaybookOrderIncomingBagSize[];
  };
  variety: string;
  bagSizes: {
    size: string;
    quantityRemoved: number;
    location: string;
  }[];
}

export interface KapoorDaybookOrderData {
  voucher: KapoorDaybookOrderVoucher;
  _id: string;
  coldStorageId: string;
  farmerAccount: KapoorDaybookFarmerAccount;
  dateOfEntry?: string;
  dateOfExtraction?: string;
  remarks: string;
  incomingBagSizes?: KapoorDaybookOrderIncomingBagSize[];
  variety: string;
  createdAt: string;
  currentStockAtThatTime?: number;
  orderDetails?: KapoorDaybookOrderOrderDetail[];
}

export interface KapoorDaybookOrdersPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface KapoorDaybookOrdersResponse {
  status: string;
  data: KapoorDaybookOrderData[];
  pagination: KapoorDaybookOrdersPagination;
}

// New interface for Kapoor outgoing order response
export interface KapoorOutgoingOrderResponse {
  status: string;
  message: string;
  outgoingOrder: {
    coldStorageId: string;
    farmerAccount: string;
    voucher: {
      type: string;
      voucherNumber: number;
    };
    dateOfExtraction: string;
    currentStockAtThatTime: number;
    remarks: string;
    orderDetails: Array<{
      variety: string;
      incomingOrder: {
        _id: string;
        voucher: {
          type: string;
          voucherNumber: number;
        };
        incomingBagSizes: Array<{
          size: string;
          quantity: {
            initialQuantity: number;
            currentQuantity: number;
          };
          location: string;
        }>;
      };
      bagSizes: Array<{
        size: string;
        quantityRemoved: number;
        location: string;
      }>;
    }>;
    createdBy: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}