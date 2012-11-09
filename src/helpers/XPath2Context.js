/*
 * XPath2.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

function cXPath2Context(vItem, oScope, nPosition, nSize) {
	this.item		= vItem;
	this.scope		= oScope || {};
	this.position	= nPosition || 1;
	this.size		= nSize || 1;
	this.stack		= {};
	//
	var oDate	= new cDate,
		nOffset	= oDate.getTimezoneOffset();
	this.dateTime	= new cXSDateTime(oDate.getFullYear(), oDate.getMonth() + 1, oDate.getDate(), oDate.getHours(), oDate.getMinutes(), oDate.getSeconds() + oDate.getMilliseconds() / 1000, nOffset);
	this.timezone	= new cXSDayTimeDuration(0, cMath.abs(~~(nOffset / 60)), cMath.abs(nOffset % 60), 0, nOffset > 0);
};

cXPath2Context.prototype.item		= null;
cXPath2Context.prototype.scope		= null;
cXPath2Context.prototype.position	= null;
cXPath2Context.prototype.size		= null;
cXPath2Context.prototype.stack		= null;	// Variables stack
cXPath2Context.prototype.dateTime	= null;
cXPath2Context.prototype.timezone	= null;

cXPath2Context.prototype.pushVariable	= function(sName, vValue) {
	if (!this.stack.hasOwnProperty(sName))
		this.stack[sName]	= [];
	this.stack[sName].push(this.scope[sName]);
	this.scope[sName] = vValue;
};

cXPath2Context.prototype.popVariable	= function(sName) {
	if (this.stack.hasOwnProperty(sName)) {
		this.scope[sName] = this.stack[sName].pop();
		if (typeof this.scope[sName] == "undefined")
			delete this.scope[sName];
		if (!this.stack[sName].length)
			delete this.stack[sName];
	}
};