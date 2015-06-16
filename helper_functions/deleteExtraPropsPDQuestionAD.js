// yet another function to deal with the absurdity of using the same index strucuture
// this one will delete all of the unused custom properties from the report before load
// @returns {Boolean}
function deleteExtraPropsPDQuestionAD() {
	debug.log('DEBUG', 'Called: deleteExtraPropsPDQuestionAD()\n');
	var propToDelete = [
		"App Center",
		"Notification Plan",
		"Program Status",
		"Application Method",
		"SSN#, Legacy",
		"DOB",
		"PD",
		"International"
	];
	for (var i = propToDelete.length - 1; i >= 0; i--) {
		if (STAGE_PROPS[propToDelete[i]]) {
			delete STAGE_PROPS[propToDelete[i]];
		}
	}
	return true;
}
