//Populate Career CP for UGRD and CSCE only
function populateCareer() {
	debug.log('DEBUG', 'Entering: PopulateCareer\n');
	if (STAGE_NOT_USED.Career) {
		debug.log('DEBUG', 'Populating STAGE_PROPS["Career"] from [%s] to STAGE_NOT_USED.Career  [%s]\n', STAGE_PROPS['Career'], STAGE_NOT_USED.Career );
		STAGE_PROPS['Career'] = STAGE_NOT_USED.Career;
	}
	return true;
}