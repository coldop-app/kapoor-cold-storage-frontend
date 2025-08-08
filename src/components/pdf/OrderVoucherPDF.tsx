import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Order, StoreAdmin } from "@/utils/types";

interface OrderVoucherPDFProps {
  order: Order;
  adminInfo: StoreAdmin;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 25,
    fontFamily: "Helvetica",
    fontSize: 10,
  },

  // Header Section
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  logoSection: {
    width: 70,
    marginRight: 15,
  },
  logo: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 5,
  },
  companyInfo: {
    flex: 1,
    paddingTop: 5,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 3,
    letterSpacing: 1,
  },
  companyAddress: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 2,
  },
  voucherTypeSection: {
    width: 140,
    alignItems: "flex-end",
  },
  voucherType: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 8,
    textDecoration: "underline",
  },
  managerInfo: {
    fontSize: 9,
    textAlign: "right",
    lineHeight: 1.2,
  },

  // Info Section
  infoSection: {
    marginBottom: 15,
    width: "100%",
  },
  infoRowMain: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
    width: "100%",
  },
  infoRowSplit: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
    width: "100%",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "bold",
    width: 120,
    flexShrink: 0,
  },
  infoLabelSmall: {
    fontSize: 10,
    fontWeight: "bold",
    minWidth: 60,
  },
  infoValue: {
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    paddingHorizontal: 5,
    minHeight: 16,
    flex: 1,
    marginRight: 20,
  },
  infoValueSmall: {
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    paddingHorizontal: 5,
    minHeight: 16,
    width: 150,
  },
  dateInfo: {
    fontSize: 11,
    fontWeight: "bold",
  },
  dateContainer: {
    width: 200,
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 5,
  },
  dateValue: {
    fontSize: 11,
    fontWeight: "bold",
  },

  // Table Section
  tableContainer: {
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#000",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    minHeight: 40,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 35,
  },

  // Table Columns
  colChamber: {
    width: "6%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  colFloor: {
    width: "6%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  colRow: {
    width: "6%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  colVariety: {
    width: "12%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  colBagSize: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  colTotal: {
    width: "8%",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },

  // Table Text Styles
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  tableCellText: {
    fontSize: 9,
    textAlign: "center",
  },
  tableCellTextBold: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Bottom Section
  bottomSection: {
    flexDirection: "row",
    marginTop: 25,
  },
  leftBottomSection: {
    flex: 1,
    marginRight: 40,
  },
  rightBottomSection: {
    width: 160,
    alignItems: "center",
  },

  // Total Bags Section
  totalBagsContainer: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
  },
  totalBagsLabel: {
    fontSize: 11,
    fontWeight: "bold",
    minWidth: 130,
  },
  totalBagsValue: {
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    paddingHorizontal: 5,
    minHeight: 16,
    flex: 1,
  },

  // Owner Risk
  ownerRiskText: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 20,
  },

  // Additional Remarks
  additionalRemarksContainer: {
    marginTop: 10,
  },
  additionalRemarksTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  remarksGrid: {
    flexDirection: "column",
  },
  remarksRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  remarksLabel: {
    fontSize: 10,
    fontWeight: "bold",
    minWidth: 60,
  },
  remarksValue: {
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    paddingHorizontal: 5,
    minHeight: 14,
    width: 120,
  },
  remarksSection: {
    marginTop: 15,
    marginBottom: 20, // Add margin bottom to create space
    padding: 10,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 4,
  },
  remarksTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 10,
    color: "#333",
  },

  // Footer styles
  footer: {
    position: "absolute",
    bottom: 25,
    left: 25,
    right: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  coldopLogo: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  coldopText: {
    fontSize: 10,
    color: "#666",
  },

  // Signature
  signatureContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  signatureBox: {
    width: 150,
    height: 60,
    borderTopWidth: 2,
    borderTopColor: "#000",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 8,
  },
  signatureText: {
    fontSize: 11,
    fontWeight: "bold",
  },
});

