sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Sorter"
], (Controller, JSONModel, Filter, FilterOperator, MessageBox, BusyIndicator, Sorter) => {
    "use strict";

    return Controller.extend("weighment.controller.Weighment", {
        onInit() {
            var WeighmentModel = new JSONModel();
            this.getView().setModel(WeighmentModel, "WeighmentModel");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function (oEvent) {
            var Load = oEvent.getParameters().targetControl.oFromPage;;
            if (Load) {
                var oModel = this.getView().getModel(),
                    WeighmentModel = this.getView().getModel("WeighmentModel"),
                    aFilters = [];

                var gateNumber = this.getView().byId("idGateNumber").getValue(),
                    gateType = this.getView().byId("idGateType").getValue(),
                    plant = this.getView().byId("idPlant").getValue(),
                    purchaseOrder = this.getView().byId("idPurchaseOrder").getValue(),
                    SalesOrder = this.getView().byId("idSalesOrder").getValue(),
                    geStatus = this.getView().byId("idGEStatus").getSelectedKey();

                if (gateNumber) {
                    aFilters.push(new Filter("GateNumber", FilterOperator.EQ, gateNumber))
                }
                if (gateType) {
                    aFilters.push(new Filter("GateType", FilterOperator.EQ, gateType))
                }
                if (plant) {
                    aFilters.push(new Filter("Plant", FilterOperator.EQ, plant))
                }
                if (purchaseOrder) {
                    aFilters.push(new Filter("PurchasingDoc", FilterOperator.EQ, purchaseOrder))
                }
                if (SalesOrder) {
                    aFilters.push(new Filter("SalesDocument", FilterOperator.EQ, SalesOrder))
                }
                if (geStatus) {
                    aFilters.push(new Filter("GateStatus", FilterOperator.EQ, geStatus))
                }

                BusyIndicator.show();
                oModel.read("/Header", {
                    urlParameters: {
                        "$top": "10000",
                        "$skip": "0"
                    },
                    filters: aFilters,
                    success: function (response) {
                        WeighmentModel.setProperty("/", response);
                        WeighmentModel.updateBindings(true);
                        BusyIndicator.hide();
                    }.bind(this),
                    error: function (error) {
                        MessageBox.error(JSON.parse(error.responseText).error.message.value);
                        BusyIndicator.hide();
                    }.bind(this)
                });
            }
        },
        onSearch: function () {
            var oModel = this.getView().getModel(),
                WeighmentModel = this.getView().getModel("WeighmentModel"),
                aFilters = [];

            var gateNumber = this.getView().byId("idGateNumber").getValue(),
                gateType = this.getView().byId("idGateType").getValue(),
                plant = this.getView().byId("idPlant").getValue(),
                purchaseOrder = this.getView().byId("idPurchaseOrder").getValue(),
                SalesOrder = this.getView().byId("idSalesOrder").getValue(),
                geStatus = this.getView().byId("idGEStatus").getSelectedKey();

            if (gateNumber) {
                aFilters.push(new Filter("GateNumber", FilterOperator.EQ, gateNumber))
            }
            if (gateType) {
                aFilters.push(new Filter("GateType", FilterOperator.EQ, gateType))
            }
            if (plant) {
                aFilters.push(new Filter("Plant", FilterOperator.EQ, plant))
            }
            if (purchaseOrder) {
                aFilters.push(new Filter("PurchasingDoc", FilterOperator.EQ, purchaseOrder))
            }
            if (SalesOrder) {
                aFilters.push(new Filter("SalesDocument", FilterOperator.EQ, SalesOrder))
            }
            if (geStatus) {
                aFilters.push(new Filter("GateStatus", FilterOperator.EQ, geStatus))
            }

            BusyIndicator.show();
            oModel.read("/Header", {
                urlParameters: {
                    "$top": "10000",
                    "$skip": "0"
                },
                filters: aFilters,
                success: function (response) {
                    WeighmentModel.setProperty("/", response);
                    WeighmentModel.updateBindings(true);
                    var oSorter = new Sorter("GateNumber", true);
                    this.getView().byId("weighmentTable").getBinding("items").sort(oSorter);
                    BusyIndicator.hide();
                }.bind(this),
                error: function (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value);
                    BusyIndicator.hide();
                }.bind(this)
            });
        },

        onGateNumberVH: function () {
            if (!this.GateNumberDialog) {
                this.GateNumberDialog = new sap.ui.xmlfragment("weighment.fragments.GateNumber", this);
                this.getView().addDependent(this.GateNumberDialog);
            }
            this.GateNumberDialog.open();
        },
        onSelectGateNumber: function (oEvent) {
            let GateNumber = oEvent.getSource().getBindingContext().getObject().GateNumber;
            this.getView().byId("idGateNumber").setValue(GateNumber);
            this.GateNumberDialog.close();
        },
        handleGateNumberVHClose: function (oEvent) {
            this.GateNumberDialog.close();
        },
        onPlantVH: function () {
            if (!this.PlantDialog) {
                this.PlantDialog = new sap.ui.xmlfragment("weighment.fragments.Plant", this);
                this.getView().addDependent(this.PlantDialog);
            }
            this.PlantDialog.open();
        },
        onSelectPlant: function (oEvent) {
            let Plant = oEvent.getSource().getBindingContext().getObject().Plant;
            this.getView().byId("idPlant").setValue(Plant);
            this.PlantDialog.close();
        },
        handlePlantVHClose: function (oEvent) {
            this.PlantDialog.close();
        },

        onPurchasingDocVH: function () {
            if (!this.PurchsingDocDialog) {
                this.PurchsingDocDialog = new sap.ui.xmlfragment("weighment.fragments.PurchaseOrder", this);
                this.getView().addDependent(this.PurchsingDocDialog);
            }
            this.PurchsingDocDialog.open();
        },
        onSelectPurchaseOrder: function (oEvent) {
            let PurchasingDoc = oEvent.getSource().getBindingContext().getObject().PurchasingDoc;
            this.getView().byId("idPurchaseOrder").setValue(PurchasingDoc);
            this.PurchsingDocDialog.close();
        },
        handleClosePurchaseOrdVH: function () {
            this.PurchsingDocDialog.close();
        },
        onSalesOrderVH: function () {
            if (!this.SalesOrderDialog) {
                this.SalesOrderDialog = new sap.ui.xmlfragment("weighment.fragments.SalesOrderVH", this);
                this.getView().addDependent(this.SalesOrderDialog);
            }
            this.SalesOrderDialog.open();
        },
        onSelectSalesOrd: function (oEvent) {
            let SalesOrder = oEvent.getSource().getBindingContext().getObject().SalesOrder;
            this.getView().byId("idSalesOrder").setValue(SalesOrder);
            this.SalesOrderDialog.close();
        },
        handleCloseSalesOrdVH: function () {
            this.SalesOrderDialog.close();
        },
        onPressNav: function (oEvent) {
            var selectedObj = oEvent.getSource().getBindingContext("WeighmentModel").getObject(),
                GateNumber = selectedObj.GateNumber,
                oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteWeighmentDetails", {
                GateNumber: GateNumber,
            })
        },
        onPressCancel: function () {
            var oTable = this.getView().byId("weighmentTable");
            if (oTable.getSelectedItem()) {
                if (!this.CancelDialog) {
                    this.CancelDialog = new sap.ui.xmlfragment("weighment.fragments.CancelVH", this);
                    this.getView().addDependent(this.CancelDialog);
                }
                this.CancelDialog.open();
            } else {
                MessageBox.information('Please Select Any Gate Entry to Cancel')
            }
        },
        onCloseCancel: function(){
            this.CancelDialog.close();
        },
        onConfirmCancel: function () {
            let oModel = this.getView().getModel(),
                selectedItem = this.getView().byId("weighmentTable").getSelectedItem(),
                selObj = selectedItem.getBindingContext('WeighmentModel').getObject(),
                remarks = sap.ui.getCore().byId("idCancelRemark").getValue();
            var payload = {
                "GateNumber": selObj.GateNumber,
                "GateType": selObj.GateType,
                "GateStatus": "Cancelled ",
                "IsCancelled": "X",
                "CancelRemark": remarks
            };
            oModel.update("/Header('" + selObj.GateNumber + "')", payload, {
                success: function (response) {
                    MessageBox.success("Gate Entry is successfully Cancelled", {
                        title: "Success",
                        onClose: function (sAction) {
                            if (sAction === 'OK') {
                                sap.ui.getCore().byId("idCancelRemark").setValue("");
                                this.CancelDialog.close();
                                this.onSearch();
                            }
                        }.bind(this),
                        styleClass: "",
                        actions: MessageBox.Action.OK,
                        emphasizedAction: MessageBox.Action.OK
                    });
                }.bind(this),
                error: function (error) {
                    console.log(error);
                    sap.ui.getCore().byId("idCancelRemark").setValue("")
                }
            })
        },
        onPressWeighmentInitial: function () {
            var oTable = this.getView().byId("weighmentTable"),
                selectedObj = oTable.getSelectedItem().getBindingContext("WeighmentModel").getObject(),
                GateNumber = selectedObj.GateNumber,
                oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteWeighmentDetails", {
                GateNumber: GateNumber,
                WeighmentType: "Initial",
                Edit: true
            })
        },
        onPressWeighmentFinal: function () {
            var oTable = this.getView().byId("weighmentTable"),
                selectedObj = oTable.getSelectedItem().getBindingContext("WeighmentModel").getObject(),
                GateNumber = selectedObj.GateNumber,
                oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteWeighmentDetails", {
                GateNumber: GateNumber,
                WeighmentType: "Final",
                Edit: true
            })
        },
        onPressSkipWeight: function () {
            var oTable = this.getView().byId("weighmentTable");
            if (oTable.getSelectedItem()) {
                if (!this.SkipWeighDialog) {
                    this.SkipWeighDialog = new sap.ui.xmlfragment("weighment.fragments.SkipWeigh", this);
                    this.getView().addDependent(this.SkipWeighDialog);
                }
                this.SkipWeighDialog.open();
            } else {
                MessageBox.information('Please Select Any Gate Entry to Skip Weighment')
            }
        },
        onCloseSkip: function () {
            sap.ui.getCore().byId("idSkipRemark").setValue("");
            this.SkipWeighDialog.close();
        },
        onConfirmSkip: function () {
            var oTable = this.getView().byId("weighmentTable");
            if (oTable.getSelectedItem()) {
                var selectedObj = oTable.getSelectedItem().getBindingContext("WeighmentModel").getObject();
                var oModel = this.getView().getModel();
                var payload = {
                    "GateNumber": selectedObj.GateNumber,
                    "GateType": selectedObj.GateType,
                    "GateStatus": "Close",
                    "WeightSkip": "X",
                    "Remark": sap.ui.getCore().byId("idSkipRemark").getValue()
                }
                BusyIndicator.show();
                oModel.update("/Header('" + selectedObj.GateNumber + "')", payload, {
                    success: function (response) {
                        console.log(response);
                        // MessageBox.success("Weighment Skipped Successfully");
                        MessageBox.success("Weighment Skipped Successfully", {
                            title: "Success",
                            onClose: function (sAction) {
                                if (sAction === 'OK') {
                                    this.onCloseSkip();
                                }
                            }.bind(this),
                            styleClass: "",
                            actions: MessageBox.Action.OK,
                            emphasizedAction: MessageBox.Action.OK
                        });
                        BusyIndicator.hide();
                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                        MessageBox.error(JSON.parse(error.responseText).error.message.value);
                        BusyIndicator.hide();
                    }.bind(this)
                })
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
        }

    });

});