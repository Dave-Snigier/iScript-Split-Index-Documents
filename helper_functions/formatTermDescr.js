// convert 1 to Y all other to  "" 
function formatTermDescr() {
	debug.log('DEBUG', 'Entering function formatTermDescr with F3 value of: [%s]\n', STAGE_KEYS.f3);
	if (STAGE_NOT_USED.Career != "GRAD") {
		STAGE_PROPS['Term Descr'] = STAGE_KEYS.f3;
		debug.log('DEBUG', 'Inside UGRD: CP Term Descr value [%s]\n', STAGE_PROPS['Term Descr']);
	}
	return true;
}