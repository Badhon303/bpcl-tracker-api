export interface bProcurementData {
  procurementId: number;
  supplierId: number;
  mixedPetQuantity: number;
  mixedPetPrice: number;
  nonPetQuantity: number;
  nonPetPrice: number;
  amberQuantity: number;
  amberPrice: number;
  paymentMethod: string;
  accountNo: string;
  imageLink: string;
  companyId: number;
  userId: number;
  createdAt?: string;
  createdBy?: string;
  latitude?: number;
  longitude?: number;
}

export interface bBaleData {
  baleId: number;
  baleDisplayId: string;
  packagingType: string;
  productType: string;
  quantity: number;
  createdAt?: string;
  createdBy: number;
  companyId: number;
  userId: number;
  shipmentWeight: number;
  status: string;
  latitude?: number;
  longitude?: number;
}

export interface bShipmentData {
  shipmentId: number;
  shipmentDisplayId: string;
  shipmentType: string;
  driverId?: number;
  vehicleId?: number;
  baleIds: number[];
  timestamp?: string;
}

export interface bUnloadShipmentData {
  id: number;
  shipmentId: number;
  totalBales: number;
  totalWeightBeforeUnload: number;
  totalWeightAfterUnload: number;
  receivedShipmentWeight: number;
  createdAt: Date;
  createdBy: number;
  companyId: number;
  userId: number;
  baleIds: number[];
  unloadingNote?: string;
}

export interface bBatchData {
  id: number;
  batchDisplayId: string;
  productType: string;
  status: string;
  createdAt: Date;
  createdBy: number;
  companyId: number;
  userId: number;
  baleIds: number[];
  baleCompanyIds: number[];
}
export interface bPreproductData {
  id: number;
  batchId: number;
  preproductDisplayId: string;
  productType: string;
  grade: string;
  preproductWeight: number;
  wastageWeight?: number | null;
  companyId: number;
  userId: number;
  createdAt: Date;
  createdBy: number;
}
export interface bPackagePreproductData {
  id: number;
  preproductId: number;
  productType: string;
  packageWeight: number;
  remainingPreproductId: number;
  remainingWeight: number;
  status: string;
  createdAt: Date;
  createdBy: number;
  companyId: number;
  userId: number;
}

export interface bPreproductShipmentData {
  id: number;
  shipmentType: string;
  createdAt: Date;
  createdBy: number;
  companyId: number;
  userId: number;
  shipmentPreproductPackages: number[];
}

export interface bLotData {
  id: number;
  productType: string;
  createdAt: Date;
  createdBy: number;
  companyId: number;
  userId: number;
  preproductIds: number[];
}

export interface bResinDhopeData {
  id: number;
  lotId: number;
  machine: string;
  grade: string;
  productType?: string;
  resinDhopeWeight: number;
  wastageWeight?: number;
  createdAt: Date;
  createdBy: number;
  companyId: number;
  userId: number;
}

export interface bResinPackageData {
  id: number;
  resinDhopeId: number;
  remainingResinDhopeId?: number;
  remainingWeight?: number;
  productType?: string;
  packageWeight: number;
  createdAt: Date;
  createdBy: number;
  companyId: number;
  userId: number;
}
export interface bResinPackageShipmentData {
  id: number;
  resinPackageId: number[];
  shipmentType: string;
  createdAt: string;
  createdBy: number;
  companyId: number;
  userId: number;
}
