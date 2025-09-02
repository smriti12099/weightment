/*global QUnit*/

sap.ui.define([
	"weighment/controller/Weighment.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Weighment Controller");

	QUnit.test("I should test the Weighment controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
