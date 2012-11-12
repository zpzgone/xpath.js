/*
 * XPath2.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

function cAxisStep(sAxis, oTest) {
	this.axis	= sAxis;
	this.test	= oTest;
	this.predicates	= [];
};

//cAxisStep.prototype	= new cStepExpr;

cAxisStep.prototype.axis		= null;
cAxisStep.prototype.test		= null;
cAxisStep.prototype.predicates	= null;

cAxisStep.axises	= {};
// Forward axis
cAxisStep.axises["attribute"]			= {};
cAxisStep.axises["child"]				= {};
cAxisStep.axises["descendant"]			= {};
cAxisStep.axises["descendant-or-self"]	= {};
cAxisStep.axises["following"]			= {};
cAxisStep.axises["following-sibling"]	= {};
cAxisStep.axises["self"]				= {};
// cAxisStep.axises["namespace"]			= {};	// deprecated in 2.0
// Reverse axis
cAxisStep.axises["ancestor"]			= {};
cAxisStep.axises["ancestor-or-self"]	= {};
cAxisStep.axises["parent"]				= {};
cAxisStep.axises["preceding"]			= {};
cAxisStep.axises["preceding-sibling"]	= {};

// Static members
cAxisStep.parse	= function (oLexer, oResolver) {
	var sAxis	= oLexer.peek(),
		oExpr,
		oStep;
	if (oLexer.peek(1) == "::") {
		if (sAxis in cAxisStep.axises) {
			oLexer.next(2);
			if (oLexer.eof() ||!(oExpr = cNodeTest.parse(oLexer, oResolver)))
				throw "AxisStep.parse: expected NodeTest expression";
			oStep	= new cAxisStep(sAxis, oExpr);
		}
		else
			throw "AxisStep.parse: Unknown axis";
	}
	else
	if (sAxis == "..") {
		oLexer.next();
		oStep	= new cAxisStep("parent", new cKindTest("node"));
	}
	else
	if (sAxis == "@") {
		oLexer.next();
		if (oLexer.eof() ||!(oExpr = cNodeTest.parse(oLexer, oResolver)))
			throw "AxisStep.parse: expected NodeTest expression";
		oStep	= new cAxisStep("attribute", oExpr);
	}
	else {
		if (oLexer.eof() ||!(oExpr = cNodeTest.parse(oLexer, oResolver)))
			return;
		oStep	= new cAxisStep(oExpr instanceof cKindTest && oExpr.name == "attribute" ? "attribute" : "child", oExpr);
	}
	//
	cStepExpr.parsePredicates(oLexer, oResolver, oStep);

	return oStep;
};

// Public members
cAxisStep.prototype.evaluate	= function (oContext) {
	var oItem	= oContext.item;

	if (!cXPath2.DOMAdapter.isNode(oItem))
		throw new cXPath2Error("XPTY0020");

	var nType	= cXPath2.DOMAdapter.getProperty(oItem, "nodeType");
	var oSequence	= new cXPath2Sequence;
	switch (this.axis) {
		// Forward axis
		case "attribute":
			if (nType == 1)
				for (var aAttributes = cXPath2.DOMAdapter.getProperty(oItem, "attributes"), nIndex = 0, nLength = aAttributes.length; nIndex < nLength; nIndex++)
					oSequence.add(aAttributes[nIndex]);
			break;

		case "child":
			for (var oNode = cXPath2.DOMAdapter.getProperty(oItem, "firstChild"); oNode; oNode = cXPath2.DOMAdapter.getProperty(oNode, "nextSibling"))
				oSequence.add(oNode);
			break;

		case "descendant-or-self":
			oSequence.add(oItem);
			// No break left intentionally
		case "descendant":
			fAxisStep_getChildrenForward(cXPath2.DOMAdapter.getProperty(oItem, "firstChild"), oSequence);
			break;

		case "following":
			// TODO: Attribute node context
			for (var oParent = oItem, oSibling; oParent; oParent = cXPath2.DOMAdapter.getProperty(oParent, "parentNode"))
				if (oSibling = cXPath2.DOMAdapter.getProperty(oParent, "nextSibling"))
					fAxisStep_getChildrenForward(oSibling, oSequence);
			break;

		case "following-sibling":
			for (var oNode = oItem; oNode = cXPath2.DOMAdapter.getProperty(oNode, "nextSibling");)
				oSequence.add(oNode);
			break;

		case "self":
			oSequence.add(oItem);
			break;

		// Reverse axis
		case "ancestor-or-self":
			oSequence.add(oItem);
			// No break left intentionally
		case "ancestor":
			for (var oNode = nType == 2 ? cXPath2.DOMAdapter.getProperty(oItem, "ownerElement") : oItem; oNode = cXPath2.DOMAdapter.getProperty(oNode, "parentNode");)
				oSequence.add(oNode);
			break;

		case "parent":
			var oParent	= nType == 2 ? cXPath2.DOMAdapter.getProperty(oItem, "ownerElement") : cXPath2.DOMAdapter.getProperty(oItem, "parentNode");
			if (oParent)
				oSequence.add(oParent);
			break;

		case "preceding":
			// TODO: Attribute node context
			for (var oParent = oItem, oSibling; oParent; oParent = cXPath2.DOMAdapter.getProperty(oParent, "parentNode"))
				if (oSibling = cXPath2.DOMAdapter.getProperty(oParent, "previousSibling"))
					fAxisStep_getChildrenBackward(oSibling, oSequence);
			break;

		case "preceding-sibling":
			for (var oNode = oItem; oNode = cXPath2.DOMAdapter.getProperty(oNode, "previousSibling");)
				oSequence.add(oNode);
			break;
	}

	// Apply test
	if (!oSequence.isEmpty()) {
		var oSequence1	= oSequence;
		oSequence	= new cXPath2Sequence;
		for (var nIndex = 0, nLength = oSequence1.items.length; nIndex < nLength; nIndex++) {
			if (this.test.test(oSequence1.items[nIndex]))
				oSequence.add(oSequence1.items[nIndex]);
		}
	}

	// Apply predicates
	if (this.predicates.length && !oSequence.isEmpty())
		oSequence	= cStepExpr.prototype.applyPredicates.call(this, oContext, oSequence);

	// Reverse results if reverse axis
	switch (this.axis) {
		case "ancestor":
		case "ancestor-or-self":
		case "parent":
		case "preceding":
		case "preceding-sibling":
			oSequence	= cXPath2Sequence.reverse(oSequence);
	}

	return oSequence;
};

//
function fAxisStep_getChildrenForward(oNode, oSequence) {
	for (var oChild; oNode; oNode = cXPath2.DOMAdapter.getProperty(oNode, "nextSibling")) {
		oSequence.add(oNode);
		if (oChild = cXPath2.DOMAdapter.getProperty(oNode, "firstChild"))
			fAxisStep_getChildrenForward(oChild, oSequence);
	}
};

function fAxisStep_getChildrenBackward(oNode, oSequence) {
	for (var oChild; oNode; oNode = cXPath2.DOMAdapter.getProperty(oNode, "previousSibling")) {
		if (oChild = cXPath2.DOMAdapter.getProperty(oNode, "lastChild"))
			fAxisStep_getChildrenBackward(oChild, oSequence);
		oSequence.add(oNode);
	}
};