sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator"
], (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, BusyIndicator) => {
    "use strict";

    return Controller.extend("weighment.controller.Details", {
        onInit() {
            var DetailModel = new JSONModel();
            this.getView().setModel(DetailModel, "DetailModel");

            var EditModel = new JSONModel();
            this.getView().setModel(EditModel, "EditModel");

            var route = this.getOwnerComponent().getRouter().getRoute("RouteWeighmentDetails")
            route.attachPatternMatched(this._onRouteMatched, this);
        },
        onUploadPress1: function () {
            // Trigger file selection
            this.getView().byId("fileUploader").$().find("input").trigger("click");
        },
        onFileChange: function (oEvent) {
            let oFile = oEvent.getParameter("files")[0]; // Get the selected file
            if (oFile && oFile.name.endsWith(".xlsx")) {
                let reader = new FileReader();
                reader.onload = (e) => {
                    let data = new Uint8Array(e.target.result);
                    let workbook = XLSX.read(data, { type: "array" });
                    let firstSheetName = workbook.SheetNames[0];
                    let firstSheet = workbook.Sheets[firstSheetName];
                    let firstCell1 = firstSheet["A1"] ? firstSheet["A1"].v : "No data";

                    // Set the value in input field
                    // this.getView().byId("excelInput").setValue(firstCell);
                    console.log(firstCell1);
                    let firstCell = firstCell1.toFixed(2);
                    let DetailModel = this.getView().getModel("DetailModel");
                    if (this.OrderType && (this.OrderType == 'CBRE' || this.OrderType == 'CBAR')) {
                        if (this.WeighmentType === 'Initial') {
                            DetailModel.setProperty("/GrossWeight", firstCell);
                        } else if (this.WeighmentType === 'Final') {
                            DetailModel.setProperty("/TareWeight", firstCell);
                        }
                    } else if (this.GateType == 'Purchase' || this.GateType == 'Manual') {
                        if (this.WeighmentType === 'Initial') {
                            DetailModel.setProperty("/GrossWeight", firstCell);
                        } else if (this.WeighmentType === 'Final') {
                            DetailModel.setProperty("/TareWeight", firstCell);
                        }
                    } else {
                        if (this.WeighmentType === 'Initial') {
                            DetailModel.setProperty("/TareWeight", firstCell);
                        } else if (this.WeighmentType === 'Final') {
                            DetailModel.setProperty("/GrossWeight", firstCell);
                        }
                    }
                    this.onWeightChange();
                };
                reader.readAsArrayBuffer(oFile);

            } else {
                sap.m.MessageToast.show("Please select a valid Excel file!");
            }
        },
        _onRouteMatched: function (oEvent) {
            var oModel = this.getView().getModel(),
                DetailModel = this.getView().getModel("DetailModel"),
                EditModel = this.getView().getModel("EditModel"),
                GateNumber = oEvent.getParameter("arguments").GateNumber,
                Edit = oEvent.getParameter("arguments").Edit;
            this.WeighmentType = oEvent.getParameter("arguments").WeighmentType;

            var aFilters = [];
            aFilters.push(new Filter("GateNumber", FilterOperator.EQ, GateNumber))

            BusyIndicator.show();
            oModel.read("/Header('" + GateNumber + "')", {
                success: function (response) {
                    DetailModel.setProperty("/", response);
                    var Gateintime = this.TimeFormat(response.GateInTime.ms)
                    DetailModel.setProperty("/GateInTime", Gateintime);
                    var initWeightime = this.TimeFormat(response.InitWtTime.ms)
                    DetailModel.setProperty("/InitWtTime", initWeightime);
                    var FinalWeightime = this.TimeFormat(response.FinalWtTime.ms)
                    DetailModel.setProperty("/FinalWtTime", FinalWeightime);
                    this.GateType = response.GateType;

                    if (Edit && response.GeStatus !== 'Close' && response.GeStatus !== '') {
                        EditModel.setProperty("/GeStatus", true);
                        const isSales = this.GateType === "Sales";
                        const isInitialWeighment = this.WeighmentType === "Initial";

                        // Toggle visibility
                        this.getView().byId("idPurchasingDoc").setVisible(!isSales);
                        this.getView().byId("idSalesOrd").setVisible(isSales);

                        // Determine editable fields
                        const editableFields = isInitialWeighment
                            ? { gross: !isSales, tare: isSales }
                            : { gross: isSales, tare: !isSales };

                        this.getView().byId("idWeighBridgeGross").setEditable(editableFields.gross);
                        this.getView().byId("idWeighBridgeTare").setEditable(editableFields.tare);
                    } else {
                        EditModel.setProperty("/GeStatus", false);
                        this.getView().byId("idWeighBridgeGross").setEditable(false);
                        this.getView().byId("idWeighBridgeTare").setEditable(false);
                    }
                    EditModel.updateBindings(true);
                    const isSales = response.GateType === 'Sales';

                    this.getView().byId("idPurchasingDoc").setVisible(!isSales);
                    this.getView().byId("idSalesOrd").setVisible(isSales);

                    this.getView().byId('idWeighBridgeTare').setValue(
                        isSales ? response.InitWeighBridgeCode : response.FinalWeighBridgeCode
                    );

                    this.getView().byId('idWeighBridgeGross').setValue(
                        isSales ? response.FinalWeighBridgeCode : response.InitWeighBridgeCode
                    );
                    DetailModel.updateBindings(true);

                    if (this.GateType === "Sales") this.getOrderType(response.SalesDocument);
                    BusyIndicator.hide();
                }.bind(this),
                error: function (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    BusyIndicator.hide();
                }
            });
        },
        onChangeWeighBridge: function (oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();

            // Allow only 1 or 2
            if (!sValue.match(/^[12]?$/)) {
                oInput.setValue(sValue.slice(0, -1)); // Remove last invalid character
            }
        },
        getOrderType: function (SalesDocument) {
            const oModel = this.getView().getModel();
            oModel.read(`/SoHead('${SalesDocument}')`, {
                success: (response) => {
                    console.log(response);
                    this.OrderType = response.SalesOrderType;
                },
                error: (error) => {
                    console.log(error);
                    MessageBox.error(JSON.parse(error.responseText).error.message.value);
                }
            });
        },
        onPressEdit: function () {
            const isInitial = this.WeighmentType === "Initial";
            this.getView().byId(isInitial ? "idGrossWeight" : "idTareWeight").setEditable(true);
            this.getView().byId("idCaptureBtn").setEnabled(true);
        },
        onPressClear: function () {
            this.getView().byId(this.WeighmentType === "Initial" ? "idGrossWeight" : "idTareWeight").setValue("");
        },
        TimeFormat: function (timems) {
            return timems ? new Date(timems).toISOString().slice(11, 19) : "";
        },
        onWeightChange: function () {
            const DetailModel = this.getView().getModel("DetailModel");

            // Retrieve and format weights
            const grossWeight = parseFloat(DetailModel.getProperty("/GrossWeight")) || 0;
            const tareWeight = parseFloat(DetailModel.getProperty("/TareWeight")) || 0;

            if (grossWeight) DetailModel.setProperty("/GrossWeight", grossWeight.toFixed(3));
            if (tareWeight) DetailModel.setProperty("/TareWeight", tareWeight.toFixed(3));

            // Calculate and update NetWeight
            if (grossWeight && tareWeight) {
                DetailModel.setProperty("/NetWeight", (grossWeight - tareWeight).toFixed(3));
            }
            DetailModel.updateBindings(true);
        },
        handleBackNavigation: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteWeighment", {
                Load: true
            })
        },
        dateFormatter: function (dateVal) {
            if (!dateVal) return "";
            const date = new Date(
                dateVal.substring(0, 4),
                dateVal.substring(4, 6) - 1,
                dateVal.substring(6, 8)
            );
            return sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MMM dd yyyy" }).format(date);
        },
        formatTime: function (timeString) {
            return timeString ? new Date(timeString).toISOString().slice(11, 19) : "";
        },
        addDecimalPoint: function (oEvent) {
            const sValue = oEvent.getSource().getValue();
            if (sValue) oEvent.getSource().setValue(parseFloat(sValue).toFixed(3));
        },
        onPressCaptureWeight: function (oEvent) {
            if (!this.FileUploadDialog) {
                this.FileUploadDialog = new sap.ui.xmlfragment("weighment.fragments.FileUpload", this);
                this.getView().addDependent(this.FileUploadDialog);
            }
            this.FileUploadDialog.open();
        },
        onUploadPress: function () {
            var DetailModel = this.getView().getModel("DetailModel");
            var oFileUploader = sap.ui.getCore().byId("FileUploaderId");
            if (!oFileUploader.getValue()) {
                MessageToast.show("Please select a file first.");
                return;
            }

            var oFile = oFileUploader.oFileUpload.files[0]; // get the file from the FileUploader control          
            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    // Read the file into an ArrayBuffer
                    var data = new Uint8Array(e.target.result);

                    // Parse the file using XLSX library
                    var workbook = XLSX.read(data, { type: "array" });

                    // Access the first sheet
                    var sheetName = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[sheetName];

                    // Convert the sheet to JSON
                    var excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (excelData.length > 0 && excelData[0].length > 0) {
                        // Get the value from the first cell in the first row
                        var singleValue = excelData[0][0];

                        // Set the value in the model
                        if (this.OrderType && (this.OrderType == 'CBRE' || this.OrderType == 'CBAR')) {
                            if (this.WeighmentType === 'Initial') {
                                DetailModel.setProperty("/GrossWeight", singleValue);
                            } else if (this.WeighmentType === 'Final') {
                                DetailModel.setProperty("/TareWeight", singleValue);
                            }
                        } else if (this.GateType == 'Purchase' || this.GateType == 'Manual') {
                            if (this.WeighmentType === 'Initial') {
                                DetailModel.setProperty("/GrossWeight", singleValue);
                            } else if (this.WeighmentType === 'Final') {
                                DetailModel.setProperty("/TareWeight", singleValue);
                            }
                        } else {
                            if (this.WeighmentType === 'Initial') {
                                DetailModel.setProperty("/TareWeight", singleValue);
                            } else if (this.WeighmentType === 'Final') {
                                DetailModel.setProperty("/GrossWeight", singleValue);
                            }
                        }

                        oFileUploader.setValue("");
                        this.FileUploadDialog.close();
                        this.onWeightChange();
                    } else {
                        MessageBox.error("Excel file is empty or does not contain valid data.");
                    }
                } catch (err) {
                    MessageBox.error("Error processing the Excel file. Please try again.");
                }
            }.bind(this);

            reader.onerror = function () {
                MessageBox.error("Error reading the file.");
            };

            // Read the file
            reader.readAsArrayBuffer(oFile);
        },
        onCloseUploadDialog: function () {
            this.FileUploadDialog.close();
        },
        onPressSave: function () {
            var oModel = this.getView().getModel(),
                DetailModel = this.getView().getModel("DetailModel"),
                DetailModelData = DetailModel.getData();

            //Get Current time in HHMMSS format
            // var today = new Date(),
            //     hour = today.getHours(),
            //     minute = today.getMinutes(),
            //     second = today.getSeconds(),
            //     todayTime = "PT" + hour + "H" + minute + "M" + second + "S";
            // if (DetailModelData.GateInTime) {
            //     var time = DetailModelData.GateInTime.split(":");
            //     var gateintime = "PT" + time[0] + "H" + time[1] + "M" + time[2] + "S";
            // } else {
            //     var gateintime = "PT00H00M00S"
            // }

            const today = new Date();
            const todayTime = `PT${today.getHours()}H${today.getMinutes()}M${today.getSeconds()}S`;

            if (DetailModelData.GateInTime) {
                var time = DetailModelData.GateInTime.split(":");
                var gateintime = "PT" + time[0] + "H" + time[1] + "M" + time[2] + "S";
            } else {
                var gateintime = "PT00H00M00S"
            }

            var payload = {
                "GateNumber": DetailModelData.GateNumber,
                "GateType": DetailModelData.GateType,
                "GateStatus": DetailModelData.GateStatus,
                "VehichleNo": DetailModelData.VehichleNo,
                "LrRrNo": DetailModelData.LrRrNo,
                "BillOfLanding": DetailModelData.BillOfLanding,
                "VendorInvoiceNo": DetailModelData.VendorInvoiceNo,
                "VendorInvoiceDt": "/Date(" + Number(DetailModelData.VendorInvoiceDt) + ")/",
                "GateInDate": "/Date(" + Number(DetailModelData.GateInDate) + ")/",
                "GateInTime": gateintime,
                "PurchasingDoc": DetailModelData.PurchasingDoc,
                "SalesDocument": DetailModelData.SalesDocument,
                "Supplier": DetailModelData.Supplier,
                "SupplierName": DetailModelData.SupplierName,
                "Customer": DetailModelData.Customer,
                "Plant": DetailModelData.Plant,
                "GrossWeight": DetailModelData.GrossWeight,
                "TareWeight": DetailModelData.TareWeight,
                "PackingUnit": "KG",
                "NetWeight": DetailModelData.NetWeight,
                "WeightRequired": DetailModelData.WeightRequired,
                "WeightSkip": DetailModelData.WeightSkip,
                "InitWtDate": "/Date(" + Number(DetailModelData.InitWtDate) + ")/",
                "FinalWtDate": null,
                "VendorSlip": DetailModelData.VendorSlip,
                "VendorGrossWeight": DetailModelData.VendorGrossWeight,
                "VendorTareWeight": DetailModelData.VendorTareWeight,
                "PreGrnQc": DetailModelData.PreGrnQc,
                "VehicleType": DetailModelData.VehicleType,
                "Remark": DetailModelData.Remark,
            };

            if (payload.GateStatus == 'Open' && this.WeighmentType === 'Initial') {
                payload.GateStatus = "Final Weighment Pending"
                payload.InitWtDate = "/Date(" + Number(new Date()) + ")/"
                payload.InitWtTime = todayTime
            } else if (payload.GateStatus == 'Final Weighment Pending' && this.WeighmentType === 'Final') {
                payload.GateStatus = "Gate Out Pending"
                var WtTime = DetailModelData.InitWtTime;
                var InitWtTime = "PT" + WtTime.split(":")[0] + "H" + WtTime.split(":")[1] + "M" + WtTime.split(":")[2] + "S";
                payload.InitWtTime = InitWtTime;
                payload.FinalWtDate = "/Date(" + Number(new Date()) + ")/";
                payload.FinalWtTime = todayTime;
            } else {
                MessageBox.error("Please Complete the Initial Weighment First");
                return;
            }
            if (this.WeighmentType === 'Initial') {
                if (this.GateType === 'Sales') {
                    payload.InitWeighBridgeCode = this.getView().byId("idWeighBridgeTare").getValue();
                } else {
                    payload.InitWeighBridgeCode = this.getView().byId("idWeighBridgeGross").getValue();
                }
            } else {
                if (this.GateType === 'Sales') {
                    payload.FinalWeighBridgeCode = this.getView().byId("idWeighBridgeGross").getValue();
                } else {
                    payload.FinalWeighBridgeCode = this.getView().byId("idWeighBridgeTare").getValue();
                }
            }
            if (this.WeighmentType === 'Final' && Number(DetailModelData.TareWeight) >= Number(DetailModelData.GrossWeight)) {
                MessageBox.error("Tare Weight Cannot be More than or Equal to Gross Weight");
            } else {
                BusyIndicator.show();
                oModel.update("/Header('" + DetailModelData.GateNumber + "')", payload, {
                    success: function (response) {
                        MessageBox.success(this.WeighmentType + " Weighment Saved Successfully", {
                            title: "Success",
                            onClose: function (sAction) {
                                if (sAction === 'OK') {
                                    this.handleBackNavigation();
                                }
                            }.bind(this),
                            styleClass: "",
                            actions: MessageBox.Action.OK,
                            emphasizedAction: MessageBox.Action.OK
                        });
                        console.log(response)
                        BusyIndicator.hide();
                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                        MessageBox.error(JSON.parse(error.responseText).error.message.value);
                        BusyIndicator.hide();
                    }
                });
            }
        },
        dateFormatter: function (dateVal) {

            if (!dateVal) {
                return "";
            } else {
                var year = parseInt(dateVal.substring(0, 4), 10);
                var month = parseInt(dateVal.substring(4, 6), 10) - 1; // Months are 0-based
                var day = parseInt(dateVal.substring(6, 8), 10);

                var date = new Date(year, month, day);

                // Format the date using sap.ui.core.format.DateFormat
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "MMM dd yyyy" // Customize the pattern as needed
                });
                var formattedDate = oDateFormat.format(date);

                return formattedDate;
            }
        },
        formatDate: function (date) {
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                format: "yMMMd"
            });
            return oDateFormat.format(date);
        },
        onPressAPI: async function () {
            var data = {
                "accessUserName": "adminuser",
                "password": "965423",
                "entityType": "DISTILLERY",
                "entityCode": "BOTTELING070649",
                "weighbridgeCode": "0259",
                "licenseNumber": "LIC67327654321",
                "entryGateNumber": "Gate 4",
                "itemName": "Liquer",
                "vehicleNumber": "UP123456",
                "transporterName": "WXYZ Transport",
                "driverName": "Raman",
                "driverMobileNumber": "8765431129",
                "vehicleType": "Trailer",
                "grossWeight": 25000.50,
                "tareWeight": 12000.25,
                "netWeight": 13000.25,
                "grossDate": "2024-12-03",
                "grossTime": "09:45:00",
                "tareDate": "2024-12-03",
                "tareTime": "09:45:00",
                "gatePassType": "FL36"
            }
            try {
                const response = await fetch('https://apigateway.upexciseonline.co/retailpos/v1.0.0/weighingbridgecontroller/saveweighingbridge', {
                    method: 'POST', // or GET, PUT, DELETE etc.
                    headers: {
                        'Content-Type': 'application/json', // or other content-type
                        'Authorization': 'Bearer 7aaa4d3f-76c8-30db-8f8b-7c75729757ab' // if API requires authentication
                    },
                    body: JSON.stringify(data) // Send data in request body
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const responseData = await response.json();  // or response.text() etc
                // Handle the successful response data
                console.log("Response Data:", responseData);
                // Update UI or other Logic with responseData
                return responseData
            } catch (error) {
                // Handle any errors
                console.error("Error during API call:", error);
            }
        }
    });
});