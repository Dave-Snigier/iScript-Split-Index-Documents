function swapObjectProps(sourceObj, sourceKey, targetObj, targetKey, condition) {
	var errTxt = 'Called: swapObjectProps(%s, %s, %s, %s, %s)\n';
	debug.log('DEBUG', errTxt, sourceObj, sourceKey, targetObj, targetKey, condition);
	if (condition) {
		var tmp = sourceObj[sourceKey];
		sourceObj[sourceKey] = targetObj[targetKey];
		targetObj[targetKey] = tmp;
	}
	return true;
}