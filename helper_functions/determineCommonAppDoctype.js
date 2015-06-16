// TODO need to get the list of applications to encode in the determine common app doctypes
// maybe this should be split out into a seperate YAML config
function determineCommonAppDoctype() {
	switch(STAGE_KEYS.drawer) {
	case 'UMBUA':
		doctypeHash = {
			'SR':'Student Report BUA',
			'SR2':'Transcript, Official BUA'
		};
		break;
	case 'UMDUA':
		doctypeHash = {
			'SR':'Student Report BUA',
			'SR2':'Transcript, Official BUA'
		};
		break;
	case 'UMLUA':
		doctypeHash = {
			'SR':'Student Report BUA',
			'SR2':'Transcript, Official BUA'
		};
		break;
	default:
		debug.log('ERROR', 'Could not determine document type for common app doc with drawer [%s]', STAGE_KEYS.drawer);
		return false;
	}

	if (typeof doctypeHash[STAGE_KEYS.docTypeName] === 'string') {
		STAGE_KEYS.docTypeName = doctypeHash[STAGE_KEYS.docTypeName];
	} else {
		debug.log('ERROR', 'Could not find a match for this common app document type: [%s]\n', STAGE_KEYS.docTypeName);
		return false;
	}
	return true;
}