// this function will 'smartcode' document types as needed
// make sure to have determined the drawer prior to running this function
function decorateDoctypes() {
	debug.log('DEBUG', 'Called: decorateDoctypes()\n');
	// Extract department from drawer
	var departmentCode = STAGE_KEYS.drawer.substring(5, 3);

	// filter out those departments that we don't smartcode yet
	if (departmentCode === 'SR' || departmentCode === 'GA') {
		return true;
	}

	// extract campus from drawer
	var campusLetter = STAGE_KEYS.drawer.substring(3, 2);

	// Build the new doctype name
	var originalDoctype = STAGE_KEYS.docTypeName;
	var transformedDoctype = originalDoctype + ' ' + campusLetter + departmentCode;
	debug.log('DEBUG', 'decorateDoctypes(): Original Doctype: %s\n', originalDoctype);
	debug.log('DEBUG', 'decorateDoctypes(): Transformed Doctype: %s\n', transformedDoctype);

	// Replace doctype in INKeys with what we have here
	STAGE_KEYS.docTypeName = transformedDoctype;

	return true;
}