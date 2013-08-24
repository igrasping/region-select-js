(function(NS){
	if (!window[NS]) return;
	window[NS].toSortCode = function (obj /*按本js需要格式好的数组,即意义在于不需要人工排序,写好结构后,使用本方法排序再替换掉数据*/){//对原始结构排序,并返回sort后的代码
		if ('function' != typeof String.localeCompare) return '浏览器不支持中文排序,请更换浏览器再尝试';
		var sortFun = function(a, b){
			if ('object' == typeof a) a = a[0];
			if ('object' == typeof b) b = b[0];
			return a.localeCompare(b);//使用浏览器本地化的多字节字符排序
		};	
		var cls = function(str) {return str.replace(/"/g, '\\"').replace(/[\n\r]/g, '');};
		var fo = function (ob, tab) {
			if ('string' != typeof tab) tab = '';
			var code = [];
			var o = ob.sort(sortFun);
			
			for (var fi = 0; fi < o.length; fi++) {
				var v = o[fi];
				
				if ('string' == typeof v) {//无子区域
					code[code.length] = tab+ '"' +cls(v)+ '"';
				} else if ('object' == typeof v){//有子区域				
					code[code.length] = tab+ '["' +cls(v[0])+ '", [\n'
										+fo(v[1], tab+'\t')
										+'\n' +tab+ ']]';
				} else {
					this.E('此区域对象值有误,可能是数组开始或结尾多写,号,如[,1,2,]写法', ob);
				}
			}
			
			return code.join(',\n');
		};
		return '[\n' +fo('object' == typeof obj ? obj : namSpace.regions, '\t')+ '\n]';
	};
})('regions');