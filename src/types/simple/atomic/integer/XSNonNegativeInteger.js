/*
 * XPath2.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

function cXSNonNegativeInteger(nValue) {
	this.value	= nValue;
};

cXSNonNegativeInteger.prototype	= new cXSInteger;

cXSNonNegativeInteger.cast	= function(vValue) {
	return new cXSNonNegativeInteger(cNumber(vValue));
};

//
fXPath2StaticContext_defineSystemDataType("nonNegativeInteger",	cXSNonNegativeInteger);