const OrderVoucherPDF: React.FC<OrderVoucherPDFProps> = ({
  order,
  adminInfo,
}) => {
  const isReceipt = order.voucher.type === "RECEIPT";

  // Get all bag sizes from admin preferences
  const allBagSizes = React.useMemo(() => {
    return adminInfo?.preferences?.bagSizes || [];
  }, [adminInfo?.preferences?.bagSizes]);

  // Calculate total bags
  const calculateTotalBags = () => {
    return order.orderDetails.reduce((total, detail) => {
      if (isReceipt) {
        return (
          total +
          detail.bagSizes.reduce(
            (sum, bag) => sum + (bag.quantity?.initialQuantity || 0),
            0
          )
        );
      } else {
        return (
          total +
          detail.bagSizes.reduce(
            (sum, bag) => sum + (bag.quantityRemoved || 0),
            0
          )
        );
      }
    }, 0);
  };

  // Convert number to words (basic implementation)
  const numberToWords = (num: number): string => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + numberToWords(num % 100) : "")
      );

    return num.toString(); // For numbers > 999, just return the number
  };

  // Define types for table rows
  interface TableBagSize {
    size: string;
    quantity: number | string;
  }

  interface LocationDetails {
    chamber: string;
    floor: string;
    row: string;
  }

  interface TableRow {
    variety: string;
    bagSizes: TableBagSize[];
    location: LocationDetails;
  }

  // Parse location string into chamber, floor, and row
  const parseLocation = (location: string): LocationDetails => {
    if (!location || typeof location !== "string") {
      return { chamber: "", floor: "", row: "" };
    }

    // Expected format: "2-1-C" or "2-1-A" etc.
    const parts = location.trim().split("-");

    // Handle different possible formats
    if (parts.length >= 3) {
      return {
        chamber: parts[0] || "",
        floor: parts[1] || "",
        row: parts[2] || "",
      };
    } else if (parts.length === 2) {
      // If only 2 parts, assume it's chamber-floor
      return {
        chamber: parts[0] || "",
        floor: parts[1] || "",
        row: "",
      };
    } else if (parts.length === 1) {
      // If only 1 part, assume it's chamber
      return {
        chamber: parts[0] || "",
        floor: "",
        row: "",
      };
    }

    return { chamber: "", floor: "", row: "" };
  };

  // Create table rows from order details
  const createTableRows = () => {
    const rows: TableRow[] = [];

    order.orderDetails.forEach((detail) => {
      // For each bag size, create a separate row if it has a quantity
      detail.bagSizes.forEach((bag) => {
        const quantity = isReceipt
          ? bag.quantity?.initialQuantity || 0
          : bag.quantityRemoved || 0;

        if (quantity > 0) {
          // Parse location for this specific bag
          // Priority: bag.location > detail.location > incomingOrder.location
          let locationString = "";

          // Try to get location from different possible sources
          // Priority: bag.location > detail.location > incomingOrder.location
          if (bag.location) {
            locationString = bag.location;
          } else if (detail.location) {
            locationString = detail.location;
          } else if (detail.incomingOrder?.location) {
            locationString = detail.incomingOrder.location;
          }

          // For outgoing orders, try to get location from the incoming order's bag sizes
          if (!locationString && detail.incomingOrder?.incomingBagSizes) {
            const matchingIncomingBag =
              detail.incomingOrder.incomingBagSizes.find(
                (incomingBag) => incomingBag.size === bag.size
              );
            // Note: IncomingBagSize doesn't have location property, but some newer types do
            if (matchingIncomingBag && "location" in matchingIncomingBag) {
              locationString = (matchingIncomingBag as { location: string })
                .location;
            }
          }

          // If still no location, try to get from the incoming order's bag sizes with location
          if (!locationString && detail.incomingOrder?.incomingBagSizes) {
            // Look for any bag size with location in the incoming order
            const bagWithLocation = detail.incomingOrder.incomingBagSizes.find(
              (incomingBag) =>
                "location" in incomingBag &&
                (incomingBag as { location: string }).location
            );
            if (bagWithLocation && "location" in bagWithLocation) {
              locationString = (bagWithLocation as { location: string })
                .location;
            }
          }

          // If still no location, try to get from the order details level
          if (!locationString && detail.location) {
            locationString = detail.location;
          }

          // If still no location, try to get from the incoming order level
          if (!locationString && detail.incomingOrder?.location) {
            locationString = detail.incomingOrder.location;
          }

          const locationDetails = parseLocation(locationString);

          // Debug: Log the location data for this bag
          console.log(
            `Bag ${bag.size}: locationString="${locationString}", parsed=`,
            locationDetails
          );

          // Create a row with this specific bag size and location
          const bagSizesMap = new Map();
          bagSizesMap.set(bag.size, quantity);

          rows.push({
            variety: detail.variety,
            bagSizes: allBagSizes.map((size) => ({
              size,
              quantity: bagSizesMap.get(size) || "-",
            })),
            location: locationDetails,
          });
        }
      });
    });

    return rows;
  };

  const tableRows = createTableRows();
  const totalBags = calculateTotalBags();

  // Calculate row totals (excluding "-" values)
  const calculateRowTotal = (bagSizes: TableBagSize[]) => {
    return bagSizes.reduce((sum, bag) => {
      const qty = bag.quantity;
      return sum + (typeof qty === "number" ? qty : 0);
    }, 0);
  };

  // Calculate column totals for each bag size
  const calculateColumnTotals = () => {
    const columnTotals = new Map<string, number>();

    // Initialize totals for all bag sizes
    allBagSizes.forEach((size) => columnTotals.set(size, 0));

    // Sum up quantities for each column
    tableRows.forEach((row) => {
      row.bagSizes.forEach((bag) => {
        const qty = bag.quantity;
        const currentTotal = columnTotals.get(bag.size) || 0;
        columnTotals.set(
          bag.size,
          currentTotal + (typeof qty === "number" ? qty : 0)
        );
      });
    });

    return columnTotals;
  };

  // Get column totals for the marka row
  const columnTotals = calculateColumnTotals();
  // Calculate total of all column totals

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              {adminInfo.imageUrl ? (
                <Image style={styles.logo} src={adminInfo.imageUrl} />
              ) : (
                <View style={[styles.logo, { backgroundColor: "#f0f0f0" }]} />
              )}
            </View>

            {/* Company Info */}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                {adminInfo.coldStorageDetails.coldStorageName.toUpperCase()}
              </Text>
              <Text style={styles.companyAddress}>
                {adminInfo.coldStorageDetails.coldStorageAddress}
              </Text>
            </View>

            {/* Voucher Type and Manager Info */}
            <View style={styles.voucherTypeSection}>
              <Text style={styles.voucherType}>
                {isReceipt ? "RECEIPT VOUCHER" : "DELIVERY VOUCHER"}
              </Text>
              <Text style={styles.managerInfo}>
                Manager{"\n"}
                {adminInfo.name}
                {"\n"}
                {adminInfo.mobileNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          {/* Voucher Number and Date */}
          <View style={styles.infoRowSplit}>
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Text style={styles.infoLabel}>
                {isReceipt ? "Receipt Voucher No:" : "Delivery Voucher No:"}
              </Text>
              <Text style={styles.infoValue}>
                {order.voucher.voucherNumber}
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Dated:</Text>
              <Text style={styles.dateValue}>
                {new Date(order.createdAt || new Date()).toLocaleDateString(
                  "en-GB"
                )}
              </Text>
            </View>
          </View>

          {/* Party Name */}
          <View style={styles.infoRowMain}>
            <Text style={styles.infoLabel}>Name of the Party:</Text>
            <Text style={styles.infoValue}>{order.farmerId.name}</Text>
          </View>

          {/* Account Number */}
          <View style={styles.infoRowMain}>
            <Text style={styles.infoLabel}>A/c No:</Text>
            <Text style={styles.infoValue}>{order.farmerId.farmerId}</Text>
          </View>

          {/* Address */}
          <View style={styles.infoRowMain}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>
              {order.farmerId.address || "N/A"}
            </Text>
          </View>

          {/* Mobile */}
          <View style={styles.infoRowMain}>
            <Text style={styles.infoLabel}>Mobile:</Text>
            <Text style={styles.infoValue}>
              {order.farmerId.mobileNumber || "N/A"}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colChamber}>
              <Text style={[styles.tableHeaderText, { fontSize: 8 }]}>CH</Text>
            </View>
            <View style={styles.colFloor}>
              <Text style={[styles.tableHeaderText, { fontSize: 8 }]}>FL</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={[styles.tableHeaderText, { fontSize: 8 }]}>Row</Text>
            </View>
            <View style={styles.colVariety}>
              <Text style={[styles.tableHeaderText, { fontSize: 8 }]}>
                Variety
              </Text>
            </View>
            {allBagSizes.map((size, index) => (
              <View key={index} style={styles.colBagSize}>
                <Text style={[styles.tableHeaderText, { fontSize: 8 }]}>
                  {size}
                </Text>
              </View>
            ))}
            <View style={styles.colTotal}>
              <Text style={[styles.tableHeaderText, { fontSize: 8 }]}>
                Total
              </Text>
            </View>
          </View>

          {/* Table Rows */}
          {tableRows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colChamber}>
                <Text style={[styles.tableCellText, { fontSize: 8 }]}>
                  {row.location.chamber}
                </Text>
              </View>
              <View style={styles.colFloor}>
                <Text style={[styles.tableCellText, { fontSize: 8 }]}>
                  {row.location.floor}
                </Text>
              </View>
              <View style={styles.colRow}>
                <Text style={[styles.tableCellText, { fontSize: 8 }]}>
                  {row.location.row}
                </Text>
              </View>
              <View style={styles.colVariety}>
                <Text style={[styles.tableCellText, { fontSize: 8 }]}>
                  {row.variety}
                </Text>
              </View>
              {row.bagSizes.map((bag, bagIndex) => (
                <View key={bagIndex} style={styles.colBagSize}>
                  <Text style={[styles.tableCellText, { fontSize: 8 }]}>
                    {bag.quantity}
                  </Text>
                </View>
              ))}
              <View style={styles.colTotal}>
                <Text style={[styles.tableCellTextBold, { fontSize: 8 }]}>
                  {calculateRowTotal(row.bagSizes)}
                </Text>
              </View>
            </View>
          ))}

          {/* Marka Row */}
          <View style={[styles.tableRow, { backgroundColor: "#f5f5f5" }]}>
            <View style={styles.colChamber}>
              <Text style={[styles.tableCellTextBold, { fontSize: 8 }]}>-</Text>
            </View>
            <View style={styles.colFloor}>
              <Text style={[styles.tableCellTextBold, { fontSize: 8 }]}>-</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={[styles.tableCellTextBold, { fontSize: 8 }]}>-</Text>
            </View>
            <View style={styles.colVariety}>
              <Text style={[styles.tableCellTextBold, { fontSize: 8 }]}>
                Marka
              </Text>
            </View>
            {allBagSizes.map((size, index) => (
              <View key={index} style={styles.colBagSize}>
                <Text style={[styles.tableCellTextBold, { fontSize: 8 }]}>
                  {columnTotals.get(size)
                    ? `${order.farmerId.farmerId}/${columnTotals.get(size)}`
                    : ""}
                </Text>
              </View>
            ))}
            <View style={styles.colTotal}>
              <Text style={[styles.tableCellTextBold, { fontSize: 8 }]}>
                {Array.from(columnTotals.values()).reduce(
                  (sum, total) => sum + total,
                  0
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Left Section */}
          <View style={styles.leftBottomSection}>
            {/* Total Bags in Words */}
            <View style={styles.totalBagsContainer}>
              <Text style={styles.totalBagsLabel}>Total Bags in words:</Text>
              <Text style={styles.totalBagsValue}>
                {totalBags > 0 ? numberToWords(totalBags) : ""}
              </Text>
            </View>

            {/* Remarks Section */}
            {order.remarks && (
              <View style={styles.remarksSection}>
                <Text style={styles.remarksTitle}>Remarks:</Text>
                <Text style={styles.remarksText}>{order.remarks}</Text>
              </View>
            )}
          </View>

          {/* Right Section - Signature */}
          <View style={styles.rightBottomSection}>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureText}>Signature</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer with Coldop Branding */}
        <View style={styles.footer}>
          <Image style={styles.coldopLogo} src="/coldop-logo.png" />
          <Text style={styles.coldopText}>Powered by Coldop</Text>
        </View>
      </Page>
    </Document>
  );
};

export default OrderVoucherPDF;
