/*
 * XPath2.js - Pure JavaScript implementation of XPath 2.0 parser and evaluator
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 *
 *
 */

function cCastExpr(oExpr, oType) {
	this.expression	= oExpr;
	this.type		= oType;
};

cCastExpr.prototype.expression	= null;
cCastExpr.prototype.type		= null;

cCastExpr.parse	= function(oLexer, oStaticContext) {
	var oExpr,
		oType;
	if (oLexer.eof() ||!(oExpr = cUnaryExpr.parse(oLexer, oStaticContext)))
		return;

	if (!(oLexer.peek() == "cast" && oLexer.peek(1) == "as"))
		return oExpr;

	oLexer.next(2);
	if (oLexer.eof() ||!(oType = cSingleType.parse(oLexer, oStaticContext)))
		throw new cXPath2Error("XPST0003"
//->Debug
				, "Unexpected <eof> token: right operand missing in cast expression"
//<-Debug
		);

	return new cCastExpr(oExpr, oType);
};

cCastExpr.prototype.evaluate	= function(oContext) {
	var oSequence1	= this.expression.evaluate(oContext);
	// Validate cardinality
	fFunctionCall_assertSequenceCardinality(oContext, oSequence1, this.type.occurence
//->Debug
			, "'cast as' expression operand"
//<-Debug
	);
	//
	if (oSequence1.isEmpty())
		return new cXPath2Sequence;
	//
	return new cXPath2Sequence(this.type.itemType.cast(cXPath2Sequence.atomizeItem(oSequence1.items[0], oContext), oContext));
};