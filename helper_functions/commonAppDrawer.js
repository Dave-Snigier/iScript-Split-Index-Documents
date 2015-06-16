/* GJ - this is needed because we had to make allowances for the 40 character import limit */
function commonAppDrawer() {
	debug.log('DEBUG', 'Called: commonAppDrawer ()\n');
	switch(STAGE_KEYS.drawer) {
		case 'B':
			STAGE_KEYS.drawer = 'UMBUA';
			break;
		case 'L':
			STAGE_KEYS.drawer = 'UMLUA';
			break;
		case 'D':
			STAGE_KEYS.drawer = 'UMDUA';
			break;
		default: 
			return false;
	}
	debug.log('INFO', 'STAGE_KEYS.drawer = [%s]\n', STAGE_KEYS.drawer);
	return true;
}