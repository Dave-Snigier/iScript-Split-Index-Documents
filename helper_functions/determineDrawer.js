/*********************************************************************************************
	Mod Summary:
		09/25/20 GJ -added logic to handle CSCE profile sheets CSR 1258.

*********************************************************************************************/
function determineDrawer() {
	debug.log('DEBUG', 'Called: determineDrawer()\n');
	var appCenter, campus, career;

	typeof STAGE_PROPS.Career === 'undefined' ?	career = STAGE_NOT_USED.Career :
												career = STAGE_PROPS.Career;

	typeof STAGE_PROPS['App Center'] === 'undefined' ?	appCenter = STAGE_NOT_USED['App Center'] :
														appCenter = STAGE_PROPS['App Center'];

	typeof STAGE_PROPS.Institution === 'undefined' ?	campus = STAGE_NOT_USED.Institution :
														campus = STAGE_PROPS.Institution;

	var drawer;
	function bostonDrawer() {
		switch (career) {
		case 'UGRD':
			drawer = 'UMBUA';
			break;
		case 'GRAD':
			drawer = 'UMBGA';
			break;
		default:
			return false;
		}
	}
	function dartmouthDrawer() {
		switch (career) {
		case 'UGRD':
			drawer = 'UMDUA';
			break;
		case 'GRAD':
			drawer = 'UMDGA';
			break;
		default:
			return false;
		}
	}
	function lowellDrawer() {
		switch (career) {
		case 'UGRD':
			drawer = 'UMLUA';
			break;
		case 'GRAD':
			drawer = 'UMLGA';
			break;
		case 'CSCE':
			drawer = 'UMLUA'
			break;
		default:
			return false;
		}
	}

	switch (campus) {
	case 'UMBOS':
		bostonDrawer();
		break;
	case 'UMDAR':
		dartmouthDrawer();
		break;
	case 'UMLOW':
		lowellDrawer();
		break;
	default:
		debug.log('ERROR', 'determineDrawer(): Campus not correctly populated. Was given: %s\n', campus);
		return false;
	}
	if (drawer) {
		STAGE_KEYS.drawer = drawer;
	} else {
		debug.log('ERROR', 'determineDrawer(): drawer cannot be determined given these parameters\n');
		debug.log('DEBUG', 'Campus: %s\n', campus);
		debug.log('DEBUG', 'App Center: %s\n', appCenter);
		debug.log('DEBUG', 'Career: %s\n', career);
		debug.log('ERROR', 'STAGE_KEYS:\n');
		debug.logObject('ERROR', STAGE_KEYS);
		debug.log('ERROR', 'STAGE_PROPS:\n');
		debug.logObject('ERROR', STAGE_PROPS);
		debug.log('ERROR', 'STAGE_NOT_USED:\n');
		debug.logObject('ERROR', STAGE_NOT_USED);
		return false;
	}
	return true;
}
