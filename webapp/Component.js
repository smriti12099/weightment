sap.ui.define([
    "sap/ui/core/UIComponent",
    "weighment/model/models",
    "sap/ui/thirdparty/jquery",
    "sap/base/Log"
], (UIComponent, models, jQuery, Log) => {
    "use strict";

    return UIComponent.extend("weighment.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            // Load XLSX dynamically
            jQuery.sap.includeScript(
                "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
                "xlsxLib"
            );

            // var jQueryScript = document.createElement('script');
            // jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/jszip.js');
            // document.head.appendChild(jQueryScript);

            // var jQueryScript = document.createElement('script');
            // jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/xlsx.js');
            // document.head.appendChild(jQueryScript);
        }
    });
});