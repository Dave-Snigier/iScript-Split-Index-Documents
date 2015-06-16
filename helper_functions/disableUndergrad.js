// replaces the real document type with a dummy doctype having all of the custom properties
// allows us to migrate grad without testing undergrad first
function disableUndergrad() {
	var drawerList = [
		"UMBUA",
		"UMBUA Lockbox",
		"UMLUA",
		"UMLUA Lockbox",
		"UMDUA",
		"UMDUA Lockbox"
	];
	for (var i = drawerList.length - 1; i >= 0; i--) {
		if (drawerList[i] === STAGE_KEYS.drawer) {
			STAGE_KEYS.docTypeName = "UGRD Test";
			break;
		}
	}
	return true;
}