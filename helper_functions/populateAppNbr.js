//adding app number to SA Application Nbr cp
function populateAppNbr() {
	debug.log('DEBUG', 'Called: populateAppNbr()\n');
	STAGE_PROPS['SA Application Nbr'] = STAGE_KEYS.f4;
	return true;
}