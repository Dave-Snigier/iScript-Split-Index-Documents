/**
 * Assign a unique date/time stamp in field 5 down to the millisecond
 * example: "03/26/2013 02:51:24.890 PM"
 * 
 * @requires GetUniqueF5DateTime
 * @return {Boolean} Returns true
 */
#include "$IMAGENOWDIR6$\\script\\lib\\GetUniqueF5DateTime.js"

var getF5DateTime_timeObject = new GetUniqueF5DateTime(true);

function getF5DateTime() {
	STAGE_KEYS.f5 = getF5DateTime_timeObject.tellTheTime();
	return true;
}