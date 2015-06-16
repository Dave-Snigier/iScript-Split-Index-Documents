function checkForRecomendationAD() {
	debug.log('DEBUG', 'Called: checkForRecomendationAD()\n');
	var recomenderNameCP = 'Recommender Name';
	var doctypes = [
		'Letter of Recommendation',
		'Letter of Recommendation BUA',
		'Letter of Recommendation LUA',
		'Letter of Recommendation DUA'
	];
	for (var i = doctypes.length - 1; i >= 0; i--) {
		if (doctypes[i] === STAGE_KEYS.docTypeName) {
			STAGE_PROPS[recomenderNameCP] = STAGE_NOT_USED[recomenderNameCP];
			break;
		}
	}
	return true;
}